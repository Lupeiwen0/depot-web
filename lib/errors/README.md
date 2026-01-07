# 统一错误信息管理系统

本模块提供同构的错误信息管理机制，使服务端（Server Actions、API Routes）和客户端（React 组件）可以共享同一套错误码和国际化翻译。

## 目录结构

```
lib/errors/
├── index.ts        # 入口文件，导出所有模块
├── types.ts        # 类型定义
├── codes.ts        # 错误码枚举
├── server.ts       # 服务端工具函数
├── client.ts       # 客户端 Hook（需单独导入）
├── schemas.ts      # Zod Schema 工厂函数
└── zod-utils.ts    # Zod 错误处理工具
```

## 快速开始

### 服务端使用（Server Actions / API Routes）

```typescript
import {
  ErrorCodes,
  createError,
  createSuccess,
  formatZodError,
} from "@/lib/errors";
import { getServerTranslations } from "@/lib/server-i18n";
import { z } from "zod";

export async function myServerAction(formData: FormData) {
  const { t } = await getServerTranslations();

  // 1. 使用错误码枚举
  if (!session?.user) {
    return { success: false, error: t(ErrorCodes.AUTH_NOT_LOGGED_IN) };
  }

  // 2. 处理 Zod 验证错误
  try {
    const data = mySchema.parse(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, ...formatZodError(error) };
    }
  }

  // 3. 返回成功结果
  return createSuccess({ id: 123 });
}
```

### 客户端使用（React 组件）

```tsx
"use client";

import { useActionError } from "@/lib/errors/client";
import { ErrorCodes } from "@/lib/errors";

function MyForm() {
  const {
    error,
    fieldErrors,
    handleResult,
    clearErrors,
    getFieldError,
    hasFieldError,
  } = useActionError();

  const handleSubmit = async (formData: FormData) => {
    clearErrors();
    const result = await myServerAction(formData);

    if (!handleResult(result)) {
      // 错误已自动设置到状态中
      return;
    }

    // 成功处理...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 通用错误提示 */}
      {error && <div className="text-red-500">{error}</div>}

      {/* 字段级错误提示 */}
      <input name="email" />
      {hasFieldError("email") && (
        <span className="text-red-500 text-sm">{getFieldError("email")}</span>
      )}
    </form>
  );
}
```

## API 参考

### 错误码枚举 (`ErrorCodes`)

所有错误码都与 `messages/*.json` 中的 i18n key 对应：

```typescript
import { ErrorCodes } from "@/lib/errors";

// 认证相关
ErrorCodes.AUTH_NOT_LOGGED_IN; // "api.auth.notLoggedIn"
ErrorCodes.AUTH_UNAUTHORIZED; // "api.auth.unauthorized"
ErrorCodes.AUTH_FORBIDDEN; // "api.auth.forbidden"

// 验证相关
ErrorCodes.VALIDATION_INVALID_REQUEST; // "api.validation.invalidRequest"

// 业务模块
ErrorCodes.PRODUCT_NOT_FOUND; // "api.product.notFound"
ErrorCodes.CART_ADD_FAILED; // "api.cart.addFailed"
ErrorCodes.ORDER_CREATE_FAILED; // "api.order.createFailed"

// 通用
ErrorCodes.COMMON_NETWORK_ERROR; // "api.common.networkError"
```

### 服务端工具函数

#### `createError<T>(code, fieldErrors?)`

创建带国际化的错误响应：

```typescript
import { createError, ErrorCodes } from "@/lib/errors";

// 基本用法
return await createError(ErrorCodes.AUTH_NOT_LOGGED_IN);

// 带字段级错误
return await createError(ErrorCodes.VALIDATION_INVALID_REQUEST, {
  email: "邮箱格式不正确",
  password: "密码太短",
});
```

#### `createSuccess<T>(data?)`

创建成功响应：

```typescript
import { createSuccess } from "@/lib/errors";

// 无数据
return createSuccess();

// 有数据
return createSuccess({ orderId: order.id });
```

#### `formatZodError(error)`

将 Zod 验证错误转换为标准格式：

```typescript
import { formatZodError } from "@/lib/errors";
import { z } from "zod";

try {
  schema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    return { success: false, ...formatZodError(error) };
    // 返回: { success: false, error: '第一个错误消息', fieldErrors: { field: 'message' } }
  }
}
```

### 客户端 Hook

#### `useActionError()`

封装错误状态管理：

| 返回值                          | 类型                        | 说明                            |
| ------------------------------- | --------------------------- | ------------------------------- |
| `error`                         | `string \| null`            | 通用错误消息                    |
| `fieldErrors`                   | `Record<string, string>`    | 字段级错误映射                  |
| `handleResult(result)`          | `(ActionResult) => boolean` | 处理 Action 结果，成功返回 true |
| `clearErrors()`                 | `() => void`                | 清除所有错误                    |
| `getFieldError(field)`          | `(string) => string?`       | 获取指定字段的错误              |
| `hasFieldError(field)`          | `(string) => boolean`       | 检查字段是否有错误              |
| `setError(message)`             | `(string \| null) => void`  | 手动设置错误                    |
| `setFieldError(field, message)` | `(string, string) => void`  | 手动设置字段错误                |

#### `useErrorTranslation()`

获取错误翻译函数：

```typescript
import { useErrorTranslation } from "@/lib/errors/client";
import { ErrorCodes } from "@/lib/errors";

function MyComponent() {
  const { translateError } = useErrorTranslation();

  const message = translateError(ErrorCodes.AUTH_NOT_LOGGED_IN);
  // 根据当前语言返回 "未登录" 或 "Not logged in"
}
```

## 添加新错误码

1. 在 `lib/errors/codes.ts` 添加枚举值：

```typescript
export const ErrorCodes = {
  // ... 现有错误码
  MY_NEW_ERROR: "api.myModule.newError",
} as const;
```

2. 在 `messages/zh.json` 和 `messages/en.json` 添加翻译：

```json
{
  "api": {
    "myModule": {
      "newError": "新错误消息"
    }
  }
}
```

3. 在代码中使用：

```typescript
import { ErrorCodes } from "@/lib/errors";

return { success: false, error: t(ErrorCodes.MY_NEW_ERROR) };
```

## Schema 工厂函数

使用带国际化的 Zod Schema：

```typescript
import { createProductSchema, createOrderSchema } from "@/lib/errors";
import { getServerTranslations } from "@/lib/server-i18n";

export async function createProduct(formData: FormData) {
  const { t } = await getServerTranslations();

  const schema = createProductSchema(t);
  const data = schema.parse({
    title: formData.get("title"),
    price: formData.get("price"),
  });
  // 验证失败时自动返回翻译后的错误消息
}
```

## 最佳实践

1. **始终使用 `ErrorCodes` 枚举**而非硬编码字符串
2. **服务端使用 `getServerTranslations()`** 获取翻译函数
3. **客户端使用 `useActionError` Hook** 管理错误状态
4. **字段级错误要显示在对应字段旁边**，提升用户体验
5. **新增错误码时同步更新中英文消息文件**
