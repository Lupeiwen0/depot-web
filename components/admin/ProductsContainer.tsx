"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ProductList from "./ProductList";
import ProductFormDialog from "./ProductFormDialog";

type Product = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export default function ProductsContainer({
  products,
}: {
  products: Product[];
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">商品管理</h1>
        <Button onClick={() => setShowCreateDialog(true)}>添加商品</Button>
      </div>
      <div className="animate-slide-up">
        <ProductList products={products} />
      </div>

      {/* 新建商品弹窗 */}
      <ProductFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
