import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

async function verifyAdminAccess(cookie: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  // 使用 admin products API 来验证权限（只获取1条记录来验证）
  const res = await fetch(`${protocol}://${host}/api/admin/products?pageSize=1`, {
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

  return { authorized: true };
}

export default async function NewProductPage() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";

  const result = await verifyAdminAccess(cookie);

  if (result.unauthorized) {
    redirect("/login");
  }

  if (result.forbidden) {
    redirect("/");
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">添加商品</h1>
      <ProductForm />
    </main>
  );
}
