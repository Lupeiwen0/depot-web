import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(1, "请输入商品名称"),
  description: z.string().optional(),
  imageUrl: z.string().url("请输入有效的图片 URL").optional().or(z.literal("")),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "请输入有效的价格"),
  tags: z.array(z.string()).optional(),
});

// 验证管理员权限
async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { isAdmin: false, error: "未登录", status: 401 };
  }

  const userRecord = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session.user.id),
  });

  if (userRecord?.role !== "admin") {
    return { isAdmin: false, error: "没有管理员权限", status: 403 };
  }

  return { isAdmin: true, userId: session.user.id };
}

// POST - 创建商品
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin();
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
          error: "表单验证失败",
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
    return NextResponse.json({ error: "创建商品失败" }, { status: 500 });
  }
}
