import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "buyer";
  createdAt: string | null;
}

interface Membership {
  id: number;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

interface UserState {
  // 状态
  user: User | null;
  isMember: boolean;
  membership: Membership | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // 初始状态
  user: null,
  isMember: false,
  membership: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  // 初始化用户信息（首次加载）
  initialize: async () => {
    // 如果已经初始化过，跳过
    if (get().isInitialized) return;

    set({ isLoading: true, error: null });

    try {
      const res = await fetch("/api/user/info");

      if (res.status === 401) {
        // 未登录
        set({
          user: null,
          isMember: false,
          membership: null,
          isLoading: false,
          isInitialized: true,
        });
        return;
      }

      if (!res.ok) {
        throw new Error("获取用户信息失败");
      }

      const data = await res.json();

      set({
        user: data.user,
        isMember: data.isMember,
        membership: data.membership,
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

  // 刷新用户信息
  refresh: async () => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch("/api/user/info");

      if (res.status === 401) {
        set({
          user: null,
          isMember: false,
          membership: null,
          isLoading: false,
        });
        return;
      }

      if (!res.ok) {
        throw new Error("获取用户信息失败");
      }

      const data = await res.json();

      set({
        user: data.user,
        isMember: data.isMember,
        membership: data.membership,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "未知错误",
        isLoading: false,
      });
    }
  },

  // 清除用户信息（登出时调用）
  clear: () => {
    set({
      user: null,
      isMember: false,
      membership: null,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  },
}));
