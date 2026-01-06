import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { verifyAdmin } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - 获取单个商品详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
        productType: product.productType,
        stripeProductId: product.stripeProductId,
        stripePriceId: product.stripePriceId,
        stripePaymentLinkUrl: product.stripePaymentLinkUrl,
        isActive: product.isActive,
        tags: product.tags,
        salesCount: product.salesCount,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Failed to get product" },
      { status: 500 }
    );
  }
}

// PUT - 更新商品
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // 检查商品是否存在
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, price, imageUrl, productType, tags, isActive } =
      body;

    // 如果修改标题，检查唯一性
    if (title && title !== existingProduct.title) {
      const duplicateTitle = await db.query.products.findFirst({
        where: eq(products.title, title),
      });

      if (duplicateTitle) {
        return NextResponse.json(
          { error: "Product with this title already exists" },
          { status: 409 }
        );
      }
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: price.toString() }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(productType !== undefined && { productType }),
        ...(tags !== undefined && { tags }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({
      product: {
        id: updatedProduct.id,
        title: updatedProduct.title,
        description: updatedProduct.description,
        imageUrl: updatedProduct.imageUrl,
        price: updatedProduct.price,
        productType: updatedProduct.productType,
        stripeProductId: updatedProduct.stripeProductId,
        stripePriceId: updatedProduct.stripePriceId,
        stripePaymentLinkUrl: updatedProduct.stripePaymentLinkUrl,
        isActive: updatedProduct.isActive,
        tags: updatedProduct.tags,
        salesCount: updatedProduct.salesCount,
        averageRating: updatedProduct.averageRating,
        reviewCount: updatedProduct.reviewCount,
        createdAt: updatedProduct.createdAt.toISOString(),
        updatedAt: updatedProduct.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - 删除商品
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // 检查商品是否存在
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
