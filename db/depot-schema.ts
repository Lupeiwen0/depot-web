import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  decimal,
  timestamp,
  pgEnum,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

// ----------------------------------------------------------------------
// 支付方式枚举
// ----------------------------------------------------------------------
export const payTypeEnum = pgEnum("pay_type", [
  "Check",
  "Credit card",
  "Purchase order",
]);

// ----------------------------------------------------------------------
// 商品类型枚举
// ----------------------------------------------------------------------
export const productTypeEnum = pgEnum("product_type", [
  "one_time", // 一次性支付（普通商品）
  "subscription", // 订阅支付（会员卡）
]);

// ----------------------------------------------------------------------
// 支付状态枚举
// ----------------------------------------------------------------------
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refunded",
  "canceled",
]);

// ----------------------------------------------------------------------
// 支付类型枚举
// ----------------------------------------------------------------------
export const paymentTypeEnum = pgEnum("payment_type", [
  "one_time",
  "subscription",
]);

// ----------------------------------------------------------------------
// 会员状态枚举
// ----------------------------------------------------------------------
export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "canceled",
  "expired",
  "pending",
]);

// ----------------------------------------------------------------------
// 优惠券状态枚举
// ----------------------------------------------------------------------
export const couponStatusEnum = pgEnum("coupon_status", [
  "available",
  "used",
  "expired",
  "revoked",
]);

// ----------------------------------------------------------------------
// 评价状态枚举
// ----------------------------------------------------------------------
export const reviewStatusEnum = pgEnum("review_status", [
  "published", // 已发布
  "hidden", // 已隐藏（管理员操作）
  "deleted", // 用户删除
]);

// ----------------------------------------------------------------------
// Products 表 (商品)
// ----------------------------------------------------------------------
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  // 价格精度：总共10位，小数位2位 (例如: 12345678.88)
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),

  // Stripe 支付相关字段
  productType: productTypeEnum("product_type").default("one_time").notNull(),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  stripePaymentLinkUrl: text("stripe_payment_link_url"),
  isActive: boolean("is_active").default(true).notNull(),

  // 标签、销量、评分相关
  tags: text("tags").array(), // 商品标签数组
  salesCount: integer("sales_count").default(0).notNull(), // 销量
  averageRating: decimal("average_rating", { precision: 3, scale: 2 })
    .default("0")
    .notNull(), // 平均评分
  reviewCount: integer("review_count").default(0).notNull(), // 评价数量

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// Carts 表 (购物车容器)
// ----------------------------------------------------------------------
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  // 关联到用户（用户登录后必须关联）
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// Orders 表 (订单)
// ----------------------------------------------------------------------
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 收货人姓名
  address: text("address").notNull(), // 收货地址
  email: text("email").notNull(), // 联系邮箱
  payType: payTypeEnum("pay_type").notNull(), // 支付方式
  // 关联下单用户
  userId: text("user_id").references(() => user.id, {
    onDelete: "set null",
  }),

  // 软删除相关字段
  deletedByUser: boolean("deleted_by_user").default(false).notNull(), // 用户软删除标记
  deletedAt: timestamp("deleted_at"), // 删除时间

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// LineItems 表 (商品条目/连接表)
// ----------------------------------------------------------------------
export const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),

  // 外键：关联到 Product
  // 策略：Restrict (限制)。如果商品存在于任何购物车中，数据库将阻止删除该商品。
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),

  // 状态 A: 在购物车中 (关联 Cart)
  // 当购物车删除时，级联删除条目（仅限未转成订单的条目）
  cartId: integer("cart_id").references(() => carts.id, {
    onDelete: "cascade",
  }),

  // 状态 B: 已生成订单 (关联 Order)
  // 当订单被删除时，级联删除条目
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "cascade",
  }),

  // 购买数量，默认为 1
  quantity: integer("quantity").default(1).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// UserStripeCustomers 表 (用户-Stripe 客户映射)
// ----------------------------------------------------------------------
export const userStripeCustomers = pgTable("user_stripe_customers", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// Payments 表 (支付记录)
// ----------------------------------------------------------------------
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

  // Stripe 相关 ID
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeInvoiceId: text("stripe_invoice_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),

  // 支付信息
  paymentType: paymentTypeEnum("payment_type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("hkd").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),

  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  metadata: text("metadata"), // JSON 格式

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// UserMemberships 表 (用户会员订阅)
// ----------------------------------------------------------------------
export const userMemberships = pgTable(
  "user_memberships",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Stripe 订阅信息
    stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripePriceId: text("stripe_price_id").notNull(),

    // 订阅状态
    status: membershipStatusEnum("status").default("pending").notNull(),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAt: timestamp("cancel_at"),
    canceledAt: timestamp("canceled_at"),
    endedAt: timestamp("ended_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("user_memberships_user_id_idx").on(table.userId)]
);

// ----------------------------------------------------------------------
// StripeWebhookLogs 表 (Webhook 事件日志)
// ----------------------------------------------------------------------
export const stripeWebhookLogs = pgTable("stripe_webhook_logs", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(), // 完整 JSON payload

  // 处理状态
  processed: boolean("processed").default(false).notNull(),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// UserCoupons 表 (用户优惠券)
// ----------------------------------------------------------------------
export const userCoupons = pgTable(
  "user_coupons",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // 优惠券信息（本地管理，不依赖 Stripe）
    couponCode: text("coupon_code").notNull().unique(), // 本地生成的唯一优惠券码

    // 优惠信息
    percentOff: integer("percent_off").default(10).notNull(), // 10% = 9折

    // 状态管理
    status: couponStatusEnum("status").default("available").notNull(),
    usedAt: timestamp("used_at"),
    expiresAt: timestamp("expires_at").notNull(), // 创建后30天

    // 关联信息 - 来源
    membershipId: integer("membership_id").references(
      () => userMemberships.id,
      {
        onDelete: "set null",
      }
    ),
    membershipPeriodStart: timestamp("membership_period_start"), // 会员周期开始时间（用于幂等性检查）

    // 关联信息 - 使用
    usedOrderId: integer("used_order_id").references(() => orders.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_coupons_user_status_expires_idx").on(
      table.userId,
      table.status,
      table.expiresAt
    ),
    index("user_coupons_used_order_idx").on(table.usedOrderId),
  ]
);

// ----------------------------------------------------------------------
// ProductTags 表 (商品标签)
// ----------------------------------------------------------------------
export const productTags = pgTable("product_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // 标签名称，唯一
  slug: text("slug").notNull().unique(), // URL 友好的标识符
  description: text("description"), // 标签描述
  color: text("color").default("#3b82f6"), // 标签颜色（用于前端展示）

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ----------------------------------------------------------------------
// ProductReviews 表 (商品评价)
// ----------------------------------------------------------------------
export const productReviews = pgTable(
  "product_reviews",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    orderId: integer("order_id").references(() => orders.id, {
      onDelete: "set null",
    }), // 关联订单，证明已购买

    // 评价内容
    rating: integer("rating").notNull(), // 1-5 星
    title: text("title"), // 评价标题（可选）
    content: text("content"), // 评价内容（可选）
    images: text("images").array(), // 评价图片 URL 数组

    // 状态管理
    status: reviewStatusEnum("status").default("published").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // 保证同一订单中的商品只能评价一次
    uniqueIndex("product_reviews_order_product_idx").on(
      table.orderId,
      table.productId
    ),
    index("product_reviews_product_status_idx").on(
      table.productId,
      table.status
    ),
    index("product_reviews_user_id_idx").on(table.userId),
  ]
);

// ----------------------------------------------------------------------
// Relations 定义 (逻辑关联)
// ----------------------------------------------------------------------

// user 关系
export const usersRelations = relations(user, ({ many, one }) => ({
  orders: many(orders), // 一个用户有多个订单
  cart: one(carts, {
    fields: [user.id],
    references: [carts.userId],
  }),
  stripeCustomer: one(userStripeCustomers, {
    fields: [user.id],
    references: [userStripeCustomers.userId],
  }),
  payments: many(payments),
  memberships: many(userMemberships),
  coupons: many(userCoupons),
  reviews: many(productReviews),
}));

// Product 关系定义
export const productsRelations = relations(products, ({ many }) => ({
  lineItems: many(lineItems), // 一个产品可以出现在多个条目中
  reviews: many(productReviews), // 一个产品有多个评价
}));

// Cart 关系定义
export const cartsRelations = relations(carts, ({ many, one }) => ({
  lineItems: many(lineItems), // 一个购物车包含多个条目
  user: one(user, {
    fields: [carts.userId],
    references: [user.id],
  }),
}));

// LineItem 关系定义
export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  // 条目属于一个产品
  product: one(products, {
    fields: [lineItems.productId],
    references: [products.id],
  }),
  // 条目属于一个购物车
  cart: one(carts, {
    fields: [lineItems.cartId],
    references: [carts.id],
  }),
  // 条目属于一个订单
  order: one(orders, {
    fields: [lineItems.orderId],
    references: [orders.id],
  }),
}));

// Orders 关系
export const ordersRelations = relations(orders, ({ one, many }) => ({
  lineItems: many(lineItems), // 一个订单包含多个条目
  user: one(user, {
    // 订单属于一个用户
    fields: [orders.userId],
    references: [user.id],
  }),
  payments: many(payments),
  reviews: many(productReviews),
}));

// UserStripeCustomers 关系
export const userStripeCustomersRelations = relations(
  userStripeCustomers,
  ({ one }) => ({
    user: one(user, {
      fields: [userStripeCustomers.userId],
      references: [user.id],
    }),
  })
);

// Payments 关系
export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(user, {
    fields: [payments.userId],
    references: [user.id],
  }),
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

// UserMemberships 关系
export const userMembershipsRelations = relations(
  userMemberships,
  ({ one, many }) => ({
    user: one(user, {
      fields: [userMemberships.userId],
      references: [user.id],
    }),
    coupons: many(userCoupons),
  })
);

// UserCoupons 关系
export const userCouponsRelations = relations(userCoupons, ({ one }) => ({
  user: one(user, {
    fields: [userCoupons.userId],
    references: [user.id],
  }),
  membership: one(userMemberships, {
    fields: [userCoupons.membershipId],
    references: [userMemberships.id],
  }),
  usedOrder: one(orders, {
    fields: [userCoupons.usedOrderId],
    references: [orders.id],
  }),
}));

// ProductReviews 关系
export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  user: one(user, {
    fields: [productReviews.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [productReviews.orderId],
    references: [orders.id],
  }),
}));
