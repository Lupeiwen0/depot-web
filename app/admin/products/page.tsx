import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProductsContainer from "@/components/admin/ProductsContainer";
import { fetchInternalApiWithAuth } from "@/lib/api-utils";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

// 获取所有标签（用于筛选器）
async function getAllTags(cookie: string): Promise<string[]> {
  try {
    const res = await fetchInternalApiWithAuth(
      "/api/admin/products?pageSize=100",
      cookie
    );
    if (!res.ok) return [];

    const data = await res.json();
    const products = data.products || [];
    const tagSet = new Set<string>();

    products.forEach((p: { tags?: string[] | null }) => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach((tag) => tagSet.add(tag));
      }
    });

    return Array.from(tagSet).sort();
  } catch {
    return [];
  }
}

// 验证管理员权限
async function checkAdminAuth(cookie: string) {
  const res = await fetchInternalApiWithAuth(
    "/api/admin/products?pageSize=1",
    cookie
  );

  if (!res.ok) {
    if (res.status === 401) return { unauthorized: true };
    if (res.status === 403) return { forbidden: true };
    return { error: true };
  }

  return { success: true };
}

export default async function AdminProductsPage() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";
  const t = await getTranslations("admin");

  const authCheck = await checkAdminAuth(cookie);

  if (authCheck.unauthorized) {
    redirect("/login");
  }

  if (authCheck.forbidden) {
    redirect("/");
  }

  if (authCheck.error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-muted/5">
        <div className="text-center py-10">
          <p className="text-red-500">{t("loadFailed")}</p>
        </div>
      </main>
    );
  }

  // 获取所有标签供筛选器使用
  const allTags = await getAllTags(cookie);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-muted/5">
      <ProductsContainer allTags={allTags} />
    </main>
  );
}
