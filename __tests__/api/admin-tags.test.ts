/**
 * 标签管理 API 测试
 */
import { NextRequest } from "next/server";

// Mock auth
const mockSession = {
  user: {
    id: "user-1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
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
const mockTags = [
  {
    id: 1,
    name: "热门",
    slug: "hot",
    description: "热门商品",
    color: "#ef4444",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: 2,
    name: "新品",
    slug: "new",
    description: "新上架商品",
    color: "#22c55e",
    createdAt: new Date("2026-01-02"),
    updatedAt: new Date("2026-01-02"),
  },
];

jest.mock("@/db", () => ({
  db: {
    query: {
      productTags: {
        findMany: jest.fn().mockResolvedValue(mockTags),
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([
          {
            id: 3,
            name: "测试标签",
            slug: "test",
            description: null,
            color: "#3b82f6",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      })),
    })),
  },
}));

jest.mock("@/db/schema", () => ({
  productTags: {
    name: "name",
    slug: "slug",
  },
  products: {
    tags: "tags",
  },
}));

import { GET, POST } from "@/app/api/admin/tags/route";

describe("Admin Tags API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/tags", () => {
    it("should return all tags", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("tags");
      expect(Array.isArray(data.tags)).toBe(true);
      expect(data.tags.length).toBe(2);
    });

    it("should return tags with correct structure", async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.tags[0]).toHaveProperty("id");
      expect(data.tags[0]).toHaveProperty("name");
      expect(data.tags[0]).toHaveProperty("slug");
      expect(data.tags[0]).toHaveProperty("color");
      expect(data.tags[0]).toHaveProperty("createdAt");
    });
  });

  describe("POST /api/admin/tags", () => {
    it("should create a new tag", async () => {
      const { db } = require("@/db");
      db.query.productTags.findFirst.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/admin/tags", {
        method: "POST",
        body: JSON.stringify({
          name: "测试标签",
          slug: "test",
          color: "#3b82f6",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("tag");
      expect(data.tag.name).toBe("测试标签");
    });

    it("should reject request without name", async () => {
      const request = new NextRequest("http://localhost:3000/api/admin/tags", {
        method: "POST",
        body: JSON.stringify({
          slug: "test",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("必填");
    });

    it("should reject duplicate tag name", async () => {
      const { db } = require("@/db");
      db.query.productTags.findFirst.mockResolvedValue(mockTags[0]);

      const request = new NextRequest("http://localhost:3000/api/admin/tags", {
        method: "POST",
        body: JSON.stringify({
          name: "热门",
          slug: "hot",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain("已存在");
    });

    it("should require admin role", async () => {
      const { auth } = require("@/lib/auth");
      auth.api.getSession.mockResolvedValue({
        user: { id: "user-1", role: "buyer" },
      });

      const request = new NextRequest("http://localhost:3000/api/admin/tags", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          slug: "test",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });
});
