"use client";

/**
 * 客户端错误处理工具
 * 用于 React 组件中的错误状态管理
 */

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult, FieldErrorMap } from "./types";
import type { ErrorCode } from "./codes";

/**
 * 客户端错误翻译 Hook
 * 用于在客户端组件中翻译错误码
 *
 * @example
 * ```tsx
 * import { useErrorTranslation, ErrorCodes } from '@/lib/errors/client';
 *
 * function MyComponent() {
 *   const { translateError } = useErrorTranslation();
 *
 *   const handleError = () => {
 *     const message = translateError(ErrorCodes.AUTH_NOT_LOGGED_IN);
 *     // 显示翻译后的错误消息
 *   };
 * }
 * ```
 */
export function useErrorTranslation() {
  const t = useTranslations();

  const translateError = useCallback(
    (code: ErrorCode): string => {
      return t(code);
    },
    [t]
  );

  return { translateError, t };
}

/**
 * Action 错误状态管理 Hook
 * 封装了错误状态、字段错误和常用操作
 *
 * @example
 * ```tsx
 * import { useActionError } from '@/lib/errors/client';
 *
 * function CheckoutForm() {
 *   const {
 *     error,
 *     fieldErrors,
 *     handleResult,
 *     clearErrors,
 *     getFieldError
 *   } = useActionError();
 *
 *   const handleSubmit = async (formData: FormData) => {
 *     clearErrors();
 *     const result = await createOrder(formData);
 *
 *     if (!handleResult(result)) {
 *       // 错误已设置到状态中
 *       return;
 *     }
 *
 *     // 成功处理...
 *   };
 *
 *   return (
 *     <form>
 *       {error && <div className="error">{error}</div>}
 *
 *       <input name="name" />
 *       {getFieldError('name') && (
 *         <span className="field-error">{getFieldError('name')}</span>
 *       )}
 *     </form>
 *   );
 * }
 * ```
 */
export function useActionError() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});

  /**
   * 处理 Action 结果
   * @param result Action 返回的结果
   * @returns 如果成功返回 true，失败返回 false
   */
  const handleResult = useCallback(<T>(result: ActionResult<T>): boolean => {
    if (!result.success) {
      setError(result.error || null);
      setFieldErrors(result.fieldErrors || {});
      return false;
    }
    // 成功时清除错误
    setError(null);
    setFieldErrors({});
    return true;
  }, []);

  /**
   * 清除所有错误状态
   */
  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  /**
   * 获取指定字段的错误消息
   * @param field 字段名（支持嵌套路径如 "user.email"）
   * @returns 错误消息，如果没有错误则返回 undefined
   */
  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return fieldErrors[field];
    },
    [fieldErrors]
  );

  /**
   * 检查指定字段是否有错误
   */
  const hasFieldError = useCallback(
    (field: string): boolean => {
      return !!fieldErrors[field];
    },
    [fieldErrors]
  );

  /**
   * 手动设置错误消息
   */
  const setErrorMessage = useCallback((message: string | null) => {
    setError(message);
  }, []);

  /**
   * 手动设置字段错误
   */
  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  return {
    /** 通用错误消息 */
    error,
    /** 字段级错误映射 */
    fieldErrors,
    /** 处理 Action 结果 */
    handleResult,
    /** 清除所有错误 */
    clearErrors,
    /** 获取字段错误 */
    getFieldError,
    /** 检查字段是否有错误 */
    hasFieldError,
    /** 手动设置错误消息 */
    setError: setErrorMessage,
    /** 手动设置字段错误 */
    setFieldError,
  };
}

/**
 * 表单字段错误提示组件的 Props 类型
 */
export interface FieldErrorProps {
  /** 字段名 */
  field: string;
  /** 字段错误映射 */
  fieldErrors: FieldErrorMap;
  /** 自定义类名 */
  className?: string;
}

/**
 * 从 ActionResult 中提取错误信息
 * @param result Action 返回的结果
 * @returns 包含 error 和 fieldErrors 的对象
 */
export function extractErrors<T>(result: ActionResult<T>): {
  error: string | null;
  fieldErrors: FieldErrorMap;
} {
  if (result.success) {
    return { error: null, fieldErrors: {} };
  }
  return {
    error: result.error || null,
    fieldErrors: result.fieldErrors || {},
  };
}
