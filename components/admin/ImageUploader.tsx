"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  name?: string;
}

type UploadMode = "link" | "upload";

export default function ImageUploader({
  value = "",
  onChange,
  name = "imageUrl",
}: ImageUploaderProps) {
  const [mode, setMode] = useState<UploadMode>(value ? "link" : "link");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModeChange = (newMode: UploadMode) => {
    setMode(newMode);
    setError("");
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    onChange(url);
    setPreviewUrl(url);
    setError("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("只支持 JPG、PNG、GIF、WebP 格式的图片");
      return;
    }

    // 验证文件大小 (最大 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("文件大小不能超过 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "上传失败");
      }

      onChange(result.url);
      setPreviewUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      // 清空 file input 以便可以重新选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClear = () => {
    onChange("");
    setPreviewUrl("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none">商品图片</label>
        <div className="flex gap-1 p-1 bg-muted rounded-md">
          <button
            type="button"
            onClick={() => handleModeChange("link")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1",
              mode === "link"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Link className="h-3 w-3" />
            链接
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("upload")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1",
              mode === "upload"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Upload className="h-3 w-3" />
            上传
          </button>
        </div>
      </div>

      {/* 隐藏的 input 用于表单提交 */}
      <input type="hidden" name={name} value={previewUrl} />

      {mode === "link" ? (
        <Input
          type="url"
          value={previewUrl}
          onChange={handleLinkChange}
          placeholder="https://example.com/image.jpg"
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                选择图片
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            支持 JPG、PNG、GIF、WebP 格式，最大 5MB
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* 图片预览 */}
      {previewUrl && (
        <div className="relative inline-block">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted">
            <Image
              src={previewUrl}
              alt="预览图片"
              fill
              className="object-cover"
              onError={() => setError("图片加载失败，请检查链接是否正确")}
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
