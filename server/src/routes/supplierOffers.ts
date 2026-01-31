import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createAuditLog } from '../services/auditService.js';

const router = Router();

// Validation schemas
const createOfferSchema = z.object({
  supplierId: z.string().uuid(),
  skuId: z.string().uuid(),
  costJpyPerKg: z.number().positive(),
  moqKg: z.number().positive().optional(),
  packSizeKg: z.number().positive().optional(),
});

const updateOfferSchema = z.object({
  costJpyPerKg: z.number().positive().optional(),
  moqKg: z.number().positive().optional(),
  packSizeKg: z.number().positive().optional(),
});

/**
 * GET /api/supplier-offers
 * List all supplier offers
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { supplierId, skuId } = req.query;

    const offers = await prisma.supplierSKUOffer.findMany({
      where: {
        ...(supplierId && { supplierId: supplierId as string }),
        ...(skuId && { skuId: skuId as string }),
      },
      include: {
        supplier: { select: { id: true, name: true, reliabilityScore: true, typicalLeadTimeDays: true } },
        sku: { select: { id: true, name: true, qualityTier: true } },
      },
      orderBy: { costJpyPerKg: 'asc' },
    });
    res.json(offers);
  } catch (error) {
    console.error('Error fetching supplier offers:', error);
    res.status(500).json({ error: 'Failed to fetch supplier offers' });
  }
});

/**
 * GET /api/supplier-offers/:id
 * Get a single supplier offer
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const offer = await prisma.supplierSKUOffer.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        sku: true,
      },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Supplier offer not found' });
    }

    res.json(offer);
  } catch (error) {
    console.error('Error fetching supplier offer:', error);
    res.status(500).json({ error: 'Failed to fetch supplier offer' });
  }
});

/**
 * POST /api/supplier-offers
 * Create a new supplier offer
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = createOfferSchema.parse(req.body);

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

    const offer = await prisma.supplierSKUOffer.create({
      data: {
        ...data,
        lastUpdatedAt: new Date(),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        sku: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      entityType: 'SupplierSKUOffer',
      entityId: offer.id,
      action: 'CREATE',
      after: offer as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(201).json(offer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating supplier offer:', error);
    res.status(500).json({ error: 'Failed to create supplier offer' });
  }
});

/**
 * PUT /api/supplier-offers/:id
 * Update a supplier offer
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = updateOfferSchema.parse(req.body);

    const existing = await prisma.supplierSKUOffer.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Supplier offer not found' });
    }

    const offer = await prisma.supplierSKUOffer.update({
      where: { id: req.params.id },
      data: {
        ...data,
        lastUpdatedAt: new Date(),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        sku: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      entityType: 'SupplierSKUOffer',
      entityId: offer.id,
      action: 'UPDATE',
      before: existing as unknown as Record<string, unknown>,
      after: offer as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.json(offer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating supplier offer:', error);
    res.status(500).json({ error: 'Failed to update supplier offer' });
  }
});

/**
 * DELETE /api/supplier-offers/:id
 * Delete a supplier offer
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.supplierSKUOffer.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Supplier offer not found' });
    }

    await prisma.supplierSKUOffer.delete({
      where: { id: req.params.id },
    });

    await createAuditLog({
      entityType: 'SupplierSKUOffer',
      entityId: req.params.id,
      action: 'DELETE',
      before: existing as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting supplier offer:', error);
    res.status(500).json({ error: 'Failed to delete supplier offer' });
  }
});

export default router;
