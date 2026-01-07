import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { carts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
// 该接口返回空数组作为错误处理，无需国际化错误消息

// GET - 获取用户购物车中的商品ID列表
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ productIds: [] });
    }

    const userCart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
      with: {
        lineItems: {
          columns: {
            productId: true,
          },
        },
      },
    });

    const productIds = userCart?.lineItems?.map((item) => item.productId) || [];

    return NextResponse.json({ productIds });
  } catch (error) {
    console.error("Get cart product ids error:", error);
    return NextResponse.json({ productIds: [] });
  }
}
