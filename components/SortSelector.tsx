"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowUpDown, TrendingUp, Star, Clock, DollarSign } from "lucide-react";

const sortOptions = [
  { value: "sales", label: "销量最高", icon: TrendingUp },
  { value: "rating", label: "好评优先", icon: Star },
  { value: "createdAt", label: "最新上架", icon: Clock },
  { value: "price-asc", label: "价格从低到高", icon: DollarSign },
  { value: "price-desc", label: "价格从高到低", icon: DollarSign },
];

export default function SortSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sortBy") || "sales";
  const currentOrder = searchParams.get("sortOrder") || "desc";
  const currentValue =
    currentSort === "price"
      ? `price-${currentOrder}`
      : currentSort;

  const handleSort = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.startsWith("price-")) {
        params.set("sortBy", "price");
        params.set("sortOrder", value.endsWith("asc") ? "asc" : "desc");
      } else {
        params.set("sortBy", value);
        params.set("sortOrder", "desc");
      }
      params.set("page", "1");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1 flex items-center gap-1">
        <ArrowUpDown className="h-4 w-4" />
        排序:
      </span>
      {sortOptions.map((option) => {
        const Icon = option.icon;
        const isActive = currentValue === option.value;
        return (
          <button
            key={option.value}
            onClick={() => handleSort(option.value)}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all",
              "border shadow-sm hover:shadow-md",
              isActive
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white/60 text-slate-700 border-white/40 hover:bg-white/80"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
