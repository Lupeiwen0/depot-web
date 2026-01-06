"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

interface PayOrderButtonProps {
  orderId: number;
}

export default function PayOrderButton({ orderId }: PayOrderButtonProps) {
  const t = useTranslations("order");
  const tPayment = useTranslations("payment");
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
        alert(data.error || tPayment("paymentFailed"));
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert(tPayment("paymentFailed"));
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
          {t("paying")}
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          {t("payNow")}
        </>
      )}
    </Button>
  );
}
