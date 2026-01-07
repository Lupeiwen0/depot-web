import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  payments,
  orders,
  userMemberships,
  userCoupons,
  stripeWebhookLogs,
  products,
} from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { fromStripeAmount } from "@/lib/currency";
import {
  createMembershipCoupons,
  revokeMembershipCoupons,
  applyCoupon,
} from "@/lib/coupon-service";
import Stripe from "stripe";
import { sql } from "drizzle-orm";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function unixSecondsToDate(value: unknown): Date | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000);
  }
  return null;
}

function getSubscriptionPeriodFromFirstItem(
  subscription: Stripe.Subscription
): {
  rawPeriodStart: unknown;
  rawPeriodEnd: unknown;
  startDate: Date | null;
  endDate: Date | null;
  priceId: string | null;
} {
  const firstItem = (subscription as any)?.items?.data?.[0];

  // Stripe 不同 API 版本下，周期字段可能在 SubscriptionItem 上
  const rawPeriodStart =
    firstItem?.current_period_start ??
    (subscription as any).current_period_start;
  const rawPeriodEnd =
    firstItem?.current_period_end ?? (subscription as any).current_period_end;

  const startDate = unixSecondsToDate(rawPeriodStart);
  const endDate = unixSecondsToDate(rawPeriodEnd);
  const priceId: string | null = firstItem?.price?.id ?? null;

  return { rawPeriodStart, rawPeriodEnd, startDate, endDate, priceId };
}

// ============================================================================
// 权益发放公共函数
// ============================================================================

/**
 * 尝试完成单次支付的权益发放
 * 条件：payment.status === "succeeded" && payment.orderId 存在
 */
async function tryFinalizeOneTimePayment(paymentId: number) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  });

  if (!payment) {
    console.log(`Payment ${paymentId} not found`);
    return;
  }

  // 条件检查：支付成功 + 订单已关联
  if (payment.status !== "succeeded") {
    console.log(
      `Payment ${paymentId} status is ${payment.status}, not succeeded`
    );
    return;
  }

  if (!payment.orderId) {
    console.log(
      `Payment ${paymentId} has no orderId, waiting for order creation`
    );
    return;
  }

  // 幂等性检查：通过 metadata 标记是否已发放权益
  const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
  if (metadata.benefitsGranted) {
    console.log(`Payment ${paymentId} benefits already granted`);
    return;
  }

  // 获取订单及其商品
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, payment.orderId),
    with: {
      lineItems: {
        with: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    console.log(`Order ${payment.orderId} not found`);
    return;
  }

  // 发放权益：更新商品销量
  for (const item of order.lineItems) {
    // 检查销量是否已更新（通过一个额外的幂等性标记）
    await db
      .update(products)
      .set({
        salesCount: sql`${products.salesCount} + ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, item.productId));
  }

  // 处理优惠券应用（如果有）
  const checkoutSessionId = payment.stripeCheckoutSessionId;
  if (checkoutSessionId) {
    // 从 webhook log 中获取原始 session 数据
    const log = await db.query.stripeWebhookLogs.findFirst({
      where: and(
        eq(stripeWebhookLogs.eventType, "checkout.session.completed"),
        sql`${stripeWebhookLogs.payload}::jsonb->>'id' = ${checkoutSessionId}`
      ),
    });

    if (log) {
      try {
        const sessionData = JSON.parse(log.payload);
        const couponIdStr = sessionData.metadata?.couponId;
        if (couponIdStr) {
          const couponId = parseInt(couponIdStr);
          if (!isNaN(couponId)) {
            await applyCoupon(couponId, order.id);
            console.log(`Applied coupon ${couponId} to order ${order.id}`);
          }
        }
      } catch (e) {
        console.error("Failed to parse session data for coupon", e);
      }
    }
  }

  // 标记权益已发放
  await db
    .update(payments)
    .set({
      metadata: JSON.stringify({ ...metadata, benefitsGranted: true }),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));

  console.log(`Payment ${paymentId} benefits granted successfully`);
}

/**
 * 尝试完成订阅的权益发放
 * 条件：membership.status === "active" && membership.userId 存在 && payment 已成功
 */
async function tryFinalizeSubscription(
  subscriptionId: string,
  periodStart: Date
) {
  const membership = await db.query.userMemberships.findFirst({
    where: eq(userMemberships.stripeSubscriptionId, subscriptionId),
  });

  if (!membership) {
    console.log(`Membership not found for subscription: ${subscriptionId}`);
    return;
  }

  // 条件检查：会员激活 + 用户已关联
  if (membership.status !== "active") {
    console.log(
      `Membership ${membership.id} status is ${membership.status}, not active`
    );
    return;
  }

  if (!membership.userId) {
    console.log(`Membership ${membership.id} has no userId`);
    return;
  }

  // 发放优惠券（内置幂等性检查，基于 membershipPeriodStart）
  await createMembershipCoupons(membership.userId, membership.id, periodStart);
  console.log(`Subscription ${subscriptionId} benefits processed`);
}

// ============================================================================
// Webhook 主入口
// ============================================================================

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 检查事件是否已处理（幂等性）
  const existingLog = await db.query.stripeWebhookLogs.findFirst({
    where: eq(stripeWebhookLogs.eventId, event.id),
  });

  if (existingLog?.processed) {
    return NextResponse.json({ received: true });
  }

  // 记录事件到日志
  await db
    .insert(stripeWebhookLogs)
    .values({
      eventId: event.id,
      eventType: event.type,
      payload: JSON.stringify(event.data.object),
    })
    .onConflictDoNothing();

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // 标记为已处理
    await db
      .update(stripeWebhookLogs)
      .set({
        processed: true,
        processedAt: new Date(),
      })
      .where(eq(stripeWebhookLogs.eventId, event.id));

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing ${event.type}:`, error);

    // 记录错误
    await db
      .update(stripeWebhookLogs)
      .set({
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(stripeWebhookLogs.eventId, event.id));

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// ============================================================================
// 事件处理函数
// ============================================================================

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.client_reference_id;
  const paymentType = session.metadata?.type;
  const paymentStatus = session.payment_status; // "paid" | "unpaid" | "no_payment_required"

  if (!userId) {
    console.error("No client_reference_id in checkout session");
    return;
  }

  // 根据 payment_status 决定支付状态
  // 如果 payment_status 是 "paid"，可以直接标记成功
  // 否则标记为 processing，等待 payment_intent.succeeded 或 invoice.payment_succeeded
  const paymentStatusValue =
    paymentStatus === "paid" ? "succeeded" : "processing";

  // 更新 payment 记录
  const paymentUpdate: Partial<typeof payments.$inferInsert> = {
    status: paymentStatusValue as
      | "pending"
      | "processing"
      | "succeeded"
      | "failed"
      | "refunded"
      | "canceled",
    updatedAt: new Date(),
  };

  if (session.payment_intent) {
    paymentUpdate.stripePaymentIntentId = session.payment_intent as string;
  }
  if (session.invoice) {
    paymentUpdate.stripeInvoiceId = session.invoice as string;
  }
  if (session.subscription) {
    paymentUpdate.stripeSubscriptionId = session.subscription as string;
  }

  await db
    .update(payments)
    .set(paymentUpdate)
    .where(eq(payments.stripeCheckoutSessionId, session.id));

  // 获取更新后的 payment 记录
  const payment = await db.query.payments.findFirst({
    where: eq(payments.stripeCheckoutSessionId, session.id),
  });

  if (paymentType === "one_time") {
    // 一次性支付 - 订单应该在 checkout 之前已创建
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error(
        "No orderId in checkout session metadata for one_time payment"
      );
      return;
    }

    // 验证订单存在
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(orderId)),
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    // 更新 payment 关联订单（确保关联正确）
    await db
      .update(payments)
      .set({
        orderId: order.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.stripeCheckoutSessionId, session.id));

    // 尝试发放权益
    if (payment) {
      await tryFinalizeOneTimePayment(payment.id);
    }
  } else if (paymentType === "subscription") {
    // 订阅支付 - 处理会员订阅
    const subscriptionId = session.subscription as string;
    const stripeCustomerId = session.customer as string;
    let priceId = session.metadata?.priceId || "price_1SjBwxQEUxc7vavPBx2mdMp6";

    if (!subscriptionId) {
      console.error("No subscription id in checkout session", session.id);
      return;
    }
    if (!stripeCustomerId) {
      console.error("No customer id in checkout session", session.id);
      return;
    }

    // 获取订阅详情以获取周期信息
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const periodInfo = getSubscriptionPeriodFromFirstItem(subscription);

    if (periodInfo.priceId) priceId = periodInfo.priceId;

    if (!periodInfo.startDate) {
      console.error(
        "Invalid current_period_start in subscription",
        subscriptionId,
        periodInfo.rawPeriodStart
      );
    }
    if (!periodInfo.endDate) {
      console.error(
        "Invalid current_period_end in subscription",
        subscriptionId,
        periodInfo.rawPeriodEnd
      );
    }

    const periodStart = periodInfo.startDate ?? new Date();
    const periodEnd =
      periodInfo.endDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 如果 payment_status 是 paid，会员状态设为 active
    // 否则设为 pending，等待 invoice.payment_succeeded 确认
    const membershipStatus = paymentStatus === "paid" ? "active" : "pending";

    // 创建或更新会员记录
    let membership = await db.query.userMemberships.findFirst({
      where: eq(userMemberships.stripeSubscriptionId, subscriptionId),
    });

    if (!membership) {
      const [newMembership] = await db
        .insert(userMemberships)
        .values({
          userId: userId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId,
          stripePriceId: priceId,
          status: membershipStatus as
            | "active"
            | "canceled"
            | "expired"
            | "pending",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        })
        .returning();
      membership = newMembership;
    } else if (membership.status !== "active" && paymentStatus === "paid") {
      // 更新状态为 active
      await db
        .update(userMemberships)
        .set({
          status: "active",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        })
        .where(eq(userMemberships.id, membership.id));
    }

    // 尝试发放权益（如果条件满足）
    await tryFinalizeSubscription(subscriptionId, periodStart);
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  // 查找关联的 payment 记录
  const payment = await db.query.payments.findFirst({
    where: eq(payments.stripePaymentIntentId, paymentIntent.id),
  });

  if (!payment) {
    console.log(
      `No payment record found for payment_intent: ${paymentIntent.id}`
    );
    return;
  }

  // 幂等性检查：如果已经是 succeeded，仍尝试发放权益（可能之前订单未关联）
  if (payment.status === "succeeded") {
    console.log(`Payment ${payment.id} already succeeded`);
    if (payment.paymentType === "one_time") {
      await tryFinalizeOneTimePayment(payment.id);
    }
    return;
  }

  // 更新支付状态为成功
  await db
    .update(payments)
    .set({
      status: "succeeded",
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  // 尝试发放权益
  if (payment.paymentType === "one_time") {
    await tryFinalizeOneTimePayment(payment.id);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // 订阅创建时可能还没有绑定用户，延迟处理
  // 实际用户绑定在 checkout.session.completed 中完成
  console.log(`Subscription created: ${subscription.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const membership = await db.query.userMemberships.findFirst({
    where: eq(userMemberships.stripeSubscriptionId, subscription.id),
  });

  if (!membership) return;

  let status: "active" | "canceled" | "expired" | "pending" = "active";
  if (subscription.status === "canceled" || subscription.cancel_at_period_end) {
    status = "canceled";
  } else if (
    subscription.status === "past_due" ||
    subscription.status === "unpaid"
  ) {
    status = "pending";
  }

  // 验证周期时间有效性
  let periodInfo = getSubscriptionPeriodFromFirstItem(subscription);
  if (!periodInfo.startDate || !periodInfo.endDate) {
    try {
      const full = await stripe.subscriptions.retrieve(subscription.id);
      periodInfo = getSubscriptionPeriodFromFirstItem(full);
    } catch (err) {
      console.error("Failed to retrieve subscription", subscription.id, err);
    }
  }

  const updateData: Partial<typeof userMemberships.$inferInsert> = {
    status,
    cancelAt: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000)
      : null,
    canceledAt: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
    updatedAt: new Date(),
  };

  if (periodInfo.startDate)
    updateData.currentPeriodStart = periodInfo.startDate;
  if (periodInfo.endDate) updateData.currentPeriodEnd = periodInfo.endDate;

  await db
    .update(userMemberships)
    .set(updateData)
    .where(eq(userMemberships.id, membership.id));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const membership = await db.query.userMemberships.findFirst({
    where: eq(userMemberships.stripeSubscriptionId, subscription.id),
  });

  if (!membership) return;

  // 更新会员状态为已过期
  await db
    .update(userMemberships)
    .set({
      status: "expired",
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userMemberships.id, membership.id));

  // 作废该会员的所有可用优惠券
  await revokeMembershipCoupons(membership.id, "订阅已取消");
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;

  if (!subscriptionId) {
    console.log("No subscription in invoice, skipping");
    return;
  }

  // 查找关联的 payment 记录（通过 invoice ID）
  const payment = await db.query.payments.findFirst({
    where: eq(payments.stripeInvoiceId, invoice.id),
  });

  if (payment && payment.status !== "succeeded") {
    // 更新支付状态为成功
    await db
      .update(payments)
      .set({
        status: "succeeded",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));
  }

  // 查找会员记录
  const membership = await db.query.userMemberships.findFirst({
    where: eq(userMemberships.stripeSubscriptionId, subscriptionId),
  });

  if (!membership) {
    console.log(`Membership not found for subscription: ${subscriptionId}`);
    return;
  }

  // 获取周期信息
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodInfo = getSubscriptionPeriodFromFirstItem(subscription);

  if (!periodInfo.startDate) {
    console.error(
      "Invalid current_period_start in subscription",
      subscriptionId,
      periodInfo.rawPeriodStart
    );
    return;
  }

  const periodStart = periodInfo.startDate;

  // 更新会员状态为 active（如果不是 active）
  const updateData: Partial<typeof userMemberships.$inferInsert> = {
    currentPeriodStart: periodStart,
    updatedAt: new Date(),
  };

  if (membership.status !== "active") {
    updateData.status = "active";
  }

  if (periodInfo.endDate) updateData.currentPeriodEnd = periodInfo.endDate;

  await db
    .update(userMemberships)
    .set(updateData)
    .where(eq(userMemberships.id, membership.id));

  // 尝试发放权益
  await tryFinalizeSubscription(subscriptionId, periodStart);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // 根据 payment_intent 找到对应的 payment 记录
  if (!charge.payment_intent) return;

  const payment = await db.query.payments.findFirst({
    where: eq(payments.stripePaymentIntentId, charge.payment_intent as string),
  });

  if (!payment) return;

  // 更新 payment 状态为已退款
  await db
    .update(payments)
    .set({
      status: "refunded",
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  // 如果是订阅支付的退款，需要作废相关优惠券
  if (payment.paymentType === "subscription" && payment.userId) {
    // 查找对应的会员记录
    const membership = await db.query.userMemberships.findFirst({
      where: and(
        eq(userMemberships.userId, payment.userId),
        eq(userMemberships.stripeCustomerId, charge.customer as string)
      ),
      orderBy: (userMemberships, { desc }) => [desc(userMemberships.createdAt)],
    });

    if (membership) {
      // 更新会员状态为已过期
      await db
        .update(userMemberships)
        .set({
          status: "expired",
          endedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userMemberships.id, membership.id));

      // 作废该会员的所有可用优惠券
      await revokeMembershipCoupons(membership.id, "订阅已退款");
    }
  }
  // 一次性支付的退款不需要额外处理，payment状态已更新
}

function formatShippingAddress(address?: Stripe.Address | null): string {
  if (!address) return "N/A";
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);
  return parts.join(", ") || "N/A";
}
