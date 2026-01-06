"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetSuccess("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || t("loginFailed"));
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || t("loginFailed"));
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError(t("enterEmailFirst"));
      return;
    }

    setError("");
    setResetSuccess("");
    setResetLoading(true);

    try {
      const res = await fetch("/api/user/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("sendResetFailed"));
      }

      setResetSuccess(t("resetEmailSent"));
    } catch (err: any) {
      setError(err.message || t("sendResetFailedRetry"));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <Card className="w-full max-w-md relative z-10 shadow-xl border-t border-l border-white/20 bg-card/80 backdrop-blur-sm animate-scale-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            {t("welcomeBack")}
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            {t("loginSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium animate-fade-in">
                {error}
              </div>
            )}
            {resetSuccess && (
              <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 font-medium animate-fade-in">
                {resetSuccess}
              </div>
            )}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("email")}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("password")}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-xs text-primary hover:underline disabled:opacity-50"
                >
                  {resetLoading ? t("sendingReset") : t("forgotPassword")}
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                  {t("loggingIn")}
                </>
              ) : (
                t("loginButton")
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t p-6 bg-muted/20">
          <div className="text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline underline-offset-4"
            >
              {t("registerNow")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
