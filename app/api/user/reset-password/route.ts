import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { account, verification } from "@/db/auth-schema";
import { eq, and, like, gt } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { getServerTranslations } from "@/lib/server-i18n";

export async function POST(request: NextRequest) {
  try {
    const { t } = await getServerTranslations();
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: t("api.auth.tokenAndPasswordRequired") },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: t("api.auth.passwordTooShort") },
        { status: 400 }
      );
    }

    // 查找有效的重置记录
    const resetRecord = await db.query.verification.findFirst({
      where: and(
        eq(verification.value, token),
        like(verification.identifier, "password-reset:%"),
        gt(verification.expiresAt, new Date())
      ),
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: t("api.auth.invalidOrExpiredToken") },
        { status: 400 }
      );
    }

    // 从 identifier 中提取用户 ID
    const userId = resetRecord.identifier.replace("password-reset:", "");

    // 加密新密码（使用 better-auth 的 hashPassword）
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    await db
      .update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(
        and(eq(account.userId, userId), eq(account.providerId, "credential"))
      );

    // 删除重置记录
    await db.delete(verification).where(eq(verification.id, resetRecord.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    const { t } = await getServerTranslations();
    return NextResponse.json(
      { error: t("api.auth.resetPasswordFailed") },
      { status: 500 }
    );
  }
}
