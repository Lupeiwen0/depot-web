"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";

export default function AddTagForm() {
  const router = useRouter();
  const t = useTranslations("admin.tags");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, color }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("saveFailed"));
      }

      setSuccess(t("saveSuccess"));
      setName("");
      setSlug("");
      setDescription("");
      setColor("#3b82f6");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  // 自动生成 slug
  const handleNameChange = (value: string) => {
    setName(value);
    // 简单的 slug 生成：转小写，替换空格为横线
    const generatedSlug = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "");
    setSlug(generatedSlug);
  };

  return (
    <div className="bg-white rounded-xl border p-6 sticky top-24">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Plus className="h-5 w-5" />
        {t("addTag")}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-600">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("tagName")}</label>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t("tagNamePlaceholder")}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("tagSlug")}</label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={t("tagSlugPlaceholder")}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("tagSlugHint")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("tagDescription")}</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("tagDescriptionPlaceholder")}
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("tagColor")}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-16 rounded border cursor-pointer"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t("creating")}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {t("createTag")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
