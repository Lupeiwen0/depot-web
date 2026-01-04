import { db } from "@/db";
import { products, carts, lineItems } from "@/db/schema";
import ProductCardWrapper from "@/components/ProductCardWrapper";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export default async function Home() {
  const allProducts = await db.select().from(products);

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
            <div className="flex items-end justify-between border-b border-slate-200/50 pb-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  热门精选
                </h2>
                <p className="text-slate-600">为您推荐本季最受欢迎的单品</p>
              </div>
              <div className="hidden md:flex items-center rounded-full bg-white/50 px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm border border-white/40">
                共 {allProducts.length} 件好物
              </div>
            </div>

            {allProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed border-slate-300/50 bg-white/20">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/50 mb-6 shadow-sm">
                  <span className="text-4xl">🛍️</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  暂无商品
                </h3>
                <p className="text-slate-500 mt-2 max-w-sm">
                  我们正在快马加鞭为您准备新品，敬请期待！
                </p>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
