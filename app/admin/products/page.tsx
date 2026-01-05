import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProductsContainer from "@/components/admin/ProductsContainer";

export const dynamic = "force-dynamic";

interface Product {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  productType: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  stripePaymentLinkUrl: string | null;
  isActive: boolean;
  tags: string[] | null;
  salesCount: number;
  averageRating: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

async function getProducts(cookie: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const res = await fetch(`${protocol}://${host}/api/admin/products?pageSize=100`, {
    cache: "no-store",
    headers: { cookie },
  });

  if (!res.ok) {
    if (res.status === 401) {
      return { unauthorized: true };
    }
    if (res.status === 403) {
      return { forbidden: true };
    }
    return { error: true };
  }

  return await res.json();
}

export default async function AdminProductsPage() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";

  const data = await getProducts(cookie);

  if (data.unauthorized) {
    redirect("/login");
  }

  if (data.forbidden) {
    redirect("/");
  }

  if (data.error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-muted/5">
        <div className="text-center py-10">
          <p className="text-red-500">加载商品列表失败，请稍后重试</p>
        </div>
      </main>
    );
  }

  const allProducts: Product[] = data.products || [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-muted/5">
      <ProductsContainer products={allProducts} />
    </main>
  );
}
