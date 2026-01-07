"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerTranslations } from "@/lib/server-i18n";
import { createProductSchema, formatZodError } from "@/lib/errors";

async function checkAdmin(t: (key: string) => string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { isAdmin: false, error: t("api.auth.notLoggedIn") };
  }

  const userRecord = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session.user.id),
  });

  if (userRecord?.role !== "admin") {
    return { isAdmin: false, error: t("api.auth.forbidden") };
  }

  return { isAdmin: true };
}

export async function createProduct(formData: FormData) {
  const { t } = await getServerTranslations();

  try {
    const adminCheck = await checkAdmin(t);
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

    const productSchema = createProductSchema(t);
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
      return { success: false, ...formatZodError(error) };
    }
    console.error("Create product error:", error);
    return { success: false, error: t("api.product.createFailed") };
  }
}

export async function updateProduct(id: number, formData: FormData) {
  const { t } = await getServerTranslations();

  try {
    const adminCheck = await checkAdmin(t);
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

    const productSchema = createProductSchema(t);
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
      return { success: false, ...formatZodError(error) };
    }
    console.error("Update product error:", error);
    return { success: false, error: t("api.product.updateFailed") };
  }
}

export async function deleteProduct(id: number) {
  const { t } = await getServerTranslations();

  try {
    const adminCheck = await checkAdmin(t);
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
      return { success: false, error: t("api.product.inCartCannotDelete") };
    }
    return { success: false, error: t("api.product.deleteFailed") };
  }
}

export async function toggleProductStatus(id: number) {
  const { t } = await getServerTranslations();

  try {
    const adminCheck = await checkAdmin(t);
    if (!adminCheck.isAdmin) {
      return { success: false, error: adminCheck.error };
    }

    // 查询当前状态
    const product = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, id),
    });

    if (!product) {
      return { success: false, error: t("api.product.notFound") };
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
    return { success: false, error: t("api.product.toggleStatusFailed") };
  }
}
