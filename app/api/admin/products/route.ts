import { NextRequest, NextResponse } from "next/server";
import { eq, and, ilike, desc, asc, sql, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { ErrorCodes } from "@/lib/errors";
import { getServerTranslations } from "@/lib/server-i18n";

const productSchema = z.object({
  title: z.string().min(1, "请输入商品名称"),
  description: z.string().optional(),
  imageUrl: z.string().url("请输入有效的图片 URL").optional().or(z.literal("")),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "请输入有效的价格"),
  tags: z.array(z.string()).optional(),
});

// GET - 获取商品列表（管理员）
export async function GET(request: NextRequest) {
  const { t } = await getServerTranslations();
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: t(ErrorCodes.AUTH_NOT_LOGGED_IN) },
        { status: 401 }
      );
    }

    const userRecord = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, session.user.id),
    });

    if (userRecord?.role !== "admin") {
      return NextResponse.json(
        { error: t(ErrorCodes.AUTH_ADMIN_REQUIRED) },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "20"),
      100
    );
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 构建查询条件（管理员可以看到所有商品，包括下架的）
    const conditions: ReturnType<typeof eq>[] = [];

    // 商品名称模糊搜索
    if (search) {
      conditions.push(ilike(products.title, `%${search}%`));
    }

    // 标签筛选
    if (tag) {
      conditions.push(sql`${products.tags} @> ARRAY[${tag}]::text[]`);
    }

    // 价格区间筛选
    if (minPrice) {
      conditions.push(
        gte(sql`CAST(${products.price} AS DECIMAL)`, parseFloat(minPrice))
      );
    }
    if (maxPrice) {
      conditions.push(
        lte(sql`CAST(${products.price} AS DECIMAL)`, parseFloat(maxPrice))
      );
    }

    // 排序字段映射
    type SortableField =
      | typeof products.createdAt
      | typeof products.price
      | typeof products.title;
    const sortFieldMap: Record<string, SortableField> = {
      createdAt: products.createdAt,
      price: products.price,
      title: products.title,
    };

    const sortField = sortFieldMap[sortBy] || products.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    // 查询总数
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);
    const total = Number(totalResult[0].count);

    // 分页查询
    const productList = await db
      .select({
        id: products.id,
        title: products.title,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        tags: products.tags,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(whereClause)
      .orderBy(orderFn(sortField))
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
        tags: product.tags || [],
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
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
      { error: t(ErrorCodes.PRODUCT_GET_FAILED) },
      { status: 500 }
    );
  }
}

// 验证管理员权限
async function checkAdmin(t: (key: string) => string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      isAdmin: false,
      error: t(ErrorCodes.AUTH_NOT_LOGGED_IN),
      status: 401,
    };
  }

  const userRecord = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session.user.id),
  });

  if (userRecord?.role !== "admin") {
    return {
      isAdmin: false,
      error: t(ErrorCodes.AUTH_ADMIN_REQUIRED),
      status: 403,
    };
  }

  return { isAdmin: true, userId: session.user.id };
}

// POST - 创建商品
export async function POST(request: NextRequest) {
  const { t } = await getServerTranslations();
  try {
    const adminCheck = await checkAdmin(t);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();

    // 验证数据
    const validated = productSchema.safeParse(body);
    if (!validated.success) {
      const errors = validated.error.flatten();
      return NextResponse.json(
        {
          error: t(ErrorCodes.VALIDATION_INVALID_REQUEST),
          fieldErrors: errors.fieldErrors,
        },
        { status: 400 }
      );
    }

    const { title, description, imageUrl, price, tags } = validated.data;

    const [newProduct] = await db
      .insert(products)
      .values({
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        price,
        tags: tags || null,
      })
      .returning();

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: t(ErrorCodes.PRODUCT_CREATE_FAILED) },
      { status: 500 }
    );
  }
}
