"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createOrder } from "@/app/actions/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Loader2, Ticket, Tag } from "lucide-react";

interface Coupon {
  id: number;
  couponCode: string;
  percentOff: number;
}

interface CheckoutFormProps {
  userEmail: string;
  availableCoupons?: Coupon[];
  subtotal?: number;
  total?: number;
}

export default function CheckoutForm({
  userEmail,
  availableCoupons = [],
  subtotal = 0,
  total = 0,
}: CheckoutFormProps) {
  const router = useRouter();
  const t = useTranslations("checkout");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // 默认选中第一张可用优惠券
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(
    availableCoupons.length > 0 ? availableCoupons[0].id : null
  );
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "legacy">(
    "stripe"
  );

  // 计算价格
  const selectedCoupon = availableCoupons.find(
    (c) => c.id === selectedCouponId
  );
  const discountPercent = selectedCoupon?.percentOff || 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const finalTotal = subtotal - discountAmount;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      // 创建订单
      const result = await createOrder(formData);

      if (!result.success || !result.orderId) {
        setError(result.error || t("createOrderFailed"));
        setLoading(false);
        return;
      }

      // 如果选择 Stripe 支付
      if (paymentMethod === "stripe") {
        // 调用 Stripe Checkout 创建会话
        const response = await fetch("/api/checkout/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: result.orderId,
            paymentType: "one_time",
            couponId: selectedCouponId || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || t("createPaymentFailed"));
          setLoading(false);
          return;
        }

        // 跳转到 Stripe Checkout 页面
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        // 传统方式，直接跳转到订单页面
        router.push(`/orders/${result.orderId}`);
      }
    } catch (err) {
      setError(t("orderError"));
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">{t("shippingAndPayment")}</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 收货人姓名 */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {t("recipientName")}
          </label>
          <Input
            type="text"
            id="name"
            name="name"
            required
            placeholder={t("recipientNamePlaceholder")}
            className="bg-gray-50 focus:bg-white transition-colors"
          />
        </div>

        {/* 收货地址 */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {t("shippingAddress")}
          </label>
          <Textarea
            id="address"
            name="address"
            required
            rows={3}
            placeholder={t("shippingAddressPlaceholder")}
            className="bg-gray-50 focus:bg-white transition-colors"
          />
        </div>

        {/* 联系邮箱 */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {t("contactEmail")}
          </label>
          <Input
            type="email"
            id="email"
            name="email"
            required
            defaultValue={userEmail}
            placeholder={t("contactEmailPlaceholder")}
            className="bg-gray-50 focus:bg-white transition-colors"
          />
        </div>

        {/* 隐藏的 payType 字段 */}
        <input type="hidden" name="payType" value="Credit card" />

        {/* 优惠券选择 */}
        {availableCoupons.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <Ticket className="inline h-4 w-4 mr-1" />
              {t("useCoupon")}
            </label>
            <select
              value={selectedCouponId ?? ""}
              onChange={(e) =>
                setSelectedCouponId(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="">{t("noCoupon")}</option>
              {availableCoupons.map((coupon) => (
                <option key={coupon.id} value={coupon.id}>
                  {t("couponDiscount", { code: coupon.couponCode, percent: coupon.percentOff })}
                </option>
              ))}
            </select>

            {/* 价格详情展示 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("subtotal")}</span>
                <span>¥{subtotal.toFixed(2)}</span>
              </div>
              {selectedCouponId && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {t("couponDeduction", { percent: discountPercent })}
                  </span>
                  <span>-¥{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span>{t("totalAmount")}</span>
                <span className="text-primary">¥{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 支付方式选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t("paymentMethod")}
          </label>
          <div className="grid grid-cols-1 gap-3">
            <label
              className={`relative flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                paymentMethod === "stripe"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="paymentMethodType"
                value="stripe"
                checked={paymentMethod === "stripe"}
                onChange={() => setPaymentMethod("stripe")}
                className="sr-only"
              />
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  paymentMethod === "stripe"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{t("stripePayment")}</p>
                <p className="text-sm text-gray-500">
                  {t("stripePaymentDesc")}
                </p>
              </div>
              {paymentMethod === "stripe" && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 text-base font-medium"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("submitting")}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("placeOrder")}
            </span>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          {t("termsHint")}
        </p>
      </form>
    </div>
  );
}
