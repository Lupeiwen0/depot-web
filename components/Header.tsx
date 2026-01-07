import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { carts, lineItems } from "@/db/depot-schema";
import { eq } from "drizzle-orm";
import HeaderClient from "./HeaderClient";
import CartDrawer, { type CartItem } from "./CartDrawer";
import { StoreProvider } from "./StoreProvider";

export default async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let userRole: "admin" | "buyer" | null = null;
  let cartItemCount = 0;
  let cartItems: CartItem[] = [];

  if (session?.user) {
    const userRecord = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, session.user.id),
    });
    userRole = userRecord?.role || null;

    // 查询购物车商品数量
    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
      with: {
        lineItems: {
          with: {
            product: true,
          },
        },
      },
    });

    // 计算购物车中的总商品数量（考虑每个商品的数量）
    if (cart?.lineItems) {
      cartItemCount = cart.lineItems.reduce(
        (total, item) => total + (item.quantity || 0),
        0
      );
      cartItems = cart.lineItems;
    }
  }

  return (
    <StoreProvider isLoggedIn={!!session?.user}>
      <HeaderClient
        session={session}
        userRole={userRole}
        cartItemCount={cartItemCount}
      />
      <CartDrawer initialItems={cartItems} />
    </StoreProvider>
  );
}
