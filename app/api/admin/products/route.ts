import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, ilike, desc, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { verifyAdmin } from "@/lib/admin-auth";
import { getServerTranslations } from "@/lib/server-i18n";

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
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "20"),
      100
    );
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const tag = searchParams.get("tag");

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

    // 价格区间筛选
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        conditions.push(sql`CAST(${products.price} AS DECIMAL) >= ${min}`);
      }
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        conditions.push(sql`CAST(${products.price} AS DECIMAL) <= ${max}`);
      }
    }

    // 标签筛选
    if (tag) {
      conditions.push(sql`${products.tags} @> ARRAY[${tag}]::text[]`);
    }

    // 排序
    type SortableColumn =
      | typeof products.title
      | typeof products.price
      | typeof products.createdAt
      | typeof products.salesCount;
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
    const { t } = await getServerTranslations();
    return NextResponse.json(
      { error: t("api.product.getFailed") },
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

    const { t } = await getServerTranslations();
    const body = await request.json();
    const { title, description, price, imageUrl, productType, tags, isActive } =
      body;

    if (!title || !price) {
      return NextResponse.json(
        { error: t("api.validation.titleAndPriceRequired") },
        { status: 400 }
      );
    }

    // 检查标题唯一性
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.title, title),
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: t("api.product.duplicateTitle") },
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
    const { t } = await getServerTranslations();
    return NextResponse.json(
      { error: t("api.product.createFailed") },
      { status: 500 }
    );
  }
}
