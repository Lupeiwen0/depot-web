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

// GET - 获取所有标签
export async function GET() {
  try {
    const tags = await db.query.productTags.findMany({
      orderBy: (productTags, { asc }) => [asc(productTags.name)],
    });

    return NextResponse.json({
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        color: tag.color,
        createdAt: tag.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get tags error:", error);
    return NextResponse.json(
      { error: "Failed to get tags" },
      { status: 500 }
    );
  }
}

// POST - 创建标签
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
    const { name, slug, description, color } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    // 检查名称唯一性
    const existingTag = await db.query.productTags.findFirst({
      where: eq(productTags.name, name),
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Tag with this name already exists" },
        { status: 409 }
      );
    }

    // 检查 slug 唯一性
    const existingSlug = await db.query.productTags.findFirst({
      where: eq(productTags.slug, slug),
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "Tag with this slug already exists" },
        { status: 409 }
      );
    }

    const [newTag] = await db
      .insert(productTags)
      .values({
        name,
        slug,
        description: description || null,
        color: color || "#3b82f6",
      })
      .returning();

    return NextResponse.json({
      tag: {
        id: newTag.id,
        name: newTag.name,
        slug: newTag.slug,
        description: newTag.description,
        color: newTag.color,
        createdAt: newTag.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create tag error:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
