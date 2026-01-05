/**
 * 用户优惠券 API 测试
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

// Mock coupons data
const mockCoupons = [
  {
    id: 1,
    userId: "user-1",
    couponCode: "COUPON001",
    percentOff: 10,
    status: "available",
    expiresAt: new Date("2026-02-01"),
    usedAt: null,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: 2,
    userId: "user-1",
    couponCode: "COUPON002",
    percentOff: 10,
    status: "used",
    expiresAt: new Date("2026-02-01"),
    usedAt: new Date("2026-01-15"),
    createdAt: new Date("2026-01-01"),
  },
  {
    id: 3,
    userId: "user-1",
    couponCode: "COUPON003",
    percentOff: 10,
    status: "expired",
    expiresAt: new Date("2025-12-01"),
    usedAt: null,
    createdAt: new Date("2025-11-01"),
  },
];

jest.mock("@/db", () => ({
  db: {
    query: {
      userCoupons: {
        findMany: jest.fn().mockResolvedValue(mockCoupons),
      },
    },
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn().mockResolvedValue({ rowCount: 0 }),
      })),
    })),
  },
}));

jest.mock("@/db/schema", () => ({
  userCoupons: {
    userId: "user_id",
    status: "status",
    expiresAt: "expires_at",
  },
}));

import { GET } from "@/app/api/user/coupons/route";

describe("User Coupons API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { auth } = require("@/lib/auth");
    auth.api.getSession.mockResolvedValue(mockSession);
  });

  describe("GET /api/user/coupons", () => {
    it("should return user coupons", async () => {
      const request = new NextRequest("http://localhost:3000/api/user/coupons");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("coupons");
      expect(Array.isArray(data.coupons)).toBe(true);
    });

    it("should return coupon statistics", async () => {
      const request = new NextRequest("http://localhost:3000/api/user/coupons");

      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("available");
      expect(data).toHaveProperty("used");
      expect(data).toHaveProperty("expired");
    });

    it("should calculate statistics correctly", async () => {
      const request = new NextRequest("http://localhost:3000/api/user/coupons");

      const response = await GET(request);
      const data = await response.json();

      expect(data.total).toBe(3);
      expect(data.available).toBe(1);
      expect(data.used).toBe(1);
      expect(data.expired).toBe(1);
    });

    it("should return coupons with correct structure", async () => {
      const request = new NextRequest("http://localhost:3000/api/user/coupons");

      const response = await GET(request);
      const data = await response.json();

      expect(data.coupons[0]).toHaveProperty("id");
      expect(data.coupons[0]).toHaveProperty("couponCode");
      expect(data.coupons[0]).toHaveProperty("percentOff");
      expect(data.coupons[0]).toHaveProperty("status");
      expect(data.coupons[0]).toHaveProperty("expiresAt");
    });

    it("should require authentication", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/user/coupons");

      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });
});
