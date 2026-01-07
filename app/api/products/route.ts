import { NextRequest, NextResponse } from "next/server";
import { eq, and, ilike, desc, asc, sql, arrayContains } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const search = searchParams.get("search") || "";
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "12"),
      100
    );
    const sortBy = searchParams.get("sortBy") || "rating";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 构建查询条件
    const conditions = [eq(products.isActive, true)];

    // 商品名称模糊搜索
    if (search) {
      conditions.push(ilike(products.title, `%${search}%`));
    }

    // 标签筛选
    if (tags.length > 0) {
      conditions.push(arrayContains(products.tags, tags));
    }

    // 排序字段映射
    type SortableField =
      | typeof products.salesCount
      | typeof products.createdAt
      | typeof products.price;
    const sortFieldMap: Record<string, SortableField> = {
      sales: products.salesCount,
      createdAt: products.createdAt,
      price: products.price,
    };

    // 特殊处理评分排序（因为 averageRating 是 decimal/string 类型）
    const isRatingSort = sortBy === "rating";
    const sortField = sortFieldMap[sortBy] || products.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    // 查询总数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions));
    const total = Number(totalResult[0].count);

    // 分页查询
    const productList = await db
      .select({
        id: products.id,
        title: products.title,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        productType: products.productType,
        tags: products.tags,
        salesCount: products.salesCount,
        averageRating: products.averageRating,
        reviewCount: products.reviewCount,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(
        isRatingSort
          ? sortOrder === "desc"
            ? desc(
                sql`COALESCE(CAST(${products.averageRating} AS DECIMAL(3,2)), 0)`
              )
            : asc(
                sql`COALESCE(CAST(${products.averageRating} AS DECIMAL(3,2)), 0)`
              )
          : orderFn(sortField)
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      products: productList.map((product) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        productType: product.productType,
        tags: product.tags || [],
        salesCount: product.salesCount,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "Failed to get products" },
      { status: 500 }
    );
  }
}
