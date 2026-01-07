/**
 * 订单 API 测试
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
const mockCartWithItems = {
  id: 1,
  userId: "user-1",
  lineItems: [
    { id: 1, productId: 1, quantity: 2, orderId: null },
    { id: 2, productId: 2, quantity: 1, orderId: null },
  ],
};

const mockEmptyCart = {
  id: 1,
  userId: "user-1",
  lineItems: [],
};

const mockOrder = {
  id: 1,
  name: "张三",
  address: "北京市朝阳区",
  email: "test@example.com",
  payType: "Credit card",
  userId: "user-1",
};

jest.mock("@/db", () => ({
  db: {
    query: {
      carts: {
        findFirst: jest.fn().mockResolvedValue(mockCartWithItems),
      },
    },
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([mockOrder]),
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
  orders: {},
  lineItems: { cartId: "cart_id", orderId: "order_id" },
}));

import { POST } from "@/app/api/orders/route";

describe("Orders API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/orders", () => {
    const validOrderData = {
      name: "张三",
      address: "北京市朝阳区",
      email: "test@example.com",
      payType: "Credit card",
    };

    it("should return 401 when not logged in", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify(validOrderData),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid form data", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify({
          name: "",
          address: "",
          email: "invalid-email",
          payType: "InvalidType",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("fieldErrors");
    });

    it("should return 400 when cart is empty", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const { db } = require("@/db");
      db.query.carts.findFirst.mockResolvedValue(mockEmptyCart);

      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify(validOrderData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should create order successfully", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(mockSession);

      const { db } = require("@/db");
      db.query.carts.findFirst.mockResolvedValue(mockCartWithItems);

      const request = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        body: JSON.stringify(validOrderData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orderId).toBe(1);
    });
  });
});
