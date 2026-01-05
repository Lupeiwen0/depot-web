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

      case "coupon.updated":
        await handleCouponUpdated(event.data.object as Stripe.Coupon);
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

  // 更新 payment 记录
  await db
    .update(payments)
    .set({
      status: "succeeded",
      stripePaymentIntentId: session.payment_intent as string,
      updatedAt: new Date(),
    })
    .where(eq(payments.stripeCheckoutSessionId, session.id));

  if (paymentType === "one_time") {
    // 一次性支付 - 创建订单
    const cartId = session.metadata?.cartId;
    if (!cartId) return;

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
  } else if (paymentType === "subscription") {
    // 订阅支付 - 处理会员订阅
    const subscriptionId = session.subscription as string;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // 创建或更新会员记录
    const existingMembership = await db.query.userMemberships.findFirst({
      where: eq(userMemberships.stripeSubscriptionId, subscriptionId),
    });

    if (!existingMembership) {
      await db.insert(userMemberships).values({
        userId: userId,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        status: "active",
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          (subscription as any).current_period_end * 1000
        ),
      });
    }
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
  await db
    .update(userMemberships)
    .set({
      status: "expired",
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userMemberships.stripeSubscriptionId, subscription.id));
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // 订阅续费成功时发放优惠券
  if (
    (invoice as any).subscription &&
    invoice.billing_reason === "subscription_cycle"
  ) {
    const membership = await db.query.userMemberships.findFirst({
      where: eq(
        userMemberships.stripeSubscriptionId,
        (invoice as any).subscription as string
      ),
    });

    if (membership) {
      await createMembershipCoupons(
        membership.userId,
        membership.id,
        membership.stripeCustomerId
      );
    }
  }

  // 首次订阅成功也发放优惠券
  if (
    (invoice as any).subscription &&
    invoice.billing_reason === "subscription_create"
  ) {
    const membership = await db.query.userMemberships.findFirst({
      where: eq(
        userMemberships.stripeSubscriptionId,
        (invoice as any).subscription as string
      ),
    });

    if (membership) {
      await createMembershipCoupons(
        membership.userId,
        membership.id,
        membership.stripeCustomerId
      );
    }
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // 根据 payment_intent 找到对应的 payment 记录
  if (charge.payment_intent) {
    await db
      .update(payments)
      .set({
        status: "refunded",
        updatedAt: new Date(),
      })
      .where(
        eq(payments.stripePaymentIntentId, charge.payment_intent as string)
      );
  }
}

async function handleCouponUpdated(coupon: Stripe.Coupon) {
  // 检查优惠券是否已被使用
  if (coupon.times_redeemed && coupon.times_redeemed > 0) {
    await db
      .update(userCoupons)
      .set({
        status: "used",
        usedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userCoupons.stripeCouponId, coupon.id));
  }
}

async function createMembershipCoupons(
  userId: string,
  membershipId: number,
  stripeCustomerId: string
) {
  const COUPON_COUNT = 30;
  const COUPON_VALIDITY_DAYS = 30;

  // 获取所有普通商品的 Stripe Product ID
  const oneTimeProducts = await db.query.products.findMany({
    where: and(
      eq(products.productType, "one_time"),
      eq(products.isActive, true)
    ),
  });

  const stripeProductIds = oneTimeProducts
    .map((p) => p.stripeProductId)
    .filter((id): id is string => id !== null);

  for (let i = 0; i < COUPON_COUNT; i++) {
    try {
      // 在 Stripe 创建优惠券
      const stripeCoupon = await stripe.coupons.create({
        percent_off: 10,
        duration: "once",
        max_redemptions: 1,
        redeem_by:
          Math.floor(Date.now() / 1000) + COUPON_VALIDITY_DAYS * 24 * 60 * 60,
        applies_to:
          stripeProductIds.length > 0
            ? { products: stripeProductIds }
            : undefined,
        metadata: {
          userId,
          membershipId: membershipId.toString(),
        },
      });

      // 记录到本地数据库
      await db.insert(userCoupons).values({
        userId,
        stripeCouponId: stripeCoupon.id,
        couponCode: stripeCoupon.id,
        stripeCustomerId,
        percentOff: 10,
        duration: "once",
        status: "available",
        expiresAt: new Date(
          Date.now() + COUPON_VALIDITY_DAYS * 24 * 60 * 60 * 1000
        ),
        membershipId,
      });
    } catch (error) {
      console.error(`Failed to create coupon ${i + 1}:`, error);
    }
  }
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
