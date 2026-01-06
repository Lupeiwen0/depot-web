"use client";

import { useState, useEffect } from "react";
import { createProduct, updateProduct } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import TagSelector from "./TagSelector";
import ImageUploader from "./ImageUploader";

type Product = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  tags?: string[] | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export default function ProductFormDialog({
  product,
  open,
  onOpenChange,
}: {
  product?: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    product?.tags || []
  );
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");

  // 当弹窗状态改变时，重置表单状态
  useEffect(() => {
    if (open) {
      // 弹窗打开时，根据是否有 product 来初始化状态
      setSelectedTags(product?.tags || []);
      setImageUrl(product?.imageUrl || "");
      setError("");
    }
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    if (result.success) {
      onOpenChange(false);
      // Server Action 已调用 revalidatePath，页面会自动更新
    } else {
      setError(result.error || "操作失败");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "编辑商品" : "添加商品"}</DialogTitle>
        </DialogHeader>
        <form
          key={open ? product?.id || "new" : "closed"}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              商品名称 *
            </label>
            <Input
              type="text"
              id="title"
              name="title"
              required
              defaultValue={product?.title}
              placeholder="请输入商品名称"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              商品描述
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={product?.description || ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="请输入商品描述"
            />
          </div>

          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            name="imageUrl"
          />

          <div className="space-y-2">
            <label
              htmlFor="price"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              价格 *
            </label>
            <Input
              type="number"
              id="price"
              name="price"
              required
              step="0.01"
              min="0.01"
              defaultValue={product?.price}
              placeholder="0.00"
            />
          </div>

          <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : product ? "更新商品" : "创建商品"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
