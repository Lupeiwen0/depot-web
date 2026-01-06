"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { updateCartItemQuantity, removeCartItem } from "@/app/actions/cart";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { useTranslations } from "next-intl";

export type CartItem = {
  id: number;
  productId: number;
  cartId: number | null;
  orderId: number | null;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string | null;
    price: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

type CartDrawerProps = {
  initialItems: CartItem[];
};

export default function CartDrawer({ initialItems }: CartDrawerProps) {
  const { isOpen, closeDrawer } = useCartDrawer();
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const t = useTranslations("cart");

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleQuantityChange = async (
    lineItemId: number,
    newQuantity: number
  ) => {
    setLoadingItems((prev) => new Set(prev).add(lineItemId));
    await updateCartItemQuantity(lineItemId, newQuantity);
    setLoadingItems((prev) => {
      const next = new Set(prev);
      next.delete(lineItemId);
      return next;
    });
  };

  const handleRemove = async (lineItemId: number) => {
    setLoadingItems((prev) => new Set(prev).add(lineItemId));
    await removeCartItem(lineItemId);
    setItems((prev) => prev.filter((item) => item.id !== lineItemId));
    setLoadingItems((prev) => {
      const next = new Set(prev);
      next.delete(lineItemId);
      return next;
    });
  };

  const total = items.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t("title")}
          </SheetTitle>
          <SheetDescription>
            {items.length > 0
              ? t("totalItems", { count: totalQuantity })
              : t("empty")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                <span className="text-3xl">🛒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("empty")}</h3>
              <p className="text-muted-foreground mb-6">{t("emptyHint")}</p>
              <Button asChild onClick={closeDrawer}>
                <Link href="/">{t("continueShopping")}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const isLoading = loadingItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg bg-card"
                  >
                    {item.product.imageUrl && (
                      <div className="relative h-20 w-20 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                        {item.product.title}
                      </h3>
                      {item.product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {item.product.description}
                        </p>
                      )}
                      <p className="text-sm font-bold text-primary mt-2">
                        ¥{parseFloat(item.product.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          disabled={isLoading}
                          className="p-1 border rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          disabled={isLoading}
                          className="p-1 border rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("itemCount")}</span>
                <span className="font-medium">
                  {totalQuantity} {t("quantity")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("itemSubtotal")}
                </span>
                <span className="font-medium">¥{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span className="font-medium text-green-600">
                  {t("freeShipping")}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>{t("totalAmount")}</span>
                <span className="text-primary">¥{total.toFixed(2)}</span>
              </div>
            </div>
            <Button asChild className="w-full" size="lg" onClick={closeDrawer}>
              <Link href="/checkout">{t("checkout")}</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
