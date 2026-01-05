/**
 * 金额计算工具模块测试
 */
import Decimal from "decimal.js";
import {
  toDecimal,
  formatCurrency,
  toStripeAmount,
  fromStripeAmount,
  calculateItemTotal,
  calculateCartTotal,
  applyDiscount,
  toStorageString,
} from "@/lib/currency";

describe("Currency Utils", () => {
  describe("toDecimal", () => {
    it("should convert string to Decimal", () => {
      const result = toDecimal("288.88");
      expect(result.toString()).toBe("288.88");
    });

    it("should convert number to Decimal", () => {
      const result = toDecimal(288.88);
      expect(result.toNumber()).toBeCloseTo(288.88);
    });

    it("should handle Decimal input", () => {
      const input = new Decimal("100.50");
      const result = toDecimal(input);
      expect(result.toString()).toBe("100.5");
    });
  });

  describe("formatCurrency", () => {
    it("should format HKD currency", () => {
      expect(formatCurrency(288.88, "HKD")).toBe("HK$288.88");
    });

    it("should format CNY currency", () => {
      expect(formatCurrency(288.88, "CNY")).toBe("¥288.88");
    });

    it("should format USD currency", () => {
      expect(formatCurrency(288.88, "USD")).toBe("$288.88");
    });

    it("should handle string input", () => {
      expect(formatCurrency("99.99", "HKD")).toBe("HK$99.99");
    });

    it("should respect custom decimals", () => {
      expect(formatCurrency(100, "HKD", 0)).toBe("HK$100");
    });
  });

  describe("toStripeAmount", () => {
    it("should convert decimal to stripe cents", () => {
      expect(toStripeAmount(288.88)).toBe(28888);
    });

    it("should handle string input", () => {
      expect(toStripeAmount("99.99")).toBe(9999);
    });

    it("should round correctly", () => {
      expect(toStripeAmount(10.005)).toBe(1001);
    });

    it("should handle whole numbers", () => {
      expect(toStripeAmount(100)).toBe(10000);
    });
  });

  describe("fromStripeAmount", () => {
    it("should convert stripe cents to decimal", () => {
      const result = fromStripeAmount(28888);
      expect(result.toString()).toBe("288.88");
    });

    it("should handle whole cents", () => {
      const result = fromStripeAmount(10000);
      expect(result.toString()).toBe("100");
    });
  });

  describe("calculateItemTotal", () => {
    it("should calculate item total correctly", () => {
      const result = calculateItemTotal("288.88", 2);
      expect(result.toString()).toBe("577.76");
    });

    it("should handle single quantity", () => {
      const result = calculateItemTotal(100, 1);
      expect(result.toNumber()).toBe(100);
    });
  });

  describe("calculateCartTotal", () => {
    it("should calculate cart total correctly", () => {
      const items = [
        { price: "288.88", quantity: 2 },
        { price: "99.99", quantity: 1 },
      ];
      const result = calculateCartTotal(items);
      expect(result.toString()).toBe("677.75");
    });

    it("should return 0 for empty cart", () => {
      const result = calculateCartTotal([]);
      expect(result.toNumber()).toBe(0);
    });
  });

  describe("applyDiscount", () => {
    it("should apply 10% discount correctly", () => {
      const result = applyDiscount(100, 10);
      expect(result.toString()).toBe("90");
    });

    it("should apply discount to decimal amounts", () => {
      const result = applyDiscount("288.88", 10);
      expect(result.toString()).toBe("259.992");
    });

    it("should handle 0% discount", () => {
      const result = applyDiscount(100, 0);
      expect(result.toNumber()).toBe(100);
    });

    it("should handle 100% discount", () => {
      const result = applyDiscount(100, 100);
      expect(result.toNumber()).toBe(0);
    });
  });

  describe("toStorageString", () => {
    it("should convert to storage string with 2 decimals", () => {
      const value = new Decimal("288.8888");
      expect(toStorageString(value)).toBe("288.89");
    });

    it("should respect custom decimals", () => {
      const value = new Decimal("100.5555");
      expect(toStorageString(value, 3)).toBe("100.556");
    });
  });

  describe("precision handling", () => {
    it("should handle floating point precision issues", () => {
      // Classic floating point issue: 0.1 + 0.2 !== 0.3
      const result = toDecimal(0.1).plus(0.2);
      expect(result.toString()).toBe("0.3");
    });

    it("should handle precise multiplication", () => {
      const result = toDecimal("288").times("0.9");
      expect(result.toString()).toBe("259.2");
    });
  });
});
