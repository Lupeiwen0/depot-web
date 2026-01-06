"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductList from "./ProductList";
import ProductFormDialog from "./ProductFormDialog";

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

type SortOption = "createdAt-desc" | "createdAt-asc" | "price-desc" | "price-asc" | "title-asc" | "title-desc";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "createdAt-desc", label: "最新创建" },
  { value: "createdAt-asc", label: "最早创建" },
  { value: "price-desc", label: "价格从高到低" },
  { value: "price-asc", label: "价格从低到高" },
  { value: "title-asc", label: "名称 A-Z" },
  { value: "title-desc", label: "名称 Z-A" },
];

export default function ProductsContainer({
  products,
}: {
  products: Product[];
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("createdAt-desc");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // 获取所有唯一的标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    products.forEach((product) => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [products]);

  // 筛选和排序商品
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 按标签筛选
    if (selectedTag !== "all") {
      result = result.filter(
        (product) => product.tags && product.tags.includes(selectedTag)
      );
    }

    // 排序
    const [field, order] = sortBy.split("-") as [string, "asc" | "desc"];
    result.sort((a, b) => {
      let comparison = 0;
      if (field === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (field === "price") {
        comparison = parseFloat(a.price) - parseFloat(b.price);
      } else if (field === "title") {
        comparison = a.title.localeCompare(b.title, "zh-CN");
      }
      return order === "desc" ? -comparison : comparison;
    });

    return result;
  }, [products, selectedTag, sortBy]);

  return (
    <>
      <div className="flex justify-between items-center mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">商品管理</h1>
        <Button onClick={() => setShowCreateDialog(true)}>添加商品</Button>
      </div>

      {/* 筛选和排序 */}
      <div className="flex gap-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">排序:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">标签:</span>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="animate-slide-up">
        <ProductList products={filteredAndSortedProducts} />
      </div>

      {/* 新建商品弹窗 */}
      <ProductFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
