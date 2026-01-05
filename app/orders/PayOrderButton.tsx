"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

interface PayOrderButtonProps {
  orderId: number;
}

export default function PayOrderButton({ orderId }: PayOrderButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentType: "one_time",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "创建支付会话失败");
        return;
      }

      // 跳转到 Stripe Checkout 页面
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("支付请求失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handlePay}
      disabled={loading}
      className="gap-1"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          处理中...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          去支付
        </>
      )}
    </Button>
  );
}
