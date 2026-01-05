/**
 * 商品 API 测试
 */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/products/route";

// Mock db
jest.mock("@/db", () => ({
  db: {
    select: jest.fn((selector) => {
      // 检查是否是 count 查询
      if (selector && selector.count !== undefined) {
        return {
          from: jest.fn(() => ({
            where: jest.fn().mockResolvedValue([{ count: 1 }]),
          })),
        };
      }
      // 普通查询
      return {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            orderBy: jest.fn(() => ({
              limit: jest.fn(() => ({
                offset: jest.fn().mockResolvedValue([
                  {
                    id: 1,
                    title: "Test Product",
                    description: "Test description",
                    price: "288.88",
                    imageUrl: "https://example.com/image.jpg",
                    productType: "one_time",
                    tags: ["hot", "new"],
                    salesCount: 100,
                    averageRating: "4.50",
                    reviewCount: 20,
                    createdAt: new Date("2026-01-01"),
                    updatedAt: new Date("2026-01-01"),
                  },
                ]),
              })),
            })),
          })),
        })),
      };
    }),
  },
}));

// Mock schema
jest.mock("@/db/schema", () => ({
  products: {
    isActive: "is_active",
    title: "title",
    tags: "tags",
    salesCount: "sales_count",
    averageRating: "average_rating",
    createdAt: "created_at",
    price: "price",
  },
}));

describe("GET /api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return products list with default pagination", async () => {
    const request = new NextRequest("http://localhost:3000/api/products");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("products");
    expect(data).toHaveProperty("pagination");
  });

  it("should handle search parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/products?search=test"
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it("should handle tags filter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/products?tags=hot,new"
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it("should handle pagination parameters", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/products?page=2&pageSize=10"
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it("should handle sort parameters", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/products?sortBy=sales&sortOrder=desc"
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it("should limit pageSize to max 100", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/products?pageSize=200"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.pageSize).toBeLessThanOrEqual(100);
  });
});
