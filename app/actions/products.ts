"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(1, "请输入商品名称"),
  description: z.string().optional(),
  imageUrl: z.string().url("请输入有效的图片链接").optional().or(z.literal("")),
  price: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0.01;
  }, "价格必须大于等于 0.01"),
  tags: z.array(z.string()).optional(),
});

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { isAdmin: false, error: "请先登录" };
  }

  const userRecord = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session.user.id),
  });

  if (userRecord?.role !== "admin") {
    return { isAdmin: false, error: "无权限访问" };
  }

  return { isAdmin: true };
}

export async function createProduct(formData: FormData) {
  try {
    const adminCheck = await checkAdmin();
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error };
    }

    // 解析标签
    const tagsJson = formData.get("tags");
    let tags: string[] = [];
    if (tagsJson && typeof tagsJson === "string") {
      try {
        tags = JSON.parse(tagsJson);
      } catch {
        tags = [];
      }
    }

    const validatedData = productSchema.parse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      imageUrl: formData.get("imageUrl") || undefined,
      price: formData.get("price"),
      tags,
    });

    await db.insert(products).values({
      title: validatedData.title,
      description: validatedData.description || null,
      imageUrl: validatedData.imageUrl || null,
      price: validatedData.price,
      tags: validatedData.tags || null,
    });

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Create product error:", error);
    return { success: false, error: "创建商品失败" };
  }
}

export async function updateProduct(id: number, formData: FormData) {
  try {
    const adminCheck = await checkAdmin();
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error };
    }

    // 解析标签
    const tagsJson = formData.get("tags");
    let tags: string[] = [];
    if (tagsJson && typeof tagsJson === "string") {
      try {
        tags = JSON.parse(tagsJson);
      } catch {
        tags = [];
      }
    }

    const validatedData = productSchema.parse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      imageUrl: formData.get("imageUrl") || undefined,
      price: formData.get("price"),
      tags,
    });

    await db
      .update(products)
      .set({
        title: validatedData.title,
        description: validatedData.description || null,
        imageUrl: validatedData.imageUrl || null,
        price: validatedData.price,
        tags: validatedData.tags || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Update product error:", error);
    return { success: false, error: "更新商品失败" };
  }
}

export async function deleteProduct(id: number) {
  try {
    const adminCheck = await checkAdmin();
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error };
    }

    await db.delete(products).where(eq(products.id, id));

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete product error:", error);
    if (error.message?.includes("violates foreign key constraint")) {
      return { success: false, error: "该商品已被添加到购物车，无法删除" };
    }
    return { success: false, error: "删除商品失败" };
  }
}

export async function toggleProductStatus(id: number) {
  try {
    const adminCheck = await checkAdmin();
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error };
    }

    // 查询当前状态
    const product = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, id),
    });

    if (!product) {
      return { success: false, error: "商品不存在" };
    }

    // 切换状态
    await db
      .update(products)
      .set({
        isActive: !product.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Toggle product status error:", error);
    return { success: false, error: "切换商品状态失败" };
  }
}
