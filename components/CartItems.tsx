"use client";

import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { updateCartItemQuantity, removeCartItem } from "@/app/actions/cart";
import { useState } from "react";

type CartItem = {
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

export default function CartItems({ items }: { items: CartItem[] }) {
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());

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
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border animate-fade-in">
      {items.map((item) => {
        const isLoading = loadingItems.has(item.id);
        return (
          <div
            key={item.id}
            className="flex gap-4 p-6 border-b last:border-b-0"
          >
            {item.product.imageUrl && (
              <div className="relative h-24 w-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground">
                {item.product.title}
              </h3>
              {item.product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {item.product.description}
                </p>
              )}
              <p className="text-lg font-bold text-primary mt-2">
                ¥{parseFloat(item.product.price).toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                onClick={() => handleRemove(item.id)}
                disabled={isLoading}
                className="text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity - 1)
                  }
                  disabled={isLoading}
                  className="p-1 border rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity + 1)
                  }
                  disabled={isLoading}
                  className="p-1 border rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
