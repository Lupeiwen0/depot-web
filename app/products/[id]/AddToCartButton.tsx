"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { addToCart } from "@/app/actions/cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: number;
  isInCart?: boolean;
}

export default function AddToCartButton({
  productId,
  isInCart: initialIsInCart = false,
}: AddToCartButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isInCart, setIsInCart] = useState(initialIsInCart);
  const [message, setMessage] = useState("");

  const handleAddToCart = async () => {
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await addToCart(productId);
      if (result.success) {
        setIsInCart(true);
        setMessage("已添加到购物车");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result.error || "添加失败");
      }
    } catch {
      setMessage("操作出错");
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
              添加中...
            </span>
          ) : isInCart ? (
            <span className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              已在购物车
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              加入购物车
            </span>
          )}
        </Button>
      </div>

      {message && (
        <p
          className={cn(
            "text-sm text-center py-2 px-4 rounded-lg",
            message.includes("已") || message.includes("成功")
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
