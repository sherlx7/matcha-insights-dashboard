import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createAuditLog } from '../services/auditService.js';

const router = Router();

// Validation schemas
const createSKUSchema = z.object({
  name: z.string().min(1),
  qualityTier: z.enum(['COMPETITION', 'CEREMONIAL', 'CAFE']),
  tastingNotes: z.string().optional(),
  intendedUse: z.enum(['LATTE', 'STRAIGHT', 'BOTH']).default('LATTE'),
  substitutableGroupId: z.string().optional(),
  active: z.boolean().default(true),
});

const updateSKUSchema = createSKUSchema.partial();

/**
 * GET /api/skus
 * List all SKUs
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { active } = req.query;
    
    const skus = await prisma.matchaSKU.findMany({
      where: active !== undefined ? { active: active === 'true' } : undefined,
      orderBy: [{ qualityTier: 'desc' }, { name: 'asc' }],
      include: {
        supplierOffers: {
          include: { supplier: { select: { id: true, name: true } } },
        },
        _count: { select: { contractLines: true, inventoryLots: true } },
      },
    });
    res.json(skus);
  } catch (error) {
    console.error('Error fetching SKUs:', error);
    res.status(500).json({ error: 'Failed to fetch SKUs' });
  }
});

/**
 * GET /api/skus/:id
 * Get a single SKU
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const sku = await prisma.matchaSKU.findUnique({
      where: { id: req.params.id },
      include: {
        supplierOffers: { include: { supplier: true } },
        contractLines: { include: { client: true } },
        inventoryLots: { where: { qtyKgRemaining: { gt: 0 } } },
      },
    });

    if (!sku) {
      return res.status(404).json({ error: 'SKU not found' });
    }

    res.json(sku);
  } catch (error) {
    console.error('Error fetching SKU:', error);
    res.status(500).json({ error: 'Failed to fetch SKU' });
  }
});

/**
 * POST /api/skus
 * Create a new SKU
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = createSKUSchema.parse(req.body);

    const sku = await prisma.matchaSKU.create({
      data,
    });

    await createAuditLog({
      entityType: 'MatchaSKU',
      entityId: sku.id,
      action: 'CREATE',
      after: sku as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(201).json(sku);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating SKU:', error);
    res.status(500).json({ error: 'Failed to create SKU' });
  }
});

/**
 * PUT /api/skus/:id
 * Update a SKU
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = updateSKUSchema.parse(req.body);

    const existing = await prisma.matchaSKU.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'SKU not found' });
    }

    const sku = await prisma.matchaSKU.update({
      where: { id: req.params.id },
      data,
    });

    await createAuditLog({
      entityType: 'MatchaSKU',
      entityId: sku.id,
      action: 'UPDATE',
      before: existing as unknown as Record<string, unknown>,
      after: sku as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.json(sku);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating SKU:', error);
    res.status(500).json({ error: 'Failed to update SKU' });
  }
});

/**
 * DELETE /api/skus/:id
 * Delete a SKU (soft delete by setting active=false)
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.matchaSKU.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'SKU not found' });
    }

    // Soft delete
    const sku = await prisma.matchaSKU.update({
      where: { id: req.params.id },
      data: { active: false },
    });

    await createAuditLog({
      entityType: 'MatchaSKU',
      entityId: req.params.id,
      action: 'DELETE',
      before: existing as unknown as Record<string, unknown>,
      after: sku as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting SKU:', error);
    res.status(500).json({ error: 'Failed to delete SKU' });
  }
});

export default router;
