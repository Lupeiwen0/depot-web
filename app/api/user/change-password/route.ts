import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { account } from "@/db/auth-schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { getServerTranslations } from "@/lib/server-i18n";

export async function POST(request: NextRequest) {
  try {
    const { t } = await getServerTranslations();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: t("api.auth.notLoggedIn") },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: t("api.auth.passwordRequired") },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: t("api.auth.passwordTooShort") },
        { status: 400 }
      );
    }

    // 查找用户的 credential 账户（邮箱密码登录）
    const userAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, session.user.id),
        eq(account.providerId, "credential")
      ),
    });

    if (!userAccount || !userAccount.password) {
      return NextResponse.json(
        { error: t("api.auth.accountNotSupported") },
        { status: 400 }
      );
    }

    // 验证当前密码（使用 better-auth 的 verifyPassword）
    const isValidPassword = await verifyPassword({
      hash: userAccount.password,
      password: currentPassword,
    });

    if (!isValidPassword) {
      return NextResponse.json(
        { error: t("api.auth.incorrectPassword") },
        { status: 400 }
      );
    }

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
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "credential")
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    const { t } = await getServerTranslations();
    return NextResponse.json(
      { error: t("api.auth.changePasswordFailed") },
      { status: 500 }
    );
  }
}
