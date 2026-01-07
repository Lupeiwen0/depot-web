/**
 * 购物车项操作 API 测试
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
};

const mockLineItem = {
  id: 1,
  productId: 1,
  cartId: 1,
  quantity: 2,
};

jest.mock("@/db", () => ({
  db: {
    query: {
      carts: {
        findFirst: jest.fn().mockResolvedValue(mockCart),
      },
      lineItems: {
        findFirst: jest.fn().mockResolvedValue(mockLineItem),
      },
    },
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
  carts: { userId: "user_id" },
  lineItems: { id: "id", cartId: "cart_id" },
}));

import { PATCH, DELETE } from "@/app/api/cart/[itemId]/route";

describe("Cart Item API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PATCH /api/cart/[itemId]", () => {
    it("should return 401 when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/cart/1", {
        method: "PATCH",
        body: JSON.stringify({ quantity: 3 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ itemId: "1" }),
      });
      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid item ID", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/cart/abc", {
        method: "PATCH",
        body: JSON.stringify({ quantity: 3 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ itemId: "abc" }),
      });
      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid quantity", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/cart/1", {
        method: "PATCH",
        body: JSON.stringify({ quantity: -1 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ itemId: "1" }),
      });
      expect(response.status).toBe(400);
    });

    it("should return 404 when cart item not found", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const { db } = require("@/db");
      db.query.lineItems.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/cart/999", {
        method: "PATCH",
        body: JSON.stringify({ quantity: 3 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ itemId: "999" }),
      });
      expect(response.status).toBe(404);
    });

    it("should update quantity successfully", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const { db } = require("@/db");
      db.query.carts.findFirst.mockResolvedValue(mockCart);
      db.query.lineItems.findFirst.mockResolvedValue(mockLineItem);

      const request = new NextRequest("http://localhost:3000/api/cart/1", {
        method: "PATCH",
        body: JSON.stringify({ quantity: 5 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ itemId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("DELETE /api/cart/[itemId]", () => {
    it("should return 401 when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/cart/1", {
        method: "DELETE",
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ itemId: "1" }),
      });
      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid item ID", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/cart/abc", {
        method: "DELETE",
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ itemId: "abc" }),
      });
      expect(response.status).toBe(400);
    });

    it("should delete cart item successfully", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const { db } = require("@/db");
      db.query.carts.findFirst.mockResolvedValue(mockCart);
      db.query.lineItems.findFirst.mockResolvedValue(mockLineItem);

      const request = new NextRequest("http://localhost:3000/api/cart/1", {
        method: "DELETE",
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ itemId: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
