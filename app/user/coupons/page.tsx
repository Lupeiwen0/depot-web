import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchInternalApiWithAuth } from "@/lib/api-utils";
import { MembershipButton } from "@/components/MembershipButton";

export const dynamic = "force-dynamic";

interface Coupon {
  id: number;
  couponCode: string;
  percentOff: number;
  status: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

interface Membership {
  id: number;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

async function getCouponsData(cookie: string) {
  const res = await fetchInternalApiWithAuth("/api/user/coupons", cookie);

  if (!res.ok) {
    if (res.status === 401) {
      return null; // 未登录
    }
    return { coupons: [], total: 0, available: 0, used: 0, expired: 0 };
  }

  return await res.json();
}

async function getMembershipData(cookie: string) {
  const res = await fetchInternalApiWithAuth("/api/user/membership", cookie);

  if (!res.ok) {
    return { isMember: false, membership: null };
  }

  return await res.json();
}

export default async function UserCouponsPage() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";

  const [couponsData, membershipData] = await Promise.all([
    getCouponsData(cookie),
    getMembershipData(cookie),
  ]);

  // 未登录重定向
  if (couponsData === null) {
    redirect("/login");
  }

  const coupons: Coupon[] = couponsData.coupons || [];
  const stats = {
    total: couponsData.total || 0,
    available: couponsData.available || 0,
    used: couponsData.used || 0,
    expired: couponsData.expired || 0,
  };

  const isMember = membershipData.isMember;
  const membership: Membership | null = membershipData.membership;

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

        {/* 会员状态提示 */}
        {!isMember && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    开通会员，享更多优惠
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    成为会员每月可获得 30 张 10% 折扣优惠券
                  </p>
                </div>
              </div>
              <MembershipButton />
            </div>
          </div>
        )}

        {/* 会员状态显示 */}
        {isMember && membership && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">尊贵会员</h3>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                    生效中
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  会员有效期至{" "}
                  {membership.currentPeriodEnd
                    ? new Date(membership.currentPeriodEnd).toLocaleDateString(
                        "zh-CN"
                      )
                    : "未知"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-muted-foreground">全部</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-green-600">可用</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.available}
            </p>
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
            <p className="text-muted-foreground mb-6">
              订阅会员即可每月获得 30 张优惠券
            </p>
            {!isMember && <MembershipButton />}
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
