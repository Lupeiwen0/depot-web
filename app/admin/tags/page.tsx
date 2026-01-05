import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Link from "next/link";
import { Tag, Plus, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TagList from "./TagList";
import AddTagForm from "./AddTagForm";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const tags = await db.query.productTags.findMany({
    orderBy: (productTags, { desc }) => [desc(productTags.createdAt)],
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* 返回链接 */}
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-slate-900 transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          返回商品管理
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">标签管理</h1>
              <p className="text-sm text-muted-foreground">
                共 {tags.length} 个标签
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 添加标签表单 */}
          <div className="lg:col-span-1">
            <AddTagForm />
          </div>

          {/* 标签列表 */}
          <div className="lg:col-span-2">
            <TagList
              tags={tags.map((tag) => ({
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
                description: tag.description,
                color: tag.color,
                createdAt: tag.createdAt.toISOString(),
              }))}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
