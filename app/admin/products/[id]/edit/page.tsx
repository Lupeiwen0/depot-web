import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

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

async function getProduct(productId: string, cookie: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const res = await fetch(`${protocol}://${host}/api/admin/products/${productId}`, {
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
    if (res.status === 404) {
      return { notFound: true };
    }
    return { error: true };
  }

  return await res.json();
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";

  const data = await getProduct(id, cookie);

  if (data.unauthorized) {
    redirect("/login");
  }

  if (data.forbidden) {
    redirect("/");
  }

  if (data.notFound || data.error) {
    notFound();
  }

  const product: Product = data.product;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">编辑商品</h1>
      <ProductForm product={product} />
    </main>
  );
}
