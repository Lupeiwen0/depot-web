/**
 * Zod 错误处理工具函数
 */

import { z } from "zod";
import type { FieldErrorMap } from "./types";

/**
 * 将 Zod 验证错误转换为字段级错误映射
 * @param error Zod 验证错误
 * @returns 字段名 -> 错误消息的映射
 */
export function zodToFieldErrors(error: z.ZodError): FieldErrorMap {
  const fieldErrors: FieldErrorMap = {};
  for (const issue of error.issues) {
    // 将路径数组转换为点分隔的字符串，如 ["user", "email"] -> "user.email"
    const path = issue.path.join(".");
    // 只保留第一个错误消息
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }
  return fieldErrors;
}

/**
 * 格式化 Zod 错误为 ActionResult 格式
 * @param error Zod 验证错误
 * @returns 包含 error 和 fieldErrors 的对象
 */
export function formatZodError(error: z.ZodError): {
  error: string;
  fieldErrors: FieldErrorMap;
} {
  const fieldErrors = zodToFieldErrors(error);
  const firstError = error.issues[0]?.message || "验证失败";
  return { error: firstError, fieldErrors };
}
