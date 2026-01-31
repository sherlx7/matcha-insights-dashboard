import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { 
  getRecommendations, 
  simulateChange,
  SimulationInput,
} from '../services/recommendationService.js';

const router = Router();

// Validation schemas
const simulationSchema = z.object({
  contractLineId: z.string().uuid(),
  simulation: z.object({
    type: z.enum(['supplier_offer', 'fx_rate', 'selling_price', 'volume']),
    changes: z.record(z.unknown()),
  }),
});

/**
 * GET /api/recommendations
 * Get ranked recommendations
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
    ],
  });
});

export default router;
