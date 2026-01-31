import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createAuditLog } from '../services/auditService.js';


const router = Router();

// Validation schemas
const createContractLineSchema = z.object({
  clientId: z.string().uuid(),
  skuId: z.string().uuid(),
  sellingSgdPerKg: z.number().positive(),
  discountPct: z.number().min(0).max(100).default(0),
  monthlyVolumeKg: z.number().positive(),
  deliveryFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('MONTHLY'),
  nextDeliveryDate: z.string().datetime().optional(),
});

const updateContractLineSchema = z.object({
  sellingSgdPerKg: z.number().positive().optional(),
  discountPct: z.number().min(0).max(100).optional(),
  monthlyVolumeKg: z.number().positive().optional(),
  deliveryFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  nextDeliveryDate: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/client-contract-lines
 * List all contract lines
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { clientId, skuId } = req.query;

    const lines = await prisma.clientContractLine.findMany({
      where: {
        ...(clientId && { clientId: clientId as string }),
        ...(skuId && { skuId: skuId as string }),
      },
      include: {
        client: { select: { id: true, name: true, segment: true } },
        sku: { select: { id: true, name: true, qualityTier: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(lines);
  } catch (error) {
    console.error('Error fetching contract lines:', error);
    res.status(500).json({ error: 'Failed to fetch contract lines' });
  }
});

/**
 * GET /api/client-contract-lines/:id
 * Get a single contract line
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const line = await prisma.clientContractLine.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        sku: {
          include: {
            supplierOffers: { include: { supplier: true } },
          },
        },
      },
    });

    if (!line) {
      return res.status(404).json({ error: 'Contract line not found' });
    }

    res.json(line);
  } catch (error) {
    console.error('Error fetching contract line:', error);
    res.status(500).json({ error: 'Failed to fetch contract line' });
  }
});

/**
 * POST /api/client-contract-lines
 * Create a new contract line
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = createContractLineSchema.parse(req.body);

    // Check if client and SKU exist
    const [client, sku] = await Promise.all([
      prisma.client.findUnique({ where: { id: data.clientId } }),
      prisma.matchaSKU.findUnique({ where: { id: data.skuId } }),
    ]);

    if (!client) {
      return res.status(400).json({ error: 'Client not found' });
    }
    if (!sku) {
      return res.status(400).json({ error: 'SKU not found' });
    }

    const line = await prisma.clientContractLine.create({
      data: {
        ...data,
        nextDeliveryDate: data.nextDeliveryDate ? new Date(data.nextDeliveryDate) : null,
      },
      include: {
        client: { select: { id: true, name: true } },
        sku: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      entityType: 'ClientContractLine',
      entityId: line.id,
      action: 'CREATE',
      after: line as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(201).json(line);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating contract line:', error);
    res.status(500).json({ error: 'Failed to create contract line' });
  }
});

/**
 * PUT /api/client-contract-lines/:id
 * Update a contract line
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = updateContractLineSchema.parse(req.body);

    const existing = await prisma.clientContractLine.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contract line not found' });
    }

    const line = await prisma.clientContractLine.update({
      where: { id: req.params.id },
      data: {
        ...data,
        nextDeliveryDate: data.nextDeliveryDate !== undefined 
          ? (data.nextDeliveryDate ? new Date(data.nextDeliveryDate) : null)
          : undefined,
      },
      include: {
        client: { select: { id: true, name: true } },
        sku: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      entityType: 'ClientContractLine',
      entityId: line.id,
      action: 'UPDATE',
      before: existing as unknown as Record<string, unknown>,
      after: line as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.json(line);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating contract line:', error);
    res.status(500).json({ error: 'Failed to update contract line' });
  }
});

/**
 * DELETE /api/client-contract-lines/:id
 * Delete a contract line
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.clientContractLine.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contract line not found' });
    }

    await prisma.clientContractLine.delete({
      where: { id: req.params.id },
    });

    await createAuditLog({
      entityType: 'ClientContractLine',
      entityId: req.params.id,
      action: 'DELETE',
      before: existing as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting contract line:', error);
    res.status(500).json({ error: 'Failed to delete contract line' });
  }
});

export default router;
