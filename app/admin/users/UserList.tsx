"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  User,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  disabledAt: string | null;
  disabledReason: string | null;
}

interface UserListProps {
  users: UserItem[];
  currentUserId: string;
}

export default function UserList({ users, currentUserId }: UserListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const action = currentStatus === "active" ? "disable" : "enable";
    const reason =
      action === "disable"
        ? prompt("请输入禁用原因（可选）:")
        : undefined;

    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "操作失败");
      }
    } catch {
      alert("操作失败");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("确定要删除这个用户吗？此操作不可撤销。")) return;

    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "删除失败");
      }
    } catch {
      alert("操作失败");
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "正常",
          icon: CheckCircle,
          className: "bg-green-100 text-green-700",
        };
      case "disabled":
        return {
          label: "已禁用",
          icon: Ban,
          className: "bg-red-100 text-red-700",
        };
      default:
        return {
          label: status,
          icon: User,
          className: "bg-gray-100 text-gray-700",
        };
    }
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">暂无用户</h3>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                用户
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                注册时间
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => {
              const statusConfig = getStatusConfig(user.status);
              const StatusIcon = statusConfig.icon;
              const isCurrentUser = user.id === currentUserId;
              const isLoading = loadingId === user.id;

              return (
                <tr
                  key={user.id}
                  className={cn(
                    "hover:bg-slate-50 transition-colors",
                    isLoading && "opacity-50"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-primary">
                              (当前用户)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {user.role === "admin" && (
                        <Shield className="h-3 w-3" />
                      )}
                      {user.role === "admin" ? "管理员" : "买家"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        statusConfig.className
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </span>
                    {user.disabledReason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        原因: {user.disabledReason}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!isCurrentUser && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleToggleStatus(user.id, user.status)
                          }
                          disabled={isLoading}
                        >
                          {user.status === "active" ? (
                            <>
                              <Ban className="h-3.5 w-3.5 mr-1" />
                              禁用
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              启用
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(user.id)}
                          disabled={isLoading}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
