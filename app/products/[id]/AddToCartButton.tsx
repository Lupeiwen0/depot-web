"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

interface AddToCartButtonProps {
  productId: number;
  isInCart?: boolean;
}

export default function AddToCartButton({
  productId,
  isInCart: _initialIsInCart = false,
}: AddToCartButtonProps) {
  const t = useTranslations("product");
  const tHome = useTranslations("home");
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // 从 store 获取购物车状态，实现实时同步
  const { items: cartItems, addItem, isInitialized } = useCartStore();
  // 使用 isInitialized 判断：store 初始化后使用 store 数据，否则使用服务端初始值
  const isInCart = isInitialized
    ? cartItems.some((item) => item.productId === productId)
    : _initialIsInCart;

  const handleAddToCart = async () => {
    // 等待 session 加载完成
    if (isPending) {
      return;
    }

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await addItem(productId);

      if (result.success) {
        setIsSuccess(true);
        setMessage(tHome("addedToCart"));
        setTimeout(() => setMessage(""), 3000);
      } else {
        setIsSuccess(false);
        setMessage(result.error || tHome("addFailed"));
      }
    } catch {
      setIsSuccess(false);
      setMessage(tHome("operationError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <Button
          onClick={handleAddToCart}
          disabled={loading}
          size="lg"
          className={cn(
            "flex-1 h-14 text-lg font-medium rounded-xl transition-all",
            isInCart
              ? "bg-green-500 hover:bg-green-600"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t("adding")}
            </span>
          ) : isInCart ? (
            <span className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              {t("inCart")}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t("addToCart")}
            </span>
          )}
        </Button>
      </div>

      {message && (
        <p
          className={cn(
            "text-sm text-center py-2 px-4 rounded-lg",
            isSuccess ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
