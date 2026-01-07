/**
 * 商品管理 API 测试
 */
import { NextRequest } from "next/server";

// Mock auth
const mockAdminSession = {
  user: {
    id: "admin-1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
  },
};

const mockBuyerSession = {
  user: {
    id: "buyer-1",
    email: "buyer@example.com",
    name: "Buyer User",
    role: "buyer",
  },
};

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn().mockResolvedValue(mockAdminSession),
    },
  },
}));

// Mock server-i18n
jest.mock("@/lib/server-i18n", () => ({
  getServerTranslations: jest.fn().mockResolvedValue({
    t: (key: string) => key,
  }),
}));

// Mock db
const mockAdminUser = {
  id: "admin-1",
  role: "admin",
};

const mockBuyerUser = {
  id: "buyer-1",
  role: "buyer",
};

const mockProduct = {
  id: 1,
  title: "测试商品",
  description: "商品描述",
  imageUrl: "https://example.com/image.jpg",
  price: "99.99",
  isActive: true,
  tags: ["hot"],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const mockProductsList = [mockProduct];

jest.mock("@/db", () => ({
  db: {
    query: {
      user: {
        findFirst: jest.fn().mockResolvedValue(mockAdminUser),
      },
      products: {
        findFirst: jest.fn().mockResolvedValue(mockProduct),
      },
    },
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            limit: jest.fn(() => ({
              offset: jest.fn().mockResolvedValue(mockProductsList),
            })),
          })),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([mockProduct]),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(),
    })),
  },
}));

jest.mock("@/db/schema", () => ({
  products: {
    id: "id",
    title: "title",
    description: "description",
    price: "price",
    imageUrl: "image_url",
    tags: "tags",
    isActive: "is_active",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
}));

import { GET, POST } from "@/app/api/admin/products/route";
import { PUT, PATCH, DELETE } from "@/app/api/admin/products/[id]/route";

describe("Admin Products API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validProductData = {
    title: "测试商品",
    description: "商品描述",
    imageUrl: "https://example.com/image.jpg",
    price: "99.99",
    tags: ["hot"],
  };

  describe("GET /api/admin/products", () => {
    it("should return 401 when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products"
      );

      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it("should return 403 when not admin", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockBuyerSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockBuyerUser);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products"
      );

      const response = await GET(request);
      expect(response.status).toBe(403);
    });

    it("should return products list successfully", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockAdminSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockAdminUser);
      // Mock count query
      db.select.mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        })),
      });
      // Mock products query
      db.select.mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                offset: jest.fn().mockResolvedValue(mockProductsList),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products?page=1&pageSize=20"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("products");
      expect(data).toHaveProperty("pagination");
      expect(Array.isArray(data.products)).toBe(true);
    });

    it("should handle search parameter", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockAdminSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockAdminUser);
      // Mock count query
      db.select.mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        })),
      });
      // Mock products query
      db.select.mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                offset: jest.fn().mockResolvedValue([]),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products?search=测试"
      );

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/admin/products", () => {
    it("should return 401 when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products",
        {
          method: "POST",
          body: JSON.stringify(validProductData),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 403 when not admin", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockBuyerSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockBuyerUser);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products",
        {
          method: "POST",
          body: JSON.stringify(validProductData),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid form data", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockAdminSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockAdminUser);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products",
        {
          method: "POST",
          body: JSON.stringify({
            title: "",
            price: "invalid",
          }),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should create product successfully", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockAdminSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockAdminUser);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products",
        {
          method: "POST",
          body: JSON.stringify(validProductData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.product).toHaveProperty("id");
    });
  });

  describe("PUT /api/admin/products/[id]", () => {
    it("should return 401 when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products/1",
        {
          method: "PUT",
          body: JSON.stringify(validProductData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });
      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid product ID", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockAdminSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockAdminUser);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products/abc",
        {
          method: "PUT",
          body: JSON.stringify(validProductData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "abc" }),
      });
      expect(response.status).toBe(400);
    });

    it("should return 404 when product not found", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockAdminSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockAdminUser);
      db.query.products.findFirst.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products/999",
        {
          method: "PUT",
          body: JSON.stringify(validProductData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "999" }),
      });
      expect(response.status).toBe(404);
    });

    it("should update product successfully", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockAdminSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockAdminUser);
      db.query.products.findFirst.mockResolvedValue(mockProduct);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products/1",
        {
          method: "PUT",
          body: JSON.stringify(validProductData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("PATCH /api/admin/products/[id]", () => {
    it("should return 401 when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products/1",
        {
          method: "PATCH",
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "1" }),
      });
      expect(response.status).toBe(401);
    });

    it("should return 404 when product not found", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockAdminSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockAdminUser);
      db.query.products.findFirst.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products/999",
        {
          method: "PATCH",
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "999" }),
      });
      expect(response.status).toBe(404);
    });

    it("should toggle product status successfully", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockAdminSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockAdminUser);
      db.query.products.findFirst.mockResolvedValue(mockProduct);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products/1",
        {
          method: "PATCH",
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isActive).toBe(false);
    });
  });

  describe("DELETE /api/admin/products/[id]", () => {
    it("should return 401 when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products/1",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "1" }),
      });
      expect(response.status).toBe(401);
    });

    it("should delete product successfully", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockAdminSession);

      const { db } = require("@/db");
      db.query.user.findFirst.mockResolvedValue(mockAdminUser);

      const request = new NextRequest(
        "http://localhost:3000/api/admin/products/1",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
