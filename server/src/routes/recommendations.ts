import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { 
  getRecommendations, 
  simulateChange,
  SimulationInput,
} from '../services/recommendationService.js';
import {
  generateAIRecommendations,
  generateProductSwapRecommendations,
  AIRecommendationInput,
} from '../services/aiService.js';
import prisma from '../db/client.js';

const router = Router();

// Validation schemas
const simulationSchema = z.object({
  contractLineId: z.string().uuid(),
  simulation: z.object({
    type: z.enum(['supplier_offer', 'fx_rate', 'selling_price', 'volume']),
    changes: z.record(z.unknown()),
  }),
});

const aiRecommendationSchema = z.object({
  clients: z.array(z.object({
    client: z.object({
      id: z.string(),
      name: z.string(),
    }),
    totalRevenue: z.number(),
    totalCOGS: z.number(),
    profit: z.number(),
    profitMargin: z.number(),
    orders: z.array(z.object({
      product: z.object({
        id: z.string(),
        name: z.string(),
        grade: z.string(),
        cost_per_kg: z.number(),
        quality_score: z.number(),
        stock_kg: z.number(),
        status: z.string(),
      }),
      quantity_kg: z.number(),
      unit_price: z.number(),
    })),
  })),
  products: z.array(z.object({
    id: z.string(),
    name: z.string(),
    grade: z.string(),
    origin: z.string(),
    cost_per_kg: z.number(),
    quality_score: z.number(),
    stock_kg: z.number(),
    status: z.string(),
  })),
});

/**
 * GET /api/recommendations
 * Get ranked recommendations (rule-based)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit = '10', type } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 50);

    let recommendations = await getRecommendations(limitNum);

    // Filter by type if specified
    if (type) {
      recommendations = recommendations.filter(r => r.type === type);
    }

    res.json({
      recommendations,
      count: recommendations.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * POST /api/recommendations/ai
 * Generate AI-powered recommendations using OpenAI
 */
router.post('/ai', requireAuth, async (req, res) => {
  try {
    const { clients, products } = aiRecommendationSchema.parse(req.body);

    // Generate AI recommendations using the product swap function
    // This maintains compatibility with the frontend RecommendationsPanel
    const result = await generateProductSwapRecommendations(clients, products);

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error generating AI recommendations:', error);
    res.status(500).json({ error: 'Failed to generate AI recommendations' });
  }
});

/**
 * POST /api/recommendations/ai/full
 * Generate comprehensive AI analysis with all recommendation types
 */
router.post('/ai/full', requireAuth, async (req, res) => {
  try {
    // Get FX rate
    const fxRate = await prisma.fXRate.findFirst({
      where: { base: 'JPY', quote: 'SGD' },
      orderBy: { timestamp: 'desc' },
    });

    // Get all SKUs with their data
    const skus = await prisma.matchaSKU.findMany({
      where: { active: true },
      include: {
        supplierOffers: {
          include: { supplier: true },
          orderBy: { costJpyPerKg: 'asc' },
        },
      },
    });

    // Get all clients with their contracts
    const clients = await prisma.client.findMany({
      include: {
        contractLines: {
          include: { sku: true },
        },
      },
    });

    // Get inventory
    const inventory = await prisma.inventoryLot.findMany({
      where: { qtyKgRemaining: { gt: 0 } },
      include: {
        sku: true,
        supplier: true,
      },
    });

    // Build AI input
    const aiInput: AIRecommendationInput = {
      products: skus.map(sku => ({
        id: sku.id,
        name: sku.name,
        grade: sku.qualityTier,
        qualityTier: sku.qualityTier,
        costPerKg: sku.supplierOffers[0]?.costJpyPerKg 
          ? sku.supplierOffers[0].costJpyPerKg * (fxRate?.rate || 0.009)
          : 0,
        qualityScore: 85, // Default quality score
        stockKg: inventory
          .filter(i => i.skuId === sku.id)
          .reduce((sum, i) => sum + i.qtyKgRemaining, 0),
        status: 'in_stock',
      })),
      clients: clients.map(client => {
        const clientContracts = client.contractLines;
        const totalRevenue = clientContracts.reduce(
          (sum, line) => sum + (line.sellingSgdPerKg * line.monthlyVolumeKg),
          0
        );
        const totalCOGS = clientContracts.reduce((sum, line) => {
          const sku = skus.find(s => s.id === line.skuId);
          const cost = sku?.supplierOffers[0]?.costJpyPerKg || 0;
          return sum + (cost * (fxRate?.rate || 0.009) * line.monthlyVolumeKg);
        }, 0);

        return {
          id: client.id,
          name: client.name,
          segment: client.segment,
          totalRevenue,
          totalCOGS,
          profit: totalRevenue - totalCOGS,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0,
          orders: clientContracts.map(line => ({
            productId: line.skuId,
            productName: line.sku.name,
            quantityKg: line.monthlyVolumeKg,
            unitPrice: line.sellingSgdPerKg,
          })),
        };
      }),
      inventory: inventory.map(lot => ({
        id: lot.id,
        skuName: lot.sku.name,
        supplierName: lot.supplier.name,
        qtyKgRemaining: lot.qtyKgRemaining,
        landedCostSgdPerKg: lot.costBasisSgdPerKg,
        expiryDate: lot.expiryDate?.toISOString(),
        daysToExpiry: lot.expiryDate 
          ? Math.floor((lot.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : undefined,
      })),
      fxRate: fxRate?.rate || 0.009,
    };

    const result = await generateAIRecommendations(aiInput);

    res.json({
      ...result,
      generatedAt: new Date().toISOString(),
      model: 'gpt-4.1-mini',
    });
  } catch (error) {
    console.error('Error generating full AI analysis:', error);
    res.status(500).json({ error: 'Failed to generate AI analysis' });
  }
});

/**
 * POST /api/recommendations/simulate
 * Simulate a proposed change
 */
router.post('/simulate', requireAuth, async (req, res) => {
  try {
    const { contractLineId, simulation } = simulationSchema.parse(req.body);

    const result = await simulateChange(contractLineId, simulation as SimulationInput);

    res.json({
      contractLineId,
      simulation,
      result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error simulating change:', error);
    res.status(500).json({ error: 'Failed to simulate change' });
  }
});

/**
 * GET /api/recommendations/types
 * Get available recommendation types with descriptions
 */
router.get('/types', requireAuth, (req, res) => {
  res.json({
    types: [
      {
        type: 'SUPPLIER_SWAP',
        name: 'Supplier Swap',
        description: 'Switch to a different supplier for cost savings while maintaining quality',
        triggers: ['Lower cost from alternative supplier', 'FX rate changes', 'Reliability concerns'],
      },
      {
        type: 'SKU_SWAP',
        name: 'SKU Swap',
        description: 'Suggest alternative SKU with better margin while maintaining quality tier',
        triggers: ['Low margin on current SKU', 'Better priced alternative available'],
      },
      {
        type: 'REORDER',
        name: 'Reorder Alert',
        description: 'Stock is running low and needs replenishment',
        triggers: ['Stock below buffer threshold', 'Upcoming delivery commitments'],
      },
      {
        type: 'ALLOCATION_OPTIMIZATION',
        name: 'Allocation Optimization',
        description: 'Optimize inventory allocation across clients',
        triggers: ['Unallocated inventory', 'Over-allocation', 'Expiring stock'],
      },
      {
        type: 'PRICING',
        name: 'Pricing Strategy',
        description: 'AI-suggested pricing adjustments for margin optimization',
        triggers: ['Market conditions', 'Competitor analysis', 'Cost changes'],
      },
      {
        type: 'CLIENT_STRATEGY',
        name: 'Client Strategy',
        description: 'AI-powered client relationship and growth recommendations',
        triggers: ['Upselling opportunities', 'Retention risks', 'Growth potential'],
      },
    ],
  });
});

export default router;
