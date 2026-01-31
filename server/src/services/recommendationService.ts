/**
 * Recommendation Engine Service
 * 
 * Generates AI-powered recommendations for:
 * - Supplier swaps (cost optimization)
 * - SKU swaps (margin improvement)
 * - Reorder alerts (stock replenishment)
 * - Allocation optimization
 */

import prisma from '../db/client.js';
import { 
  calculateLandedCost, 
  calculateMonthlyProfit,
  calculateStockCoverage,
} from '../utils/calculations.js';

// Types
export interface Recommendation {
  id: string;
  type: 'SUPPLIER_SWAP' | 'SKU_SWAP' | 'REORDER' | 'ALLOCATION_OPTIMIZATION';
  title: string;
  explanation: string;
  impactScore: number; // 0-100, higher = more impact
  riskScore: number; // 0-100, higher = more risk
  finalScore: number; // Combined score for ranking
  confidenceScore: number; // 0-1, confidence in the recommendation
  numericImpact: {
    deltaLandedCostPerKg?: number;
    deltaMonthlyProfit?: number;
    stockoutRiskReduction?: number;
  };
  assumptions: string[];
  applyAction: {
    entityType: string;
    entityId: string;
    changes: Record<string, unknown>;
  } | null;
  metadata: Record<string, unknown>;
}

export interface SimulationInput {
  type: 'supplier_offer' | 'fx_rate' | 'selling_price' | 'volume';
  changes: Record<string, unknown>;
}

export interface SimulationResult {
  before: {
    landedCostPerKg: number | null;
    monthlyProfit: number | null;
    marginPct: number | null;
  };
  after: {
    landedCostPerKg: number | null;
    monthlyProfit: number | null;
    marginPct: number | null;
  };
  delta: {
    landedCostPerKg: number;
    monthlyProfit: number;
    marginPct: number;
  };
}

/**
 * Get the latest FX rate
 */
async function getLatestFxRate(): Promise<number> {
  const rate = await prisma.fXRate.findFirst({
    where: { base: 'JPY', quote: 'SGD' },
    orderBy: { timestamp: 'desc' },
  });
  return rate?.rate ?? 0.009; // Default fallback
}

/**
 * Generate supplier swap recommendations
 */
async function generateSupplierSwapRecommendations(fxRate: number): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Get all contract lines with their current supplier offers
  const contractLines = await prisma.clientContractLine.findMany({
    include: {
      client: true,
      sku: {
        include: {
          supplierOffers: {
            include: { supplier: true },
            orderBy: { costJpyPerKg: 'asc' },
          },
        },
      },
    },
  });

  for (const line of contractLines) {
    const offers = line.sku.supplierOffers;
    if (offers.length < 2) continue;

    // Find current supplier (assume first inventory lot's supplier or cheapest)
    const currentOffer = offers[0];
    const cheaperOffers = offers.slice(1).filter(o => 
      o.costJpyPerKg < currentOffer.costJpyPerKg &&
      o.supplier.reliabilityScore >= 0.85
    );

    for (const cheaperOffer of cheaperOffers) {
      const currentLanded = calculateLandedCost(currentOffer.costJpyPerKg, fxRate);
      const newLanded = calculateLandedCost(cheaperOffer.costJpyPerKg, fxRate);
      const deltaCost = currentLanded.landedCostSgdPerKg - newLanded.landedCostSgdPerKg;
      const monthlyVolume = line.monthlyVolumeKg;
      const monthlySavings = deltaCost * monthlyVolume;

      if (monthlySavings > 10) { // Only recommend if savings > $10/month
        const impactScore = Math.min(100, (monthlySavings / 100) * 50);
        const riskScore = (1 - cheaperOffer.supplier.reliabilityScore) * 100;
        const finalScore = impactScore * 0.7 - riskScore * 0.3;

        recommendations.push({
          id: `supplier-swap-${line.id}-${cheaperOffer.supplierId}`,
          type: 'SUPPLIER_SWAP',
          title: `Switch ${line.sku.name} supplier for ${line.client.name}`,
          explanation: `Switching from ${currentOffer.supplier.name} to ${cheaperOffer.supplier.name} could save SGD ${monthlySavings.toFixed(2)}/month (SGD ${deltaCost.toFixed(2)}/kg × ${monthlyVolume}kg). Reliability score: ${(cheaperOffer.supplier.reliabilityScore * 100).toFixed(0)}%.`,
          impactScore,
          riskScore,
          finalScore,
          confidenceScore: 0.85,
          numericImpact: {
            deltaLandedCostPerKg: -deltaCost,
            deltaMonthlyProfit: monthlySavings,
          },
          assumptions: [
            'Current supplier is the most expensive option',
            'New supplier can meet volume requirements',
            `Lead time: ${cheaperOffer.supplier.typicalLeadTimeDays} days`,
          ],
          applyAction: {
            entityType: 'SupplierSKUOffer',
            entityId: cheaperOffer.id,
            changes: { preferred: true },
          },
          metadata: {
            contractLineId: line.id,
            currentSupplierId: currentOffer.supplierId,
            newSupplierId: cheaperOffer.supplierId,
            skuId: line.skuId,
          },
        });
      }
    }
  }

  return recommendations;
}

/**
 * Generate SKU swap recommendations
 */
async function generateSkuSwapRecommendations(fxRate: number): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Get contract lines with low margins
  const contractLines = await prisma.clientContractLine.findMany({
    include: {
      client: true,
      sku: {
        include: {
          supplierOffers: {
            include: { supplier: true },
            orderBy: { costJpyPerKg: 'asc' },
            take: 1,
          },
        },
      },
    },
  });

  for (const line of contractLines) {
    const currentOffer = line.sku.supplierOffers[0];
    if (!currentOffer) continue;

    const currentLanded = calculateLandedCost(currentOffer.costJpyPerKg, fxRate);
    const currentProfit = calculateMonthlyProfit(
      line.sellingSgdPerKg,
      line.discountPct,
      currentLanded.landedCostSgdPerKg,
      line.monthlyVolumeKg
    );

    // Only consider low-margin contracts
    if (currentProfit.grossMarginPct > 25) continue;

    // Find alternative SKUs in the same quality tier with better margins
    const alternativeSkus = await prisma.matchaSKU.findMany({
      where: {
        qualityTier: line.sku.qualityTier,
        id: { not: line.skuId },
        active: true,
        substitutableGroupId: line.sku.substitutableGroupId,
      },
      include: {
        supplierOffers: {
          include: { supplier: true },
          orderBy: { costJpyPerKg: 'asc' },
          take: 1,
        },
      },
    });

    for (const altSku of alternativeSkus) {
      const altOffer = altSku.supplierOffers[0];
      if (!altOffer) continue;

      const altLanded = calculateLandedCost(altOffer.costJpyPerKg, fxRate);
      const altProfit = calculateMonthlyProfit(
        line.sellingSgdPerKg,
        line.discountPct,
        altLanded.landedCostSgdPerKg,
        line.monthlyVolumeKg
      );

      const marginImprovement = altProfit.grossMarginPct - currentProfit.grossMarginPct;
      const profitImprovement = altProfit.monthlyProfit - currentProfit.monthlyProfit;

      if (marginImprovement > 5 && profitImprovement > 20) {
        const impactScore = Math.min(100, profitImprovement);
        const riskScore = 20; // Moderate risk for SKU changes
        const finalScore = impactScore * 0.6 - riskScore * 0.4;

        recommendations.push({
          id: `sku-swap-${line.id}-${altSku.id}`,
          type: 'SKU_SWAP',
          title: `Consider ${altSku.name} for ${line.client.name}`,
          explanation: `Switching from ${line.sku.name} to ${altSku.name} could improve margin from ${currentProfit.grossMarginPct.toFixed(1)}% to ${altProfit.grossMarginPct.toFixed(1)}% (+SGD ${profitImprovement.toFixed(2)}/month). Both are ${line.sku.qualityTier} grade.`,
          impactScore,
          riskScore,
          finalScore,
          confidenceScore: 0.7,
          numericImpact: {
            deltaLandedCostPerKg: currentLanded.landedCostSgdPerKg - altLanded.landedCostSgdPerKg,
            deltaMonthlyProfit: profitImprovement,
          },
          assumptions: [
            'Client accepts SKU substitution within same quality tier',
            'Alternative SKU has similar taste profile',
            'Inventory available or can be sourced',
          ],
          applyAction: {
            entityType: 'ClientContractLine',
            entityId: line.id,
            changes: { skuId: altSku.id },
          },
          metadata: {
            contractLineId: line.id,
            currentSkuId: line.skuId,
            newSkuId: altSku.id,
            clientId: line.clientId,
          },
        });
      }
    }
  }

  return recommendations;
}

/**
 * Generate reorder recommendations
 */
async function generateReorderRecommendations(): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Get SKUs with inventory and demand data
  const skus = await prisma.matchaSKU.findMany({
    where: { active: true },
    include: {
      inventoryLots: {
        where: { qtyKgRemaining: { gt: 0 } },
      },
      contractLines: true,
      supplierOffers: {
        include: { supplier: true },
        orderBy: { costJpyPerKg: 'asc' },
        take: 1,
      },
    },
  });

  for (const sku of skus) {
    const totalStock = sku.inventoryLots.reduce(
      (sum, lot) => sum + lot.qtyKgRemaining,
      0
    );
    const monthlyDemand = sku.contractLines.reduce(
      (sum, line) => sum + line.monthlyVolumeKg,
      0
    );

    if (monthlyDemand === 0) continue;

    const coverage = calculateStockCoverage(totalStock, monthlyDemand);
    const bestOffer = sku.supplierOffers[0];

    // Alert if coverage is less than 30 days
    if (coverage.stockCoverageDays !== null && coverage.stockCoverageDays < 30) {
      const urgency = coverage.stockCoverageDays < 14 ? 'CRITICAL' : 'WARNING';
      const suggestedQty = Math.max(
        monthlyDemand * 2, // 2 months buffer
        bestOffer?.supplier.minOrderKg ?? 10
      );

      const impactScore = urgency === 'CRITICAL' ? 90 : 60;
      const riskScore = urgency === 'CRITICAL' ? 80 : 40;
      const finalScore = impactScore;

      recommendations.push({
        id: `reorder-${sku.id}`,
        type: 'REORDER',
        title: `${urgency}: Reorder ${sku.name}`,
        explanation: `Stock coverage is ${coverage.stockCoverageDays?.toFixed(0)} days (${totalStock.toFixed(1)}kg remaining, ${monthlyDemand.toFixed(1)}kg/month demand). Recommend ordering ${suggestedQty.toFixed(0)}kg from ${bestOffer?.supplier.name ?? 'preferred supplier'}.`,
        impactScore,
        riskScore,
        finalScore,
        confidenceScore: 0.95,
        numericImpact: {
          stockoutRiskReduction: urgency === 'CRITICAL' ? 0.9 : 0.6,
        },
        assumptions: [
          `Lead time: ${bestOffer?.supplier.typicalLeadTimeDays ?? 21} days`,
          'Demand remains consistent',
          'No pending orders in transit',
        ],
        applyAction: {
          entityType: 'OrderPlan',
          entityId: 'new',
          changes: {
            supplierId: bestOffer?.supplierId,
            skuId: sku.id,
            qtyKg: suggestedQty,
          },
        },
        metadata: {
          skuId: sku.id,
          currentStockKg: totalStock,
          monthlyDemandKg: monthlyDemand,
          coverageDays: coverage.stockCoverageDays,
          suggestedOrderKg: suggestedQty,
        },
      });
    }
  }

  return recommendations;
}

/**
 * Generate allocation optimization recommendations
 */
async function generateAllocationRecommendations(): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Check for over-allocated inventory
  const inventoryLots = await prisma.inventoryLot.findMany({
    where: { qtyKgRemaining: { gt: 0 } },
    include: {
      sku: true,
      supplier: true,
      allocations: {
        include: { client: true },
      },
    },
  });

  for (const lot of inventoryLots) {
    const totalAllocated = lot.allocations.reduce(
      (sum, alloc) => sum + alloc.qtyKgAllocated,
      0
    );

    // Over-allocation check
    if (totalAllocated > lot.qtyKgRemaining) {
      const overAllocatedKg = totalAllocated - lot.qtyKgRemaining;
      
      recommendations.push({
        id: `over-allocation-${lot.id}`,
        type: 'ALLOCATION_OPTIMIZATION',
        title: `Over-allocation: ${lot.sku.name} from ${lot.supplier.name}`,
        explanation: `Lot has ${lot.qtyKgRemaining.toFixed(1)}kg remaining but ${totalAllocated.toFixed(1)}kg allocated (${overAllocatedKg.toFixed(1)}kg over). Review and adjust allocations to prevent fulfillment issues.`,
        impactScore: 85,
        riskScore: 70,
        finalScore: 85,
        confidenceScore: 1.0,
        numericImpact: {},
        assumptions: [
          'Allocation quantities are accurate',
          'No pending inventory arrivals',
        ],
        applyAction: null, // Requires manual review
        metadata: {
          inventoryLotId: lot.id,
          skuId: lot.skuId,
          availableKg: lot.qtyKgRemaining,
          allocatedKg: totalAllocated,
          overAllocatedKg,
          allocations: lot.allocations.map(a => ({
            clientId: a.clientId,
            clientName: a.client.name,
            qtyKg: a.qtyKgAllocated,
          })),
        },
      });
    }

    // Unallocated inventory check (for expiring stock)
    if (lot.expiryDate) {
      const daysToExpiry = Math.floor(
        (lot.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const unallocatedKg = lot.qtyKgRemaining - totalAllocated;

      if (daysToExpiry < 60 && unallocatedKg > 5) {
        recommendations.push({
          id: `expiring-unallocated-${lot.id}`,
          type: 'ALLOCATION_OPTIMIZATION',
          title: `Expiring stock: ${lot.sku.name}`,
          explanation: `${unallocatedKg.toFixed(1)}kg unallocated and expires in ${daysToExpiry} days. Consider allocating to existing clients or offering promotional pricing.`,
          impactScore: 70,
          riskScore: 50,
          finalScore: 70,
          confidenceScore: 0.9,
          numericImpact: {},
          assumptions: [
            'Stock is still sellable',
            'Clients can accept additional volume',
          ],
          applyAction: null,
          metadata: {
            inventoryLotId: lot.id,
            skuId: lot.skuId,
            unallocatedKg,
            daysToExpiry,
            expiryDate: lot.expiryDate.toISOString(),
          },
        });
      }
    }
  }

  return recommendations;
}

/**
 * Get all recommendations, ranked by score
 */
export async function getRecommendations(limit: number = 10): Promise<Recommendation[]> {
  const fxRate = await getLatestFxRate();

  const [supplierSwaps, skuSwaps, reorders, allocations] = await Promise.all([
    generateSupplierSwapRecommendations(fxRate),
    generateSkuSwapRecommendations(fxRate),
    generateReorderRecommendations(),
    generateAllocationRecommendations(),
  ]);

  const allRecommendations = [
    ...supplierSwaps,
    ...skuSwaps,
    ...reorders,
    ...allocations,
  ];

  // Sort by final score descending
  allRecommendations.sort((a, b) => b.finalScore - a.finalScore);

  return allRecommendations.slice(0, limit);
}

/**
 * Simulate a proposed change
 */
export async function simulateChange(
  contractLineId: string,
  simulation: SimulationInput
): Promise<SimulationResult> {
  const line = await prisma.clientContractLine.findUnique({
    where: { id: contractLineId },
    include: {
      sku: {
        include: {
          supplierOffers: {
            orderBy: { costJpyPerKg: 'asc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!line) {
    throw new Error('Contract line not found');
  }

  const fxRate = await getLatestFxRate();
  const currentOffer = line.sku.supplierOffers[0];

  // Calculate current state
  const currentLanded = currentOffer 
    ? calculateLandedCost(currentOffer.costJpyPerKg, fxRate)
    : null;
  const currentProfit = currentLanded
    ? calculateMonthlyProfit(
        line.sellingSgdPerKg,
        line.discountPct,
        currentLanded.landedCostSgdPerKg,
        line.monthlyVolumeKg
      )
    : null;

  // Calculate simulated state based on change type
  let newLandedCost = currentLanded?.landedCostSgdPerKg ?? 0;
  let newSellingPrice = line.sellingSgdPerKg;
  let newDiscount = line.discountPct;
  let newVolume = line.monthlyVolumeKg;

  switch (simulation.type) {
    case 'supplier_offer':
      if (simulation.changes.costJpyPerKg) {
        const newLanded = calculateLandedCost(
          simulation.changes.costJpyPerKg as number,
          fxRate
        );
        newLandedCost = newLanded.landedCostSgdPerKg;
      }
      break;
    case 'fx_rate':
      if (simulation.changes.rate && currentOffer) {
        const newLanded = calculateLandedCost(
          currentOffer.costJpyPerKg,
          simulation.changes.rate as number
        );
        newLandedCost = newLanded.landedCostSgdPerKg;
      }
      break;
    case 'selling_price':
      if (simulation.changes.sellingSgdPerKg) {
        newSellingPrice = simulation.changes.sellingSgdPerKg as number;
      }
      if (simulation.changes.discountPct !== undefined) {
        newDiscount = simulation.changes.discountPct as number;
      }
      break;
    case 'volume':
      if (simulation.changes.monthlyVolumeKg) {
        newVolume = simulation.changes.monthlyVolumeKg as number;
      }
      break;
  }

  const newProfit = calculateMonthlyProfit(
    newSellingPrice,
    newDiscount,
    newLandedCost,
    newVolume
  );

  return {
    before: {
      landedCostPerKg: currentLanded?.landedCostSgdPerKg ?? null,
      monthlyProfit: currentProfit?.monthlyProfit ?? null,
      marginPct: currentProfit?.grossMarginPct ?? null,
    },
    after: {
      landedCostPerKg: newLandedCost,
      monthlyProfit: newProfit.monthlyProfit,
      marginPct: newProfit.grossMarginPct,
    },
    delta: {
      landedCostPerKg: newLandedCost - (currentLanded?.landedCostSgdPerKg ?? 0),
      monthlyProfit: newProfit.monthlyProfit - (currentProfit?.monthlyProfit ?? 0),
      marginPct: newProfit.grossMarginPct - (currentProfit?.grossMarginPct ?? 0),
    },
  };
}
