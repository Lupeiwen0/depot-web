import { NextRequest, NextResponse } from "next/server";
import { eq, and, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { userCoupons } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 先更新过期的优惠券状态
    await db
      .update(userCoupons)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userCoupons.userId, session.user.id),
          eq(userCoupons.status, "available"),
          lt(userCoupons.expiresAt, new Date())
        )
      );

    // 获取用户所有优惠券
    const coupons = await db.query.userCoupons.findMany({
      where: eq(userCoupons.userId, session.user.id),
      orderBy: (userCoupons, { desc }) => [desc(userCoupons.createdAt)],
    });

    // 统计各状态数量
    const stats = coupons.reduce(
      (acc, coupon) => {
        acc.total++;
        if (coupon.status === "available") acc.available++;
        else if (coupon.status === "used") acc.used++;
        else if (coupon.status === "expired") acc.expired++;
        return acc;
      },
      { total: 0, available: 0, used: 0, expired: 0 }
    );

    return NextResponse.json({
      coupons: coupons.map((coupon) => ({
        id: coupon.id,
        couponCode: coupon.couponCode,
        percentOff: coupon.percentOff,
        status: coupon.status,
        expiresAt: coupon.expiresAt.toISOString(),
        usedAt: coupon.usedAt?.toISOString() || null,
        createdAt: coupon.createdAt.toISOString(),
      })),
      ...stats,
    });
  } catch (error) {
    console.error("Get user coupons error:", error);
    return NextResponse.json(
      { error: "Failed to get coupons" },
      { status: 500 }
    );
  }
}
