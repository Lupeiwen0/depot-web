/**
 * 服务端错误处理工具
 * 用于 Server Actions 和 API Routes
 */

import { getServerTranslations } from "@/lib/server-i18n";
import type { ActionResult, FieldErrorMap } from "./types";
import type { ErrorCode } from "./codes";

/**
 * 创建带国际化的错误响应
 * @param code 错误码（来自 ErrorCodes 枚举）
 * @param fieldErrors 可选的字段级错误映射
 * @returns 包含翻译后错误消息的 ActionResult
 *
 * @example
 * ```ts
 * import { createError, ErrorCodes } from '@/lib/errors';
 *
 * // 在 Server Action 中使用
 * if (!session?.user) {
 *   return await createError(ErrorCodes.AUTH_NOT_LOGGED_IN);
 * }
 * ```
 */
export async function createError<T = void>(
  code: ErrorCode,
  fieldErrors?: FieldErrorMap
): Promise<ActionResult<T>> {
  const { t } = await getServerTranslations();
  return {
    success: false,
    error: t(code),
    fieldErrors,
  };
}

/**
 * 创建带自定义错误消息的错误响应（已翻译消息）
 * @param errorMessage 已翻译的错误消息
 * @param fieldErrors 可选的字段级错误映射
 *
 * @example
 * ```ts
 * const { t } = await getServerTranslations();
 * return createErrorWithMessage(t('api.custom.error'));
 * ```
 */
export function createErrorWithMessage<T = void>(
  errorMessage: string,
  fieldErrors?: FieldErrorMap
): ActionResult<T> {
  return {
    success: false,
    error: errorMessage,
    fieldErrors,
  };
}

/**
 * 创建成功响应
 * @param data 可选的响应数据
 *
 * @example
 * ```ts
 * import { createSuccess } from '@/lib/errors';
 *
 * // 无数据返回
 * return createSuccess();
 *
 * // 有数据返回
 * return createSuccess({ orderId: order.id });
 * ```
 */
export function createSuccess<T>(data?: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * 包装异步操作，统一处理错误
 * @param operation 异步操作函数
 * @param errorCode 失败时的错误码
 *
 * @example
 * ```ts
 * import { withErrorHandling, ErrorCodes } from '@/lib/errors';
 *
 * const result = await withErrorHandling(
 *   async () => {
 *     // 你的业务逻辑
 *     return { data: 'success' };
 *   },
 *   ErrorCodes.COMMON_OPERATION_FAILED
 * );
 * ```
 */
export async function withErrorHandling<T>(
  operation: () => Promise<ActionResult<T>>,
  errorCode: ErrorCode
): Promise<ActionResult<T>> {
  try {
    return await operation();
  } catch (error) {
    console.error("Operation error:", error);
    return await createError<T>(errorCode);
  }
}
