import ProductCardWrapper from "@/components/ProductCardWrapper";
import ProductSearchBar from "@/components/ProductSearchBar";
import TagFilter from "@/components/TagFilter";
import SortSelector from "@/components/SortSelector";
import Pagination from "@/components/Pagination";
import { headers } from "next/headers";
import { Suspense } from "react";
import { fetchInternalApi, fetchInternalApiWithAuth } from "@/lib/api-utils";

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
      pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
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
  const [{ products: allProducts, pagination }, tags, cartProductIds] =
    await Promise.all([
      getProductsData(params),
      getTagsData(),
      getCartProductIds(),
    ]);

  const hasFilters = params.search || params.tags;

  return (
    <main className="min-h-screen">
      {/* Hero Section - Fixed Background */}
      <section className="fixed top-0 left-0 w-full h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center rounded-full border border-white/40 bg-white/30 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition-colors cursor-default hover:bg-white/40">
              <span className="mr-2">✨</span>
              <span>全场商品限时特惠，品质好物等你发现</span>
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 drop-shadow-sm leading-tight">
              探索极简主义生活
            </h1>

            <p className="max-w-[700px] text-lg text-slate-700 md:text-2xl/relaxed font-medium tracking-wide">
              为您精选全球高品质设计好物,提升生活格调。让每一次日常,都成为一种享受。
            </p>
          </div>
        </div>
      </section>

      {/* Product List Overlay */}
      <div className="relative z-20 mt-[85vh] min-h-screen bg-white/40 backdrop-blur-2xl rounded-t-[3rem] border-t border-white/30 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.1)] transition-all">
        <div className="container mx-auto px-4 py-8 md:pb-24">
          <div className="flex flex-col gap-4">
            {/* 标题 */}
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  热门精选
                </h2>
                <p className="text-sm text-slate-600">
                  为您推荐本季最受欢迎的单品
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

                {/* 标签过滤 */}
                <div className="flex-1 min-w-0">
                  <Suspense
                    fallback={
                      <div className="h-8 bg-white/40 rounded-full w-64 animate-pulse" />
                    }
                  >
                    <TagFilter tags={tags} />
                  </Suspense>
                </div>

                {/* 排序选择器 */}
                <div className="flex-shrink-0">
                  <Suspense
                    fallback={
                      <div className="h-8 bg-white/40 rounded-full w-96 animate-pulse" />
                    }
                  >
                    <SortSelector />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* 搜索结果统计 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                {hasFilters ? (
                  <span>
                    找到{" "}
                    <span className="font-semibold text-slate-900">
                      {pagination.total}
                    </span>{" "}
                    件商品
                  </span>
                ) : (
                  <span>
                    共{" "}
                    <span className="font-semibold text-slate-900">
                      {pagination.total}
                    </span>{" "}
                    件好物
                  </span>
                )}
              </div>
            </div>

            {allProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed border-slate-300/50 bg-white/20">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/50 mb-6 shadow-sm">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {hasFilters ? "未找到匹配的商品" : "暂无商品"}
                </h3>
                <p className="text-slate-500 mt-2 max-w-sm">
                  {hasFilters
                    ? "尝试调整搜索关键词或清除筛选条件"
                    : "我们正在快马加鞭为您准备新品，敬请期待！"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {allProducts.map((product, index) => (
                    <ProductCardWrapper
                      key={product.id}
                      product={product}
                      index={index}
                      isInCart={cartProductIds.includes(product.id)}
                    />
                  ))}
                </div>

                {/* 分页 */}
                <Suspense fallback={null}>
                  <Pagination
                    page={pagination.page}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    totalPages={pagination.totalPages}
                  />
                </Suspense>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
