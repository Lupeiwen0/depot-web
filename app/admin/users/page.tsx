import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ChevronLeft } from "lucide-react";
import { fetchInternalApiWithAuth } from "@/lib/api-utils";
import { getTranslations } from "next-intl/server";
import UserList from "./UserList";

export const dynamic = "force-dynamic";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  image: string | null;
  createdAt: string;
  disabledAt: string | null;
  disabledReason: string | null;
  membershipStatus: string | null;
}

interface UsersData {
  currentUserId: string;
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  unauthorized?: boolean;
  forbidden?: boolean;
  error?: boolean;
}

async function getUsersData(cookie: string): Promise<UsersData> {
  const res = await fetchInternalApiWithAuth(
    "/api/admin/users?pageSize=100",
    cookie
  );

  if (!res.ok) {
    if (res.status === 401) {
      return {
        unauthorized: true,
        currentUserId: "",
        users: [],
        pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
      };
    }
    if (res.status === 403) {
      return {
        forbidden: true,
        currentUserId: "",
        users: [],
        pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
      };
    }
    return {
      error: true,
      currentUserId: "",
      users: [],
      pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
    };
  }

  return await res.json();
}

export default async function AdminUsersPage() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";
  const t = await getTranslations("admin");

  const data = await getUsersData(cookie);

  if (data.unauthorized) {
    redirect("/login");
  }

  if (data.forbidden) {
    redirect("/");
  }

  if (data.error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="text-center py-10">
            <p className="text-red-500">{t("loadFailed")}</p>
          </div>
        </div>
      </main>
    );
  }

  const users = data.users;

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
          {t("backToProducts")}
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t("users.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("users.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-muted-foreground">{t("users.stats.total")}</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-green-600">{t("users.stats.active")}</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-red-500">{t("users.stats.disabled")}</p>
            <p className="text-2xl font-bold text-red-400">{stats.disabled}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-sm text-blue-600">{t("users.stats.admin")}</p>
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
            createdAt: u.createdAt,
            disabledAt: u.disabledAt,
            disabledReason: u.disabledReason,
          }))}
          currentUserId={data.currentUserId}
        />
      </div>
    </main>
  );
}
