"use client";

import { useEffect, ReactNode } from "react";
import { useUserStore } from "@/stores/user-store";
import { useCartStore } from "@/stores/cart-store";

interface StoreProviderProps {
  children: ReactNode;
  isLoggedIn?: boolean;
}

export function StoreProvider({ children, isLoggedIn }: StoreProviderProps) {
  const initializeUser = useUserStore((state) => state.initialize);
  const fetchCart = useCartStore((state) => state.fetchCart);

  useEffect(() => {
    // 只有登录用户才初始化
    if (isLoggedIn) {
      initializeUser();
      fetchCart();
    }
  }, [isLoggedIn, initializeUser, fetchCart]);

  return <>{children}</>;
}
