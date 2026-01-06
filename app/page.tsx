import ProductCardWrapper from "@/components/ProductCardWrapper";
import ProductSearchBar from "@/components/ProductSearchBar";
import TagFilter from "@/components/TagFilter";
import SortSelector from "@/components/SortSelector";
import ProductList from "@/components/ProductList";
import { headers } from "next/headers";
import { Suspense } from "react";
import { fetchInternalApi, fetchInternalApiWithAuth } from "@/lib/api-utils";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  tags?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: string;
}

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

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string | null;
}

async function getProductsData(searchParams: SearchParams) {
  const queryParams = new URLSearchParams();
  if (searchParams.search) queryParams.set("search", searchParams.search);
  if (searchParams.tags) queryParams.set("tags", searchParams.tags);
  if (searchParams.page) queryParams.set("page", searchParams.page);
  if (searchParams.pageSize) queryParams.set("pageSize", searchParams.pageSize);
  if (searchParams.sortBy) queryParams.set("sortBy", searchParams.sortBy);
  if (searchParams.sortOrder)
    queryParams.set("sortOrder", searchParams.sortOrder);

  const res = await fetchInternalApi(`/api/products?${queryParams.toString()}`);

  if (!res.ok) {
    return {
      products: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    };
  }

  const data = await res.json();
  return {
    products: data.products as Product[],
    pagination: data.pagination as {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    },
  };
}

async function getTagsData() {
  const res = await fetchInternalApi("/api/tags");

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.tags as Tag[];
}

async function getCartProductIds() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";

  try {
    const res = await fetchInternalApiWithAuth("/api/cart/product-ids", cookie);

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.productIds as number[];
  } catch (error) {
    console.error("获取购物车信息失败:", error);
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [{ products: allProducts, pagination }, tags, cartProductIds, t] =
    await Promise.all([
      getProductsData(params),
      getTagsData(),
      getCartProductIds(),
      getTranslations("home"),
    ]);

  const hasFilters = params.search || params.tags;

  return (
    <main className="min-h-screen">
      {/* Hero Section - Fixed Background */}
      <section className="fixed top-0 left-0 w-full h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center rounded-full border border-white/40 bg-white/30 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition-colors cursor-default hover:bg-white/40 dark:border-white/20 dark:bg-white/10 dark:text-slate-200">
              <span className="mr-2">✨</span>
              <span>{t("heroTag")}</span>
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 drop-shadow-sm leading-tight">
              {t("heroTitle")}
            </h1>

            <p className="max-w-[700px] text-lg text-slate-700 dark:text-slate-300 md:text-2xl/relaxed font-medium tracking-wide">
              {t("heroSubtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Product List Overlay */}
      <div className="relative z-20 mt-[85vh] min-h-screen bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl rounded-t-[3rem] border-t border-white/30 dark:border-white/10 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.1)] transition-all">
        <div className="container mx-auto px-4 py-8 md:pb-24">
          <div className="flex flex-col gap-4">
            {/* 标题 */}
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 pb-4">
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {t("featuredTitle")}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("featuredSubtitle")}
                </p>
              </div>
            </div>

            {/* 筛选栏 - 吸顶效果 */}
            <div className="sticky top-[68px] z-30 -mx-4 px-4 py-3 backdrop-blur-xl rounded-3xl shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* 搜索框 */}
                <div className="lg:w-80 flex-shrink-0">
                  <Suspense
                    fallback={
                      <div className="w-full h-10 bg-white/40 rounded-full animate-pulse" />
                    }
                  >
                    <ProductSearchBar defaultValue={params.search} />
                  </Suspense>
                </div>

                {/* 标签和排序 - 靠右 */}
                <div className="flex-1 flex justify-end items-center gap-4">
                  <Suspense
                    fallback={
                      <div className="h-8 bg-white/40 rounded-full w-32 animate-pulse" />
                    }
                  >
                    <TagFilter tags={tags} />
                  </Suspense>

                  <Suspense
                    fallback={
                      <div className="h-8 bg-white/40 rounded-full w-32 animate-pulse" />
                    }
                  >
                    <SortSelector />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* 搜索结果统计 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                {hasFilters ? (
                  <span>{t("foundProducts", { count: pagination.total })}</span>
                ) : (
                  <span>{t("totalProducts", { count: pagination.total })}</span>
                )}
              </div>
            </div>

            {allProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed border-slate-300/50 dark:border-slate-600/50 bg-white/20 dark:bg-gray-800/20">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/50 dark:bg-gray-700/50 mb-6 shadow-sm">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {hasFilters ? t("noProductsFound") : t("noProducts")}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                  {hasFilters ? t("noProductsHint") : t("noProductsWait")}
                </p>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="h-[480px] rounded-xl bg-white/40 animate-pulse"
                      />
                    ))}
                  </div>
                }
              >
                <ProductList
                  initialProducts={allProducts}
                  initialPagination={pagination}
                  cartProductIds={cartProductIds}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
