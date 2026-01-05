import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userCoupons } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Ticket, Clock, CheckCircle, XCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UserCouponsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const coupons = await db.query.userCoupons.findMany({
    where: eq(userCoupons.userId, session.user.id),
    orderBy: [desc(userCoupons.createdAt)],
  });

  // 统计
  const stats = {
    total: coupons.length,
    available: coupons.filter((c) => c.status === "available").length,
    used: coupons.filter((c) => c.status === "used").length,
    expired: coupons.filter((c) => c.status === "expired").length,
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return {
          label: "可用",
          icon: CheckCircle,
          className: "bg-green-100 text-green-700 border-green-200",
        };
      case "used":
        return {
          label: "已使用",
          icon: CheckCircle,
          className: "bg-gray-100 text-gray-500 border-gray-200",
        };
      case "expired":
        return {
          label: "已过期",
          icon: XCircle,
          className: "bg-red-100 text-red-500 border-red-200",
        };
      default:
        return {
          label: status,
          icon: Ticket,
          className: "bg-gray-100 text-gray-500 border-gray-200",
        };
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* 返回链接 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-slate-900 transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          返回首页
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">我的优惠券</h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-muted-foreground">全部</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-green-600">可用</p>
            <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-muted-foreground">已使用</p>
            <p className="text-2xl font-bold text-slate-400">{stats.used}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-red-500">已过期</p>
            <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
          </div>
        </div>

        {/* 优惠券列表 */}
        {coupons.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <Ticket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              暂无优惠券
            </h3>
            <p className="text-muted-foreground">
              订阅会员即可每月获得 30 张优惠券
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => {
              const statusConfig = getStatusConfig(coupon.status);
              const StatusIcon = statusConfig.icon;
              const isDisabled = coupon.status !== "available";

              return (
                <div
                  key={coupon.id}
                  className={cn(
                    "relative bg-white rounded-xl border overflow-hidden transition-all",
                    isDisabled ? "opacity-60" : "hover:shadow-md"
                  )}
                >
                  <div className="flex">
                    {/* 折扣区域 */}
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center px-6 py-4 min-w-[120px]",
                        coupon.status === "available"
                          ? "bg-gradient-to-br from-primary to-primary/80 text-white"
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <span className="text-3xl font-bold">
                        {coupon.percentOff}%
                      </span>
                      <span className="text-sm opacity-90">折扣</span>
                    </div>

                    {/* 信息区域 */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {coupon.couponCode}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              有效期至{" "}
                              {new Date(coupon.expiresAt).toLocaleDateString(
                                "zh-CN"
                              )}
                            </span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
                            statusConfig.className
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      {coupon.usedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          使用时间：
                          {new Date(coupon.usedAt).toLocaleString("zh-CN")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 虚线装饰 */}
                  <div className="absolute left-[120px] top-0 bottom-0 border-l-2 border-dashed border-slate-200" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
