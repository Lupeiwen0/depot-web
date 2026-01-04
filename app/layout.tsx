import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { CartDrawerProvider } from "@/contexts/CartDrawerContext";

export const metadata: Metadata = {
  title: "在线商城系统",
  description: "Depot Next.js 在线商城",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <CartDrawerProvider>
          <Header />
          {children}
        </CartDrawerProvider>
      </body>
    </html>
  );
}
