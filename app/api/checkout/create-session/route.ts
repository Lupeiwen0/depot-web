import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  carts,
  orders,
  lineItems,
  products,
  payments,
  userStripeCustomers,
} from "@/db/schema";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import { toStripeAmount, calculateItemTotal } from "@/lib/currency";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Decimal from "decimal.js";
import type Stripe from "stripe";

interface CreateSessionRequest {
  type?: "one_time" | "subscription";
  paymentType?: "one_time" | "subscription"; // 兼容前端
  cartId?: number;
  orderId?: number; // 支持基于订单的支付
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
  couponCode?: string;
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
    const { cartId, orderId, priceId, couponCode } = body;
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
      // 一次性支付（购物车结算或订单支付）
      let orderLineItems: Array<{
        product: {
          title: string;
          description: string | null;
          imageUrl: string | null;
          price: string;
        };
        quantity: number;
      }> = [];
      let metadataId: string;
      let metadataType: "cartId" | "orderId";

      if (orderId) {
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
          return NextResponse.json(
            { error: "Order is empty" },
            { status: 400 }
          );
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

        orderLineItems = order.lineItems;
        metadataId = orderId.toString();
        metadataType = "orderId";
      } else if (cartId) {
        // 基于购物车的支付
        const cart = await db.query.carts.findFirst({
          where: eq(carts.id, cartId),
          with: {
            lineItems: {
              with: {
                product: true,
              },
            },
          },
        });

        if (!cart || cart.userId !== session.user.id) {
          return NextResponse.json(
            { error: "Cart not found or unauthorized" },
            { status: 404 }
          );
        }

        if (cart.lineItems.length === 0) {
          return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        orderLineItems = cart.lineItems;
        metadataId = cartId.toString();
        metadataType = "cartId";
      } else {
        return NextResponse.json(
          { error: "orderId or cartId is required for one_time payment" },
          { status: 400 }
        );
      }

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

      // 计算总金额
      const totalAmount = orderLineItems.reduce((sum, item) => {
        return sum.plus(calculateItemTotal(item.product.price, item.quantity));
      }, new Decimal(0));

      // 创建 Checkout Session 配置
      const checkoutConfig: Stripe.Checkout.SessionCreateParams = {
        customer: stripeCustomer.stripeCustomerId,
        client_reference_id: session.user.id,
        mode: "payment",
        line_items: stripeLineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        metadata: {
          [metadataType]: metadataId,
          userId: session.user.id,
          type: "one_time",
        },
      };

      // 如果有优惠券代码，添加到 discounts
      if (couponCode) {
        checkoutConfig.discounts = [{ coupon: couponCode }];
        // 使用 discounts 时不能同时使用 allow_promotion_codes
        checkoutConfig.allow_promotion_codes = undefined;
      }

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
        amount: totalAmount.toFixed(2),
        currency: STRIPE_CONFIG.currency,
        status: "pending",
        metadata: JSON.stringify({ [metadataType]: metadataId }),
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
