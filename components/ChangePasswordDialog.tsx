"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
  userEmail,
}: ChangePasswordDialogProps) {
  const t = useTranslations("changePassword");
  const tCommon = useTranslations("common");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("failed"));
        return;
      }

      setSuccess(t("success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        onOpenChange(false);
        setSuccess("");
      }, 1500);
    } catch {
      setError(tCommon("networkError"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setResetSuccess("");
    setResetLoading(true);

    try {
      const response = await fetch("/api/user/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("sendResetFailed"));
        return;
      }

      setResetSuccess(t("resetEmailSent"));
    } catch {
      setError(tCommon("networkError"));
    } finally {
      setResetLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess("");
      setResetSuccess("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("currentPassword")}</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t("currentPasswordPlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("newPassword")}</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("newPasswordPlaceholder")}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("confirmNewPassword")}</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("confirmNewPasswordPlaceholder")}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-600">{success}</p>
          )}

          {resetSuccess && (
            <p className="text-sm text-green-600">{resetSuccess}</p>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="w-full sm:w-auto"
            >
              {resetLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {t("sendResetEmail")}
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
