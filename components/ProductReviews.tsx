"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User, ThumbsUp, Flag, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Review {
  id: number;
  userId: string;
  userName: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: number;
  averageRating?: string;
  reviewCount?: number;
  readOnly?: boolean; // 是否只读模式（不显示评价表单）
}

export default function ProductReviews({
  productId,
  averageRating,
  reviewCount = 0,
  readOnly = false,
}: ProductReviewsProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 使用 API 返回的最新统计数据
  const [statsRating, setStatsRating] = useState(averageRating);
  const [statsCount, setStatsCount] = useState(reviewCount);

  // 评价表单状态
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 获取评价列表
  const fetchReviews = async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(
        `/api/products/${productId}/reviews?page=${pageNum}&pageSize=5`
      );
      const data = await res.json();

      if (data.reviews) {
        if (append) {
          setReviews((prev) => [...prev, ...data.reviews]);
        } else {
          setReviews(data.reviews);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }

      // 更新统计数据
      if (data.stats) {
        setStatsRating(data.stats.averageRating);
        setStatsCount(data.stats.totalReviews);
      }
    } catch (err) {
      console.error("获取评价失败:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [productId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setSubmitting(true);
    setError("");

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

      // 重置表单并刷新评价列表
      setRating(5);
      setTitle("");
      setContent("");
      setShowForm(false);
      setPage(1);
      fetchReviews(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交评价失败");
    } finally {
      setSubmitting(false);
    }
  };

  const rating_avg = statsRating ? parseFloat(statsRating) : 0;

  return (
    <div className="space-y-6">
      {/* 评分概览 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40">
        <div className="flex flex-col items-center justify-center sm:pr-6 sm:border-r border-slate-200">
          <div className="text-5xl font-bold text-slate-900">
            {rating_avg > 0 ? rating_avg.toFixed(1) : "--"}
          </div>
          <div className="flex items-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-5 w-5",
                  star <= Math.round(rating_avg)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {statsCount} 条评价
          </p>
        </div>

        {!readOnly && (
          <div className="flex-1">
            <p className="text-slate-600 mb-4">
              {session?.user
                ? "购买商品后可在订单详情中发表评价"
                : "登录并购买商品后可发表评价"}
            </p>
          </div>
        )}
      </div>

      {/* 评价表单 - 只在非只读模式下显示 */}
      {!readOnly && showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              评分
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 hover:text-amber-200"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating === 5 && "非常满意"}
                {rating === 4 && "满意"}
                {rating === 3 && "一般"}
                {rating === 2 && "不满意"}
                {rating === 1 && "非常不满意"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              标题（可选）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="用一句话总结您的评价"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white/80 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              评价内容
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享您的使用体验..."
              className="min-h-[120px] bg-white/80"
              maxLength={1000}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "提交中..." : "提交评价"}
            </Button>
          </div>
        </form>
      )}

      {/* 评价列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>暂无评价，成为第一个评价的用户吧！</p>
          </div>
        ) : (
          <>
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">
                        {review.userName || "匿名用户"}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          已购买
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          )}
                        />
                      ))}
                    </div>

                    {review.title && (
                      <h4 className="font-medium text-slate-900 mt-2">
                        {review.title}
                      </h4>
                    )}

                    {review.content && (
                      <p className="text-slate-600 mt-1 whitespace-pre-wrap">
                        {review.content}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3">
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-slate-900 transition-colors">
                        <ThumbsUp className="h-4 w-4" />
                        <span>有用 ({review.helpfulCount})</span>
                      </button>
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-slate-900 transition-colors">
                        <Flag className="h-4 w-4" />
                        <span>举报</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  {loadingMore ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      加载中...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      加载更多评价
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
