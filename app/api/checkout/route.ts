import { NextResponse } from "next/server";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "@/db";
import { carts, lineItems, userCoupons } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { calculateDiscount } from "@/lib/coupon-service";
import { getServerTranslations } from "@/lib/server-i18n";

// GET - 获取结账页面数据（购物车商品和可用优惠券）
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const { t } = await getServerTranslations();

    if (!session?.user) {
      return NextResponse.json(
        { error: t("api.auth.unauthorized") },
        { status: 401 }
      );
    }

    // 获取用户购物车
    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
      with: {
        lineItems: {
          where: isNull(lineItems.orderId),
          with: {
            product: true,
          },
        },
      },
    });

    const cartItems = cart?.lineItems || [];

    if (cartItems.length === 0) {
      return NextResponse.json({ empty: true });
    }

    // 获取用户可用的优惠券
    const availableCoupons = await db.query.userCoupons.findMany({
      where: and(
        eq(userCoupons.userId, session.user.id),
        eq(userCoupons.status, "available"),
        gt(userCoupons.expiresAt, new Date())
      ),
      orderBy: (userCoupons, { asc }) => [asc(userCoupons.expiresAt)],
    });

    const subtotal = cartItems.reduce((sum, item) => {
      return sum + parseFloat(item.product.price) * item.quantity;
    }, 0);

    // 计算默认折扣（如果有可用优惠券则使用第一张）
    const defaultCoupon = availableCoupons[0];
    const discountAmount = defaultCoupon
      ? calculateDiscount(subtotal, defaultCoupon.percentOff)
      : 0;
    const total = subtotal - discountAmount;

    return NextResponse.json({
      userEmail: session.user.email,
      cartId: cart?.id,
      cartItems: cartItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productTitle: item.product.title,
        productPrice: item.product.price,
        productImage: item.product.imageUrl,
        quantity: item.quantity,
      })),
      coupons: availableCoupons.map((c) => ({
        id: c.id,
        couponCode: c.couponCode,
        percentOff: c.percentOff,
      })),
      subtotal,
      discountAmount,
      total,
    });
  } catch (error) {
    console.error("Get checkout data error:", error);
    const { t } = await getServerTranslations();
    return NextResponse.json(
      { error: t("api.checkout.getFailed") },
      { status: 500 }
    );
  }
}
