"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User, Shield, Ban, CheckCircle, Trash2 } from "lucide-react";
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
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("common");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // 弹窗状态管理
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  const [disableDialog, setDisableDialog] = useState<{
    open: boolean;
    userId: string;
  }>({
    open: false,
    userId: "",
  });

  const [disableReason, setDisableReason] = useState("");

  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });

  // 处理状态切换（禁用/启用）
  const handleToggleStatusClick = (userId: string, currentStatus: string) => {
    if (currentStatus === "active") {
      // 打开禁用原因输入框
      setDisableDialog({ open: true, userId });
      setDisableReason("");
    } else {
      // 启用用户确认
      setConfirmDialog({
        open: true,
        title: t("enableUser"),
        description: t("confirmEnable"),
        onConfirm: () => performToggleStatus(userId, "active"),
      });
    }
  };

  // 执行状态切换 API
  const performToggleStatus = async (
    userId: string,
    newStatus: string,
    reason?: string | null
  ) => {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setErrorDialog({
          open: true,
          message: data.error || tCommon("operationFailed"),
        });
      }
    } catch {
      setErrorDialog({ open: true, message: tCommon("operationFailed") });
    } finally {
      setLoadingId(null);
      setDisableDialog((prev) => ({ ...prev, open: false }));
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  // 提交禁用原因
  const handleDisableSubmit = () => {
    performToggleStatus(disableDialog.userId, "disabled", disableReason);
  };

  // 处理删除点击
  const handleDeleteClick = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: t("deleteUser"),
      description: t("confirmDelete"),
      onConfirm: async () => {
        setLoadingId(userId);
        try {
          const res = await fetch(`/api/admin/users/${userId}`, {
            method: "DELETE",
          });

          if (res.ok) {
            router.refresh();
          } else {
            const data = await res.json();
            setErrorDialog({
              open: true,
              message: data.error || tCommon("deleteFailed"),
            });
          }
        } catch {
          setErrorDialog({ open: true, message: tCommon("operationFailed") });
        } finally {
          setLoadingId(null);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  // 处理角色切换点击
  const handleToggleRoleClick = (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "buyer" : "admin";
    setConfirmDialog({
      open: true,
      title: t("changeRole"),
      description: t("confirmRoleChange", {
        role: newRole === "admin" ? t("roleAdmin") : t("roleBuyer"),
      }),
      onConfirm: async () => {
        setLoadingId(userId);
        try {
          const res = await fetch(`/api/admin/users/${userId}/toggle-role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole }),
          });

          if (res.ok) {
            router.refresh();
          } else {
            const data = await res.json();
            setErrorDialog({
              open: true,
              message: data.error || tCommon("operationFailed"),
            });
          }
        } catch {
          setErrorDialog({ open: true, message: tCommon("operationFailed") });
        } finally {
          setLoadingId(null);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: t("statusActive"),
          icon: CheckCircle,
          className: "bg-green-100 text-green-700",
        };
      case "disabled":
        return {
          label: t("statusDisabled"),
          icon: Ban,
          className: "bg-red-100 text-red-700",
        };
      case "deleted":
        return {
          label: t("statusDeleted"),
          icon: Trash2,
          className: "bg-gray-100 text-gray-500",
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
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {t("noUsers")}
        </h3>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t("table.user")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t("table.role")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t("table.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t("table.registeredAt")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t("table.action")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => {
                const statusConfig = getStatusConfig(user.status);
                const StatusIcon = statusConfig.icon;
                const isCurrentUser = user.id === currentUserId;
                const isLoading = loadingId === user.id;
                const isDeleted = user.status === "deleted";

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
                                {t("currentUser")}
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
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors",
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                          isCurrentUser && "cursor-not-allowed opacity-60"
                        )}
                        onClick={() =>
                          !isCurrentUser &&
                          !isLoading &&
                          handleToggleRoleClick(user.id, user.role)
                        }
                        title={
                          isCurrentUser
                            ? t("cannotModifyOwnRole")
                            : t("clickToToggleRole")
                        }
                      >
                        {user.role === "admin" && (
                          <Shield className="h-3 w-3" />
                        )}
                        {user.role === "admin"
                          ? t("roleAdmin")
                          : t("roleBuyer")}
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
                          {t("disabledReason")}: {user.disabledReason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isCurrentUser && !isDeleted && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleToggleStatusClick(user.id, user.status)
                            }
                            disabled={isLoading}
                          >
                            {user.status === "active" ? (
                              <>
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                {t("disableUser")}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                {t("enableUser")}
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(user.id)}
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

      {/* 通用确认弹窗 */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm}>
              {tCommon("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 禁用原因输入弹窗 */}
      <Dialog
        open={disableDialog.open}
        onOpenChange={(open) => setDisableDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("disableUser")}</DialogTitle>
            <DialogDescription>{t("disableReasonPrompt")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="mb-2 block">
              {t("disabledReason")}
            </Label>
            <Input
              id="reason"
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
              placeholder={t("disableReasonPrompt")}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDisableDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleDisableSubmit}>{tCommon("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 错误提示弹窗 */}
      <AlertDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("error")}</AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() =>
                setErrorDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {tCommon("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
