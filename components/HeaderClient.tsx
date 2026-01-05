"use client";

import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { ShoppingCart, Settings, LogOut, Ticket, Users, Tag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCartDrawer } from "@/contexts/CartDrawerContext";

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
                在线商城
              </span>
            </Link>
            <div className="ml-8 hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                商品列表
              </Link>
              {session?.user && (
                <>
                  <Link
                    href="/orders"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    我的订单
                  </Link>
                  <Link
                    href="/user/coupons"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
                  >
                    <Ticket className="h-4 w-4 mr-1" />
                    优惠券
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
                    商品管理
                  </Link>
                  <Link
                    href="/admin/tags"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    标签管理
                  </Link>
                  <Link
                    href="/admin/users"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    用户管理
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
                <span className="sr-only">购物车</span>
              </Button>
            )}
            {session?.user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getUserInitial(session.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-sm font-medium leading-none">
                      {session.user.name}
                    </span>
                    {userRole === "admin" && (
                      <span className="text-[10px] text-primary font-semibold">
                        管理员
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  title="退出登录"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">登录</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">注册</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
