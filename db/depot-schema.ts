import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  decimal,
  timestamp,
  pgEnum,
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
// Products 表 (商品)
// ----------------------------------------------------------------------
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  // 价格精度：总共8位，小数位2位 (例如: 123456.78)
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
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
// Relations 定义 (逻辑关联)
// ----------------------------------------------------------------------

// user 关系
export const usersRelations = relations(user, ({ many, one }) => ({
  orders: many(orders), // 一个用户有多个订单
  cart: one(carts, {
    fields: [user.id],
    references: [carts.userId],
  }),
}));

// Product 关系定义
export const productsRelations = relations(products, ({ many }) => ({
  lineItems: many(lineItems), // 一个产品可以出现在多个条目中
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
}));
