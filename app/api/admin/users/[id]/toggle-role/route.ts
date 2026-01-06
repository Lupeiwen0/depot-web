import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
import { verifyAdmin, getServerTranslations } from "@/lib/server-i18n";

// PATCH - 切换用户角色
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { t } = await getServerTranslations();
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    // 验证角色值
    if (!role || !["admin", "buyer"].includes(role)) {
      return NextResponse.json(
        { error: t("api.validation.invalidRole") },
        { status: 400 }
      );
    }

    // 查找用户
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: t("api.user.notFound") },
        { status: 404 }
      );
    }

    // 不允许修改自己的角色
    if (targetUser.id === authResult.user.id) {
      return NextResponse.json(
        { error: t("api.user.cannotModifyOwnRole") },
        { status: 403 }
      );
    }

    // 更新角色
    await db
      .update(user)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id));

    return NextResponse.json({
      success: true,
      message: t("api.common.updateSuccess"),
    });
  } catch (error) {
    console.error("Toggle user role error:", error);
    const { t } = await getServerTranslations();
    return NextResponse.json(
      { error: t("api.common.operationFailed") },
      { status: 500 }
    );
  }
}
