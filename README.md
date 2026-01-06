# 在线商城系统 (Depot Next.js)

基于 Next.js、Drizzle ORM、PostgreSQL 和 better-auth 构建的现代化在线商城系统。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **数据库**: PostgreSQL
- **ORM**: Drizzle ORM
- **认证**: better-auth
- **样式**: Tailwind CSS
- **表单验证**: Zod
- **图标**: Lucide React

## 开发文档
- 开发文档在 dev-doc 目录下，包含各增量开发文档

## 功能特性

### 用户功能
- ✅ 用户注册和登录
- ✅ 浏览商品列表
- ✅ 添加商品到购物车
- ✅ 查看和管理购物车
- ✅ 结算下单
- ✅ 查看订单历史记录

### 管理员功能
- ✅ 商品管理（增删改查）
- ✅ 商品信息维护
- ✅ 图片链接管理

### 技术亮点
- 🔒 基于 better-auth 的安全认证
- 🗄️ Drizzle ORM 提供类型安全的数据库操作
- 🔗 外键约束和级联策略保证数据完整性
- 🎨 Tailwind CSS 提供现代化的 UI 设计
- ⚡ Next.js Server Actions 实现无缝的服务器交互
- 📱 响应式设计，支持移动端

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 或 npm
- PostgreSQL 数据库

### 安装步骤

1. **克隆项目**
```bash
cd depot-nextjs
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库连接 URL
DATABASE_URL=postgresql://username:password@localhost:5432/depot

# better-auth 密钥（生产环境请使用强随机字符串）
BETTER_AUTH_SECRET=your-secret-key-here-change-in-production

# 应用 URL
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **创建数据库**

```bash
# 登录 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE depot;
```

5. **生成并运行数据库迁移**

```bash
# 生成迁移文件
pnpm db:generate

# 推送到数据库
pnpm db:push
```

6. **启动开发服务器**

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 数据库 Schema

### 核心表结构

#### Users (用户表)
- `id`: 主键
- `name`: 姓名
- `email`: 邮箱（唯一）
- `password_hash`: 加密密码
- `role`: 角色（admin/buyer）

#### Products (商品表)
- `id`: 主键
- `title`: 商品名称（唯一）
- `description`: 商品描述
- `image_url`: 图片链接
- `price`: 价格（Decimal 8,2）

#### Carts (购物车表)
- `id`: 主键
- `user_id`: 关联用户（外键，级联删除）

#### LineItems (商品条目表)
- `id`: 主键
- `product_id`: 关联商品（外键，限制删除）
- `cart_id`: 关联购物车（外键，级联删除）
- `order_id`: 关联订单（外键，级联删除）
- `quantity`: 数量

#### Orders (订单表)
- `id`: 主键
- `name`: 收货人
- `address`: 收货地址
- `email`: 联系邮箱
- `pay_type`: 支付方式（Check/Credit card/Purchase order）
- `user_id`: 关联用户（外键，设置为 NULL）

### 关键业务逻辑

1. **购物车智能合并**: 添加已存在的商品时自动增加数量
2. **订单快照**: 订单创建后将购物车条目转移到订单
3. **外键保护**: 已在购物车的商品无法删除
4. **级联删除**: 删除购物车时自动清理相关条目

## 项目结构

```
depot-nextjs/
├── app/                      # Next.js App Router
│   ├── actions/              # Server Actions
│   │   ├── cart.ts           # 购物车操作
│   │   ├── order.ts          # 订单操作
│   │   └── products.ts       # 商品管理
│   ├── admin/                # 管理员页面
│   │   └── products/         # 商品管理
│   ├── api/                  # API 路由
│   │   └── auth/             # 认证端点
│   ├── cart/                 # 购物车页面
│   ├── checkout/             # 结算页面
│   ├── login/                # 登录页面
│   ├── orders/               # 订单页面
│   ├── register/             # 注册页面
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 首页
├── components/               # React 组件
│   ├── admin/                # 管理员组件
│   ├── Header.tsx            # 导航头
│   ├── HeaderClient.tsx      # 客户端导航头
│   ├── ProductCard.tsx       # 商品卡片
│   ├── CartItems.tsx         # 购物车条目
│   └── CheckoutForm.tsx      # 结算表单
├── db/                       # 数据库配置
│   ├── schema.ts             # Drizzle Schema
│   └── index.ts              # 数据库连接
├── lib/                      # 工具库
│   ├── auth.ts               # 服务端认证
│   └── auth-client.ts        # 客户端认证
└── drizzle.config.ts         # Drizzle 配置
```

## 可用脚本

```bash
# 开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 生成数据库迁移
pnpm db:generate

# 推送 schema 到数据库
pnpm db:push

# 打开 Drizzle Studio
pnpm db:studio
```

## 初始化管理员账号

项目启动后，注册的第一个用户需要手动设置为管理员：

```sql
-- 登录数据库
psql -U postgres -d depot

-- 将用户设置为管理员
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## 开发建议

### 添加测试数据

可以使用 Drizzle Studio 或直接通过 SQL 添加测试商品：

```sql
INSERT INTO products (title, description, image_url, price, created_at, updated_at)
VALUES
  ('iPhone 15', '最新款苹果手机', 'https://example.com/iphone15.jpg', 5999.00, NOW(), NOW()),
  ('MacBook Pro', '专业级笔记本电脑', 'https://example.com/macbook.jpg', 12999.00, NOW(), NOW()),
  ('AirPods Pro', '主动降噪耳机', 'https://example.com/airpods.jpg', 1999.00, NOW(), NOW());
```

### 生产部署注意事项

1. **环境变量**: 确保 `BETTER_AUTH_SECRET` 使用强随机字符串
2. **数据库**: 使用生产级 PostgreSQL 实例
3. **图片存储**: 建议使用 CDN 或对象存储服务
4. **HTTPS**: 生产环境必须使用 HTTPS
5. **备份**: 定期备份数据库

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
