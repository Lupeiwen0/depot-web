import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, verification } from "@/db/auth-schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendPasswordResetEmail } from "@/lib/email";
import { getServerTranslations } from "@/lib/server-i18n";

export async function POST(request: NextRequest) {
  try {
    const { t } = await getServerTranslations();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: t("api.auth.emailRequired") },
        { status: 400 }
      );
    }

    // 查找用户
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    // 不管用户是否存在都返回成功，避免泄露用户信息
    if (!existingUser) {
      return NextResponse.json({ success: true });
    }

    // 生成重置 token
    const token = nanoid(32);

    // 设置过期时间（30分钟后）
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // 删除该用户之前的重置请求
    await db
      .delete(verification)
      .where(eq(verification.identifier, `password-reset:${existingUser.id}`));

    // 创建新的重置记录
    await db.insert(verification).values({
      id: nanoid(),
      identifier: `password-reset:${existingUser.id}`,
      value: token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 发送重置邮件
    const result = await sendPasswordResetEmail(email, token);

    if (!result.success) {
      console.error("Send reset email failed:", result.error);
      return NextResponse.json(
        { error: t("api.auth.sendEmailFailed") },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Request password reset error:", error);
    const { t } = await getServerTranslations();
    return NextResponse.json(
      { error: t("api.auth.requestFailed") },
      { status: 500 }
    );
  }
}
