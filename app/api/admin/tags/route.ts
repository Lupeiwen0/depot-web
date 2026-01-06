import { NextRequest, NextResponse } from "next/server";
import { eq, sql, arrayContains } from "drizzle-orm";
import { db } from "@/db";
import { productTags, products } from "@/db/schema";
import { verifyAdmin, getServerTranslations } from "@/lib/server-i18n";

// GET - 获取所有标签（管理后台）
export async function GET() {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

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
    const { t } = await getServerTranslations();
    return NextResponse.json(
      { error: t("api.tag.getFailed") },
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

    const { t } = await getServerTranslations();
    const body = await request.json();
    const { name, slug, description, color } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: t("api.validation.nameAndSlugRequired") },
        { status: 400 }
      );
    }

    // 检查名称唯一性
    const existingTag = await db.query.productTags.findFirst({
      where: eq(productTags.name, name),
    });

    if (existingTag) {
      return NextResponse.json(
        { error: t("api.tag.duplicateName") },
        { status: 409 }
      );
    }

    // 检查 slug 唯一性
    const existingSlug = await db.query.productTags.findFirst({
      where: eq(productTags.slug, slug),
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: t("api.tag.duplicateSlug") },
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
    const { t } = await getServerTranslations();
    return NextResponse.json(
      { error: t("api.tag.createFailed") },
      { status: 500 }
    );
  }
}
