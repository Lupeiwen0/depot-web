import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { fetchInternalApiWithAuth } from "@/lib/api-utils";
import DeleteOrderButton from "./DeleteOrderButton";
import PayOrderButton from "./PayOrderButton";

export const dynamic = "force-dynamic";

interface OrderItem {
  id: number;
  productId: number;
  productTitle: string;
  productPrice: string;
  productImage: string | null;
  quantity: number;
}

interface Payment {
  id: number;
  status: string;
  amount: string | null;
  currency: string | null;
}

interface Order {
  id: number;
  name: string;
  address: string;
  email: string;
  payType: string;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
}

async function getOrdersData(cookie: string) {
  const res = await fetchInternalApiWithAuth("/api/user/orders", cookie);

  if (!res.ok) {
    if (res.status === 401) {
      return null;
    }
    return { orders: [] };
  }

  return await res.json();
}

export default async function OrdersPage() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";
  const t = await getTranslations("order");

  const data = await getOrdersData(cookie);

  if (data === null) {
    redirect("/login");
  }

  const userOrders: Order[] = data.orders || [];

  const getPaymentStatus = (
    orderPayments: Payment[],
    orderCreatedAt: string
  ) => {
    const now = new Date();
    const orderTime = new Date(orderCreatedAt);
    const diffMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);
    const isExpired = diffMinutes > 30;

    if (!orderPayments || orderPayments.length === 0) {
      if (isExpired) {
        return {
          label: t("status.cancelled"),
          className: "bg-gray-100 text-gray-700",
          canPay: false,
        };
      }
      return {
        label: t("status.pending"),
        className: "bg-yellow-100 text-yellow-700",
        canPay: true,
      };
    }
    const latestPayment = orderPayments[orderPayments.length - 1];
    switch (latestPayment.status) {
      case "succeeded":
        return {
          label: t("status.paid"),
          className: "bg-green-100 text-green-700",
          canPay: false,
        };
      case "pending":
        if (isExpired) {
          return {
            label: t("status.cancelled"),
            className: "bg-gray-100 text-gray-700",
            canPay: false,
          };
        }
        return {
          label: t("status.pending"),
          className: "bg-yellow-100 text-yellow-700",
          canPay: true,
        };
      case "failed":
        if (isExpired) {
          return {
            label: t("status.cancelled"),
            className: "bg-gray-100 text-gray-700",
            canPay: false,
          };
        }
        return {
          label: t("status.failed"),
          className: "bg-red-100 text-red-700",
          canPay: true,
        };
      case "refunded":
        return {
          label: t("status.refunded"),
          className: "bg-gray-100 text-gray-700",
          canPay: false,
        };
      default:
        if (isExpired) {
          return {
            label: t("status.cancelled"),
            className: "bg-gray-100 text-gray-700",
            canPay: false,
          };
        }
        return {
          label: t("status.pending"),
          className: "bg-yellow-100 text-yellow-700",
          canPay: true,
        };
    }
  };

  const getPaymentMethodLabel = (payType: string) => {
    switch (payType) {
      case "Credit card":
        return t("creditCard");
      case "Check":
        return t("check");
      default:
        return t("purchaseOrder");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-muted/5">
      <h1 className="text-3xl font-bold tracking-tight mb-8">{t("title")}</h1>
      {userOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/30 animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <span className="text-3xl">📦</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("empty")}</h2>
          <p className="text-muted-foreground mb-6">{t("emptyHint")}</p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {t("goShopping")}
          </a>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          {userOrders.map((order, index) => {
            const total = order.items.reduce((sum, item) => {
              return sum + parseFloat(item.productPrice) * item.quantity;
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
                      <h3 className="text-lg font-bold">{t("orderPrefix")}{order.id}</h3>
                      {(() => {
                        const status = getPaymentStatus(
                          order.payments,
                          order.createdAt
                        );
                        return (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {t("orderTime")}:{" "}
                      {new Date(order.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const status = getPaymentStatus(
                        order.payments,
                        order.createdAt
                      );
                      return status.canPay ? (
                        <PayOrderButton orderId={order.id} />
                      ) : null;
                    })()}
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                      {t("viewDetail")}
                    </Link>
                    <DeleteOrderButton orderId={order.id} />
                  </div>
                </div>

                <div className="">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                        {t("recipient")}
                      </p>
                      <p className="font-medium text-sm">{order.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                        {t("address")}
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
                        {t("email")}
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
                        {t("paymentMethod")}
                      </p>
                      <p className="font-medium text-sm">
                        {getPaymentMethodLabel(order.payType)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm font-medium mb-3">{t("productList")}</p>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.productTitle}{" "}
                            <span className="text-foreground">
                              × {item.quantity}
                            </span>
                          </span>
                          <span className="font-medium">
                            ¥
                            {(
                              parseFloat(item.productPrice) * item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t border-dashed">
                      <span>{t("totalAmount")}</span>
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
