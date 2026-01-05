import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, lineItems, products, payments } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - 获取用户订单列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取用户订单（不显示已删除的）
    const userOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.userId, session.user.id),
        eq(orders.deletedByUser, false)
      ),
      orderBy: [desc(orders.createdAt)],
      with: {
        lineItems: {
          with: {
            product: true,
          },
        },
        payments: true,
      },
    });

    return NextResponse.json({
      orders: userOrders.map((order) => ({
        id: order.id,
        name: order.name,
        address: order.address,
        email: order.email,
        payType: order.payType,
        createdAt: order.createdAt.toISOString(),
        items: order.lineItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          productTitle: item.product.title,
          productPrice: item.product.price,
          productImage: item.product.imageUrl,
          quantity: item.quantity,
        })),
        payment: order.payments[0]
          ? {
              status: order.payments[0].status,
              amount: order.payments[0].amount,
              currency: order.payments[0].currency,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    return NextResponse.json(
      { error: "Failed to get orders" },
      { status: 500 }
    );
  }
}
