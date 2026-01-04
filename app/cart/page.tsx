import { redirect } from "next/navigation";

export default function CartPage() {
  // 重定向到首页，购物车现在通过抽屉弹窗显示
  redirect("/");
}
