/**
 * 用户订单 API 测试
 */
import { NextRequest } from "next/server";

// Mock auth
const mockSession = {
  user: {
    id: "user-1",
    email: "user@example.com",
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

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

// Mock orders data
const mockOrders = [
  {
    id: 1,
    name: "Test User",
    address: "123 Test St",
    email: "user@example.com",
    payType: "Credit card",
    userId: "user-1",
    deletedByUser: false,
    createdAt: new Date("2026-01-01"),
    lineItems: [
      {
        id: 1,
        productId: 1,
        quantity: 2,
        product: {
          title: "Test Product",
          price: "288.88",
          imageUrl: "https://example.com/image.jpg",
        },
      },
    ],
    payments: [
      {
        status: "succeeded",
        amount: "577.76",
        currency: "hkd",
      },
    ],
  },
];

jest.mock("@/db", () => ({
  db: {
    query: {
      orders: {
        findMany: jest.fn().mockResolvedValue(mockOrders),
        findFirst: jest.fn().mockResolvedValue(mockOrders[0]),
      },
    },
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn().mockResolvedValue({ rowCount: 1 }),
      })),
    })),
  },
}));

jest.mock("@/db/schema", () => ({
  orders: {
    userId: "user_id",
    deletedByUser: "deleted_by_user",
    id: "id",
  },
  lineItems: {},
  products: {},
  payments: {},
}));

import { GET } from "@/app/api/user/orders/route";
import { DELETE } from "@/app/api/user/orders/[id]/route";

describe("User Orders API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { auth } = require("@/lib/auth");
    auth.api.getSession.mockResolvedValue(mockSession);
  });

  describe("GET /api/user/orders", () => {
    it("should return user orders", async () => {
      const request = new NextRequest("http://localhost:3000/api/user/orders");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("orders");
      expect(Array.isArray(data.orders)).toBe(true);
    });

    it("should return orders with correct structure", async () => {
      const request = new NextRequest("http://localhost:3000/api/user/orders");

      const response = await GET(request);
      const data = await response.json();

      expect(data.orders[0]).toHaveProperty("id");
      expect(data.orders[0]).toHaveProperty("name");
      expect(data.orders[0]).toHaveProperty("items");
      expect(data.orders[0]).toHaveProperty("payments");
    });

    it("should require authentication", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/user/orders");

      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/user/orders/:id", () => {
    it("should soft delete order", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/user/orders/1",
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("deleted");
    });

    it("should reject invalid order ID", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/user/orders/invalid",
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "invalid" }),
      });

      expect(response.status).toBe(400);
    });

    it("should reject if order not found", async () => {
      const { db } = require("@/db");
      db.query.orders.findFirst.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/user/orders/999",
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "999" }),
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/user/orders/1",
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "1" }),
      });

      expect(response.status).toBe(401);
    });
  });
});
