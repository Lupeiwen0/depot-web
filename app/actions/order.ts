"use server";

import { db } from "@/db";
import { orders, lineItems, carts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { getServerTranslations } from "@/lib/server-i18n";
import { createOrderSchema, formatZodError } from "@/lib/errors";

export async function createOrder(formData: FormData) {
  const { t } = await getServerTranslations();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: t("api.auth.notLoggedIn") };
    }

    // 验证表单数据
    const checkoutSchema = createOrderSchema(t);
    const validatedData = checkoutSchema.parse({
      name: formData.get("name"),
      address: formData.get("address"),
      email: formData.get("email"),
      payType: formData.get("payType"),
    });

    // 获取用户购物车
    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
      with: {
        lineItems: {
          where: isNull(lineItems.orderId),
        },
      },
    });

    if (!cart || cart.lineItems.length === 0) {
      return { success: false, error: t("api.order.cartEmpty") };
    }

    // 创建订单
    const [order] = await db
      .insert(orders)
      .values({
        name: validatedData.name,
        address: validatedData.address,
        email: validatedData.email,
        payType: validatedData.payType,
        userId: session.user.id,
      })
      .returning();

    // 将购物车中的商品转移到订单
    await db
      .update(lineItems)
      .set({
        orderId: order.id,
        cartId: null,
        updatedAt: new Date(),
      })
      .where(and(eq(lineItems.cartId, cart.id), isNull(lineItems.orderId)));

    return { success: true, orderId: order.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, ...formatZodError(error) };
    }
    console.error("Create order error:", error);
    return { success: false, error: t("api.order.createFailed") };
  }
}
