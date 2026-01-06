import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  payments,
  orders,
  lineItems,
  carts,
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

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.client_reference_id;
  const paymentType = session.metadata?.type;

  if (!userId) {
    console.error("No client_reference_id in checkout session");
    return;
  }

  // 更新 payment 记录（订阅 checkout.session.completed 通常没有 payment_intent）
  const paymentUpdate: Partial<typeof payments.$inferInsert> = {
    status: "succeeded",
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

  if (paymentType === "one_time") {
    // 一次性支付 - 创建订单或更新已有订单
    const cartId = session.metadata?.cartId;
    const orderId = session.metadata?.orderId;

    if (cartId) {
      // 基于购物车的支付 - 创建新订单
      const cart = await db.query.carts.findFirst({
        where: eq(carts.id, parseInt(cartId)),
        with: {
          lineItems: {
            with: {
              product: true,
            },
          },
          user: true,
        },
      });

      if (!cart) return;

      // 创建订单
      const [order] = await db
        .insert(orders)
        .values({
          name: session.customer_details?.name || cart.user?.name || "Guest",
          address: formatShippingAddress(
            (session as any).shipping_details?.address
          ),
          email: session.customer_details?.email || cart.user?.email || "",
          payType: "Credit card",
          userId: userId,
        })
        .returning();

      // 将购物车商品转移到订单
      for (const item of cart.lineItems) {
        await db
          .update(lineItems)
          .set({
            orderId: order.id,
            cartId: null,
            updatedAt: new Date(),
          })
          .where(eq(lineItems.id, item.id));

        // 更新商品销量
        await db
          .update(products)
          .set({
            salesCount: sql`${products.salesCount} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      // 更新 payment 关联订单
      await db
        .update(payments)
        .set({
          orderId: order.id,
          updatedAt: new Date(),
        })
        .where(eq(payments.stripeCheckoutSessionId, session.id));
    } else if (orderId) {
      // 基于订单的支付 - 订单已存在，只需更新销量
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, parseInt(orderId)),
        with: {
          lineItems: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!order) return;

      // 更新商品销量
      for (const item of order.lineItems) {
        await db
          .update(products)
          .set({
            salesCount: sql`${products.salesCount} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      // 更新 payment 关联订单（如果还没关联）
      await db
        .update(payments)
        .set({
          orderId: order.id,
          updatedAt: new Date(),
        })
        .where(eq(payments.stripeCheckoutSessionId, session.id));

      // 处理优惠券使用完成
      const couponIdStr = session.metadata?.couponId;
      if (couponIdStr && orderId) {
        const couponId = parseInt(couponIdStr);
        if (!isNaN(couponId)) {
          await applyCoupon(couponId, parseInt(orderId));
          console.log(`Applied coupon ${couponId} to order ${orderId}`);
        }
      }
    }
  } else if (paymentType === "subscription") {
    // 订阅支付 - 处理会员订阅
    const subscriptionId = session.subscription as string;
    const stripeCustomerId = session.customer as string;
    const priceId =
      session.metadata?.priceId || "price_1SjBwxQEUxc7vavPBx2mdMp6";

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
    const periodStart = new Date(
      (subscription as any).current_period_start * 1000
    );

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
          status: "active",
          currentPeriodStart: periodStart,
          currentPeriodEnd: new Date(
            (subscription as any).current_period_end * 1000
          ),
        })
        .returning();
      membership = newMembership;
    }

    // 发放优惠券（幂等性检查内置于服务中）
    await createMembershipCoupons(userId, membership.id, periodStart);
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

  await db
    .update(userMemberships)
    .set({
      status,
      currentPeriodStart: new Date(
        (subscription as any).current_period_start * 1000
      ),
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000
      ),
      cancelAt: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000)
        : null,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      updatedAt: new Date(),
    })
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
  // 订阅续费成功时发放优惠券（首次订阅在 checkout.session.completed 中处理）
  if (
    (invoice as any).subscription &&
    invoice.billing_reason === "subscription_cycle"
  ) {
    const subscriptionId = (invoice as any).subscription as string;

    const membership = await db.query.userMemberships.findFirst({
      where: eq(userMemberships.stripeSubscriptionId, subscriptionId),
    });

    if (membership) {
      // 获取当前订阅周期开始时间
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodStart = new Date(
        (subscription as any).current_period_start * 1000
      );

      // 更新会员周期信息
      await db
        .update(userMemberships)
        .set({
          currentPeriodStart: periodStart,
          currentPeriodEnd: new Date(
            (subscription as any).current_period_end * 1000
          ),
          updatedAt: new Date(),
        })
        .where(eq(userMemberships.id, membership.id));

      // 发放优惠券（幂等性检查内置于服务中）
      await createMembershipCoupons(
        membership.userId,
        membership.id,
        periodStart
      );
    }
  }
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
