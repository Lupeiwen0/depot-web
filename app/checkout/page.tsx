import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import CheckoutForm from "@/components/CheckoutForm";
import { fetchInternalApiWithAuth } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

interface CartItem {
  id: number;
  productId: number;
  productTitle: string;
  productPrice: string;
  productImage: string | null;
  quantity: number;
}

interface Coupon {
  id: number;
  couponCode: string;
  percentOff: number;
}

interface CheckoutData {
  userEmail: string;
  cartItems: CartItem[];
  coupons: Coupon[];
  subtotal: number;
  discountAmount: number;
  total: number;
  empty?: boolean;
  error?: string;
}

async function getCheckoutData(
  cookie: string
): Promise<CheckoutData & { unauthorized?: boolean }> {
  const res = await fetchInternalApiWithAuth("/api/checkout", cookie);

  if (!res.ok) {
    if (res.status === 401) {
      return {
        unauthorized: true,
        userEmail: "",
        cartItems: [],
        coupons: [],
        subtotal: 0,
        discountAmount: 0,
        total: 0,
      };
    }
    return {
      error: "Failed to load checkout data",
      userEmail: "",
      cartItems: [],
      coupons: [],
      subtotal: 0,
      discountAmount: 0,
      total: 0,
    };
  }

  return await res.json();
}

export default async function CheckoutPage() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";
  const t = await getTranslations("checkout");

  const data = await getCheckoutData(cookie);

  if (data.unauthorized) {
    redirect("/login");
  }

  if (data.empty || data.cartItems.length === 0) {
    redirect("/cart");
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-muted/5">
      <h1 className="text-3xl font-bold tracking-tight mb-8">{t("title")}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
        <div className="lg:col-span-2">
          <CheckoutForm
            userEmail={data.userEmail}
            availableCoupons={data.coupons}
            subtotal={data.subtotal}
            total={data.total}
          />
        </div>
        <div className="lg:col-span-1 sticky top-24">
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">{t("orderSummary")}</h2>
            <div className="space-y-4 mb-4">
              {data.cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span
                    className="text-muted-foreground w-2/3 truncate pr-2"
                    title={item.productTitle}
                  >
                    {item.productTitle}{" "}
                    <span className="text-foreground">× {item.quantity}</span>
                  </span>
                  <span className="font-medium flex-shrink-0">
                    ¥
                    {(parseFloat(item.productPrice) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("subtotal")}</span>
                  <span>¥{data.subtotal.toFixed(2)}</span>
                </div>
                {data.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t("memberDiscount")}</span>
                    <span>-¥{data.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>{t("totalAmount")}</span>
                  <span className="text-primary">¥{data.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
