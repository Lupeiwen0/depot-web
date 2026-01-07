"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SortSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("sort");

  const sortOptions = [
    { value: "sales", label: t("salesDesc") },
    { value: "rating", label: t("ratingDesc") },
    { value: "createdAt", label: t("newest") },
    { value: "price-asc", label: t("priceAsc") },
    { value: "price-desc", label: t("priceDesc") },
  ];

  const currentSort = searchParams.get("sortBy") || "rating";
  const currentOrder = searchParams.get("sortOrder") || "desc";
  const currentValue =
    currentSort === "price" ? `price-${currentOrder}` : currentSort;

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
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <ArrowUpDown className="h-4 w-4" />
        {t("label")}:
      </span>
      <Select
        value={currentValue}
        onValueChange={handleSort}
        disabled={isPending}
      >
        <SelectTrigger className="w-[140px] bg-white/60 dark:bg-gray-800/60 border-white/40 dark:border-gray-600/40">
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
  );
}
