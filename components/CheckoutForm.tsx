"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/order";

export default function CheckoutForm({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createOrder(formData);

    if (result.success) {
      router.push(`/orders/${result.orderId}`);
    } else {
      setError(result.error || "创建订单失败");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">配送信息</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            收货人姓名
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="请输入收货人姓名"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            收货地址
          </label>
          <textarea
            id="address"
            name="address"
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="请输入详细收货地址"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            联系邮箱
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            defaultValue={userEmail}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="请输入联系邮箱"
          />
        </div>

        <div>
          <label htmlFor="payType" className="block text-sm font-medium text-gray-700 mb-1">
            支付方式
          </label>
          <select
            id="payType"
            name="payType"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">请选择支付方式</option>
            <option value="Credit card">信用卡</option>
            <option value="Check">支票</option>
            <option value="Purchase order">采购订单</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          {loading ? "提交中..." : "提交订单"}
        </button>
      </form>
    </div>
  );
}
