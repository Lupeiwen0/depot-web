"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Tag } from "lucide-react";

interface TagItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  createdAt: string;
}

interface TagListProps {
  tags: TagItem[];
}

export default function TagList({ tags }: TagListProps) {
  const router = useRouter();
  const t = useTranslations("admin.tags");
  const tCommon = useTranslations("common");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm(t("deleteConfirm"))) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || t("deleteFailed"));
      }
    } catch {
      alert(tCommon("operationFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  if (tags.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <Tag className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">{t("noTags")}</h3>
        <p className="text-muted-foreground">{t("noTagsHint")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="divide-y">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: tag.color || "#3b82f6" }}
              >
                {tag.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{tag.name}</span>
                  <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded">
                    {tag.slug}
                  </span>
                </div>
                {tag.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {tag.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t("createdAt")} {new Date(tag.createdAt).toLocaleDateString("zh-CN")}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(tag.id)}
              disabled={deletingId === tag.id}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
