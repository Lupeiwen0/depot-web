import { NextRequest, NextResponse } from "next/server";
import { getServerTranslationsSync } from "@/lib/server-i18n";

// 公开页面（不需要登录）
const publicPages = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/products",
];

// 公开 API（不需要登录）
const publicApis = [
  "/api/auth",
  "/api/products",
  "/api/tags",
  "/api/webhook",
  "/api/user/request-password-reset",
  "/api/user/reset-password",
];

// better-auth 的 session cookie 名称
// 从环境变量获取 cookie 前缀，与 lib/auth.ts 保持一致
const COOKIE_PREFIX = process.env.COOKIE_PREFIX || "dp-dev";
// 开发环境（HTTP）使用普通名称，生产环境（HTTPS）自动添加 __Secure- 前缀
const SESSION_COOKIE_NAME = `${COOKIE_PREFIX}.session_token`;
const SECURE_SESSION_COOKIE_NAME = `__Secure-${COOKIE_PREFIX}.session_token`;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是 API 请求
  const isApiRequest = pathname.startsWith("/api/");

  // 检查是否是公开页面
  const isPublicPage = publicPages.some((path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  });

  // 检查是否是公开 API
  const isPublicApi = publicApis.some((path) => pathname.startsWith(path));

  // 如果是公开页面或公开 API，直接放行
  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  // 检查 session cookie 是否存在（兼容开发和生产环境）
  const sessionToken =
    request.cookies.get(SECURE_SESSION_COOKIE_NAME) ||
    request.cookies.get(SESSION_COOKIE_NAME);

  // 如果没有 session cookie，认为未登录
  if (!sessionToken?.value) {
    // 获取翻译
    const { t } = getServerTranslationsSync(request);

    // API 请求返回 401
    if (isApiRequest) {
      return NextResponse.json(
        { error: t("api.auth.notLoggedIn") },
        { status: 401 }
      );
    }

    // 页面请求重定向到登录页
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    // 禁用缓存，确保登录失效后页面完全刷新
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }

  // 有 session cookie，放行（详细验证由各路由的 auth.api.getSession 处理）
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (favicon)
     * - public 目录下的文件
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
