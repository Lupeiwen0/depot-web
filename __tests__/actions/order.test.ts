/**
 * 订单 Actions 单元测试
 */

import { createOrder } from "@/app/actions/order";
import {
  createMockSession,
  createMockCart,
  createMockLineItem,
  createMockOrder,
  createMockFormData,
} from "../utils/test-helpers";

// Mock 数据库和认证模块
const mockGetSession = jest.fn();
const mockCartsFind = jest.fn();
const mockDbInsert = jest.fn();
const mockDbUpdate = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: any[]) => mockGetSession(...args),
    },
  },
}));

jest.mock("@/db", () => ({
  db: {
    query: {
      carts: {
        findFirst: (...args: any[]) => mockCartsFind(...args),
      },
    },
    insert: (...args: any[]) => mockDbInsert(...args),
    update: (...args: any[]) => mockDbUpdate(...args),
  },
}));

describe("订单 Actions 测试", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrder", () => {
    const validFormData = createMockFormData({
      name: "张三",
      address: "北京市朝阳区",
      email: "test@example.com",
      payType: "Credit card",
    });

    it("应该拒绝未登录用户创建订单", async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await createOrder(validFormData);

      expect(result).toEqual({
        success: false,
        error: "未登录",
      });
    });

    it("应该成功创建订单", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 查询到购物车及商品条目
      const mockCart = createMockCart();
      const mockLineItems = [
        createMockLineItem({ id: 1, productId: 1 }),
        createMockLineItem({ id: 2, productId: 2 }),
      ];

      mockCartsFind.mockResolvedValue({
        ...mockCart,
        lineItems: mockLineItems,
      });

      // Mock 插入订单
      const mockOrder = createMockOrder();
      mockDbInsert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockOrder]),
        }),
      });

      // Mock 更新商品条目
      mockDbUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn(),
        }),
      });

      const result = await createOrder(validFormData);

      expect(result).toEqual({
        success: true,
        orderId: mockOrder.id,
      });
    });

    it("应该拒绝空购物车创建订单", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 查询到空购物车
      const mockCart = createMockCart();
      mockCartsFind.mockResolvedValue({
        ...mockCart,
        lineItems: [],
      });

      const result = await createOrder(validFormData);

      expect(result).toEqual({
        success: false,
        error: "购物车是空的",
      });
    });

    it("应该拒绝没有购物车的用户创建订单", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 查询不到购物车
      mockCartsFind.mockResolvedValue(null);

      const result = await createOrder(validFormData);

      expect(result).toEqual({
        success: false,
        error: "购物车是空的",
      });
    });

    it("应该验证表单数据 - 缺少姓名", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      const invalidFormData = createMockFormData({
        name: "",
        address: "北京市朝阳区",
        email: "test@example.com",
        payType: "Credit card",
      });

      const result = await createOrder(invalidFormData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("姓名");
    });

    it("应该验证表单数据 - 无效邮箱", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      const invalidFormData = createMockFormData({
        name: "张三",
        address: "北京市朝阳区",
        email: "invalid-email",
        payType: "Credit card",
      });

      const result = await createOrder(invalidFormData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("邮箱");
    });

    it("应该验证表单数据 - 缺少地址", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      const invalidFormData = createMockFormData({
        name: "张三",
        address: "",
        email: "test@example.com",
        payType: "Credit card",
      });

      const result = await createOrder(invalidFormData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("地址");
    });

    it("应该处理数据库错误", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 数据库错误
      mockCartsFind.mockRejectedValue(new Error("数据库错误"));

      const result = await createOrder(validFormData);

      expect(result).toEqual({
        success: false,
        error: "创建订单失败",
      });
    });
  });
});
