import { cookies, headers } from "next/headers";

type Messages = Record<string, any>;

/**
 * 获取服务端翻译函数
 * 用于在 API 路由和 middleware 中进行国际化
 */
export async function getServerTranslations() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "zh";

  // 动态导入对应语言的翻译文件
  const messages: Messages = (await import(`../messages/${locale}.json`))
    .default;

  /**
   * 翻译函数
   * @param key - 翻译键，使用点号分隔的路径，如 "api.auth.notLoggedIn"
   * @param params - 可选的插值参数对象
   * @returns 翻译后的文本
   */
  const t = (key: string, params?: Record<string, any>): string => {
    // 按点号分割 key，逐层访问 messages 对象
    const keys = key.split(".");
    let value: any = messages;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // 如果找不到翻译，返回 key 本身
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // 如果最终值不是字符串，返回 key
    if (typeof value !== "string") {
      console.warn(`Translation value is not a string for key: ${key}`);
      return key;
    }

    // 如果有参数，进行简单的插值替换
    if (params) {
      return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
        const regex = new RegExp(`\\{${paramKey}\\}`, "g");
        return result.replace(regex, String(paramValue));
      }, value);
    }

    return value;
  };

  return {
    locale,
    t,
  };
}

/**
 * 同步版本的服务端翻译函数（用于 middleware）
 * 注意：由于 middleware 的限制，这里使用同步方式读取 cookie
 */
export function getServerTranslationsSync(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
}) {
  const locale = request.cookies.get("locale")?.value || "zh";

  /**
   * 翻译函数 - 同步版本
   * 注意：这个版本不会动态导入翻译文件，而是返回一个延迟加载的函数
   */
  const t = (key: string, params?: Record<string, any>): string => {
    // 在 middleware 中，我们暂时直接返回硬编码的翻译
    // 因为 middleware 运行在 Edge Runtime，不支持动态导入
    const translations: Record<string, Record<string, string>> = {
      zh: {
        "api.auth.notLoggedIn": "未登录",
        "api.auth.unauthorized": "未授权",
      },
      en: {
        "api.auth.notLoggedIn": "Not logged in",
        "api.auth.unauthorized": "Unauthorized",
      },
    };

    const messages = translations[locale] || translations.zh;
    const value = messages[key];

    if (!value) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    // 如果有参数，进行简单的插值替换
    if (params) {
      return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
        const regex = new RegExp(`\\{${paramKey}\\}`, "g");
        return result.replace(regex, String(paramValue));
      }, value);
    }

    return value;
  };

  return {
    locale,
    t,
  };
}
