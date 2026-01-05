/**
 * 商品管理 Actions 单元测试
 */

import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/actions/products";
import {
  createMockSession,
  createMockProduct,
  createMockFormData,
} from "../utils/test-helpers";

// Mock 数据库和认证模块
const mockGetSession = jest.fn();
const mockUserFind = jest.fn();
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
      user: {
        findFirst: (...args: any[]) => mockUserFind(...args),
      },
    },
    insert: (...args: any[]) => mockDbInsert(...args),
    update: (...args: any[]) => mockDbUpdate(...args),
    delete: (...args: any[]) => mockDbDelete(...args),
  },
}));

describe("商品管理 Actions 测试", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createProduct", () => {
    const validFormData = createMockFormData({
      title: "新商品",
      description: "商品描述",
      imageUrl: "https://example.com/image.jpg",
      price: "99.99",
    });

    it("应该拒绝未登录用户创建商品", async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await createProduct(validFormData);

      expect(result).toEqual({
        success: false,
        error: "请先登录",
      });
    });

    it("应该拒绝非管理员用户创建商品", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      // Mock 查询到普通用户
      mockUserFind.mockResolvedValue({
        id: "test-user-id",
        role: "buyer",
      });

      const result = await createProduct(validFormData);

      expect(result).toEqual({
        success: false,
        error: "无权限访问",
      });
    });

    it("应该允许管理员创建商品", async () => {
      const mockAdminSession = createMockSession({
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
      mockGetSession.mockResolvedValue(mockAdminSession);

      // Mock 查询到管理员用户
      mockUserFind.mockResolvedValue({
        id: "admin-user-id",
        role: "admin",
      });

      // Mock 插入商品
      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue([createMockProduct()]),
      });

      const result = await createProduct(validFormData);

      expect(result).toEqual({ success: true });
    });

    it("应该验证商品标题不能为空", async () => {
      const mockAdminSession = createMockSession({
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
      mockGetSession.mockResolvedValue(mockAdminSession);

      mockUserFind.mockResolvedValue({
        id: "admin-user-id",
        role: "admin",
      });

      const invalidFormData = createMockFormData({
        title: "",
        description: "商品描述",
        imageUrl: "https://example.com/image.jpg",
        price: "99.99",
      });

      const result = await createProduct(invalidFormData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("名称");
    });

    it("应该验证价格必须大于0.01", async () => {
      const mockAdminSession = createMockSession({
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
      mockGetSession.mockResolvedValue(mockAdminSession);

      mockUserFind.mockResolvedValue({
        id: "admin-user-id",
        role: "admin",
      });

      const invalidFormData = createMockFormData({
        title: "新商品",
        description: "商品描述",
        imageUrl: "https://example.com/image.jpg",
        price: "0.00",
      });

      const result = await createProduct(invalidFormData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("价格");
    });

    it("应该验证图片URL格式", async () => {
      const mockAdminSession = createMockSession({
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
      mockGetSession.mockResolvedValue(mockAdminSession);

      mockUserFind.mockResolvedValue({
        id: "admin-user-id",
        role: "admin",
      });

      const invalidFormData = createMockFormData({
        title: "新商品",
        description: "商品描述",
        imageUrl: "invalid-url",
        price: "99.99",
      });

      const result = await createProduct(invalidFormData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("图片");
    });
  });

  describe("updateProduct", () => {
    const validFormData = createMockFormData({
      title: "更新商品",
      description: "更新描述",
      imageUrl: "https://example.com/new-image.jpg",
      price: "199.99",
    });

    it("应该拒绝未登录用户更新商品", async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await updateProduct(1, validFormData);

      expect(result).toEqual({
        success: false,
        error: "请先登录",
      });
    });

    it("应该拒绝非管理员用户更新商品", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      mockUserFind.mockResolvedValue({
        id: "test-user-id",
        role: "buyer",
      });

      const result = await updateProduct(1, validFormData);

      expect(result).toEqual({
        success: false,
        error: "无权限访问",
      });
    });

    it("应该允许管理员更新商品", async () => {
      const mockAdminSession = createMockSession({
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
      mockGetSession.mockResolvedValue(mockAdminSession);

      mockUserFind.mockResolvedValue({
        id: "admin-user-id",
        role: "admin",
      });

      // Mock 更新操作
      mockDbUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn(),
        }),
      });

      const result = await updateProduct(1, validFormData);

      expect(result).toEqual({ success: true });
    });
  });

  describe("deleteProduct", () => {
    it("应该拒绝未登录用户删除商品", async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await deleteProduct(1);

      expect(result).toEqual({
        success: false,
        error: "请先登录",
      });
    });

    it("应该拒绝非管理员用户删除商品", async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue(mockSession);

      mockUserFind.mockResolvedValue({
        id: "test-user-id",
        role: "buyer",
      });

      const result = await deleteProduct(1);

      expect(result).toEqual({
        success: false,
        error: "无权限访问",
      });
    });

    it("应该允许管理员删除商品", async () => {
      const mockAdminSession = createMockSession({
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
      mockGetSession.mockResolvedValue(mockAdminSession);

      mockUserFind.mockResolvedValue({
        id: "admin-user-id",
        role: "admin",
      });

      // Mock 删除操作
      mockDbDelete.mockReturnValue({
        where: jest.fn(),
      });

      const result = await deleteProduct(1);

      expect(result).toEqual({ success: true });
    });

    it("应该处理外键约束错误(商品已在购物车中)", async () => {
      const mockAdminSession = createMockSession({
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
      mockGetSession.mockResolvedValue(mockAdminSession);

      mockUserFind.mockResolvedValue({
        id: "admin-user-id",
        role: "admin",
      });

      // Mock 外键约束错误
      mockDbDelete.mockImplementation(() => {
        throw new Error("violates foreign key constraint");
      });

      const result = await deleteProduct(1);

      expect(result).toEqual({
        success: false,
        error: "该商品已被添加到购物车，无法删除",
      });
    });

    it("应该处理其他删除错误", async () => {
      const mockAdminSession = createMockSession({
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
      mockGetSession.mockResolvedValue(mockAdminSession);

      mockUserFind.mockResolvedValue({
        id: "admin-user-id",
        role: "admin",
      });

      // Mock 其他错误
      mockDbDelete.mockImplementation(() => {
        throw new Error("数据库错误");
      });

      const result = await deleteProduct(1);

      expect(result).toEqual({
        success: false,
        error: "删除商品失败",
      });
    });
  });
});
