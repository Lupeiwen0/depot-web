import { db } from "@/db";
import { userCoupons, userMemberships } from "@/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { randomBytes } from "crypto";

// 常量配置
const COUPON_COUNT = 20; // 会员周期发放的优惠券数量
const COUPON_VALIDITY_DAYS = 30; // 优惠券有效期（天）
const COUPON_PERCENT_OFF = 10; // 折扣百分比（10% = 9折）

/**
 * 生成唯一的优惠券码
 * 格式：前缀 + 随机字符串，例如：VIP-A1B2C3D4
 */
export function generateCouponCode(): string {
  const randomPart = randomBytes(4).toString("hex").toUpperCase();
  return `VIP-${randomPart}`;
}

/**
 * 创建会员优惠券（含幂等性检查）
 * @param userId 用户ID
 * @param membershipId 会员记录ID
 * @param periodStart 会员周期开始时间（用于幂等性检查）
 */
export async function createMembershipCoupons(
  userId: string,
  membershipId: number,
  periodStart: Date
): Promise<{ created: number; skipped: boolean }> {
  // 幂等性检查：检查该周期是否已发放过优惠券
  const existingCoupons = await db.query.userCoupons.findFirst({
    where: and(
      eq(userCoupons.userId, userId),
      eq(userCoupons.membershipId, membershipId),
      eq(userCoupons.membershipPeriodStart, periodStart)
    ),
  });

  if (existingCoupons) {
    console.log(
      `Coupons already issued for membership ${membershipId} period ${periodStart.toISOString()}`
    );
    return { created: 0, skipped: true };
  }

  const expiresAt = new Date(
    Date.now() + COUPON_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  );
  let createdCount = 0;

  for (let i = 0; i < COUPON_COUNT; i++) {
    try {
      await db.insert(userCoupons).values({
        userId,
        couponCode: generateCouponCode(),
        percentOff: COUPON_PERCENT_OFF,
        status: "available",
        expiresAt,
        membershipId,
        membershipPeriodStart: periodStart,
      });
      createdCount++;
    } catch (error) {
      // 优惠券码冲突时重试
      if ((error as any)?.code === "23505") {
        // unique_violation
        i--; // 重试当前索引
        continue;
      }
      console.error(`Failed to create coupon ${i + 1}:`, error);
    }
  }

  console.log(
    `Created ${createdCount} coupons for user ${userId}, membership ${membershipId}`
  );
  return { created: createdCount, skipped: false };
}

/**
 * 获取用户可用的优惠券列表
 */
export async function getAvailableCoupons(userId: string) {
  // 先更新过期的优惠券状态
  await db
    .update(userCoupons)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userCoupons.userId, userId),
        eq(userCoupons.status, "available"),
        lt(userCoupons.expiresAt, new Date())
      )
    );

  // 获取可用优惠券
  return db.query.userCoupons.findMany({
    where: and(
      eq(userCoupons.userId, userId),
      eq(userCoupons.status, "available"),
      gt(userCoupons.expiresAt, new Date())
    ),
    orderBy: (userCoupons, { asc }) => [asc(userCoupons.expiresAt)],
  });
}

/**
 * 验证优惠券有效性
 * @returns 优惠券信息（如果有效）或 null（如果无效）
 */
export async function validateCoupon(userId: string, couponId: number) {
  const coupon = await db.query.userCoupons.findFirst({
    where: and(
      eq(userCoupons.id, couponId),
      eq(userCoupons.userId, userId),
      eq(userCoupons.status, "available"),
      gt(userCoupons.expiresAt, new Date())
    ),
  });

  return coupon;
}

/**
 * 应用优惠券到订单（标记为已使用）
 * @param couponId 优惠券ID
 * @param orderId 订单ID
 */
export async function applyCoupon(
  couponId: number,
  orderId: number
): Promise<boolean> {
  const result = await db
    .update(userCoupons)
    .set({
      status: "used",
      usedAt: new Date(),
      usedOrderId: orderId,
      updatedAt: new Date(),
    })
    .where(
      and(eq(userCoupons.id, couponId), eq(userCoupons.status, "available"))
    )
    .returning({ id: userCoupons.id });

  return result.length > 0;
}

/**
 * 作废会员的所有可用优惠券
 * @param membershipId 会员记录ID
 * @param reason 作废原因（用于日志）
 */
export async function revokeMembershipCoupons(
  membershipId: number,
  reason: string
): Promise<number> {
  const result = await db
    .update(userCoupons)
    .set({
      status: "revoked",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userCoupons.membershipId, membershipId),
        eq(userCoupons.status, "available")
      )
    )
    .returning({ id: userCoupons.id });

  const count = result.length;
  console.log(
    `Revoked ${count} coupons for membership ${membershipId}: ${reason}`
  );
  return count;
}

/**
 * 计算折扣金额
 * @param totalAmount 原价
 * @param percentOff 折扣百分比
 * @returns 折扣金额
 */
export function calculateDiscount(
  totalAmount: number,
  percentOff: number
): number {
  return totalAmount * (percentOff / 100);
}

/**
 * 计算折后价格
 * @param totalAmount 原价
 * @param percentOff 折扣百分比
 * @returns 折后价格
 */
export function calculateDiscountedTotal(
  totalAmount: number,
  percentOff: number
): number {
  return totalAmount * (1 - percentOff / 100);
}
