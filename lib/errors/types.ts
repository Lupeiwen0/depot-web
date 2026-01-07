/**
 * 同构错误映射类型定义
 * 客户端和服务端共享使用
 */

/**
 * 字段级错误映射
 * 键为字段名（支持嵌套路径如 "user.email"），值为错误消息
 */
export type FieldErrorMap = Record<string, string>;

/**
 * Server Action 统一响应类型
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  /** 通用错误消息（已翻译） */
  error?: string;
  /** 字段级错误映射（已翻译） */
  fieldErrors?: FieldErrorMap;
}

/**
 * API 错误响应类型
 */
export interface ApiErrorResponse {
  error?: string;
  fieldErrors?: FieldErrorMap;
}

/**
 * 重新导出错误码类型
 */
export type { ErrorCode } from "./codes";
