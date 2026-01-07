"use server";

import { db } from "@/db";
import { carts, lineItems } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerTranslations } from "@/lib/server-i18n";
import { ErrorCodes } from "@/lib/errors";

export async function addToCart(productId: number) {
  const { t } = await getServerTranslations();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: t(ErrorCodes.AUTH_NOT_LOGGED_IN) };
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
        eq(lineItems.productId, productId)
      ),
    });

    if (existingItem) {
      // 更新数量
      await db
        .update(lineItems)
        .set({
          quantity: existingItem.quantity + 1,
          updatedAt: new Date(),
        })
        .where(eq(lineItems.id, existingItem.id));
    } else {
      // 创建新的条目
      await db.insert(lineItems).values({
        cartId: cart.id,
        productId,
        quantity: 1,
      });
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Add to cart error:", error);
    return { success: false, error: t(ErrorCodes.CART_ADD_FAILED) };
  }
}

export async function updateCartItemQuantity(
  lineItemId: number,
  quantity: number
) {
  const { t } = await getServerTranslations();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: t(ErrorCodes.AUTH_NOT_LOGGED_IN) };
    }

    if (quantity <= 0) {
      // 删除条目
      await db.delete(lineItems).where(eq(lineItems.id, lineItemId));
    } else {
      // 更新数量
      await db
        .update(lineItems)
        .set({
          quantity,
          updatedAt: new Date(),
        })
        .where(eq(lineItems.id, lineItemId));
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Update cart item error:", error);
    return { success: false, error: t(ErrorCodes.CART_UPDATE_FAILED) };
  }
}

export async function removeCartItem(lineItemId: number) {
  const { t } = await getServerTranslations();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: t(ErrorCodes.AUTH_NOT_LOGGED_IN) };
    }

    await db.delete(lineItems).where(eq(lineItems.id, lineItemId));

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Remove cart item error:", error);
    return { success: false, error: t(ErrorCodes.CART_REMOVE_FAILED) };
  }
}
