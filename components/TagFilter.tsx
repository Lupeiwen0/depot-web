"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string | null;
}

interface TagFilterProps {
  tags: Tag[];
}

export default function TagFilter({ tags }: TagFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedTags = (searchParams.get("tags") || "").split(",").filter(Boolean);

  const toggleTag = useCallback(
    (tagName: string) => {
      const params = new URLSearchParams(searchParams.toString());
      let newTags = [...selectedTags];

      if (newTags.includes(tagName)) {
        newTags = newTags.filter((t) => t !== tagName);
      } else {
        newTags.push(tagName);
      }

      if (newTags.length > 0) {
        params.set("tags", newTags.join(","));
      } else {
        params.delete("tags");
      }
      params.set("page", "1"); // 筛选时重置页码

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, selectedTags]
  );

  const clearTags = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tags");
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [pathname, router, searchParams]);

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">标签:</span>
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag.name);
        return (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.name)}
            disabled={isPending}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-all",
              "border shadow-sm hover:shadow-md",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white/60 text-slate-700 border-white/40 hover:bg-white/80"
            )}
            style={
              isSelected && tag.color
                ? { backgroundColor: tag.color, borderColor: tag.color }
                : undefined
            }
          >
            {tag.name}
          </button>
        );
      })}
      {selectedTags.length > 0 && (
        <button
          onClick={clearTags}
          disabled={isPending}
          className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
