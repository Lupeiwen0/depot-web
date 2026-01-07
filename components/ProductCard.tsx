"use client";

import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

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
  salesCount?: number;
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
  const { data: session, isPending } = useSession();
  const t = useTranslations("home");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { addItem } = useCartStore();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any parent link clicks if applicable

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
      const result = await addItem(product.id);

      if (result.success) {
        setMessage(t("added"));
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage(result.error || t("failed"));
      }
    } catch (error) {
      setMessage(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col group relative min-h-[480px] rounded-xl border-white/40 bg-white/60 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:border-primary/20 hover:bg-white/80">
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
              {t("noImage")}
            </div>
          )}
          {/* Overlay gradient for text readability if needed, or just cool effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-10" />

          {/* 商品标签 - 固定在图片左上角 */}
          {product.tags && product.tags.length > 0 && (
            <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
              {product.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-primary shadow-lg ring-1 ring-black/5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

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
                  {t("added")}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-1.5 p-4">
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

        {/* 评分和销量 - 左右布局 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {product.averageRating && parseFloat(product.averageRating) > 0 ? (
              <>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">
                  {parseFloat(product.averageRating).toFixed(1)}
                </span>
                {product.reviewCount != null && product.reviewCount > 0 && (
                  <span>({product.reviewCount})</span>
                )}
              </>
            ) : (
              <>
                <Star className="h-3.5 w-3.5 text-muted-foreground/30" />
                <span className="font-medium text-muted-foreground">0.0</span>
              </>
            )}
          </div>
          <span>{t("salesCount", { count: product.salesCount || 0 })}</span>
        </div>

        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-sm font-medium text-destructive">¥</span>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {parseFloat(product.price).toFixed(2)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={loading}
          className="w-full rounded-lg bg-primary/90 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary hover:shadow-md active:scale-95"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t("adding")}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t("addToCart")}
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
