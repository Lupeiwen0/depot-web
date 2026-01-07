/**
 * 错误处理模块
 * 导出所有类型、工具函数和 Schema 工厂
 *
 * 服务端使用:
 * ```ts
 * import { ErrorCodes, createError, createSuccess, formatZodError } from '@/lib/errors';
 * ```
 *
 * 客户端使用:
 * ```ts
 * import { useActionError, useErrorTranslation } from '@/lib/errors/client';
 * import { ErrorCodes } from '@/lib/errors';
 * ```
 */

export * from "./types";
export * from "./zod-utils";
export * from "./schemas";
export * from "./codes";
export * from "./server";

// 客户端模块需要单独导入，因为包含 "use client" 指令:
// import { useActionError, useErrorTranslation } from '@/lib/errors/client';
