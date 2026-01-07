import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orders, lineItems, carts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const orderSchema = z.object({
  name: z.string().min(1, "请输入姓名"),
  address: z.string().min(1, "请输入地址"),
  email: z.string().email("请输入有效的邮箱地址"),
  payType: z.enum(["Check", "Credit card", "Purchase order"] as const, {
    message: "请选择支付方式",
  }),
});

// POST - 创建订单
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();

    // 验证表单数据
    const validated = orderSchema.safeParse(body);
    if (!validated.success) {
      const errors = validated.error.flatten();
      return NextResponse.json(
        {
          error: "表单验证失败",
          fieldErrors: errors.fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, address, email, payType } = validated.data;

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
      return NextResponse.json({ error: "购物车为空" }, { status: 400 });
    }

    // 创建订单
    const [order] = await db
      .insert(orders)
      .values({
        name,
        address,
        email,
        payType,
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

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}
