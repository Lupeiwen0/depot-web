/**
 * 国际化 Zod Schema 工厂函数
 * 使用翻译函数生成带本地化错误消息的 Schema
 */

import { z } from "zod";

type TranslateFunction = (key: string) => string;

/**
 * 创建商品验证 Schema
 * @param t 翻译函数
 */
export function createProductSchema(t: TranslateFunction) {
  return z.object({
    title: z.string().min(1, t("api.validation.product.titleRequired")),
    description: z.string().optional(),
    imageUrl: z
      .string()
      .url(t("api.validation.product.invalidImageUrl"))
      .optional()
      .or(z.literal("")),
    price: z.string().refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0.01;
    }, t("api.validation.product.priceMin")),
    tags: z.array(z.string()).optional(),
  });
}

/**
 * 创建订单验证 Schema
 * @param t 翻译函数
 */
export function createOrderSchema(t: TranslateFunction) {
  return z.object({
    name: z.string().min(1, t("api.validation.order.nameRequired")),
    address: z.string().min(1, t("api.validation.order.addressRequired")),
    email: z.string().email(t("api.validation.order.invalidEmail")),
    payType: z.enum(["Check", "Credit card", "Purchase order"]),
  });
}
