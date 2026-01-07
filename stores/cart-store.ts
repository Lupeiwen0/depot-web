import { create } from "zustand";

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    title: string;
    price: string;
    imageUrl: string | null;
  };
}

interface CartState {
  // 状态
  items: CartItem[];
  itemCount: number;
  isOpen: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (
    productId: number,
    quantity?: number
  ) => Promise<{ success: boolean; error?: string }>;
  removeItem: (itemId: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (
    itemId: number,
    quantity: number
  ) => Promise<{ success: boolean; error?: string }>;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  // 初始状态
  items: [],
  itemCount: 0,
  isOpen: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  // 获取购物车数据
  fetchCart: async () => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch("/api/cart");

      if (res.status === 401) {
        // 未登录
        set({
          items: [],
          itemCount: 0,
          isLoading: false,
          isInitialized: true,
        });
        return;
      }

      if (!res.ok) {
        throw new Error("获取购物车失败");
      }

      const data = await res.json();
      const items: CartItem[] = data.lineItems || [];
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      set({
        items,
        itemCount,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "未知错误",
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  // 添加商品到购物车
  addItem: async (productId: number, quantity = 1) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.error || "添加失败" };
      }

      // 刷新购物车
      await get().fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: "添加失败" };
    }
  },

  // 移除购物车商品
  removeItem: async (itemId: number) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.error || "删除失败" };
      }

      // 刷新购物车
      await get().fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: "删除失败" };
    }
  },

  // 更新商品数量
  updateQuantity: async (itemId: number, quantity: number) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.error || "更新失败" };
      }

      // 刷新购物车
      await get().fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: "更新失败" };
    }
  },

  // Drawer 控制
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),

  // 清空购物车状态
  clear: () => {
    set({
      items: [],
      itemCount: 0,
      isOpen: false,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  },
}));
