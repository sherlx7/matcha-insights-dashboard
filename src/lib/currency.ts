// Currency utilities for Matsu Matcha (Singapore-based business)
// All prices are in SGD (Singapore Dollars)

export const CURRENCY = {
  code: 'SGD',
  symbol: 'S$',
  locale: 'en-SG',
};

// Current JPY to SGD exchange rate (updated January 2026)
export const JPY_TO_SGD_RATE = 0.0082;

// Shipping cost per kg in SGD
export const SHIPPING_PER_KG_SGD = 15;

// Import tax rate (Singapore)
export const IMPORT_TAX_RATE = 0.09; // 9%

/**
 * Format a number as SGD currency
 */
export function formatSGD(amount: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }): string {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options || {};
  return `S$${amount.toLocaleString('en-SG', { minimumFractionDigits, maximumFractionDigits })}`;
}

/**
 * Format a number as SGD currency (compact for large numbers)
 */
export function formatSGDCompact(amount: number): string {
  if (amount >= 1000000) {
    return `S$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `S$${(amount / 1000).toFixed(1)}K`;
  }
  return formatSGD(amount);
}

/**
 * Calculate landed cost from JPY cost
 * Formula: (JPY cost × FX rate) + $15 shipping + 9% tax on (cost + shipping)
 */
export function calculateLandedCost(costJPY: number, exchangeRate: number = JPY_TO_SGD_RATE): {
  powderCostSGD: number;
  shippingSGD: number;
  importTaxSGD: number;
  landedCostSGD: number;
} {
  const powderCostSGD = costJPY * exchangeRate;
  const shippingSGD = SHIPPING_PER_KG_SGD;
  const importTaxSGD = (powderCostSGD + shippingSGD) * IMPORT_TAX_RATE;
  const landedCostSGD = powderCostSGD + shippingSGD + importTaxSGD;

  return {
    powderCostSGD,
    shippingSGD,
    importTaxSGD,
    landedCostSGD,
  };
}

/**
 * Calculate profit metrics for a client order
 */
export function calculateProfitMetrics(
  sellingPricePerKg: number,
  landedCostPerKg: number,
  discountPercent: number = 0,
  quantityKg: number = 1
): {
  netSellingPrice: number;
  profitPerKg: number;
  grossMarginPercent: number;
  totalRevenue: number;
  totalProfit: number;
} {
  const netSellingPrice = sellingPricePerKg * (1 - discountPercent / 100);
  const profitPerKg = netSellingPrice - landedCostPerKg;
  const grossMarginPercent = netSellingPrice > 0 ? (profitPerKg / netSellingPrice) * 100 : 0;
  const totalRevenue = netSellingPrice * quantityKg;
  const totalProfit = profitPerKg * quantityKg;

  return {
    netSellingPrice,
    profitPerKg,
    grossMarginPercent,
    totalRevenue,
    totalProfit,
  };
}

/**
 * Format JPY amount
 */
export function formatJPY(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}
