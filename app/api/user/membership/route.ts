import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { userMemberships } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - 获取用户会员状态
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ isMember: false, membership: null });
    }

    const membership = await db.query.userMemberships.findFirst({
      where: and(
        eq(userMemberships.userId, session.user.id),
        eq(userMemberships.status, "active")
      ),
    });

    if (!membership) {
      return NextResponse.json({ isMember: false, membership: null });
    }

    return NextResponse.json({
      isMember: true,
      membership: {
        id: membership.id,
        status: membership.status,
        currentPeriodStart: membership.currentPeriodStart?.toISOString() || null,
        currentPeriodEnd: membership.currentPeriodEnd?.toISOString() || null,
        createdAt: membership.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get membership status error:", error);
    return NextResponse.json({ isMember: false, membership: null });
  }
}
