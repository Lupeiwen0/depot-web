/**
 * 购物车 API 测试
 */
import { NextRequest } from "next/server";

// Mock auth
const mockSession = {
  user: {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    role: "buyer",
  },
};

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn().mockResolvedValue(mockSession),
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
const mockCart = {
  id: 1,
  userId: "user-1",
  lineItems: [
    {
      id: 1,
      productId: 1,
      quantity: 2,
      orderId: null,
      product: {
        id: 1,
        title: "测试商品",
        price: "99.99",
        imageUrl: "https://example.com/image.jpg",
      },
    },
  ],
};

const mockProduct = {
  id: 1,
  title: "测试商品",
  price: "99.99",
  isActive: true,
};

jest.mock("@/db", () => ({
  db: {
    query: {
      carts: {
        findFirst: jest.fn().mockResolvedValue(mockCart),
      },
      products: {
        findFirst: jest.fn().mockResolvedValue(mockProduct),
      },
      lineItems: {
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([{ id: 1, userId: "user-1" }]),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(),
      })),
    })),
  },
}));

jest.mock("@/db/schema", () => ({
  carts: { userId: "user_id" },
  lineItems: {
    cartId: "cart_id",
    productId: "product_id",
    orderId: "order_id",
  },
  products: { id: "id" },
}));

import { GET, POST } from "@/app/api/cart/route";

describe("Cart API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/cart", () => {
    it("should return 401 when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("should return cart data when logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("lineItems");
      expect(data).toHaveProperty("totalItems");
      expect(data).toHaveProperty("totalPrice");
    });
  });

  describe("POST /api/cart", () => {
    it("should return 401 when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: 1 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid product ID", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: "invalid" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 404 when product not found", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const { db } = require("@/db");
      db.query.products.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: 999 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });

    it("should add product to cart successfully", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const { db } = require("@/db");
      db.query.products.findFirst.mockResolvedValue(mockProduct);
      db.query.carts.findFirst.mockResolvedValue(mockCart);
      db.query.lineItems.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: 1, quantity: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
