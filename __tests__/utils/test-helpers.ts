/**
 * 测试辅助工具
 * 提供 Mock 数据生成和常用测试函数
 */

import type { Session } from "@/lib/auth";

/**
 * 创建 Mock 用户会话
 */
export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    session: {
      id: "test-session-id",
      userId: "test-user-id",
      token: "test-token",
      expiresAt: new Date(Date.now() + 86400000), // 24小时后过期
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    user: {
      id: "test-user-id",
      name: "测试用户",
      email: "test@example.com",
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "buyer",
      ...overrides?.user,
    },
    ...overrides,
  } as Session;
}

/**
 * 创建管理员 Mock 会话
 */
export function createMockAdminSession(): Session {
  return createMockSession({
    user: {
      id: "admin-user-id",
      name: "管理员",
      email: "admin@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "admin",
    },
  });
}

/**
 * 创建 Mock 商品数据
 */
export function createMockProduct(overrides?: any) {
  return {
    id: 1,
    title: "测试商品",
    description: "这是一个测试商品",
    imageUrl: "https://example.com/image.jpg",
    price: "99.99",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * 创建 Mock 购物车数据
 */
export function createMockCart(overrides?: any) {
  return {
    id: 1,
    userId: "test-user-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * 创建 Mock 购物车条目数据
 */
export function createMockLineItem(overrides?: any) {
  return {
    id: 1,
    productId: 1,
    cartId: 1,
    orderId: null,
    quantity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * 创建 Mock 订单数据
 */
export function createMockOrder(overrides?: any) {
  return {
    id: 1,
    name: "张三",
    address: "北京市朝阳区",
    email: "test@example.com",
    payType: "Credit card" as const,
    userId: "test-user-id",
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * 创建 Mock FormData
 */
export function createMockFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}
