import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { productReviews, products, orders, lineItems, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface RouteParams {
  params: Promise<{ productId: string }>;
}

// GET - 获取商品评价列表
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId: productIdStr } = await params;
    const productId = parseInt(productIdStr);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "10"), 50);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const filter = searchParams.get("filter"); // good, medium, bad, with_images

    // 构建查询条件
    const conditions = [
      eq(productReviews.productId, productId),
      eq(productReviews.status, "published"),
    ];

    // 评价筛选
    if (filter === "good") {
      conditions.push(sql`${productReviews.rating} >= 4`);
    } else if (filter === "medium") {
      conditions.push(eq(productReviews.rating, 3));
    } else if (filter === "bad") {
      conditions.push(sql`${productReviews.rating} <= 2`);
    } else if (filter === "with_images") {
      conditions.push(sql`array_length(${productReviews.images}, 1) > 0`);
    }

    // 排序
    const orderFn = sortBy === "rating" ? desc(productReviews.rating) : desc(productReviews.createdAt);

    // 查询总数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(productReviews)
      .where(and(...conditions));
    const total = Number(totalResult[0].count);

    // 查询评价列表
    const reviews = await db
      .select({
        id: productReviews.id,
        rating: productReviews.rating,
        title: productReviews.title,
        content: productReviews.content,
        images: productReviews.images,
        createdAt: productReviews.createdAt,
        userId: productReviews.userId,
        userName: user.name,
        userImage: user.image,
      })
      .from(productReviews)
      .leftJoin(user, eq(productReviews.userId, user.id))
      .where(and(...conditions))
      .orderBy(orderFn)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // 获取评分分布
    const ratingDistribution = await db
      .select({
        rating: productReviews.rating,
        count: sql<number>`count(*)`,
      })
      .from(productReviews)
      .where(
        and(
          eq(productReviews.productId, productId),
          eq(productReviews.status, "published")
        )
      )
      .groupBy(productReviews.rating);

    const distribution: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    ratingDistribution.forEach((item) => {
      distribution[item.rating.toString()] = Number(item.count);
    });

    // 获取商品评分统计
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: {
        averageRating: true,
        reviewCount: true,
      },
    });

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        user: {
          id: review.userId,
          name: review.userName || "Anonymous",
          image: review.userImage,
        },
        rating: review.rating,
        title: review.title,
        content: review.content,
        images: review.images || [],
        createdAt: review.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        averageRating: product?.averageRating || "0",
        totalReviews: product?.reviewCount || 0,
        ratingDistribution: distribution,
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Failed to get reviews" },
      { status: 500 }
    );
  }
}

// POST - 创建评价
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId: productIdStr } = await params;
    const productId = parseInt(productIdStr);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const body = await request.json();
    const { orderId, rating, title, content, images } = body;

    // 验证评分范围
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // 验证是否已购买
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.userId, session.user.id)
      ),
      with: {
        lineItems: {
          where: eq(lineItems.productId, productId),
        },
      },
    });

    if (!order || order.lineItems.length === 0) {
      return NextResponse.json(
        { error: "You can only review products you have purchased" },
        { status: 403 }
      );
    }

    // 检查该订单中此商品是否已评价
    const existingReview = await db.query.productReviews.findFirst({
      where: and(
        eq(productReviews.orderId, orderId),
        eq(productReviews.productId, productId)
      ),
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product in this order" },
        { status: 409 }
      );
    }

    // 创建评价
    const [newReview] = await db
      .insert(productReviews)
      .values({
        userId: session.user.id,
        productId,
        orderId,
        rating,
        title: title || null,
        content: content || null,
        images: images || null,
        status: "published",
      })
      .returning();

    // 更新商品评分统计
    await updateProductRating(productId);

    return NextResponse.json({
      review: {
        id: newReview.id,
        rating: newReview.rating,
        title: newReview.title,
        content: newReview.content,
        images: newReview.images || [],
        createdAt: newReview.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

// 更新商品评分统计
async function updateProductRating(productId: number) {
  const stats = await db
    .select({
      avgRating: sql<number>`AVG(${productReviews.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(productReviews)
    .where(
      and(
        eq(productReviews.productId, productId),
        eq(productReviews.status, "published")
      )
    );

  const avgRating = stats[0].avgRating || 0;
  const count = Number(stats[0].count);

  await db
    .update(products)
    .set({
      averageRating: avgRating.toFixed(2),
      reviewCount: count,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
}
