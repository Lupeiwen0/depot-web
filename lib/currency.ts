import Decimal from "decimal.js";

// 配置精度（货币通常保留 2 位小数）
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * 转换为 Decimal 类型
 */
export function toDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * 格式化为货币字符串
 */
export function formatCurrency(
  value: string | number | Decimal,
  currency: string = "HKD",
  decimals: number = 2
): string {
  const amount = toDecimal(value).toFixed(decimals);
  const symbol = currency === "CNY" ? "¥" : currency === "HKD" ? "HK$" : "$";
  return `${symbol}${amount}`;
}

/**
 * 转换为 Stripe 金额（最小货币单位）
 * HKD/CNY: 288.88 → 28888
 */
export function toStripeAmount(amount: string | number | Decimal): number {
  return toDecimal(amount).times(100).round().toNumber();
}

/**
 * 从 Stripe 金额转换回标准金额
 * 28888 → 288.88
 */
export function fromStripeAmount(stripeAmount: number): Decimal {
  return toDecimal(stripeAmount).dividedBy(100);
}

/**
 * 计算商品小计（单价 × 数量）
 */
export function calculateItemTotal(
  price: string | number,
  quantity: number
): Decimal {
  return toDecimal(price).times(quantity);
}

/**
 * 计算购物车总价
 */
export function calculateCartTotal(
  items: Array<{ price: string; quantity: number }>
): Decimal {
  return items.reduce(
    (sum, item) => sum.plus(calculateItemTotal(item.price, item.quantity)),
    new Decimal(0)
  );
}

/**
 * 应用折扣（百分比）
 */
export function applyDiscount(
  amount: string | number | Decimal,
  percentOff: number
): Decimal {
  const multiplier = toDecimal(100).minus(percentOff).dividedBy(100);
  return toDecimal(amount).times(multiplier);
}

/**
 * 将 Decimal 转换为存储用的字符串
 */
export function toStorageString(value: Decimal, decimals: number = 2): string {
  return value.toFixed(decimals);
}
