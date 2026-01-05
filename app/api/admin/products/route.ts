import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, ilike, desc, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// 验证管理员权限
async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (session.user.role !== "admin") {
    return { error: "Forbidden: Admin access required", status: 403 };
  }

  return { user: session.user };
}

// GET - 获取商品列表（管理后台）
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "50"), 100);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 构建查询条件
    const conditions = [];

    // 搜索（标题或描述）
    if (search) {
      conditions.push(
        or(
          ilike(products.title, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )
      );
    }

    // 排序
    type SortableColumn = typeof products.title | typeof products.price | typeof products.createdAt | typeof products.salesCount;
    const sortFieldMap: Record<string, SortableColumn> = {
      title: products.title,
      price: products.price,
      createdAt: products.createdAt,
      salesCount: products.salesCount,
    };
    const sortField = sortFieldMap[sortBy] || products.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    // 查询总数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = Number(totalResult[0].count);

    // 查询商品列表
    const productList = await db
      .select()
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(sortField))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      products: productList.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        price: p.price,
        productType: p.productType,
        stripeProductId: p.stripeProductId,
        stripePriceId: p.stripePriceId,
        stripePaymentLinkUrl: p.stripePaymentLinkUrl,
        isActive: p.isActive,
        tags: p.tags,
        salesCount: p.salesCount,
        averageRating: p.averageRating,
        reviewCount: p.reviewCount,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get admin products error:", error);
    return NextResponse.json(
      { error: "Failed to get products" },
      { status: 500 }
    );
  }
}

// POST - 创建商品
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { title, description, price, imageUrl, productType, tags, isActive } = body;

    if (!title || !price) {
      return NextResponse.json(
        { error: "title and price are required" },
        { status: 400 }
      );
    }

    // 检查标题唯一性
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.title, title),
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this title already exists" },
        { status: 409 }
      );
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        title,
        description: description || null,
        price: price.toString(),
        imageUrl: imageUrl || null,
        productType: productType || "one_time",
        tags: tags || null,
        isActive: isActive !== false,
      })
      .returning();

    return NextResponse.json({
      product: {
        id: newProduct.id,
        title: newProduct.title,
        description: newProduct.description,
        imageUrl: newProduct.imageUrl,
        price: newProduct.price,
        productType: newProduct.productType,
        tags: newProduct.tags,
        isActive: newProduct.isActive,
        createdAt: newProduct.createdAt.toISOString(),
        updatedAt: newProduct.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
