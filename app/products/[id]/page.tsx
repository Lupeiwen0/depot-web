import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { fetchInternalApi, fetchInternalApiWithAuth } from "@/lib/api-utils";
import ProductReviews from "@/components/ProductReviews";
import AddToCartButton from "./AddToCartButton";
import { ChevronLeft, Star, ShoppingBag, Shield, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

interface Product {
  id: number;
  title: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  productType: string;
  tags: string[];
  salesCount: number | null;
  averageRating: string | null;
  reviewCount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProductDetail(productId: string) {
  const res = await fetchInternalApi(`/api/products/${productId}`);

  if (!res.ok) {
    if (res.status === 404) {
      return { notFound: true };
    }
    return { error: true };
  }

  return await res.json();
}

async function getCartProductIds(cookie: string) {
  try {
    const res = await fetchInternalApiWithAuth("/api/cart/product-ids", cookie);

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.productIds as number[];
  } catch {
    return [];
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    notFound();
  }

  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";
  const t = await getTranslations("product");
  const tReview = await getTranslations("review");

  const [productData, cartProductIds] = await Promise.all([
    getProductDetail(id),
    getCartProductIds(cookie),
  ]);

  if (productData.notFound || productData.error) {
    notFound();
  }

  const product: Product = productData.product;
  const isInCart = cartProductIds.includes(productId);
  const rating = product.averageRating ? parseFloat(product.averageRating) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-slate-900 transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("backToList")}
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-white/60 backdrop-blur-sm border border-white/40 shadow-lg">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-muted-foreground">
                <span className="text-6xl">🖼️</span>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                  {product.title}
                </h1>

                <div className="flex items-center gap-4 mt-3 text-sm">
                  {rating > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium text-slate-900">
                        {rating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({tReview("reviewsCount", { count: product.reviewCount || 0 })})
                      </span>
                    </div>
                  )}
                  {product.salesCount != null && product.salesCount > 0 && (
                    <span className="text-muted-foreground">
                      {t("salesCount", { count: product.salesCount })}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-medium text-red-600">¥</span>
                  <span className="text-4xl font-bold text-red-600">
                    {parseFloat(product.price).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("taxIncluded")}
                </p>
              </div>

              {product.description && (
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">
                    {t("description")}
                  </h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 text-center">
                  <Truck className="h-6 w-6 text-slate-600 mb-2" />
                  <span className="text-xs font-medium text-slate-700">{t("freeShipping")}</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 text-center">
                  <Shield className="h-6 w-6 text-slate-600 mb-2" />
                  <span className="text-xs font-medium text-slate-700">{t("qualityGuarantee")}</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 text-center">
                  <ShoppingBag className="h-6 w-6 text-slate-600 mb-2" />
                  <span className="text-xs font-medium text-slate-700">{t("returnPolicy")}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <AddToCartButton productId={productId} isInCart={isInCart} />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{t("productReviews")}</h2>
          <ProductReviews
            productId={productId}
            averageRating={product.averageRating || undefined}
            reviewCount={product.reviewCount || 0}
            readOnly={true}
          />
        </div>
      </div>
    </main>
  );
}
