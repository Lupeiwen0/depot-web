/**
 * 购物车商品 ID 列表 API 测试
 */

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

// Mock db
const mockCart = {
  id: 1,
  userId: "user-1",
  lineItems: [{ productId: 1 }, { productId: 2 }, { productId: 3 }],
};

jest.mock("@/db", () => ({
  db: {
    query: {
      carts: {
        findFirst: jest.fn().mockResolvedValue(mockCart),
      },
    },
  },
}));

jest.mock("@/db/schema", () => ({
  carts: { userId: "user_id" },
}));

import { GET } from "@/app/api/cart/product-ids/route";

describe("Cart Product IDs API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/cart/product-ids", () => {
    it("should return empty array when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.productIds).toEqual([]);
    });

    it("should return product IDs when logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const { db } = require("@/db");
      db.query.carts.findFirst.mockResolvedValue(mockCart);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.productIds).toEqual([1, 2, 3]);
    });

    it("should return empty array when cart is empty", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const { db } = require("@/db");
      db.query.carts.findFirst.mockResolvedValue({ id: 1, lineItems: [] });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.productIds).toEqual([]);
    });

    it("should return empty array when no cart exists", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const { db } = require("@/db");
      db.query.carts.findFirst.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.productIds).toEqual([]);
    });
  });
});
