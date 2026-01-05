import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

interface RouteParams {
  params: Promise<{ productId: string }>;
}

// GET - 获取商品详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId: productIdStr } = await params;
    const productId = parseInt(productIdStr);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
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
      },
    });
  } catch (error) {
    console.error("Get product detail error:", error);
    return NextResponse.json(
      { error: "Failed to get product" },
      { status: 500 }
    );
  }
}
