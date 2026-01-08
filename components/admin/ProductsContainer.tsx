"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import ProductList from "./ProductList";
import ProductFormDialog from "./ProductFormDialog";
import { useTranslations } from "next-intl";
import { DataPagination } from "@/components/ui/data-pagination";

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

type SortOption =
  | "createdAt-desc"
  | "createdAt-asc"
  | "price-desc"
  | "price-asc"
  | "title-asc"
  | "title-desc";

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function ProductsContainer({
  initialProducts,
  initialPagination,
  allTags,
}: {
  initialProducts?: Product[];
  initialPagination?: PaginationInfo;
  allTags?: string[];
}) {
  const t = useTranslations("admin.products");

  // 状态
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [pagination, setPagination] = useState<PaginationInfo>(
    initialPagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // 筛选条件
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("createdAt-desc");
  const [currentPage, setCurrentPage] = useState(1);

  // 排序选项
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "createdAt-desc", label: t("sort.newestFirst") },
    { value: "createdAt-asc", label: t("sort.oldestFirst") },
    { value: "price-desc", label: t("sort.priceHighToLow") },
    { value: "price-asc", label: t("sort.priceLowToHigh") },
    { value: "title-asc", label: t("sort.nameAZ") },
    { value: "title-desc", label: t("sort.nameZA") },
  ];

  // 获取商品数据
  const fetchProducts = useCallback(
    async (options?: { checkEmptyPage?: boolean }) => {
      setIsLoading(true);
      try {
        const [sortField, sortOrder] = sortBy.split("-");
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: "20",
          sortBy: sortField,
          sortOrder: sortOrder,
        });

        if (search) params.set("search", search);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        if (selectedTag && selectedTag !== "all")
          params.set("tag", selectedTag);

        const res = await fetch(`/api/admin/products?${params.toString()}`);
        if (!res.ok) throw new Error("获取商品失败");

        const data = await res.json();
        const fetchedProducts = data.products || [];
        const fetchedPagination = data.pagination || {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        };

        // 如果删除后当前页没有数据了，且不是第一页，则返回前一页
        if (
          options?.checkEmptyPage &&
          fetchedProducts.length === 0 &&
          currentPage > 1
        ) {
          setCurrentPage(currentPage - 1);
          return; // 状态变化会触发重新获取
        }

        setProducts(fetchedProducts);
        setPagination(fetchedPagination);
      } catch (error) {
        console.error("Fetch products error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, search, minPrice, maxPrice, selectedTag, sortBy]
  );

  // 筛选条件变化时重新获取
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // 处理筛选条件变化
  const handleTagChange = (value: string) => {
    setSelectedTag(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    // 排序变化时保持当前页码，不重置
  };

  const handlePriceChange = (type: "min" | "max", value: string) => {
    if (type === "min") {
      setMinPrice(value);
    } else {
      setMaxPrice(value);
    }
    setCurrentPage(1);
  };

  return (
    <>
      {/* 标题 */}
      <div className="flex justify-between items-center mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      </div>

      {/* 筛选区 - 吸顶 */}
      <div className="sticky top-[68px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 mb-6 border rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4">
          {/* 关键字搜索 */}
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索商品名称..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* 价格区间 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              价格:
            </span>
            <Input
              type="number"
              placeholder="最低"
              value={minPrice}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              className="w-20 h-9"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="最高"
              value={maxPrice}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              className="w-20 h-9"
            />
          </div>

          {/* 标签筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("filterByTag")}:
            </span>
            <Select value={selectedTag} onValueChange={handleTagChange}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {allTags?.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 排序 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("sort.label")}:
            </span>
            <Select
              value={sortBy}
              onValueChange={(v) => handleSortChange(v as SortOption)}
            >
              <SelectTrigger className="w-[140px] h-9">
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

          {/* 添加商品按钮 - 靠右 */}
          <div className="flex-1 flex justify-end">
            <Button onClick={() => setShowCreateDialog(true)}>
              {t("addProduct")}
            </Button>
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="animate-slide-up relative min-h-[170px] overflow-hidden rounded-lg">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <ProductList products={products} onRefresh={fetchProducts} />
      </div>

      {/* 分页 */}
      <DataPagination
        page={currentPage}
        pageSize={pagination.pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages}
        isLoading={isLoading}
        onPageChange={setCurrentPage}
      />

      {/* 新建商品弹窗 */}
      <ProductFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchProducts}
      />
    </>
  );
}
