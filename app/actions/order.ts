"use server";

import { db } from "@/db";
import { orders, lineItems, carts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

const checkoutSchema = z.object({
  name: z.string().min(1, "请输入收货人姓名"),
  address: z.string().min(1, "请输入收货地址"),
  email: z.string().email("请输入有效的邮箱地址"),
  payType: z.enum(["Check", "Credit card", "Purchase order"]),
});

export async function createOrder(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "请先登录" };
    }

    // 验证表单数据
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
      return { success: false, error: "购物车是空的" };
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
      return { success: false, error: error.issues[0].message };
    }
    console.error("Create order error:", error);
    return { success: false, error: "创建订单失败，请重试" };
  }
}
