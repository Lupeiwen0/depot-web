import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { verifyAdmin } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - 切换用户状态
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id: userId } = await params;

    const body = await request.json();
    const { status, reason } = body;

    if (!status || !["active", "disabled"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'active' or 'disabled'" },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 不能禁用自己
    if (userId === authResult.user.id) {
      return NextResponse.json(
        { error: "You cannot disable yourself" },
        { status: 400 }
      );
    }

    // 更新用户状态
    if (status === "disabled") {
      await db
        .update(user)
        .set({
          status: "disabled",
          disabledAt: new Date(),
          disabledReason: reason || null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));
    } else {
      await db
        .update(user)
        .set({
          status: "active",
          disabledAt: null,
          disabledReason: null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));
    }

    return NextResponse.json({
      message: `User ${
        status === "disabled" ? "disabled" : "enabled"
      } successfully`,
      status,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    return NextResponse.json(
      { error: "Failed to toggle user status" },
      { status: 500 }
    );
  }
}
