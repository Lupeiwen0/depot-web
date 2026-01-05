"use client";

import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MembershipButtonProps {
  className?: string;
}

export function MembershipButton({ className }: MembershipButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      // 使用固定的 price ID
      const priceId = "price_1SjBwxQEUxc7vavPBx2mdMp6";

      // 创建 Checkout Session
      const sessionRes = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          priceId,
        }),
      });

      if (!sessionRes.ok) {
        const error = await sessionRes.json();
        throw new Error(error.error || "创建支付会话失败");
      }

      const { url } = await sessionRes.json();

      // 3. 跳转到 Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      alert(error instanceof Error ? error.message : "订阅失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubscribe}
      disabled={isLoading}
      className={`gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 ${
        className || ""
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Crown className="h-4 w-4" />
      )}
      {isLoading ? "处理中..." : "立即开通会员"}
    </Button>
  );
}
