import { NextResponse } from "next/server";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "@/db";
import { carts, lineItems, userCoupons } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - 获取结账页面数据（购物车商品和可用优惠券）
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    });

    const total = cartItems.reduce((sum, item) => {
      return sum + parseFloat(item.product.price) * item.quantity;
    }, 0);

    return NextResponse.json({
      userEmail: session.user.email,
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
      total,
    });
  } catch (error) {
    console.error("Get checkout data error:", error);
    return NextResponse.json(
      { error: "Failed to get checkout data" },
      { status: 500 }
    );
  }
}
