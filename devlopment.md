
# Depot 项目开发文档

---

## 1. 项目概述

本项目旨在构建一个名为 **在线商城系统** 的应用。该系统允许管理员维护菜品（产品）信息，允许用户浏览商品目录、将商品加入购物车并进行结算。

---

## 2. 技术栈架构 (Tech Stack)

基于当前主流的 React 生态系统，使用 `better-auth` 集成用户管理系统。

| 模块 | 技术选型 | 说明 |
|------|---------|------|
| **全栈框架** | **Next.js 15 (App Router)** | 提供路由、服务端渲染 (SSR/RSC) 和 API 路由 |
| **语言** | **TypeScript** | 提供强类型支持，增强代码健壮性 |
| **数据库** | **PostgreSQL** | 生产环境标准关系型数据库 |
| **ORM** | **Drizzle ORM** | 类型安全的 ORM，显式定义 Schema 和关系 |
| **UI 组件库** | **Shadcn UI** | 基于 Radix UI 和 Tailwind CSS 的可定制组件库 |
| **样式** | **Tailwind CSS** | 原子化 CSS，快速构建 UI |
| **身份认证** | **Better-Auth** | 现代化的全栈身份认证解决方案 |
| **验证** | **Zod** | 用于前端表单验证和后端 Schema 校验 |

---

## 3. 项目实现目标

* 实现用户登录
* 实现商品列表展示
* 实现商品添加购物车
* 实现购物车下单结算
* 实现用户查询订单历史记录

---

## 4. 数据库设计 (Schema Design)

在 Drizzle ORM 中，要显式定义表结构及物理外键约束。

### 4.1 核心数据表

#### A. Users & Auth (用户与认证系统 - Better-Auth)

基于 `better-auth` 的标准 Schema，使用 Text (UUID/CUID) 作为主键。

*   **`user`** (用户表)
    *   `id` (Text, PK): 用户唯一标识
    *   `name` (Text): 用户名
    *   `email` (Text): 邮箱 (Unique)
    *   `emailVerified` (Boolean): 邮箱是否验证
    *   `image` (Text): 头像 URL
    *   `role` (Enum): `'admin' | 'buyer'` (默认为 buyer)
    *   `createdAt`, `updatedAt`

*   **`session`** (会话表)
    *   `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`
    *   用于管理用户登录状态

*   **`account`** (OAuth 账户表)
    *   `id`, `userId`, `accountId`, `providerId`, `accessToken`, etc.
    *   支持第三方登录 (如 GitHub, Google)

*   **`verification`** (验证表)
    *   用于邮箱验证等流程

#### B. Products (商品表)

*   `id` (Serial, PK): 自增主键
*   `title` (Text): 商品名称 (Unique, Not Null)
*   `description` (Text): 商品描述
*   `imageUrl` (Text): 图片链接 (`image_url`)
*   `price` (Decimal): 价格 (精度 8, 小数位 2)
*   `createdAt`, `updatedAt`

#### C. Carts (购物车表)

*   `id` (Serial, PK): 自增主键
*   `userId` (Text): 关联用户 ID (`user_id`)
    *   **约束**: 必须关联用户 (Not Null)，且唯一 (One-to-One with User)
    *   **OnDelete**: Cascade (用户删除时，购物车随之删除)
*   `createdAt`, `updatedAt`

#### D. Orders (订单表)

*   `id` (Serial, PK): 自增主键
*   `userId` (Text): 关联用户 ID (`user_id`)
    *   **OnDelete**: Set Null (用户删除时，订单保留但解除关联)
*   `name`, `address`, `email`: 收货信息
*   `payType`: 支付方式枚举
*   `createdAt`

#### E. LineItems (订单/购物车条目表)

*   `id` (Serial, PK): 自增主键
*   `productId` (Integer): 关联商品
    *   **OnDelete**: Restrict (商品被引用时禁止删除)
*   `cartId` (Integer): 关联购物车 (Nullable)
    *   **OnDelete**: Cascade
*   `orderId` (Integer): 关联订单 (Nullable)
    *   **OnDelete**: Cascade
*   `quantity` (Integer): 数量 (Default 1)
*   `createdAt`, `updatedAt`

---

## 5. 业务关系定义 (Relations Definition)

Drizzle 需要在代码中显式定义逻辑关联和外键策略，这是保证数据完整性的核心。

### 5.1 实体关系图（ER Logic）

* `Product (1) <---> (N) LineItem`

  * 一个产品可以出现在多个购物明细中（被多人购买）
  * 关键约束（Restrict）：如果某个 Product 已经存在于 `LineItems` 表中，则禁止删除该 Product（防止历史数据丢失或购物车报错）

* `Cart (1) <---> (N) LineItem`

  * 一个购物车包含多个商品条目
  * 关键约束（Cascade）：当一个 Cart 被清空或销毁时，属于该 Cart 的所有 `LineItems` 必须被级联删除

* `LineItem (N) <---> (1) Product & (1) Cart`

  * 一个商品条目必须属于一个特定的 Product 和一个特定的 Cart

### 4.2 级联策略配置 (OnDelete Strategy)

* `lineItems.productId` 引用 `products.id`：`{ onDelete: 'restrict' }`
* `lineItems.cartId` 引用 `carts.id`：`{ onDelete: 'cascade' }`

### 4.3 购物车核心逻辑（对应任务 D & E）

**购物车会话管理**：

* 登录之后可执行添加购物车，已实现购物车与用户关联

**加入购物车（Add to Cart）**：

* 在产品卡片上添加 “Add to Cart” 按钮（表单）

**核心逻辑（智能合并）**：

1. 当用户添加产品时，先查询 `LineItems`。
2. 如果该 Cart 中已存在该 Product 的 `LineItem`，则更新 `quantity + 1`。
3. 如果不存在，则创建新的 `LineItem`，`quantity = 1`。

**购物车展示**：

* 侧边栏或独立页面显示当前 Cart 的所有 `LineItems`
* 通过关联查询获取完整的商品详情

**错误处理**：

* 处理非法 Cart ID 的访问（如手动篡改 Cookie）
* 实现全局错误边界（Error Boundary），展示友好的 404 或 500 页面

**交互增强（第四阶段，对应任务 F）**：

* 高亮变化：当购物车内容更新时，通过 CSS 动画（如黄色淡出效果）提示用户

---

## 6. 单元测试与质量保证 (Testing Strategy)

### 6.1 单元测试 (Unit Testing)

* 工具：Vitest 或 Jest
* 重点测试对象：

  * 业务逻辑函数（例如计算购物车总价 `total_price`、合并商品条目的逻辑）
  * 模型约束：测试当 `price` 为负数时，Zod Schema 是否抛出错误

### 6.2 集成测试 (Integration Testing)

* 重点测试对象：数据库交互与关系约束
* 测试场景：

  * **Cascade 测试**：创建一个包含商品的 Cart，删除 Cart，断言 `LineItems` 表中对应记录已被物理删除
  * **Restrict 测试**：创建一个已被放入购物车的 Product，尝试删除该 Product，断言数据库抛出 FK 违例且前端能捕获该错误
  * **购物车转订单测试**：

    1. 创建 Cart 和 `LineItems`
    2. 调用 `createOrder` Action
       断言：

    * `orders` 表新增一条记录
    * `lineItems` 表中原记录的 `cart_id` 变为 `null`（或移除关联）
    * `lineItems` 表中原记录的 `order_id` 变为新订单 ID
    * `carts` 表中的记录被删除（或标记失效）

---

## 7. 附：表结构设计（示例代码）

下面保留原文档中的 Drizzle/JS 代码片段以供参考：

```typescript
// ----------------------------------------------------------------------
// Auth Schema (Better-Auth) - db/auth-schema.ts
// ----------------------------------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  role: userRoleEnum("role").default("buyer").notNull(),
  // ... other fields
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  // ...
});

// ----------------------------------------------------------------------
// Depot Schema - db/depot-schema.ts
// ----------------------------------------------------------------------

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  // ...
});

// Carts
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  // ...
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  payType: payTypeEnum("pay_type").notNull(),
  // ...
});

// LineItems
export const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  cartId: integer("cart_id").references(() => carts.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1).notNull(),
});
```

---



