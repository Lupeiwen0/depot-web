import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { CartDrawerProvider } from "@/contexts/CartDrawerContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "在线商城系统",
  description: "Depot Next.js 在线商城",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <CartDrawerProvider>
              <Header />
              {children}
            </CartDrawerProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
