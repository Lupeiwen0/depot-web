"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function Pagination({
  page,
  pageSize,
  total,
  totalPages,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

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
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
      <p className="text-sm text-muted-foreground">
        共 {total} 件商品，第 {page} / {totalPages} 页
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || isPending}
          className="h-9 px-3 rounded-lg bg-white/60 border-white/40"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">上一页</span>
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((pageNum, index) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(pageNum)}
                disabled={isPending}
                className={cn(
                  "h-9 w-9 p-0 rounded-lg",
                  page === pageNum
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/60 border-white/40 hover:bg-white/80"
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
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages || isPending}
          className="h-9 px-3 rounded-lg bg-white/60 border-white/40"
        >
          <span className="hidden sm:inline mr-1">下一页</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
