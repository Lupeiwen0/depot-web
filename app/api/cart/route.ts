import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { carts, lineItems, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ErrorCodes } from "@/lib/errors";
import { getServerTranslations } from "@/lib/server-i18n";

// GET - 获取用户购物车详情
export async function GET() {
  const { t } = await getServerTranslations();
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: t(ErrorCodes.AUTH_NOT_LOGGED_IN) },
        { status: 401 }
      );
    }

    const userCart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
      with: {
        lineItems: {
          where: isNull(lineItems.orderId),
          with: {
            product: {
              columns: {
                id: true,
                title: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    const cartLineItems =
      userCart?.lineItems?.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
      })) || [];

    const totalItems = cartLineItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalPrice = cartLineItems.reduce((sum, item) => {
      const price = parseFloat(item.product?.price || "0");
      return sum + price * item.quantity;
    }, 0);

    return NextResponse.json({
      lineItems: cartLineItems,
      totalItems,
      totalPrice: totalPrice.toFixed(2),
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: t(ErrorCodes.CART_ADD_FAILED) },
      { status: 500 }
    );
  }
}

// POST - 添加商品到购物车
export async function POST(request: NextRequest) {
  const { t } = await getServerTranslations();
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: t(ErrorCodes.AUTH_NOT_LOGGED_IN) },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId || typeof productId !== "number") {
      return NextResponse.json(
        { error: t(ErrorCodes.VALIDATION_INVALID_ID) },
        { status: 400 }
      );
    }

    // 检查商品是否存在
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: t(ErrorCodes.PRODUCT_NOT_FOUND) },
        { status: 404 }
      );
    }

    // 查找或创建用户的购物车
    let cart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
    });

    if (!cart) {
      const [newCart] = await db
        .insert(carts)
        .values({
          userId: session.user.id,
        })
        .returning();
      cart = newCart;
    }

    // 检查购物车中是否已存在该商品
    const existingItem = await db.query.lineItems.findFirst({
      where: and(
        eq(lineItems.cartId, cart.id),
        eq(lineItems.productId, productId),
        isNull(lineItems.orderId)
      ),
    });

    if (existingItem) {
      // 更新数量
      await db
        .update(lineItems)
        .set({
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(lineItems.id, existingItem.id));
    } else {
      // 创建新的条目
      await db.insert(lineItems).values({
        cartId: cart.id,
        productId,
        quantity,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { error: t(ErrorCodes.CART_ADD_FAILED) },
      { status: 500 }
    );
  }
}
