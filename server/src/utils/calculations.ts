/**
 * Core cost and profitability calculations for Matsu Matcha
 * 
 * FX Rate Convention:
 * - We store FX rate as "SGD per 1 JPY" (e.g., 0.009 means 1 JPY = 0.009 SGD)
 * - To convert JPY to SGD: jpy_amount * fx_rate = sgd_amount
 */

// Constants
export const SHIPPING_SGD_PER_KG = 15;
export const IMPORT_TAX_RATE = 0.09; // 9%

export interface LandedCostBreakdown {
  costJpy: number;
  fxRate: number;
  powderCostSgd: number;
  shippingSgdPerKg: number;
  subtotalBeforeTax: number;
  importTax: number;
  landedCostSgdPerKg: number;
}

/**
 * Calculate landed cost per kg in SGD
 * 
 * Formula:
 * - powder_cost_sgd = cost_jpy_per_kg * fx_rate_jpy_to_sgd
 * - shipping_sgd_per_kg = 15
 * - import_tax = 0.09 * (powder_cost_sgd + shipping_sgd_per_kg)
 * - landed_cost_sgd_per_kg = powder_cost_sgd + shipping_sgd_per_kg + import_tax
 */
export function calculateLandedCost(
  costJpyPerKg: number,
  fxRateJpyToSgd: number
): LandedCostBreakdown {
  const powderCostSgd = costJpyPerKg * fxRateJpyToSgd;
  const shippingSgdPerKg = SHIPPING_SGD_PER_KG;
  const subtotalBeforeTax = powderCostSgd + shippingSgdPerKg;
  const importTax = IMPORT_TAX_RATE * subtotalBeforeTax;
  const landedCostSgdPerKg = subtotalBeforeTax + importTax;

  return {
    costJpy: costJpyPerKg,
    fxRate: fxRateJpyToSgd,
    powderCostSgd,
    shippingSgdPerKg,
    subtotalBeforeTax,
    importTax,
    landedCostSgdPerKg,
  };
}

export interface ProfitBreakdown {
  sellingSgdPerKg: number;
  discountPct: number;
  netSellingPrice: number;
  landedCostSgdPerKg: number;
  profitPerKg: number;
  grossMarginPct: number;
}

/**
 * Calculate profit per kg
 * 
 * Formula:
 * - net_selling_price = selling_sgd_per_kg * (1 - discount_pct)
 * - profit_per_kg = net_selling_price - landed_cost_sgd_per_kg
 * - gross_margin_pct = (profit_per_kg / net_selling_price) * 100
 */
export function calculateProfit(
  sellingSgdPerKg: number,
  discountPct: number,
  landedCostSgdPerKg: number
): ProfitBreakdown {
  const netSellingPrice = sellingSgdPerKg * (1 - discountPct / 100);
  const profitPerKg = netSellingPrice - landedCostSgdPerKg;
  const grossMarginPct = netSellingPrice > 0 
    ? (profitPerKg / netSellingPrice) * 100 
    : 0;

  return {
    sellingSgdPerKg,
    discountPct,
    netSellingPrice,
    landedCostSgdPerKg,
    profitPerKg,
    grossMarginPct,
  };
}

export interface MonthlyProfitBreakdown extends ProfitBreakdown {
  monthlyVolumeKg: number;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
}

/**
 * Calculate monthly profit
 * 
 * Formula:
 * - monthly_profit = profit_per_kg * monthly_volume_kg
 */
export function calculateMonthlyProfit(
  sellingSgdPerKg: number,
  discountPct: number,
  landedCostSgdPerKg: number,
  monthlyVolumeKg: number
): MonthlyProfitBreakdown {
  const profitBreakdown = calculateProfit(sellingSgdPerKg, discountPct, landedCostSgdPerKg);
  const monthlyRevenue = profitBreakdown.netSellingPrice * monthlyVolumeKg;
  const monthlyCost = landedCostSgdPerKg * monthlyVolumeKg;
  const monthlyProfit = profitBreakdown.profitPerKg * monthlyVolumeKg;

  return {
    ...profitBreakdown,
    monthlyVolumeKg,
    monthlyRevenue,
    monthlyCost,
    monthlyProfit,
  };
}

export interface StockCoverage {
  totalAvailableKg: number;
  projectedDailyDemandKg: number;
  stockCoverageDays: number | null;
}

/**
 * Calculate stock coverage days
 * 
 * Formula:
 * - stock_coverage_days = total_available_kg / projected_daily_demand_kg
 */
export function calculateStockCoverage(
  totalAvailableKg: number,
  monthlyDemandKg: number
): StockCoverage {
  const projectedDailyDemandKg = monthlyDemandKg / 30;
  const stockCoverageDays = projectedDailyDemandKg > 0 
    ? totalAvailableKg / projectedDailyDemandKg 
    : null;

  return {
    totalAvailableKg,
    projectedDailyDemandKg,
    stockCoverageDays,
  };
}

/**
 * Calculate reorder quantity based on buffer policy
 * Default buffer: 4 weeks demand
 */
export function calculateReorderQuantity(
  currentStockKg: number,
  monthlyDemandKg: number,
  bufferWeeks: number = 4,
  minOrderKg: number = 10
): { needsReorder: boolean; suggestedQtyKg: number; urgency: 'low' | 'medium' | 'high' | 'critical' } {
  const weeklyDemand = monthlyDemandKg / 4;
  const bufferStockKg = weeklyDemand * bufferWeeks;
  const targetStockKg = bufferStockKg + (weeklyDemand * 2); // Buffer + 2 weeks safety
  
  const shortfall = targetStockKg - currentStockKg;
  const needsReorder = shortfall > 0;
  const suggestedQtyKg = needsReorder 
    ? Math.max(shortfall, minOrderKg) 
    : 0;

  // Determine urgency
  const coverageDays = monthlyDemandKg > 0 
    ? (currentStockKg / (monthlyDemandKg / 30)) 
    : Infinity;

  let urgency: 'low' | 'medium' | 'high' | 'critical';
  if (coverageDays <= 7) {
    urgency = 'critical';
  } else if (coverageDays <= 14) {
    urgency = 'high';
  } else if (coverageDays <= 28) {
    urgency = 'medium';
  } else {
    urgency = 'low';
  }

  return { needsReorder, suggestedQtyKg, urgency };
}

/**
 * Compare two supplier offers and calculate savings
 */
export function compareSupplierOffers(
  currentCostJpy: number,
  candidateCostJpy: number,
  fxRate: number,
  monthlyVolumeKg: number
): {
  deltaLandedCostPerKg: number;
  deltaMonthlyProfit: number;
  savingsPercentage: number;
} {
  const currentLanded = calculateLandedCost(currentCostJpy, fxRate);
  const candidateLanded = calculateLandedCost(candidateCostJpy, fxRate);
  
  const deltaLandedCostPerKg = currentLanded.landedCostSgdPerKg - candidateLanded.landedCostSgdPerKg;
  const deltaMonthlyProfit = deltaLandedCostPerKg * monthlyVolumeKg;
  const savingsPercentage = currentLanded.landedCostSgdPerKg > 0
    ? (deltaLandedCostPerKg / currentLanded.landedCostSgdPerKg) * 100
    : 0;

  return {
    deltaLandedCostPerKg,
    deltaMonthlyProfit,
    savingsPercentage,
  };
}
