"use client";

import Link from "next/link";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import ProductCard from "./ProductCard";

type Product = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  tags?: string[] | null;
  salesCount?: number;
  averageRating?: string | null;
  reviewCount?: number | null;
};

interface ProductCardWrapperProps {
  product: Product;
  index: number;
  isInCart: boolean;
}

/**
 * 商品卡片包装器组件
 * 为商品卡片添加滚动渐入动效和链接
 */
export default function ProductCardWrapper({
  product,
  index,
  isInCart,
}: ProductCardWrapperProps) {
  const { ref, isVisible } = useScrollReveal({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        transitionDelay: isVisible ? `${(index % 4) * 100}ms` : "0ms",
      }}
    >
      <Link href={`/products/${product.id}`} className="block">
        <ProductCard product={product} isInCart={isInCart} />
      </Link>
    </div>
  );
}
