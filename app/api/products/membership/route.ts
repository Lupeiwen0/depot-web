import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

// GET - 获取会员订阅商品信息
export async function GET() {
  try {
    const membershipProduct = await db.query.products.findFirst({
      where: and(
        eq(products.productType, "subscription"),
        eq(products.isActive, true)
      ),
    });

    if (!membershipProduct || !membershipProduct.stripePriceId) {
      return NextResponse.json(
        { error: "Membership product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: membershipProduct.id,
      title: membershipProduct.title,
      description: membershipProduct.description,
      price: membershipProduct.price,
      priceId: membershipProduct.stripePriceId,
      imageUrl: membershipProduct.imageUrl,
    });
  } catch (error) {
    console.error("Get membership product error:", error);
    return NextResponse.json(
      { error: "Failed to get membership product" },
      { status: 500 }
    );
  }
}
