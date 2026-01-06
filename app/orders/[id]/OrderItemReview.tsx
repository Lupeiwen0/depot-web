"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItemReviewProps {
  orderId: number;
  productId: number;
  productTitle: string;
  existingReview?: {
    id: number;
    rating: number;
    title: string | null;
    content: string | null;
    createdAt: string;
  } | null;
  canReview: boolean;
}

export default function OrderItemReview({
  orderId,
  productId,
  productTitle,
  existingReview,
  canReview,
}: OrderItemReviewProps) {
  const t = useTranslations("order");
  const tReview = useTranslations("review");
  const tCommon = useTranslations("common");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingReview);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [content, setContent] = useState(existingReview?.content || "");

  const getRatingText = (r: number) => {
    return tReview(`ratings.${r}` as "ratings.1" | "ratings.2" | "ratings.3" | "ratings.4" | "ratings.5");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, title, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("reviewFailed"));
      }

      setSubmitted(true);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reviewFailed"));
    } finally {
      setLoading(false);
    }
  };

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
            {t("reviewed")}
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

  if (!canReview) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        {t("canReviewAfterPay")}
      </p>
    );
  }

  if (!showForm) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowForm(true)}
        className="mt-2"
      >
        <Star className="h-3.5 w-3.5 mr-1" />
        {t("reviewProduct")}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 bg-slate-50 rounded-lg space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          {tReview("rating")}
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
            {getRatingText(rating)}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          {tReview("ratingTitle")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={tReview("ratingTitlePlaceholder")}
          className="w-full px-3 py-1.5 text-sm rounded border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          {tReview("content")}
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={tReview("contentPlaceholder")}
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
              {tReview("submitting")}
            </>
          ) : (
            tReview("submit")
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowForm(false)}
          disabled={loading}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
