import { db } from "@/db";
import { products, carts } from "@/db/schema";
import ProductCardWrapper from "@/components/ProductCardWrapper";
import ProductSearchBar from "@/components/ProductSearchBar";
import TagFilter from "@/components/TagFilter";
import SortSelector from "@/components/SortSelector";
import Pagination from "@/components/Pagination";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, ilike, desc, asc, sql, arrayContains } from "drizzle-orm";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  tags?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: string;
}

async function getProductsData(searchParams: SearchParams) {
  const search = searchParams.search || "";
  const tagsParam = searchParams.tags;
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  const page = parseInt(searchParams.page || "1");
  const pageSize = Math.min(parseInt(searchParams.pageSize || "12"), 100);
  const sortBy = searchParams.sortBy || "createdAt";
  const sortOrder = searchParams.sortOrder || "desc";

  // 构建查询条件
  const conditions = [eq(products.isActive, true)];

  // 商品名称模糊搜索
  if (search) {
    conditions.push(ilike(products.title, `%${search}%`));
  }

  // 标签筛选
  if (tags.length > 0) {
    conditions.push(arrayContains(products.tags, tags));
  }

  // 排序字段映射
  type SortableField = typeof products.salesCount | typeof products.averageRating | typeof products.createdAt | typeof products.price;
  const sortFieldMap: Record<string, SortableField> = {
    sales: products.salesCount,
    rating: products.averageRating,
    createdAt: products.createdAt,
    price: products.price,
  };

  const sortField = sortFieldMap[sortBy] || products.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  // 查询总数
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(...conditions));
  const total = Number(totalResult[0].count);

  // 分页查询
  const productList = await db
    .select({
      id: products.id,
      title: products.title,
      description: products.description,
      price: products.price,
      imageUrl: products.imageUrl,
      tags: products.tags,
      salesCount: products.salesCount,
      averageRating: products.averageRating,
      reviewCount: products.reviewCount,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(orderFn(sortField))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalPages = Math.ceil(total / pageSize);

  return {
    products: productList,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

async function getTagsData() {
  const allTags = await db.query.productTags.findMany({
    orderBy: (productTags, { asc }) => [asc(productTags.name)],
  });

  return allTags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
  }));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [{ products: allProducts, pagination }, tags] = await Promise.all([
    getProductsData(params),
    getTagsData(),
  ]);

  // 获取用户购物车中的商品ID列表
  let cartProductIds: number[] = [];
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user) {
      const userCart = await db.query.carts.findFirst({
        where: eq(carts.userId, session.user.id),
        with: {
          lineItems: {
            columns: {
              productId: true,
            },
          },
        },
      });

      if (userCart?.lineItems) {
        cartProductIds = userCart.lineItems.map((item) => item.productId);
      }
    }
  } catch (error) {
    console.error("获取购物车信息失败:", error);
  }

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
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col gap-10">
            {/* 标题和搜索区域 */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/50 pb-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    热门精选
                  </h2>
                  <p className="text-slate-600">为您推荐本季最受欢迎的单品</p>
                </div>

                {/* 搜索框 */}
                <Suspense fallback={<div className="w-full max-w-md h-10 bg-white/40 rounded-full animate-pulse" />}>
                  <ProductSearchBar defaultValue={params.search} />
                </Suspense>
              </div>

              {/* 标签过滤和排序 */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <Suspense fallback={<div className="h-8 bg-white/40 rounded-full w-64 animate-pulse" />}>
                  <TagFilter tags={tags} />
                </Suspense>

                <Suspense fallback={<div className="h-8 bg-white/40 rounded-full w-96 animate-pulse" />}>
                  <SortSelector />
                </Suspense>
              </div>

              {/* 搜索结果统计 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {hasFilters ? (
                    <span>
                      找到 <span className="font-semibold text-slate-900">{pagination.total}</span> 件商品
                    </span>
                  ) : (
                    <span>
                      共 <span className="font-semibold text-slate-900">{pagination.total}</span> 件好物
                    </span>
                  )}
                </div>
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
