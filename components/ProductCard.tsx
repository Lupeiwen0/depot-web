"use client";

import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { addToCart } from "@/app/actions/cart";
import { useState, useRef } from "react";
import { useCartAnimation } from "@/lib/use-cart-animation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";

type Product = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // 新增字段
  tags?: string[] | null;
  salesCount?: number | null;
  averageRating?: string | null;
  reviewCount?: number | null;
};

export default function ProductCard({
  product,
  isInCart = false,
}: {
  product: Product;
  isInCart?: boolean;
}) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { animateToCart } = useCartAnimation();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any parent link clicks if applicable
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await addToCart(product.id);
      if (result.success) {
        // 触发飞入动画
        if (buttonRef.current) {
          animateToCart(buttonRef.current, {
            duration: 800,
            onComplete: () => {
              setMessage("已添加");
              setTimeout(() => setMessage(""), 2000);
            },
          });
        } else {
          setMessage("已添加");
          setTimeout(() => setMessage(""), 2000);
        }
      } else {
        setMessage(result.error || "失败");
      }
    } catch (error) {
      setMessage("出错");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col group relative h-full overflow-hidden rounded-xl border-white/40 bg-white/60 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:border-primary/20 hover:bg-white/80">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/20">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
              暂无图片
            </div>
          )}
          {/* Overlay gradient for text readability if needed, or just cool effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-10" />

          {/* 已添加标识 - 固定在右上角 */}
          {isInCart && (
            <div className="absolute top-3 right-3 z-10 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1.5 shadow-lg ring-2 ring-white/50 backdrop-blur-sm">
                <svg
                  className="h-3.5 w-3.5 text-white"
                  fill="none"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-xs font-semibold text-white tracking-wide">
                  已添加
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2 p-5">
        {/* 标签显示 */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 -mt-1 mb-1">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {product.title}
          </CardTitle>
        </div>

        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground/80 h-[2.5em]">
            {product.description}
          </p>
        )}

        {/* 评分和销量 */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {product.averageRating && parseFloat(product.averageRating) > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {parseFloat(product.averageRating).toFixed(1)}
              </span>
              {product.reviewCount != null && product.reviewCount > 0 && (
                <span>({product.reviewCount})</span>
              )}
            </span>
          )}
          {product.salesCount != null && product.salesCount > 0 && (
            <span>已售 {product.salesCount}</span>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-sm font-medium text-destructive">¥</span>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {parseFloat(product.price).toFixed(2)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button
          ref={buttonRef}
          onClick={handleAddToCart}
          disabled={loading}
          className="w-full rounded-lg bg-primary/90 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary hover:shadow-md active:scale-95 group-hover:translate-y-0 opacity-100 lg:opacity-0 lg:translate-y-4 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 duration-300"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              添加中...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              加入购物车
            </span>
          )}
        </Button>
      </CardFooter>

      {/* Success/Error Toast - Floating */}
      {message && (
        <div className="absolute top-4 right-4 z-20 animate-in fade-in slide-in-from-top-2">
          <div className="rounded-full bg-background/95 backdrop-blur px-4 py-1.5 text-xs font-medium shadow-lg ring-1 ring-border">
            <span
              className={
                message.includes("已") ? "text-green-600" : "text-red-500"
              }
            >
              {message}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
