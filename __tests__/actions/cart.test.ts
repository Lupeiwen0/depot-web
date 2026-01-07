/**
 * 购物车 Actions 单元测试
 */

import {
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
} from "@/app/actions/cart";
import {
  createMockSession,
  createMockCart,
  createMockLineItem,
} from "../utils/test-helpers";

// Mock 数据库和认证模块
const mockGetSession = jest.fn();
const mockCartsFind = jest.fn();
const mockLineItemsFind = jest.fn();
const mockDbInsert = jest.fn();
const mockDbUpdate = jest.fn();
const mockDbDelete = jest.fn();

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
      lineItems: {
        findFirst: (...args: any[]) => mockLineItemsFind(...args),
      },
    },
    insert: (...args: any[]) => mockDbInsert(...args),
    update: (...args: any[]) => mockDbUpdate(...args),
    delete: (...args: any[]) => mockDbDelete(...args),
  },
}));

describe("购物车 Actions 测试", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addToCart", () => {
    it("应该拒绝未登录用户添加商品", async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await addToCart(1);

      expect(result).toEqual({
        success: false,
        error: "未登录",
      });
    });

    it("应该为新用户创建购物车并添加商品", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 查询不到购物车
      mockCartsFind.mockResolvedValue(null);

      // Mock 插入购物车返回
      const mockCart = createMockCart();
      mockDbInsert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCart]),
        }),
      });

      // Mock 查询不到已存在的商品条目
      mockLineItemsFind.mockResolvedValue(null);

      // Mock 插入商品条目
      mockDbInsert.mockReturnValueOnce({
        values: jest.fn().mockResolvedValue([createMockLineItem()]),
      });

      const result = await addToCart(1);

      expect(result).toEqual({ success: true });
    });

    it("应该在已有购物车中添加新商品", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 查询到购物车
      const mockCart = createMockCart();
      mockCartsFind.mockResolvedValue(mockCart);

      // Mock 查询不到已存在的商品条目
      mockLineItemsFind.mockResolvedValue(null);

      // Mock 插入商品条目
      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue([createMockLineItem()]),
      });

      const result = await addToCart(1);

      expect(result).toEqual({ success: true });
    });

    it("应该增加已存在商品的数量", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 查询到购物车
      const mockCart = createMockCart();
      mockCartsFind.mockResolvedValue(mockCart);

      // Mock 查询到已存在的商品条目
      const existingItem = createMockLineItem({ quantity: 2 });
      mockLineItemsFind.mockResolvedValue(existingItem);

      // Mock 更新商品条目
      mockDbUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn(),
        }),
      });

      const result = await addToCart(1);

      expect(result).toEqual({ success: true });
    });

    it("应该处理数据库错误", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 数据库错误
      mockCartsFind.mockRejectedValue(new Error("数据库错误"));

      const result = await addToCart(1);

      expect(result).toEqual({
        success: false,
        error: "添加到购物车失败，请重试",
      });
    });
  });

  describe("updateCartItemQuantity", () => {
    it("应该拒绝未登录用户更新数量", async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await updateCartItemQuantity(1, 2);

      expect(result).toEqual({
        success: false,
        error: "未登录",
      });
    });

    it("应该更新商品数量", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 更新操作
      mockDbUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn(),
        }),
      });

      const result = await updateCartItemQuantity(1, 3);

      expect(result).toEqual({ success: true });
    });

    it("应该在数量为0时删除商品", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 删除操作
      mockDbDelete.mockReturnValue({
        where: jest.fn(),
      });

      const result = await updateCartItemQuantity(1, 0);

      expect(result).toEqual({ success: true });
    });

    it("应该在数量为负数时删除商品", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 删除操作
      mockDbDelete.mockReturnValue({
        where: jest.fn(),
      });

      const result = await updateCartItemQuantity(1, -1);

      expect(result).toEqual({ success: true });
    });

    it("应该处理更新错误", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 数据库错误
      mockDbUpdate.mockImplementation(() => {
        throw new Error("更新失败");
      });

      const result = await updateCartItemQuantity(1, 2);

      expect(result).toEqual({
        success: false,
        error: "更新购物车失败，请重试",
      });
    });
  });

  describe("removeCartItem", () => {
    it("应该拒绝未登录用户删除商品", async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await removeCartItem(1);

      expect(result).toEqual({
        success: false,
        error: "未登录",
      });
    });

    it("应该成功删除购物车商品", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 删除操作
      mockDbDelete.mockReturnValue({
        where: jest.fn(),
      });

      const result = await removeCartItem(1);

      expect(result).toEqual({ success: true });
    });

    it("应该处理删除错误", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 数据库错误
      mockDbDelete.mockImplementation(() => {
        throw new Error("删除失败");
      });

      const result = await removeCartItem(1);

      expect(result).toEqual({
        success: false,
        error: "移除商品失败，请重试",
      });
    });
  });
});
