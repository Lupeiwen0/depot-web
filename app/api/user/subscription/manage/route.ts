import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userStripeCustomers } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST - 创建 Stripe Billing Portal Session
export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取用户的 Stripe Customer ID
    const stripeCustomer = await db.query.userStripeCustomers.findFirst({
      where: eq(userStripeCustomers.userId, session.user.id),
    });

    if (!stripeCustomer) {
      return NextResponse.json(
        { error: "未找到关联的支付账户" },
        { status: 404 }
      );
    }

    // 创建 Billing Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomer.stripeCustomerId,
      return_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Create billing portal session error:", error);
    return NextResponse.json({ error: "创建管理页面失败" }, { status: 500 });
  }
}
