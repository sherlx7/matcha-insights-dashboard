import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createAuditLog } from '../services/auditService.js';

const router = Router();

// Validation schemas
const createInventoryLotSchema = z.object({
  supplierId: z.string().uuid(),
  skuId: z.string().uuid(),
  arrivedAt: z.string().datetime(),
  qtyKgTotal: z.number().positive(),
  qtyKgRemaining: z.number().min(0).optional(),
  costBasisSgdPerKg: z.number().positive(),
  warehouseLocation: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
});

const updateInventoryLotSchema = z.object({
  qtyKgRemaining: z.number().min(0).optional(),
  warehouseLocation: z.string().optional(),
  expiryDate: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/inventory-lots
 * List all inventory lots
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { skuId, supplierId, hasStock } = req.query;

    const lots = await prisma.inventoryLot.findMany({
      where: {
        ...(skuId && { skuId: skuId as string }),
        ...(supplierId && { supplierId: supplierId as string }),
        ...(hasStock === 'true' && { qtyKgRemaining: { gt: 0 } }),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        sku: { select: { id: true, name: true, qualityTier: true } },
        _count: { select: { allocations: true } },
      },
      orderBy: { arrivedAt: 'desc' },
    });
    res.json(lots);
  } catch (error) {
    console.error('Error fetching inventory lots:', error);
    res.status(500).json({ error: 'Failed to fetch inventory lots' });
  }
});

/**
 * GET /api/inventory-lots/:id
 * Get a single inventory lot
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const lot = await prisma.inventoryLot.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        sku: true,
        allocations: {
          include: { client: true },
        },
      },
    });

    if (!lot) {
      return res.status(404).json({ error: 'Inventory lot not found' });
    }

    res.json(lot);
  } catch (error) {
    console.error('Error fetching inventory lot:', error);
    res.status(500).json({ error: 'Failed to fetch inventory lot' });
  }
});

/**
 * POST /api/inventory-lots
 * Create a new inventory lot
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = createInventoryLotSchema.parse(req.body);

    // Check if supplier and SKU exist
    const [supplier, sku] = await Promise.all([
      prisma.supplier.findUnique({ where: { id: data.supplierId } }),
      prisma.matchaSKU.findUnique({ where: { id: data.skuId } }),
    ]);

    if (!supplier) {
      return res.status(400).json({ error: 'Supplier not found' });
    }
    if (!sku) {
      return res.status(400).json({ error: 'SKU not found' });
    }

    const lot = await prisma.inventoryLot.create({
      data: {
        ...data,
        arrivedAt: new Date(data.arrivedAt),
        qtyKgRemaining: data.qtyKgRemaining ?? data.qtyKgTotal,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
      include: {
        supplier: { select: { id: true, name: true } },
        sku: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      entityType: 'InventoryLot',
      entityId: lot.id,
      action: 'CREATE',
      after: lot as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(201).json(lot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating inventory lot:', error);
    res.status(500).json({ error: 'Failed to create inventory lot' });
  }
});

/**
 * PUT /api/inventory-lots/:id
 * Update an inventory lot
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = updateInventoryLotSchema.parse(req.body);

    const existing = await prisma.inventoryLot.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory lot not found' });
    }

    const lot = await prisma.inventoryLot.update({
      where: { id: req.params.id },
      data: {
        ...data,
        expiryDate: data.expiryDate !== undefined 
          ? (data.expiryDate ? new Date(data.expiryDate) : null)
          : undefined,
      },
      include: {
        supplier: { select: { id: true, name: true } },
        sku: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      entityType: 'InventoryLot',
      entityId: lot.id,
      action: 'UPDATE',
      before: existing as unknown as Record<string, unknown>,
      after: lot as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.json(lot);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating inventory lot:', error);
    res.status(500).json({ error: 'Failed to update inventory lot' });
  }
});

/**
 * DELETE /api/inventory-lots/:id
 * Delete an inventory lot
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.inventoryLot.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory lot not found' });
    }

    await prisma.inventoryLot.delete({
      where: { id: req.params.id },
    });

    await createAuditLog({
      entityType: 'InventoryLot',
      entityId: req.params.id,
      action: 'DELETE',
      before: existing as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inventory lot:', error);
    res.status(500).json({ error: 'Failed to delete inventory lot' });
  }
});

export default router;
