"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ProductCardWrapper from "./ProductCardWrapper";

interface Product {
  id: number;
  title: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  tags: string[];
  salesCount: number;
  averageRating: string | null;
  reviewCount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ProductListProps {
  initialProducts: Product[];
  initialPagination: Pagination;
  cartProductIds: number[];
}

export default function ProductList({
  initialProducts,
  initialPagination,
  cartProductIds,
}: ProductListProps) {
  const searchParams = useSearchParams();
  const t = useTranslations("home");

  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(initialPagination.page);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialPagination.page < initialPagination.totalPages
  );

  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // 当搜索参数改变时，重置列表
  useEffect(() => {
    setProducts(initialProducts);
    setPage(initialPagination.page);
    setTotalPages(initialPagination.totalPages);
    setHasMore(initialPagination.page < initialPagination.totalPages);
  }, [searchParams, initialProducts, initialPagination]);

  // 加载下一页
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", nextPage.toString());

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.products && data.products.length > 0) {
        setProducts((prev) => [...prev, ...data.products]);
        setPage(nextPage);
        setTotalPages(data.pagination.totalPages);
        setHasMore(nextPage < data.pagination.totalPages);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more products:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, hasMore, searchParams]);

  // 使用 IntersectionObserver 监听滚动
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // 提前100px开始加载
      }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, loadMore]);

  if (products.length === 0) {
    return null; // 空状态由父组件处理
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <ProductCardWrapper
            key={`${product.id}-${index}`}
            product={product}
            index={index}
            isInCart={cartProductIds.includes(product.id)}
          />
        ))}
      </div>

      {/* 加载更多触发器和状态显示 */}
      <div
        ref={observerTarget}
        className="flex items-center justify-center py-8 mt-4"
      >
        {loading && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>{t("loading")}</span>
          </div>
        )}

        {!hasMore && !loading && products.length > 0 && (
          <div className="text-sm text-muted-foreground font-medium py-4 px-6 rounded-full bg-white/40 backdrop-blur-sm border border-white/40 shadow-sm">
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              已加载全部 {products.length} 件商品
            </span>
          </div>
        )}
      </div>
    </>
  );
}
