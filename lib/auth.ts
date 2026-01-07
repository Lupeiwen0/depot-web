import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

// Cookie 前缀，从环境变量获取，默认为 dp-dev
export const COOKIE_PREFIX = process.env.COOKIE_PREFIX || "dp-dev";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "casdoor",
          clientId: process.env.CASDOOR_CLIENT_ID!,
          clientSecret: process.env.CASDOOR_CLIENT_SECRET!,
          discoveryUrl: `${process.env.CASDOOR_ENDPOINT}/.well-known/openid-configuration`,
          scopes: ["openid", "profile", "email"],
          // 自定义 getUserInfo 以正确映射 Casdoor 返回的用户信息
          getUserInfo: async (tokens) => {
            const response = await fetch(
              `${process.env.CASDOOR_ENDPOINT}/api/userinfo`,
              {
                headers: {
                  Authorization: `Bearer ${tokens.accessToken}`,
                },
              }
            );
            const data = await response.json();

            // Casdoor userinfo 可能返回的字段：
            // sub, name, preferred_username, email, picture, phone 等
            const userId = data.sub || data.id || data.name;

            // 如果 Casdoor 用户没有 email，使用用户 ID 生成占位 email
            const email = data.email || `${userId}@casdoor.local`;

            return {
              id: userId,
              name: data.name || data.preferred_username || data.displayName,
              email: email,
              image: data.picture || data.avatar,
              emailVerified: !!data.email, // 只有真实 email 才标记为已验证
            };
          },
        },
      ],
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "buyer",
        input: false, // 防止用户在注册时定义自己的角色
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: COOKIE_PREFIX,
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
