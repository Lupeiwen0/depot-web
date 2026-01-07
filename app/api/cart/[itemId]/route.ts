import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { carts, lineItems } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

// 验证用户对购物车项目的所有权
async function verifyCartItemOwnership(itemId: number, userId: string) {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
  });

  if (!cart) {
    return { valid: false, error: "购物车不存在" };
  }

  const item = await db.query.lineItems.findFirst({
    where: and(eq(lineItems.id, itemId), eq(lineItems.cartId, cart.id)),
  });

  if (!item) {
    return { valid: false, error: "购物车项目不存在" };
  }

  return { valid: true, item };
}

// PATCH - 更新购物车商品数量
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { itemId: itemIdStr } = await params;
    const itemId = parseInt(itemIdStr);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "无效的项目 ID" }, { status: 400 });
    }

    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json({ error: "无效的数量" }, { status: 400 });
    }

    const verification = await verifyCartItemOwnership(itemId, session.user.id);
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 404 });
    }

    if (quantity === 0) {
      // 删除条目
      await db.delete(lineItems).where(eq(lineItems.id, itemId));
    } else {
      // 更新数量
      await db
        .update(lineItems)
        .set({
          quantity,
          updatedAt: new Date(),
        })
        .where(eq(lineItems.id, itemId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update cart item error:", error);
    return NextResponse.json({ error: "更新购物车失败" }, { status: 500 });
  }
}

// DELETE - 从购物车移除商品
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { itemId: itemIdStr } = await params;
    const itemId = parseInt(itemIdStr);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "无效的项目 ID" }, { status: 400 });
    }

    const verification = await verifyCartItemOwnership(itemId, session.user.id);
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 404 });
    }

    await db.delete(lineItems).where(eq(lineItems.id, itemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove cart item error:", error);
    return NextResponse.json({ error: "删除购物车项目失败" }, { status: 500 });
  }
}
