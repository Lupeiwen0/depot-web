import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce-slow">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
              <span className="text-white text-lg">✓</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">支付成功</h1>
          <p className="text-gray-600">
            感谢您的购买！您的订单已经确认。
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">订单处理中</p>
              <p className="text-sm text-gray-500">
                我们正在准备您的商品
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            您将收到一封确认邮件，其中包含订单详情和物流跟踪信息。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/orders">
            <Button className="w-full sm:w-auto gap-2">
              <Package className="h-4 w-4" />
              查看我的订单
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <ShoppingBag className="h-4 w-4" />
              继续购物
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
