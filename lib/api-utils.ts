import { headers } from "next/headers";

/**
 * 构建内部 API 的完整 URL
 */
async function getApiUrl(path: string): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}${path}`;
}

/**
 * 调用内部 API 的通用方法
 * @param path API 路径（如：/api/products）
 * @param options fetch 的配置选项
 * @returns fetch Response 对象
 */
export async function fetchInternalApi(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = await getApiUrl(path);
  return fetch(url, {
    cache: "no-store",
    ...options,
  });
}

/**
 * 调用需要 cookie 认证的内部 API
 * @param path API 路径
 * @param cookie cookie 字符串
 * @param options 其他 fetch 配置选项
 * @returns fetch Response 对象
 */
export async function fetchInternalApiWithAuth(
  path: string,
  cookie: string,
  options?: RequestInit
): Promise<Response> {
  const url = await getApiUrl(path);
  return fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      cookie,
      ...options?.headers,
    },
  });
}
