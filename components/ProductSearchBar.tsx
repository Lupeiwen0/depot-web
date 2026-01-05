"use client";

import { useCallback, useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductSearchBarProps {
  defaultValue?: string;
}

export default function ProductSearchBar({
  defaultValue = "",
}: ProductSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  // 同步 URL 参数到本地状态
  useEffect(() => {
    const searchValue = searchParams.get("search") || "";
    setValue(searchValue);
  }, [searchParams]);

  // 防抖搜索
  const updateSearch = useCallback(
    (searchValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set("search", searchValue);
        params.set("page", "1"); // 搜索时重置页码
      } else {
        params.delete("search");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // 防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== (searchParams.get("search") || "")) {
        updateSearch(value);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, searchParams, updateSearch]);

  const handleClear = () => {
    setValue("");
    updateSearch("");
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="搜索商品名称..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 pr-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border-white/40 focus:bg-white/80 transition-all"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
