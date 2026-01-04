"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/products";
import ProductFormDialog from "./ProductFormDialog";

type Product = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function ProductList({ products }: { products: Product[] }) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定要删除商品"${title}"吗？`)) {
      return;
    }

    setDeleting(id);
    const result = await deleteProduct(id);
    if (!result.success) {
      alert(result.error || "删除失败");
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="bg-card shadow-sm rounded-lg overflow-hidden border">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              商品
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              描述
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              价格
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {products.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-6 py-12 text-center text-muted-foreground"
              >
                暂无商品
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr
                key={product.id}
                className="group hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {product.imageUrl && (
                      <div className="relative h-12 w-12 flex-shrink-0 mr-4 bg-muted rounded overflow-hidden">
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="font-medium text-foreground">
                      {product.title}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-muted-foreground max-w-xs truncate">
                    {product.description || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">
                    ¥{parseFloat(product.price).toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-2 rounded-md hover:bg-primary/10 text-primary transition-colors"
                      title="编辑"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.title)}
                      disabled={deleting === product.id}
                      className="p-2 rounded-md hover:bg-destructive/10 text-destructive disabled:opacity-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

      {/* 编辑商品弹窗 */}
      {editingProduct && (
        <ProductFormDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        />
      )}
    </>
  );
}
