import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { carts, lineItems } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ErrorCodes } from "@/lib/errors";
import { getServerTranslations } from "@/lib/server-i18n";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

// 验证用户对购物车项目的所有权
async function verifyCartItemOwnership(
  itemId: number,
  userId: string,
  t: (key: string) => string
) {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
  });

  if (!cart) {
    return { valid: false, error: t(ErrorCodes.VALIDATION_NOT_FOUND) };
  }

  const item = await db.query.lineItems.findFirst({
    where: and(eq(lineItems.id, itemId), eq(lineItems.cartId, cart.id)),
  });

  if (!item) {
    return { valid: false, error: t(ErrorCodes.VALIDATION_NOT_FOUND) };
  }

  return { valid: true, item };
}

// PATCH - 更新购物车商品数量
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { t } = await getServerTranslations();
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: t(ErrorCodes.AUTH_NOT_LOGGED_IN) },
        { status: 401 }
      );
    }

    const { itemId: itemIdStr } = await params;
    const itemId = parseInt(itemIdStr);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: t(ErrorCodes.VALIDATION_INVALID_ID) },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json(
        { error: t(ErrorCodes.VALIDATION_INVALID_REQUEST) },
        { status: 400 }
      );
    }

    const verification = await verifyCartItemOwnership(
      itemId,
      session.user.id,
      t
    );
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
    return NextResponse.json(
      { error: t(ErrorCodes.CART_UPDATE_FAILED) },
      { status: 500 }
    );
  }
}

// DELETE - 从购物车移除商品
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { t } = await getServerTranslations();
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: t(ErrorCodes.AUTH_NOT_LOGGED_IN) },
        { status: 401 }
      );
    }

    const { itemId: itemIdStr } = await params;
    const itemId = parseInt(itemIdStr);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: t(ErrorCodes.VALIDATION_INVALID_ID) },
        { status: 400 }
      );
    }

    const verification = await verifyCartItemOwnership(
      itemId,
      session.user.id,
      t
    );
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 404 });
    }

    await db.delete(lineItems).where(eq(lineItems.id, itemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove cart item error:", error);
    return NextResponse.json(
      { error: t(ErrorCodes.CART_REMOVE_FAILED) },
      { status: 500 }
    );
  }
}
