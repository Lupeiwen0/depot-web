import { NextRequest, NextResponse } from "next/server";
import { eq, sql, arrayContains } from "drizzle-orm";
import { db } from "@/db";
import { productTags, products } from "@/db/schema";
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - 更新标签
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;
    const tagId = parseInt(id);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, slug, description, color } = body;

    // 检查标签是否存在
    const existingTag = await db.query.productTags.findFirst({
      where: eq(productTags.id, tagId),
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // 检查名称唯一性（排除当前标签）
    if (name && name !== existingTag.name) {
      const duplicateName = await db.query.productTags.findFirst({
        where: eq(productTags.name, name),
      });
      if (duplicateName) {
        return NextResponse.json(
          { error: "Tag with this name already exists" },
          { status: 409 }
        );
      }
    }

    // 检查 slug 唯一性（排除当前标签）
    if (slug && slug !== existingTag.slug) {
      const duplicateSlug = await db.query.productTags.findFirst({
        where: eq(productTags.slug, slug),
      });
      if (duplicateSlug) {
        return NextResponse.json(
          { error: "Tag with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const [updatedTag] = await db
      .update(productTags)
      .set({
        name: name ?? existingTag.name,
        slug: slug ?? existingTag.slug,
        description: description !== undefined ? description : existingTag.description,
        color: color ?? existingTag.color,
        updatedAt: new Date(),
      })
      .where(eq(productTags.id, tagId))
      .returning();

    return NextResponse.json({
      tag: {
        id: updatedTag.id,
        name: updatedTag.name,
        slug: updatedTag.slug,
        description: updatedTag.description,
        color: updatedTag.color,
        updatedAt: updatedTag.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update tag error:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE - 删除标签
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
    const tagId = parseInt(id);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
    }

    // 检查标签是否存在
    const existingTag = await db.query.productTags.findFirst({
      where: eq(productTags.id, tagId),
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // 检查有多少商品使用了该标签
    const productsWithTag = await db.query.products.findMany({
      where: arrayContains(products.tags, [existingTag.name]),
    });

    // 删除标签
    await db.delete(productTags).where(eq(productTags.id, tagId));

    // 从所有使用该标签的商品中移除
    for (const product of productsWithTag) {
      const updatedTags = (product.tags || []).filter(
        (tag) => tag !== existingTag.name
      );
      await db
        .update(products)
        .set({
          tags: updatedTags.length > 0 ? updatedTags : null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));
    }

    return NextResponse.json({
      message: "Tag deleted successfully",
      affectedProducts: productsWithTag.length,
    });
  } catch (error) {
    console.error("Delete tag error:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
