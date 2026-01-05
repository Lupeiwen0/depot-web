import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// 验证管理员权限
async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (session.user.role !== "admin") {
    return { error: "Forbidden: Admin access required", status: 403 };
  }

  return { user: session.user };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - 删除用户（软删除）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id: userId } = await params;

    // 检查用户是否存在
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 不能删除自己
    if (userId === authResult.user.id) {
      return NextResponse.json(
        { error: "You cannot delete yourself" },
        { status: 400 }
      );
    }

    // 不能删除其他管理员
    if (existingUser.role === "admin") {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 400 }
      );
    }

    // 软删除用户
    await db
      .update(user)
      .set({
        status: "deleted",
        disabledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
