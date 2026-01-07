# Depot Next.js - 在线商城系统

基于 Next.js 15、Drizzle ORM、PostgreSQL、better-auth 和 Stripe 构建的现代化全栈在线商城系统，支持会员订阅、优惠券、商品评价等完整电商功能。

## 技术栈

### 核心框架

| 技术           | 版本 | 说明                                    |
| -------------- | ---- | --------------------------------------- |
| **Next.js**    | 15.x | App Router 架构，支持 Server Components |
| **React**      | 19.x | 最新 React 版本                         |
| **TypeScript** | 5.x  | 类型安全的 JavaScript                   |

### 数据库与 ORM

| 技术            | 版本   | 说明           |
| --------------- | ------ | -------------- |
| **PostgreSQL**  | -      | 关系型数据库   |
| **Drizzle ORM** | 0.41.x | 类型安全的 ORM |
| **drizzle-kit** | 0.31.x | 数据库迁移工具 |

### 认证与支付

| 技术            | 版本  | 说明                                   |
| --------------- | ----- | -------------------------------------- |
| **better-auth** | 1.2.x | 现代化认证解决方案                     |
| **Stripe**      | 20.x  | 支付网关（API 版本 2025-12-15.clover） |

### 状态管理与 UI

| 技术             | 版本    | 说明                   |
| ---------------- | ------- | ---------------------- |
| **Zustand**      | 5.x     | 轻量级状态管理         |
| **Tailwind CSS** | 3.4.x   | 原子化 CSS 框架        |
| **shadcn/ui**    | -       | 基于 Radix UI 的组件库 |
| **Lucide React** | 0.469.x | 图标库                 |

### 国际化与其他

| 技术          | 版本  | 说明                |
| ------------- | ----- | ------------------- |
| **next-intl** | 4.7.x | 国际化解决方案      |
| **Zod**       | 4.x   | Schema 验证         |
| **Resend**    | 6.x   | 邮件发送服务        |
| **ali-oss**   | 6.x   | 阿里云 OSS 图片上传 |

---

## 功能模块

### 用户端功能

- ✅ 用户注册/登录（邮箱密码认证）
- ✅ 密码重置（邮件验证）
- ✅ 商品浏览（搜索、排序、标签筛选、分页）
- ✅ 购物车管理（添加、修改数量、删除）
- ✅ 在线结算（Stripe 安全支付）
- ✅ 订单管理（查看、支付、取消、软删除）
- ✅ 商品评价（星级评分、文字评价、图片评价）
- ✅ 会员订阅（月度订阅，自动续费）
- ✅ 优惠券系统（会员专属，订单抵扣）
- ✅ 深色/浅色主题切换
- ✅ 中英文国际化

### 管理员功能

- ✅ 商品管理（CRUD、图片上传、标签管理）
- ✅ 标签管理（创建、编辑、删除）
- ✅ 用户管理（查看、禁用、角色切换）
- ✅ 商品搜索与筛选（价格、标签、分页）

### 技术亮点

- 🔒 基于 better-auth 的安全认证系统
- 💳 Stripe 支付集成（一次性支付 + 订阅）
- 🗄️ Drizzle ORM 类型安全数据库操作
- 🔗 完整的外键约束和级联策略
- 🎨 shadcn/ui + Tailwind CSS 现代化 UI
- ⚡ Next.js Server Components 优化性能
- 📱 响应式设计，支持移动端
- 🌍 完整的中英文国际化支持
- 🛡️ Middleware 路由保护
- 📊 Zustand 状态管理
- ⚠️ 同构错误信息管理（服务端/客户端共享错误码和国际化）

---

## 项目结构

```
depot-nextjs/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions
│   │   ├── cart.ts               # 购物车操作
│   │   ├── order.ts              # 订单操作
│   │   └── products.ts           # 商品操作
│   ├── admin/                    # 管理员页面
│   │   ├── products/             # 商品管理
│   │   ├── tags/                 # 标签管理
│   │   └── users/                # 用户管理
│   ├── api/                      # API 路由
│   │   ├── admin/                # 管理员 API
│   │   ├── auth/                 # 认证 API (better-auth)
│   │   ├── cart/                 # 购物车 API
│   │   ├── checkout/             # 结算 API
│   │   ├── payment/              # 支付状态 API
│   │   ├── products/             # 商品 API
│   │   ├── tags/                 # 标签 API
│   │   ├── upload/               # 图片上传 API
│   │   ├── user/                 # 用户信息 API
│   │   └── webhook/              # Stripe Webhook
│   ├── cart/                     # 购物车页面
│   ├── checkout/                 # 结算页面
│   ├── login/                    # 登录页面
│   ├── orders/                   # 订单页面
│   ├── payment/                  # 支付结果页面
│   ├── products/                 # 商品详情页面
│   ├── register/                 # 注册页面
│   ├── reset-password/           # 密码重置页面
│   └── user/                     # 用户相关页面
├── components/                   # React 组件
│   ├── admin/                    # 管理员组件
│   ├── ui/                       # shadcn/ui 组件
│   ├── CartDrawer.tsx            # 购物车抽屉
│   ├── CheckoutForm.tsx          # 结算表单
│   ├── HeaderClient.tsx          # 导航头
│   ├── ProductCard.tsx           # 商品卡片
│   ├── ProductList.tsx           # 商品列表
│   └── ...
├── db/                           # 数据库配置
│   ├── index.ts                  # 数据库连接
│   ├── schema.ts                 # Schema 导出
│   ├── auth-schema.ts            # 认证相关表
│   └── depot-schema.ts           # 业务相关表
├── drizzle/                      # 数据库迁移文件
├── i18n/                         # 国际化配置
├── lib/                          # 工具库
│   ├── auth.ts                   # better-auth 配置
│   ├── auth-client.ts            # 客户端认证
│   ├── stripe.ts                 # Stripe 配置
│   ├── currency.ts               # 货币处理
│   ├── coupon-service.ts         # 优惠券服务
│   ├── email.ts                  # 邮件服务
│   ├── api-utils.ts              # API 工具函数
│   ├── server-i18n.ts            # 服务端国际化
│   └── errors/                   # 统一错误信息管理
│       ├── codes.ts              # 错误码枚举
│       ├── server.ts             # 服务端错误工具
│       ├── client.ts             # 客户端错误 Hook
│       ├── schemas.ts            # Zod Schema 工厂
│       └── README.md             # 使用文档
├── messages/                     # 国际化消息
│   ├── zh.json                   # 中文
│   └── en.json                   # 英文
├── stores/                       # Zustand 状态管理
│   ├── user-store.ts             # 用户状态
│   └── cart-store.ts             # 购物车状态
├── middleware.ts                 # 路由中间件
└── ...
```

---

## 数据库架构

### 核心业务表

```mermaid
erDiagram
    users ||--o{ orders : "下单"
    users ||--o| carts : "拥有"
    users ||--o{ user_memberships : "订阅"
    users ||--o{ user_coupons : "持有"
    users ||--o{ payments : "支付"
    users ||--o{ product_reviews : "评价"

    carts ||--o{ line_items : "包含"
    orders ||--o{ line_items : "包含"
    orders ||--o{ payments : "关联"

    products ||--o{ line_items : "被购买"
    products ||--o{ product_reviews : "收到评价"

    user_memberships ||--o{ user_coupons : "发放"
```

### 表结构详情

#### 用户相关

| 表名           | 说明                             |
| -------------- | -------------------------------- |
| `user`         | 用户基本信息（better-auth 管理） |
| `session`      | 用户会话                         |
| `account`      | 账户关联                         |
| `verification` | 验证令牌                         |

#### 商品相关

| 表名              | 说明                            |
| ----------------- | ------------------------------- |
| `products`        | 商品信息（支持一次性/订阅类型） |
| `product_tags`    | 商品标签                        |
| `product_reviews` | 商品评价                        |

#### 购物车与订单

| 表名         | 说明                        |
| ------------ | --------------------------- |
| `carts`      | 购物车（每用户一个）        |
| `line_items` | 商品条目（购物车/订单共用） |
| `orders`     | 订单信息                    |

#### 支付相关

| 表名                    | 说明                 |
| ----------------------- | -------------------- |
| `payments`              | 支付记录             |
| `user_stripe_customers` | 用户-Stripe 客户映射 |
| `stripe_webhook_logs`   | Webhook 事件日志     |

#### 会员相关

| 表名               | 说明         |
| ------------------ | ------------ |
| `user_memberships` | 用户会员订阅 |
| `user_coupons`     | 用户优惠券   |

---

## 支付流程

### 一次性支付流程（商品购买）

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   用户结算   │────▶│  创建订单   │────▶│ 创建 Stripe │
│  (Checkout)  │     │  (Order)    │     │   Session   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
            ┌─────────────┐     ┌─────────────┐
            │ 跳转 Stripe │────▶│ 支付成功    │
            │  支付页面   │     │  Webhook    │
            └─────────────┘     └──────┬──────┘
                                       │
              ┌────────────────────────┴────────────────────────┐
              ▼                                                  ▼
      ┌─────────────┐                                   ┌─────────────┐
      │ 更新支付状态 │                                   │ 更新商品销量 │
      │  succeeded  │                                   │   +优惠券   │
      └─────────────┘                                   └─────────────┘
```

**关键代码文件：**

- `app/api/checkout/route.ts` - 创建订单
- `app/api/checkout/create-session/route.ts` - 创建 Stripe Session
- `app/api/webhook/stripe/route.ts` - 处理 Webhook 事件

### 订阅支付流程（会员开通）

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  开通会员   │────▶│ 创建 Stripe │────▶│ 跳转 Stripe │
│   按钮      │     │  Session    │     │  支付页面   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
            ┌─────────────┐     ┌─────────────┐
            │ 支付成功    │────▶│ 创建会员   │
            │  Webhook    │     │   记录      │
            └─────────────┘     └──────┬──────┘
                                       │
                                       ▼
                               ┌─────────────┐
                               │ 发放优惠券  │
                               │  (20张/月)  │
                               └─────────────┘
```

### Webhook 事件处理

| 事件类型                        | 处理逻辑                    |
| ------------------------------- | --------------------------- |
| `checkout.session.completed`    | 更新支付状态，关联订单/会员 |
| `payment_intent.succeeded`      | 确认支付成功，发放权益      |
| `customer.subscription.created` | 记录订阅创建                |
| `customer.subscription.updated` | 更新订阅状态                |
| `customer.subscription.deleted` | 订阅取消，作废优惠券        |
| `invoice.payment_succeeded`     | 续费成功，发放新优惠券      |
| `charge.refunded`               | 退款处理                    |

---

## 会员系统

### 会员权益

- 每月自动获得 **20 张 10% 折扣优惠券**
- 优惠券有效期 30 天
- 结算时可选择使用优惠券抵扣

### 订阅管理

- 支持 Stripe Customer Portal 管理订阅
- 自动续费处理
- 取消订阅后优惠券自动作废

### 相关文件

- `lib/coupon-service.ts` - 优惠券创建、验证、应用
- `stores/user-store.ts` - 用户会员状态管理
- `components/SubscriptionManageButton.tsx` - 订阅管理按钮

---

## 国际化

### 支持语言

- 🇨🇳 中文 (zh)
- 🇺🇸 English (en)

### 实现方式

- 使用 `next-intl` 实现
- 语言选择存储在 Cookie 中
- 服务端和客户端均支持

### 文件结构

```
messages/
├── zh.json    # 中文翻译
└── en.json    # 英文翻译

i18n/
└── request.ts # 国际化配置
```

---

## 统一错误信息管理

本项目实现了同构的错误信息管理机制，服务端和客户端共享同一套错误码和国际化翻译。

### 核心功能

- **错误码枚举** - 集中定义所有业务错误码，与 i18n key 对应
- **服务端工具** - `createError()`、`createSuccess()` 简化 Server Actions
- **客户端 Hook** - `useActionError()` 封装错误状态管理
- **表单验证** - Zod Schema 工厂支持国际化错误消息
- **字段级错误** - 支持在表单字段旁显示验证错误

### 使用示例

**服务端（Server Actions）：**

```typescript
import { ErrorCodes, formatZodError } from "@/lib/errors";
import { getServerTranslations } from "@/lib/server-i18n";

export async function myAction(formData: FormData) {
  const { t } = await getServerTranslations();

  if (!session?.user) {
    return { success: false, error: t(ErrorCodes.AUTH_NOT_LOGGED_IN) };
  }
  // ...
}
```

**客户端（React 组件）：**

```tsx
import { useActionError } from "@/lib/errors/client";

function MyForm() {
  const { error, handleResult, getFieldError } = useActionError();

  const onSubmit = async (data) => {
    const result = await myAction(data);
    if (!handleResult(result)) return;
    // 成功处理...
  };

  return (
    <form>
      {error && <div className="text-red-500">{error}</div>}
      <input name="email" />
      {getFieldError("email") && <span>{getFieldError("email")}</span>}
    </form>
  );
}
```

### 详细文档

完整使用指南请参阅：[lib/errors/README.md](lib/errors/README.md)

---

## 快速开始

### 环境要求

- Node.js 18+
- pnpm（推荐）
- PostgreSQL 数据库
- Stripe 账号

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd depot-nextjs
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库连接
DATABASE_URL=postgresql://username:password@localhost:5432/depot

# better-auth 配置
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cookie 前缀（区分环境）
COOKIE_PREFIX=dp-dev

# Stripe 配置
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# 会员订阅价格 ID
NEXT_PUBLIC_MEMBERSHIP_PRICE_ID=price_xxx

# 阿里云 OSS（图片上传）
ALI_OSS_REGION=oss-cn-hongkong
ALI_OSS_ACCESS_KEY_ID=xxx
ALI_OSS_ACCESS_KEY_SECRET=xxx
ALI_OSS_BUCKET=xxx

# Resend 邮件服务
RESEND_API_KEY=re_xxx
```

4. **初始化数据库**

```bash
# 生成迁移文件
pnpm db:generate

# 推送到数据库
pnpm db:push
```

5. **启动开发服务器**

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 可用脚本

```bash
# 开发
pnpm dev              # 启动开发服务器

# 构建
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 代码检查
pnpm lint             # TypeScript 类型检查

# 数据库
pnpm db:generate      # 生成迁移文件
pnpm db:push          # 推送 schema 到数据库
pnpm db:migrate       # 执行迁移
pnpm db:studio        # 打开 Drizzle Studio

# 测试
pnpm test             # 运行测试
pnpm test:watch       # 监听模式测试
pnpm test:coverage    # 测试覆盖率
```

---

## Stripe 配置

### 1. 创建会员订阅产品

在 Stripe Dashboard 创建：

- **Product**: 会员订阅
- **Price**: 月度订阅价格（如 HKD 99/月）

### 2. 配置 Webhook

添加 Webhook 端点：

- **URL**: `https://your-domain.com/api/webhook/stripe`
- **Events**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `customer.subscription.*`
  - `invoice.payment_succeeded`
  - `charge.refunded`

### 3. 本地开发 Webhook 测试

使用 Stripe CLI：

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

---

## 管理员账号

注册后需要手动设置管理员：

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'admin@example.com';
```

或使用 Drizzle Studio：

```bash
pnpm db:studio
```

---

## 生产部署

### 部署检查清单

- [ ] 配置生产环境变量
- [ ] 使用强随机字符串作为 `BETTER_AUTH_SECRET`
- [ ] 配置生产数据库
- [ ] 配置 Stripe 生产密钥
- [ ] 配置 Stripe Webhook 生产端点
- [ ] 配置 CDN/OSS 图片存储
- [ ] 启用 HTTPS
- [ ] 配置数据库备份

### 推荐平台

- Vercel
- Railway
- Fly.io

---

## 开发文档

详细的增量开发文档在 `dev-doc` 目录下。

---

## 许可证

MIT

---

## 贡献

欢迎提交 Issue 和 Pull Request！
