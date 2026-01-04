import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";

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
    },
  });

  if (!order) {
    notFound();
  }

  const total = order.lineItems.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/orders"
          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
        >
          ← 返回订单列表
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
          <p className="text-sm text-gray-600 mt-1">
            订单号: #{order.id}
          </p>
          <p className="text-sm text-gray-600">
            下单时间: {new Date(order.createdAt).toLocaleString("zh-CN")}
          </p>
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
                <span className="font-bold text-indigo-600">¥{total.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">商品清单</h2>
          <div className="space-y-4">
            {order.lineItems.map((item) => (
              <div key={item.id} className="flex gap-4 border-b pb-4 last:border-b-0">
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
                      <p className="font-semibold text-indigo-600">
                        小计: ¥{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-gray-600">
                共 {order.lineItems.reduce((sum, item) => sum + item.quantity, 0)} 件商品
              </p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                订单总额: <span className="text-indigo-600">¥{total.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
