import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createAuditLog } from '../services/auditService.js';

const router = Router();

// Validation schemas
const createSupplierSchema = z.object({
  name: z.string().min(1),
  country: z.string().default('Japan'),
  currency: z.string().default('JPY'),
  typicalLeadTimeDays: z.number().int().positive().default(21),
  reliabilityScore: z.number().min(0).max(1).default(0.9),
  minOrderKg: z.number().positive().default(10),
  notes: z.string().optional(),
});

const updateSupplierSchema = createSupplierSchema.partial();

/**
 * GET /api/suppliers
 * List all suppliers
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { skuOffers: true, inventoryLots: true } },
      },
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

/**
 * GET /api/suppliers/:id
 * Get a single supplier
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        skuOffers: { include: { sku: true } },
        inventoryLots: { where: { qtyKgRemaining: { gt: 0 } } },
        orderPlans: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

/**
 * POST /api/suppliers
 * Create a new supplier
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = createSupplierSchema.parse(req.body);

    const supplier = await prisma.supplier.create({
      data,
    });

    await createAuditLog({
      entityType: 'Supplier',
      entityId: supplier.id,
      action: 'CREATE',
      after: supplier as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(201).json(supplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

/**
 * PUT /api/suppliers/:id
 * Update a supplier
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = updateSupplierSchema.parse(req.body);

    const existing = await prisma.supplier.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data,
    });

    await createAuditLog({
      entityType: 'Supplier',
      entityId: supplier.id,
      action: 'UPDATE',
      before: existing as unknown as Record<string, unknown>,
      after: supplier as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.json(supplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

/**
 * DELETE /api/suppliers/:id
 * Delete a supplier
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.supplier.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await prisma.supplier.delete({
      where: { id: req.params.id },
    });

    await createAuditLog({
      entityType: 'Supplier',
      entityId: req.params.id,
      action: 'DELETE',
      before: existing as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;
