import Link from "next/link";
import { XCircle, ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">支付已取消</h1>
          <p className="text-gray-600">
            您的支付已被取消。您可以在订单列表中找到待支付的订单继续完成支付。
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <p className="text-sm text-gray-600">
            如果您在支付过程中遇到任何问题，请联系我们的客服团队。
            待支付订单将保留 30 分钟，超时后将自动取消。
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
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
