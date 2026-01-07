"use client";

import { useState, useEffect } from "react";
import { Crown, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useUserStore } from "@/stores/user-store";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionManageButtonProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
}

export function SubscriptionManageButton({
  className,
  variant = "default",
}: SubscriptionManageButtonProps) {
  const {
    isMember,
    isLoading: userLoading,
    isInitialized,
    initialize,
  } = useUserStore();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const t = useTranslations("header");

  // 初始化用户状态
  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleManageSubscription = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/user/subscription/manage", {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "创建管理页面失败");
      }

      const { url } = await res.json();
      if (url) {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Manage subscription error:", error);
      alert(error instanceof Error ? error.message : "操作失败，请重试");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsActionLoading(true);
    try {
      const priceId = "price_1SjBwxQEUxc7vavPBx2mdMp6";
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscription", priceId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "创建支付会话失败");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      alert(error instanceof Error ? error.message : "订阅失败，请重试");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 加载中显示骨架屏
  if (!isInitialized || userLoading) {
    return (
      <div className={`flex items-center gap-2 ${className || ""}`}>
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (isMember) {
    // 已订阅 - 显示订阅管理
    return (
      <Button
        onClick={handleManageSubscription}
        disabled={isActionLoading}
        variant={variant}
        className={`gap-2 ${className || ""}`}
      >
        {isActionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Settings className="h-4 w-4" />
        )}
        {isActionLoading ? t("processing") : t("manageSubscription")}
      </Button>
    );
  }

  // 未订阅 - 显示开通会员
  return (
    <Button
      onClick={handleSubscribe}
      disabled={isActionLoading}
      variant={variant}
      className={`gap-2 ${
        variant === "ghost"
          ? ""
          : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
      } ${className || ""}`}
    >
      {isActionLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Crown className="h-4 w-4" />
      )}
      {isActionLoading ? t("processing") : t("joinMembership")}
    </Button>
  );
}
