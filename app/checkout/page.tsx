import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { carts, lineItems, userCoupons } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import CheckoutForm from "@/components/CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // 获取用户购物车
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, session.user.id),
    with: {
      lineItems: {
        where: isNull(lineItems.orderId),
        with: {
          product: true,
        },
      },
    },
  });

  const cartItems = cart?.lineItems || [];

  if (cartItems.length === 0) {
    redirect("/cart");
  }

  // 获取用户可用的优惠券
  const availableCoupons = await db.query.userCoupons.findMany({
    where: and(
      eq(userCoupons.userId, session.user.id),
      eq(userCoupons.status, "available"),
      gt(userCoupons.expiresAt, new Date())
    ),
  });

  const total = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-muted/5">
      <h1 className="text-3xl font-bold tracking-tight mb-8">填写订单信息</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
        <div className="lg:col-span-2">
          <CheckoutForm
            userEmail={session.user.email!}
            availableCoupons={availableCoupons.map((c) => ({
              id: c.id,
              couponCode: c.couponCode,
              percentOff: c.percentOff,
            }))}
          />
        </div>
        <div className="lg:col-span-1 sticky top-24">
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">订单概览</h2>
            <div className="space-y-4 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span
                    className="text-muted-foreground w-2/3 truncate pr-2"
                    title={item.product.title}
                  >
                    {item.product.title}{" "}
                    <span className="text-foreground">× {item.quantity}</span>
                  </span>
                  <span className="font-medium flex-shrink-0">
                    ¥
                    {(parseFloat(item.product.price) * item.quantity).toFixed(
                      2
                    )}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-bold border-t pt-4">
                <span>总计</span>
                <span className="text-primary">¥{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
