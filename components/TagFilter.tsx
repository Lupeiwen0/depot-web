"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag } from "lucide-react";

interface TagType {
  id: number;
  name: string;
  slug: string;
  color: string | null;
}

interface TagFilterProps {
  tags: TagType[];
}

export default function TagFilter({ tags }: TagFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("tags");

  const selectedTag = searchParams.get("tags") || "all";

  const handleTagChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === "all") {
        params.delete("tags");
      } else {
        params.set("tags", value);
      }
      params.set("page", "1");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Tag className="h-4 w-4" />
        {t("label")}:
      </span>
      <Select
        value={selectedTag}
        onValueChange={handleTagChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[120px] bg-white/60 border-white/40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("all")}</SelectItem>
          {tags.map((tag) => (
            <SelectItem key={tag.id} value={tag.name}>
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
