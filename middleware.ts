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
const SESSION_COOKIE_NAME = "better-auth.session_token";

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

  // 检查 session cookie 是否存在
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME);

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
    return NextResponse.redirect(loginUrl);
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
