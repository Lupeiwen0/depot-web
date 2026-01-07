import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, lineItems, payments, userStripeCustomers } from "@/db/schema";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import { toStripeAmount, calculateItemTotal } from "@/lib/currency";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Decimal from "decimal.js";
import type Stripe from "stripe";
import { validateCoupon, calculateDiscountedTotal } from "@/lib/coupon-service";

interface CreateSessionRequest {
  type?: "one_time" | "subscription";
  paymentType?: "one_time" | "subscription"; // 兼容前端
  orderId?: number; // 支付基于订单
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
  couponId?: number; // 优惠券ID
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateSessionRequest = await request.json();
    const { orderId, priceId, couponId } = body;
    // 兼容 type 和 paymentType 两种参数名
    const type = body.type || body.paymentType || "one_time";
    // 默认的成功和取消 URL
    const successUrl =
      body.successUrl ||
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      body.cancelUrl ||
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/payment/cancel`;

    // 获取或创建 Stripe Customer
    let stripeCustomer = await db.query.userStripeCustomers.findFirst({
      where: eq(userStripeCustomers.userId, session.user.id),
    });

    if (!stripeCustomer) {
      // 创建新的 Stripe Customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
        metadata: {
          userId: session.user.id,
        },
      });

      const [newCustomer] = await db
        .insert(userStripeCustomers)
        .values({
          userId: session.user.id,
          stripeCustomerId: customer.id,
          email: session.user.email,
        })
        .returning();

      stripeCustomer = newCustomer;
    }

    if (type === "one_time") {
      // 一次性支付（基于订单）
      if (!orderId) {
        return NextResponse.json(
          { error: "orderId is required for one_time payment" },
          { status: 400 }
        );
      }

      // 基于订单的支付
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          lineItems: {
            with: {
              product: true,
            },
          },
          payments: true,
        },
      });

      if (!order || order.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Order not found or unauthorized" },
          { status: 404 }
        );
      }

      if (order.lineItems.length === 0) {
        return NextResponse.json({ error: "Order is empty" }, { status: 400 });
      }

      // 检查订单是否已有成功支付
      const successfulPayment = order.payments?.find(
        (p) => p.status === "succeeded"
      );
      if (successfulPayment) {
        return NextResponse.json(
          { error: "Order has already been paid" },
          { status: 400 }
        );
      }

      // 检查是否有 pending 的支付记录，复用同一个 Stripe Session
      const pendingPayment = order.payments?.find(
        (p) => p.status === "pending" && p.stripeCheckoutSessionId
      );
      if (pendingPayment?.stripeCheckoutSessionId) {
        try {
          // 查询 Stripe Session 状态
          const existingSession = await stripe.checkout.sessions.retrieve(
            pendingPayment.stripeCheckoutSessionId
          );
          // Session 仍然有效（open 状态），复用该链接
          if (existingSession.status === "open" && existingSession.url) {
            return NextResponse.json({
              sessionId: existingSession.id,
              url: existingSession.url,
            });
          }
          // Session 已过期或已完成，将 pending 记录标记为 canceled
          if (existingSession.status === "expired") {
            await db
              .update(payments)
              .set({ status: "canceled", updatedAt: new Date() })
              .where(eq(payments.id, pendingPayment.id));
          }
        } catch (e) {
          // Session 查询失败（可能已过期），标记为 canceled
          console.error("Failed to retrieve existing session:", e);
          await db
            .update(payments)
            .set({ status: "canceled", updatedAt: new Date() })
            .where(eq(payments.id, pendingPayment.id));
        }
      }

      const orderLineItems = order.lineItems;

      // 构建 Stripe line items
      const stripeLineItems = orderLineItems.map((item) => ({
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: {
            name: item.product.title,
            description: item.product.description || undefined,
            images: item.product.imageUrl ? [item.product.imageUrl] : undefined,
          },
          unit_amount: toStripeAmount(item.product.price),
        },
        quantity: item.quantity,
      }));

      // 计算总金额（原价）
      const subtotal = orderLineItems.reduce((sum, item) => {
        return sum.plus(calculateItemTotal(item.product.price, item.quantity));
      }, new Decimal(0));

      // 验证并应用优惠券
      let validatedCoupon: { id: number; percentOff: number } | null = null;
      let finalAmount = subtotal;

      if (couponId) {
        const coupon = await validateCoupon(session.user.id, couponId);
        if (!coupon) {
          return NextResponse.json(
            { error: "优惠券无效或已过期" },
            { status: 400 }
          );
        }
        validatedCoupon = { id: coupon.id, percentOff: coupon.percentOff };
        // 计算折后价格
        finalAmount = new Decimal(
          calculateDiscountedTotal(subtotal.toNumber(), coupon.percentOff)
        );
      }

      // 如果有优惠券，则用折后价格重建 line_items
      let finalLineItems = stripeLineItems;
      if (validatedCoupon) {
        // 使用单个 line item 显示折后总价
        finalLineItems = [
          {
            price_data: {
              currency: STRIPE_CONFIG.currency,
              product_data: {
                name: `订单支付（已使用${validatedCoupon.percentOff}%折扣）`,
                description: orderLineItems
                  .map((item) => `${item.product.title} x ${item.quantity}`)
                  .join(", "),
                images: undefined,
              },
              unit_amount: toStripeAmount(finalAmount.toFixed(2)),
            },
            quantity: 1,
          },
        ];
      }

      // 创建 Checkout Session 配置
      const checkoutConfig: Stripe.Checkout.SessionCreateParams = {
        customer: stripeCustomer.stripeCustomerId,
        client_reference_id: session.user.id,
        mode: "payment",
        line_items: finalLineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          orderId: orderId.toString(),
          userId: session.user.id,
          type: "one_time",
          ...(validatedCoupon
            ? { couponId: validatedCoupon.id.toString() }
            : {}),
        },
      };

      // 创建 Checkout Session
      const checkoutSession = await stripe.checkout.sessions.create(
        checkoutConfig
      );

      // 创建本地 payment 记录
      await db.insert(payments).values({
        userId: session.user.id,
        orderId: orderId || undefined,
        stripeCheckoutSessionId: checkoutSession.id,
        paymentType: "one_time",
        amount: finalAmount.toFixed(2),
        currency: STRIPE_CONFIG.currency,
        status: "pending",
        metadata: JSON.stringify({
          orderId: orderId,
          ...(validatedCoupon
            ? {
                couponId: validatedCoupon.id,
                originalAmount: subtotal.toFixed(2),
                discountPercent: validatedCoupon.percentOff,
              }
            : {}),
        }),
      });

      return NextResponse.json({
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      });
    } else if (type === "subscription") {
      // 订阅支付（会员卡）
      if (!priceId) {
        return NextResponse.json(
          { error: "priceId is required for subscription payment" },
          { status: 400 }
        );
      }

      // 获取 Price 信息
      const price = await stripe.prices.retrieve(priceId);

      // 创建订阅 Checkout Session
      // 注意：已指定 customer，邮箱会从 customer 获取
      // customer_update.name 和 customer_update.address 设为 'never' 可防止用户修改
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomer.stripeCustomerId,
        client_reference_id: session.user.id,
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: session.user.id,
          type: "subscription",
          priceId,
        },
      });

      // 创建本地 payment 记录
      const amount = price.unit_amount ? price.unit_amount / 100 : 0;
      await db.insert(payments).values({
        userId: session.user.id,
        stripeCheckoutSessionId: checkoutSession.id,
        paymentType: "subscription",
        amount: amount.toFixed(2),
        currency: price.currency || STRIPE_CONFIG.currency,
        status: "pending",
        metadata: JSON.stringify({ priceId }),
      });

      return NextResponse.json({
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      });
    }

    return NextResponse.json(
      { error: "Invalid payment type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
