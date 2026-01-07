import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { ErrorCodes } from "@/lib/errors";
import { getServerTranslations } from "@/lib/server-i18n";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const productSchema = z.object({
  title: z.string().min(1, "请输入商品名称"),
  description: z.string().optional(),
  imageUrl: z.string().url("请输入有效的图片 URL").optional().or(z.literal("")),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "请输入有效的价格"),
  tags: z.array(z.string()).optional(),
});

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

// PUT - 更新商品
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { t } = await getServerTranslations();
  try {
    const adminCheck = await checkAdmin(t);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: t(ErrorCodes.VALIDATION_INVALID_ID) },
        { status: 400 }
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

    // 检查商品是否存在
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: t(ErrorCodes.PRODUCT_NOT_FOUND) },
        { status: 404 }
      );
    }

    await db
      .update(products)
      .set({
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        price,
        tags: tags || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: t(ErrorCodes.PRODUCT_UPDATE_FAILED) },
      { status: 500 }
    );
  }
}

// PATCH - 切换商品上下架状态
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { t } = await getServerTranslations();
  try {
    const adminCheck = await checkAdmin(t);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: t(ErrorCodes.VALIDATION_INVALID_ID) },
        { status: 400 }
      );
    }

    // 查询当前状态
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return NextResponse.json(
        { error: t(ErrorCodes.PRODUCT_NOT_FOUND) },
        { status: 404 }
      );
    }

    // 切换状态
    await db
      .update(products)
      .set({
        isActive: !product.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    return NextResponse.json({ success: true, isActive: !product.isActive });
  } catch (error) {
    console.error("Toggle product status error:", error);
    return NextResponse.json(
      { error: t(ErrorCodes.PRODUCT_TOGGLE_STATUS_FAILED) },
      { status: 500 }
    );
  }
}

// DELETE - 删除商品
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { t } = await getServerTranslations();
  try {
    const adminCheck = await checkAdmin(t);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: t(ErrorCodes.VALIDATION_INVALID_ID) },
        { status: 400 }
      );
    }

    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete product error:", error);
    if (
      error instanceof Error &&
      error.message?.includes("violates foreign key constraint")
    ) {
      return NextResponse.json(
        { error: t(ErrorCodes.PRODUCT_IN_CART_CANNOT_DELETE) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: t(ErrorCodes.PRODUCT_DELETE_FAILED) },
      { status: 500 }
    );
  }
}
