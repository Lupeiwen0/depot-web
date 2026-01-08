"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface DataPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * 通用数据分页组件
 * 支持客户端状态控制模式，适用于列表数据分页场景
 */
export function DataPagination({
  page,
  total,
  totalPages,
  isLoading = false,
  onPageChange,
  className,
}: DataPaginationProps) {
  const t = useTranslations("pagination");

  if (totalPages <= 1) return null;

  // 计算要显示的页码
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-6",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        {t("info", { total, page, totalPages })}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="h-9 px-3 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">{t("prev")}</span>
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((pageNum, index) =>
            pageNum === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className={cn(
                  "h-9 w-9 p-0 rounded-lg",
                  page === pageNum
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {pageNum}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="h-9 px-3 rounded-lg"
        >
          <span className="hidden sm:inline mr-1">{t("next")}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default DataPagination;
