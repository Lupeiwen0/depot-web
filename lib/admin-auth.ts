import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getServerTranslations } from "@/lib/server-i18n";

/**
 * 验证管理员权限的辅助函数
 * 集成国际化错误消息
 */
export async function verifyAdmin() {
  const { t } = await getServerTranslations();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: t("api.auth.unauthorized"), status: 401 };
  }

  if (session.user.role !== "admin") {
    return { error: t("api.auth.adminRequired"), status: 403 };
  }

  return { user: session.user };
}
