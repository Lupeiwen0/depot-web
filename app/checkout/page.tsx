import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";

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
  total: number;
  empty?: boolean;
  error?: string;
}

async function getCheckoutData(cookie: string): Promise<CheckoutData & { unauthorized?: boolean }> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const res = await fetch(`${protocol}://${host}/api/checkout`, {
    cache: "no-store",
    headers: { cookie },
  });

  if (!res.ok) {
    if (res.status === 401) {
      return { unauthorized: true, userEmail: "", cartItems: [], coupons: [], total: 0 };
    }
    return { error: "Failed to load checkout data", userEmail: "", cartItems: [], coupons: [], total: 0 };
  }

  return await res.json();
}

export default async function CheckoutPage() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";

  const data = await getCheckoutData(cookie);

  if (data.unauthorized) {
    redirect("/login");
  }

  if (data.empty || data.cartItems.length === 0) {
    redirect("/cart");
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-muted/5">
      <h1 className="text-3xl font-bold tracking-tight mb-8">填写订单信息</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
        <div className="lg:col-span-2">
          <CheckoutForm
            userEmail={data.userEmail}
            availableCoupons={data.coupons}
          />
        </div>
        <div className="lg:col-span-1 sticky top-24">
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">订单概览</h2>
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
                    {(parseFloat(item.productPrice) * item.quantity).toFixed(
                      2
                    )}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-bold border-t pt-4">
                <span>总计</span>
                <span className="text-primary">¥{data.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
