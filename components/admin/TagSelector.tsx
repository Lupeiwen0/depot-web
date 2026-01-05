"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Tag = {
  id: number;
  name: string;
  slug: string;
  color: string;
};

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagSelector({
  selectedTags,
  onChange,
}: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 获取所有标签
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch("/api/tags");
        const data = await res.json();
        if (data.tags) {
          setAllTags(data.tags);
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  // 过滤标签
  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 检查是否可以创建新标签
  const canCreateNewTag =
    searchQuery.trim() !== "" &&
    !allTags.some(
      (tag) => tag.name.toLowerCase() === searchQuery.toLowerCase()
    );

  // 切换选择标签
  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  // 移除已选标签
  const removeTag = (tagName: string) => {
    onChange(selectedTags.filter((t) => t !== tagName));
  };

  // 创建新标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setCreating(true);
    try {
      const slug = newTagName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "");

      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName,
          slug: slug || `tag-${Date.now()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAllTags([...allTags, data.tag]);
        onChange([...selectedTags, data.tag.name]);
        setNewTagName("");
        setShowCreateForm(false);
        setSearchQuery("");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "创建标签失败");
      }
    } catch (error) {
      console.error("Create tag error:", error);
      alert("创建标签失败");
    } finally {
      setCreating(false);
    }
  };

  // 快速创建（从搜索框直接创建）
  const handleQuickCreate = async () => {
    if (!canCreateNewTag) return;

    setCreating(true);
    try {
      const slug = searchQuery
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "");

      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: searchQuery,
          slug: slug || `tag-${Date.now()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAllTags([...allTags, data.tag]);
        onChange([...selectedTags, data.tag.name]);
        setSearchQuery("");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "创建标签失败");
      }
    } catch (error) {
      console.error("Create tag error:", error);
      alert("创建标签失败");
    } finally {
      setCreating(false);
    }
  };

  // 获取标签颜色
  const getTagColor = (tagName: string) => {
    const tag = allTags.find((t) => t.name === tagName);
    return tag?.color || "#3b82f6";
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">商品标签</label>

      {/* 已选标签显示 */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {selectedTags.map((tagName) => (
          <span
            key={tagName}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm text-white"
            style={{ backgroundColor: getTagColor(tagName) }}
          >
            {tagName}
            <button
              type="button"
              onClick={() => removeTag(tagName)}
              className="hover:bg-white/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {selectedTags.length === 0 && (
          <span className="text-sm text-muted-foreground">未选择标签</span>
        )}
      </div>

      {/* 标签选择器 - 使用 Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            选择或创建标签
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          {/* 搜索框 */}
          <div className="p-2 border-b">
            <Input
              placeholder="搜索或输入新标签名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>

          {/* 标签列表 */}
          <div className="max-h-48 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-sm">{tag.name}</span>
                  {selectedTags.includes(tag.name) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            ) : searchQuery ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                未找到匹配的标签
              </div>
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                暂无标签
              </div>
            )}
          </div>

          {/* 快速创建新标签 */}
          {canCreateNewTag && (
            <div className="border-t p-2">
              <button
                type="button"
                onClick={handleQuickCreate}
                disabled={creating}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm text-primary"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                创建标签 &quot;{searchQuery}&quot;
              </button>
            </div>
          )}

          {/* 高级创建表单 */}
          {!canCreateNewTag && (
            <div className="border-t p-2">
              {!showCreateForm ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm text-muted-foreground"
                >
                  <Plus className="h-4 w-4" />
                  创建新标签
                </button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="输入新标签名称"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="h-8"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateTag}
                      disabled={creating || !newTagName.trim()}
                      className="flex-1"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "创建"
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewTagName("");
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* 隐藏的表单字段 */}
      <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
    </div>
  );
}
