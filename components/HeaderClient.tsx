"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import {
  ShoppingCart,
  Settings,
  LogOut,
  Ticket,
  Users,
  Tag,
  Package,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import ChangePasswordDialog from "./ChangePasswordDialog";
import { SubscriptionManageButton } from "./SubscriptionManageButton";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useTranslations } from "next-intl";

type Session = {
  user: {
    id: string;
    name: string;
    email: string;
  };
} | null;

export default function HeaderClient({
  session,
  userRole,
  cartItemCount,
}: {
  session: Session;
  userRole: "admin" | "buyer" | null;
  cartItemCount: number;
}) {
  const { openDrawer } = useCartDrawer();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const t = useTranslations("header");

  const handleSignOut = async () => {
    await signOut();
    // 退出登录后刷新页面，以触发服务端组件重新渲染
    window.location.href = "/";
  };

  // 获取用户名首字母
  const getUserInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t("siteName")}
              </span>
            </Link>
            <div className="ml-8 hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {t("productList")}
              </Link>
              {session?.user && (
                <>
                  <Link
                    href="/orders"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    {t("myOrders")}
                  </Link>
                  <Link
                    href="/user/coupons"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
                  >
                    <Ticket className="h-4 w-4 mr-1" />
                    {t("coupons")}
                  </Link>
                </>
              )}
              {userRole === "admin" && (
                <>
                  <Link
                    href="/admin/products"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {t("productManagement")}
                  </Link>
                  <Link
                    href="/admin/tags"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    {t("tagManagement")}
                  </Link>
                  <Link
                    href="/admin/users"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    {t("userManagement")}
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {session?.user && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={openDrawer}
              >
                <ShoppingCart className="h-5 w-5" data-cart-icon />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
                <span className="sr-only">{t("cart")}</span>
              </Button>
            )}
            <LanguageToggle />
            <ThemeToggle />
            {session?.user ? (
              <>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 cursor-pointer rounded-lg p-1 hover:bg-accent transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getUserInitial(session.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col text-left">
                        <span className="text-sm font-medium leading-none">
                          {session.user.name}
                        </span>
                        {userRole === "admin" && (
                          <span className="text-[10px] text-primary font-semibold">
                            {t("admin")}
                          </span>
                        )}
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="flex flex-col gap-1">
                      <SubscriptionManageButton
                        variant="ghost"
                        className="justify-start px-3 py-2 h-auto font-normal w-full"
                      />
                      <button
                        onClick={() => {
                          setPopoverOpen(false);
                          setShowPasswordDialog(true);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
                      >
                        <KeyRound className="h-4 w-4" />
                        {t("changePassword")}
                      </button>
                      <button
                        onClick={() => {
                          setPopoverOpen(false);
                          handleSignOut();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("logout")}
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
                <ChangePasswordDialog
                  open={showPasswordDialog}
                  onOpenChange={setShowPasswordDialog}
                  userEmail={session.user.email}
                />
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">{t("login")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">{t("register")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
