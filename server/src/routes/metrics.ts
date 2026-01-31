import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { 
  calculateLandedCost, 
  calculateMonthlyProfit,
  calculateStockCoverage,
} from '../utils/calculations.js';

const router = Router();

/**
 * GET /api/metrics/profitability
 * Get profitability metrics grouped by client, SKU, or supplier
 */
router.get('/profitability', requireAuth, async (req, res) => {
  try {
    const { group_by = 'client' } = req.query;

    // Get latest FX rate
    const fxRate = await prisma.fXRate.findFirst({
      where: { base: 'JPY', quote: 'SGD' },
      orderBy: { timestamp: 'desc' },
    });
    const rate = fxRate?.rate ?? 0.009;

    // Get all contract lines with related data
    const contractLines = await prisma.clientContractLine.findMany({
      include: {
        client: true,
        sku: {
          include: {
            supplierOffers: {
              include: { supplier: true },
              orderBy: { costJpyPerKg: 'asc' },
              take: 1, // Get cheapest offer
            },
          },
        },
      },
    });

    // Calculate profitability for each contract line
    const lineMetrics = contractLines.map(line => {
      const offer = line.sku.supplierOffers[0];
      if (!offer) return null;

      const landed = calculateLandedCost(offer.costJpyPerKg, rate);
      const profit = calculateMonthlyProfit(
        line.sellingSgdPerKg,
        line.discountPct,
        landed.landedCostSgdPerKg,
        line.monthlyVolumeKg
      );

      return {
        clientId: line.clientId,
        clientName: line.client.name,
        skuId: line.skuId,
        skuName: line.sku.name,
        supplierId: offer.supplierId,
        supplierName: offer.supplier.name,
        ...profit,
        landedCostPerKg: landed.landedCostSgdPerKg,
      };
    }).filter(Boolean);

    // Group by specified dimension
    const grouped = new Map<string, {
      id: string;
      name: string;
      totalRevenue: number;
      totalCost: number;
      totalProfit: number;
      avgMargin: number;
      totalVolumeKg: number;
      lineCount: number;
    }>();

    for (const metric of lineMetrics) {
      if (!metric) continue;

      let key: string;
      let name: string;
      let id: string;

      switch (group_by) {
        case 'sku':
          key = metric.skuId;
          name = metric.skuName;
          id = metric.skuId;
          break;
        case 'supplier':
          key = metric.supplierId;
          name = metric.supplierName;
          id = metric.supplierId;
          break;
        default: // client
          key = metric.clientId;
          name = metric.clientName;
          id = metric.clientId;
      }

      const existing = grouped.get(key) || {
        id,
        name,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        avgMargin: 0,
        totalVolumeKg: 0,
        lineCount: 0,
      };

      existing.totalRevenue += metric.monthlyRevenue;
      existing.totalCost += metric.monthlyCost;
      existing.totalProfit += metric.monthlyProfit;
      existing.totalVolumeKg += metric.monthlyVolumeKg;
      existing.lineCount += 1;

      grouped.set(key, existing);
    }

    // Calculate average margins
    const results = Array.from(grouped.values()).map(g => ({
      ...g,
      avgMargin: g.totalRevenue > 0 
        ? ((g.totalRevenue - g.totalCost) / g.totalRevenue) * 100 
        : 0,
    }));

    // Sort by profit descending
    results.sort((a, b) => b.totalProfit - a.totalProfit);

    // Calculate totals
    const totals = results.reduce(
      (acc, r) => ({
        totalRevenue: acc.totalRevenue + r.totalRevenue,
        totalCost: acc.totalCost + r.totalCost,
        totalProfit: acc.totalProfit + r.totalProfit,
        totalVolumeKg: acc.totalVolumeKg + r.totalVolumeKg,
      }),
      { totalRevenue: 0, totalCost: 0, totalProfit: 0, totalVolumeKg: 0 }
    );

    res.json({
      groupBy: group_by,
      fxRate: rate,
      data: results,
      totals: {
        ...totals,
        avgMargin: totals.totalRevenue > 0 
          ? ((totals.totalRevenue - totals.totalCost) / totals.totalRevenue) * 100 
          : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching profitability metrics:', error);
    res.status(500).json({ error: 'Failed to fetch profitability metrics' });
  }
});

/**
 * GET /api/metrics/inventory
 * Get inventory metrics and stock coverage
 */
router.get('/inventory', requireAuth, async (req, res) => {
  try {
    // Get all SKUs with inventory and demand data
    const skus = await prisma.matchaSKU.findMany({
      where: { active: true },
      include: {
        inventoryLots: {
          where: { qtyKgRemaining: { gt: 0 } },
        },
        contractLines: true,
        allocations: {
          where: { status: { not: 'RELEASED' } },
        },
      },
    });

    const inventory = skus.map(sku => {
      const totalStockKg = sku.inventoryLots.reduce(
        (sum, lot) => sum + lot.qtyKgRemaining,
        0
      );
      const totalAllocatedKg = sku.allocations.reduce(
        (sum, alloc) => sum + alloc.qtyKgAllocated,
        0
      );
      const monthlyDemandKg = sku.contractLines.reduce(
        (sum, line) => sum + line.monthlyVolumeKg,
        0
      );
      const unallocatedKg = totalStockKg - totalAllocatedKg;
      const coverage = calculateStockCoverage(totalStockKg, monthlyDemandKg);

      return {
        skuId: sku.id,
        skuName: sku.name,
        qualityTier: sku.qualityTier,
        totalStockKg,
        allocatedKg: totalAllocatedKg,
        unallocatedKg,
        monthlyDemandKg,
        stockCoverageDays: coverage.stockCoverageDays,
        lotCount: sku.inventoryLots.length,
        clientCount: sku.contractLines.length,
        status: coverage.stockCoverageDays === null 
          ? 'no_demand'
          : coverage.stockCoverageDays < 14 
            ? 'critical'
            : coverage.stockCoverageDays < 30 
              ? 'low'
              : 'healthy',
      };
    });

    // Sort by coverage days (critical first)
    inventory.sort((a, b) => {
      if (a.stockCoverageDays === null) return 1;
      if (b.stockCoverageDays === null) return -1;
      return a.stockCoverageDays - b.stockCoverageDays;
    });

    // Calculate totals
    const totals = inventory.reduce(
      (acc, i) => ({
        totalStockKg: acc.totalStockKg + i.totalStockKg,
        allocatedKg: acc.allocatedKg + i.allocatedKg,
        unallocatedKg: acc.unallocatedKg + i.unallocatedKg,
        monthlyDemandKg: acc.monthlyDemandKg + i.monthlyDemandKg,
      }),
      { totalStockKg: 0, allocatedKg: 0, unallocatedKg: 0, monthlyDemandKg: 0 }
    );

    const criticalCount = inventory.filter(i => i.status === 'critical').length;
    const lowCount = inventory.filter(i => i.status === 'low').length;

    res.json({
      data: inventory,
      totals,
      alerts: {
        criticalCount,
        lowCount,
        healthyCount: inventory.length - criticalCount - lowCount,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory metrics:', error);
    res.status(500).json({ error: 'Failed to fetch inventory metrics' });
  }
});

export default router;
