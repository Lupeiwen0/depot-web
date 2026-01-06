"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteOrderButtonProps {
  orderId: number;
}

export default function DeleteOrderButton({ orderId }: DeleteOrderButtonProps) {
  const router = useRouter();
  const t = useTranslations("order");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/orders/${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || tCommon("deleteFailed"));
      }
    } catch {
      alert(tCommon("operationFailed"));
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("confirmDeleteOrder")}</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? t("deleting") : tCommon("confirm")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setShowConfirm(true)}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
