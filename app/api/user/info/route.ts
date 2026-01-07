import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { user, userMemberships } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - 获取当前用户完整信息
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取用户详细信息
    const userInfo = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    if (!userInfo) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 获取会员状态
    const membership = await db.query.userMemberships.findFirst({
      where: and(
        eq(userMemberships.userId, session.user.id),
        eq(userMemberships.status, "active")
      ),
    });

    return NextResponse.json({
      user: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        role: userInfo.role,
        createdAt: userInfo.createdAt?.toISOString() || null,
      },
      isMember: !!membership,
      membership: membership
        ? {
            id: membership.id,
            status: membership.status,
            currentPeriodStart:
              membership.currentPeriodStart?.toISOString() || null,
            currentPeriodEnd:
              membership.currentPeriodEnd?.toISOString() || null,
            createdAt: membership.createdAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Get user info error:", error);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}
