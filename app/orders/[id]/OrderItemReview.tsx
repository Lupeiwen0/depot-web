"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItemReviewProps {
  productId: number;
  productTitle: string;
  existingReview?: {
    id: number;
    rating: number;
    title: string | null;
    content: string | null;
    createdAt: string;
  } | null;
  canReview: boolean; // 只有已支付的订单才能评价
}

export default function OrderItemReview({
  productId,
  productTitle,
  existingReview,
  canReview,
}: OrderItemReviewProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingReview);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [content, setContent] = useState(existingReview?.content || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "提交评价失败");
      }

      setSubmitted(true);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交评价失败");
    } finally {
      setLoading(false);
    }
  };

  // 已评价 - 显示评价内容
  if (submitted || existingReview) {
    const review = existingReview || { rating, title, content, createdAt: new Date().toISOString() };
    return (
      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-3.5 w-3.5",
                  star <= (review.rating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-200"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            已评价
          </span>
        </div>
        {(review.title || title) && (
          <p className="text-sm font-medium text-slate-700">{review.title || title}</p>
        )}
        {(review.content || content) && (
          <p className="text-sm text-slate-600 mt-1">{review.content || content}</p>
        )}
      </div>
    );
  }

  // 不能评价（订单未支付）
  if (!canReview) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        订单完成支付后可评价
      </p>
    );
  }

  // 显示评价按钮或表单
  if (!showForm) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowForm(true)}
        className="mt-2"
      >
        <Star className="h-3.5 w-3.5 mr-1" />
        评价商品
      </Button>
    );
  }

  // 评价表单
  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 bg-slate-50 rounded-lg space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          评分
        </label>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  star <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 hover:text-amber-200"
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-xs text-muted-foreground">
            {rating === 5 && "非常满意"}
            {rating === 4 && "满意"}
            {rating === 3 && "一般"}
            {rating === 2 && "不满意"}
            {rating === 1 && "非常不满意"}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          标题（可选）
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="一句话总结"
          className="w-full px-3 py-1.5 text-sm rounded border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          评价内容
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享您的使用体验..."
          className="min-h-[60px] text-sm"
          maxLength={500}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              提交中...
            </>
          ) : (
            "提交评价"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowForm(false)}
          disabled={loading}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
