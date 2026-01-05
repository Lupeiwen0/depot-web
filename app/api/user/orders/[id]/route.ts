import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orders, productReviews } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - 获取订单详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.userId, session.user.id),
        eq(orders.deletedByUser, false)
      ),
      with: {
        lineItems: {
          with: {
            product: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 获取订单中商品的评价
    const reviews = await db.query.productReviews.findMany({
      where: eq(productReviews.orderId, orderId),
    });

    const reviewsByProductId = new Map(
      reviews.map((r) => [r.productId, r])
    );

    return NextResponse.json({
      order: {
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
          review: reviewsByProductId.has(item.productId)
            ? {
                id: reviewsByProductId.get(item.productId)!.id,
                rating: reviewsByProductId.get(item.productId)!.rating,
                title: reviewsByProductId.get(item.productId)!.title,
                content: reviewsByProductId.get(item.productId)!.content,
                createdAt: reviewsByProductId.get(item.productId)!.createdAt.toISOString(),
              }
            : null,
        })),
        payments: order.payments.map((p) => ({
          id: p.id,
          status: p.status,
          amount: p.amount,
          currency: p.currency,
        })),
      },
    });
  } catch (error) {
    console.error("Get order detail error:", error);
    return NextResponse.json(
      { error: "Failed to get order" },
      { status: 500 }
    );
  }
}

// DELETE - 软删除订单
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // 验证订单所有权
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.userId, session.user.id)
      ),
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    // 软删除订单
    await db
      .update(orders)
      .set({
        deletedByUser: true,
        deletedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
