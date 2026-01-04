"use server";

import { db } from "@/db";
import { carts, lineItems } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addToCart(productId: number) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "请先登录" };
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
    return { success: false, error: "添加失败，请重试" };
  }
}

export async function updateCartItemQuantity(lineItemId: number, quantity: number) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "请先登录" };
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
    return { success: false, error: "更新失败，请重试" };
  }
}

export async function removeCartItem(lineItemId: number) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "请先登录" };
    }

    await db.delete(lineItems).where(eq(lineItems.id, lineItemId));

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("Remove cart item error:", error);
    return { success: false, error: "删除失败，请重试" };
  }
}
