import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createAuditLog } from '../services/auditService.js';


const router = Router();

// Validation schemas
const createAllocationSchema = z.object({
  inventoryLotId: z.string().uuid(),
  clientId: z.string().uuid(),
  skuId: z.string().uuid(),
  qtyKgAllocated: z.number().positive(),
  status: z.enum(['RESERVED', 'FULFILLED', 'RELEASED']).default('RESERVED'),
});

const updateAllocationSchema = z.object({
  qtyKgAllocated: z.number().positive().optional(),
  status: z.enum(['RESERVED', 'FULFILLED', 'RELEASED']).optional(),
});

/**
 * GET /api/allocations
 * List all allocations
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { clientId, skuId, inventoryLotId, status } = req.query;

    const allocations = await prisma.allocation.findMany({
      where: {
        ...(clientId && { clientId: clientId as string }),
        ...(skuId && { skuId: skuId as string }),
        ...(inventoryLotId && { inventoryLotId: inventoryLotId as string }),
        ...(status && { status: status as string }),
      },
      include: {
        client: { select: { id: true, name: true } },
        sku: { select: { id: true, name: true, qualityTier: true } },
        inventoryLot: { select: { id: true, qtyKgRemaining: true, arrivedAt: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

/**
 * GET /api/allocations/:id
 * Get a single allocation
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const allocation = await prisma.allocation.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        sku: true,
        inventoryLot: { include: { supplier: true } },
      },
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    res.json(allocation);
  } catch (error) {
    console.error('Error fetching allocation:', error);
    res.status(500).json({ error: 'Failed to fetch allocation' });
  }
});

/**
 * POST /api/allocations
 * Create a new allocation
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = createAllocationSchema.parse(req.body);

    // Check if inventory lot, client, and SKU exist
    const [lot, client, sku] = await Promise.all([
      prisma.inventoryLot.findUnique({ where: { id: data.inventoryLotId } }),
      prisma.client.findUnique({ where: { id: data.clientId } }),
      prisma.matchaSKU.findUnique({ where: { id: data.skuId } }),
    ]);

    if (!lot) {
      return res.status(400).json({ error: 'Inventory lot not found' });
    }
    if (!client) {
      return res.status(400).json({ error: 'Client not found' });
    }
    if (!sku) {
      return res.status(400).json({ error: 'SKU not found' });
    }

    // Verify SKU matches lot
    if (lot.skuId !== data.skuId) {
      return res.status(400).json({ error: 'SKU does not match inventory lot' });
    }

    // Check available quantity
    const existingAllocations = await prisma.allocation.aggregate({
      where: { inventoryLotId: data.inventoryLotId },
      _sum: { qtyKgAllocated: true },
    });
    const totalAllocated = existingAllocations._sum.qtyKgAllocated || 0;
    const available = lot.qtyKgRemaining - totalAllocated;

    if (data.qtyKgAllocated > available) {
      return res.status(400).json({ 
        error: `Insufficient inventory. Available: ${available.toFixed(2)}kg` 
      });
    }

    const allocation = await prisma.allocation.create({
      data,
      include: {
        client: { select: { id: true, name: true } },
        sku: { select: { id: true, name: true } },
        inventoryLot: { select: { id: true, qtyKgRemaining: true } },
      },
    });

    await createAuditLog({
      entityType: 'Allocation',
      entityId: allocation.id,
      action: 'CREATE',
      after: allocation as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(201).json(allocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating allocation:', error);
    res.status(500).json({ error: 'Failed to create allocation' });
  }
});

/**
 * PUT /api/allocations/:id
 * Update an allocation
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = updateAllocationSchema.parse(req.body);

    const existing = await prisma.allocation.findUnique({
      where: { id: req.params.id },
      include: { inventoryLot: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // If updating quantity, check availability
    if (data.qtyKgAllocated !== undefined) {
      const otherAllocations = await prisma.allocation.aggregate({
        where: { 
          inventoryLotId: existing.inventoryLotId,
          id: { not: req.params.id },
        },
        _sum: { qtyKgAllocated: true },
      });
      const otherAllocated = otherAllocations._sum.qtyKgAllocated || 0;
      const available = existing.inventoryLot.qtyKgRemaining - otherAllocated;

      if (data.qtyKgAllocated > available) {
        return res.status(400).json({ 
          error: `Insufficient inventory. Available: ${available.toFixed(2)}kg` 
        });
      }
    }

    const allocation = await prisma.allocation.update({
      where: { id: req.params.id },
      data,
      include: {
        client: { select: { id: true, name: true } },
        sku: { select: { id: true, name: true } },
        inventoryLot: { select: { id: true, qtyKgRemaining: true } },
      },
    });

    await createAuditLog({
      entityType: 'Allocation',
      entityId: allocation.id,
      action: 'UPDATE',
      before: existing as unknown as Record<string, unknown>,
      after: allocation as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.json(allocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating allocation:', error);
    res.status(500).json({ error: 'Failed to update allocation' });
  }
});

/**
 * DELETE /api/allocations/:id
 * Delete an allocation
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.allocation.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    await prisma.allocation.delete({
      where: { id: req.params.id },
    });

    await createAuditLog({
      entityType: 'Allocation',
      entityId: req.params.id,
      action: 'DELETE',
      before: existing as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting allocation:', error);
    res.status(500).json({ error: 'Failed to delete allocation' });
  }
});

export default router;
