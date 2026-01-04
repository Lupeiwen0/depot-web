import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function OrdersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // 获取用户的所有订单
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, session.user.id),
    with: {
      lineItems: {
        with: {
          product: true,
        },
      },
    },
    orderBy: [desc(orders.createdAt)],
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-muted/5">
      <h1 className="text-3xl font-bold tracking-tight mb-8">我的订单</h1>
      {userOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/30 animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <span className="text-3xl">📦</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">暂无订单</h2>
          <p className="text-muted-foreground mb-6">还没有购买记录哦</p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            去购物
          </a>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          {userOrders.map((order, index) => {
            const total = order.lineItems.reduce((sum, item) => {
              return sum + parseFloat(item.product.price) * item.quantity;
            }, 0);

            return (
              <div
                key={order.id}
                className="bg-card rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "forwards",
                }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold">订单 #{order.id}</h3>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                        已支付
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      下单时间:{" "}
                      {new Date(order.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    查看详情
                  </Link>
                </div>

                <div className="">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                        收货人
                      </p>
                      <p className="font-medium text-sm">{order.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                        收货地址
                      </p>
                      <p
                        className="font-medium text-sm truncate"
                        title={order.address}
                      >
                        {order.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                        联系邮箱
                      </p>
                      <p
                        className="font-medium text-sm truncate"
                        title={order.email}
                      >
                        {order.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                        支付方式
                      </p>
                      <p className="font-medium text-sm">
                        {order.payType === "Credit card"
                          ? "信用卡"
                          : order.payType === "Check"
                          ? "支票"
                          : "采购订单"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm font-medium mb-3">商品清单</p>
                    <div className="space-y-3">
                      {order.lineItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.product.title}{" "}
                            <span className="text-foreground">
                              × {item.quantity}
                            </span>
                          </span>
                          <span className="font-medium">
                            ¥
                            {(
                              parseFloat(item.product.price) * item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t border-dashed">
                      <span>订单总额</span>
                      <span className="text-primary">¥{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
