import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { orders, productReviews } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import OrderItemReview from "./OrderItemReview";
import PayOrderButton from "../PayOrderButton";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // 获取订单详情
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, parseInt(id)),
      eq(orders.userId, session.user.id)
    ),
    with: {
      lineItems: {
        with: {
          product: true,
        },
      },
      payments: true,
    },
  });

  if (!order) {
    notFound();
  }

  // 检查订单是否已支付
  const isPaid = order.payments?.some((p) => p.status === "succeeded") || false;

  // 获取用户对这些商品的已有评价
  const productIds = order.lineItems.map((item) => item.productId);
  const existingReviews = productIds.length > 0
    ? await db.query.productReviews.findMany({
        where: and(
          eq(productReviews.userId, session.user.id),
          inArray(productReviews.productId, productIds)
        ),
      })
    : [];

  // 创建评价映射
  const reviewMap = new Map(
    existingReviews.map((r) => [
      r.productId,
      {
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
      },
    ])
  );

  const total = order.lineItems.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0);

  // 支付状态
  const getPaymentStatus = () => {
    // 检查是否超时（30分钟）
    const now = new Date();
    const orderTime = new Date(order.createdAt);
    const diffMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);
    const isExpired = diffMinutes > 30;

    if (!order.payments || order.payments.length === 0) {
      if (isExpired) {
        return { label: "已取消", className: "bg-gray-100 text-gray-700", canPay: false };
      }
      return { label: "待支付", className: "bg-yellow-100 text-yellow-700", canPay: true };
    }
    const latestPayment = order.payments[order.payments.length - 1];
    switch (latestPayment.status) {
      case "succeeded":
        return { label: "已支付", className: "bg-green-100 text-green-700", canPay: false };
      case "pending":
        // 支付中状态，如果未超时可以重新发起支付
        if (isExpired) {
          return { label: "已取消", className: "bg-gray-100 text-gray-700", canPay: false };
        }
        return { label: "待支付", className: "bg-yellow-100 text-yellow-700", canPay: true };
      case "failed":
        if (isExpired) {
          return { label: "已取消", className: "bg-gray-100 text-gray-700", canPay: false };
        }
        return { label: "支付失败", className: "bg-red-100 text-red-700", canPay: true };
      case "refunded":
        return { label: "已退款", className: "bg-gray-100 text-gray-700", canPay: false };
      default:
        if (isExpired) {
          return { label: "已取消", className: "bg-gray-100 text-gray-700", canPay: false };
        }
        return { label: "待支付", className: "bg-yellow-100 text-yellow-700", canPay: true };
    }
  };

  const paymentStatus = getPaymentStatus();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          返回订单列表
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentStatus.className}`}>
                {paymentStatus.label}
              </span>
            </div>
            {paymentStatus.canPay && (
              <PayOrderButton orderId={order.id} />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            订单号: #{order.id}
          </p>
          <p className="text-sm text-gray-600">
            下单时间: {new Date(order.createdAt).toLocaleString("zh-CN")}
          </p>
          {paymentStatus.canPay && (
            <p className="text-sm text-orange-600 mt-2">
              请在 30 分钟内完成支付，超时订单将自动取消
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">配送信息</h2>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">收货人:</span>{" "}
                <span className="font-medium">{order.name}</span>
              </p>
              <p>
                <span className="text-gray-600">收货地址:</span>{" "}
                <span className="font-medium">{order.address}</span>
              </p>
              <p>
                <span className="text-gray-600">联系邮箱:</span>{" "}
                <span className="font-medium">{order.email}</span>
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">支付信息</h2>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">支付方式:</span>{" "}
                <span className="font-medium">
                  {order.payType === "Credit card"
                    ? "信用卡"
                    : order.payType === "Check"
                    ? "支票"
                    : "采购订单"}
                </span>
              </p>
              <p>
                <span className="text-gray-600">订单总额:</span>{" "}
                <span className="font-bold text-primary">¥{total.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">商品清单</h2>
          <div className="space-y-6">
            {order.lineItems.map((item) => (
              <div key={item.id} className="border-b pb-4 last:border-b-0">
                <div className="flex gap-4">
                  {item.product.imageUrl && (
                    <div className="relative h-20 w-20 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {item.product.title}
                    </h3>
                    {item.product.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.product.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">
                        数量: {item.quantity}
                      </span>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          单价: ¥{parseFloat(item.product.price).toFixed(2)}
                        </p>
                        <p className="font-semibold text-primary">
                          小计: ¥{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 评价组件 */}
                <OrderItemReview
                  productId={item.productId}
                  productTitle={item.product.title}
                  existingReview={reviewMap.get(item.productId) || null}
                  canReview={isPaid}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-gray-600">
                共 {order.lineItems.reduce((sum, item) => sum + item.quantity, 0)} 件商品
              </p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                订单总额: <span className="text-primary">¥{total.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
