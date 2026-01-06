import { NextResponse } from "next/server";
import { db } from "@/db";
import { getServerTranslations } from "@/lib/server-i18n";

// GET - 获取所有标签（公共 API，无需认证）
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
        color: tag.color,
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
