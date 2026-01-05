import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { desc, ne } from "drizzle-orm";
import Link from "next/link";
import { Users, ChevronLeft } from "lucide-react";
import UserList from "./UserList";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  // 获取所有用户（排除已删除的）
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      disabledAt: user.disabledAt,
      disabledReason: user.disabledReason,
    })
    .from(user)
    .where(ne(user.status, "deleted"))
    .orderBy(desc(user.createdAt));

  // 统计
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    disabled: users.filter((u) => u.status === "disabled").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

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
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
              <p className="text-sm text-muted-foreground">
                管理平台用户账号
              </p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-muted-foreground">总用户</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-green-600">正常</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-red-500">已禁用</p>
            <p className="text-2xl font-bold text-red-400">{stats.disabled}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-blue-600">管理员</p>
            <p className="text-2xl font-bold text-blue-600">{stats.admins}</p>
          </div>
        </div>

        {/* 用户列表 */}
        <UserList
          users={users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role || "buyer",
            status: u.status || "active",
            createdAt: u.createdAt.toISOString(),
            disabledAt: u.disabledAt?.toISOString() || null,
            disabledReason: u.disabledReason,
          }))}
          currentUserId={session.user.id}
        />
      </div>
    </main>
  );
}
