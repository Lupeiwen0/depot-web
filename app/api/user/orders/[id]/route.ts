import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ id: string }>;
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
