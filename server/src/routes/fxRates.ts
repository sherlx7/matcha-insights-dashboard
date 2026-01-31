import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createAuditLog } from '../services/auditService.js';


const router = Router();

// Validation schemas
const createFXRateSchema = z.object({
  base: z.string().default('JPY'),
  quote: z.string().default('SGD'),
  rate: z.number().positive(),
  source: z.enum(['MANUAL', 'API']).default('MANUAL'),
});

/**
 * GET /api/fx-rates
 * List FX rates
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { base, quote, limit } = req.query;

    const rates = await prisma.fXRate.findMany({
      where: {
        ...(base && { base: base as string }),
        ...(quote && { quote: quote as string }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit ? parseInt(limit as string) : 30,
    });
    res.json(rates);
  } catch (error) {
    console.error('Error fetching FX rates:', error);
    res.status(500).json({ error: 'Failed to fetch FX rates' });
  }
});

/**
 * GET /api/fx-rates/latest
 * Get the latest FX rate
 */
router.get('/latest', requireAuth, async (req, res) => {
  try {
    const { base = 'JPY', quote = 'SGD' } = req.query;

    const rate = await prisma.fXRate.findFirst({
      where: {
        base: base as string,
        quote: quote as string,
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!rate) {
      return res.status(404).json({ error: 'No FX rate found' });
    }

    res.json(rate);
  } catch (error) {
    console.error('Error fetching latest FX rate:', error);
    res.status(500).json({ error: 'Failed to fetch latest FX rate' });
  }
});

/**
 * POST /api/fx-rates
 * Create a new FX rate entry
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = createFXRateSchema.parse(req.body);

    const rate = await prisma.fXRate.create({
      data: {
        ...data,
        timestamp: new Date(),
      },
    });

    await createAuditLog({
      entityType: 'FXRate',
      entityId: rate.id,
      action: 'CREATE',
      after: rate as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(201).json(rate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating FX rate:', error);
    res.status(500).json({ error: 'Failed to create FX rate' });
  }
});

/**
 * GET /api/fx-rates/history
 * Get FX rate history for charts
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { base = 'JPY', quote = 'SGD', days = '30' } = req.query;
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const rates = await prisma.fXRate.findMany({
      where: {
        base: base as string,
        quote: quote as string,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Calculate statistics
    const rateValues = rates.map(r => r.rate);
    const avg = rateValues.length > 0 
      ? rateValues.reduce((a, b) => a + b, 0) / rateValues.length 
      : 0;
    const min = rateValues.length > 0 ? Math.min(...rateValues) : 0;
    const max = rateValues.length > 0 ? Math.max(...rateValues) : 0;
    
    // Calculate volatility (standard deviation)
    const variance = rateValues.length > 0
      ? rateValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / rateValues.length
      : 0;
    const volatility = Math.sqrt(variance);

    res.json({
      rates,
      statistics: {
        average: avg,
        min,
        max,
        volatility,
        volatilityPct: avg > 0 ? (volatility / avg) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching FX rate history:', error);
    res.status(500).json({ error: 'Failed to fetch FX rate history' });
  }
});

export default router;
