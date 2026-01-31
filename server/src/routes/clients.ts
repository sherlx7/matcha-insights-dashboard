import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createAuditLog } from '../services/auditService.js';


const router = Router();

// Validation schemas
const createClientSchema = z.object({
  name: z.string().min(1),
  segment: z.enum(['CAFE', 'BRAND', 'OTHER']).default('CAFE'),
  defaultDiscountPct: z.number().min(0).max(100).default(0),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial();

/**
 * GET /api/clients
 * List all clients
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { segment } = req.query;

    const clients = await prisma.client.findMany({
      where: segment ? { segment: segment as string } : undefined,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { contractLines: true, allocations: true } },
      },
    });
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

/**
 * GET /api/clients/:id
 * Get a single client
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        contractLines: {
          include: { sku: true },
        },
        allocations: {
          include: {
            inventoryLot: true,
            sku: true,
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

/**
 * POST /api/clients
 * Create a new client
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = createClientSchema.parse(req.body);

    const client = await prisma.client.create({
      data,
    });

    await createAuditLog({
      entityType: 'Client',
      entityId: client.id,
      action: 'CREATE',
      after: client as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(201).json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

/**
 * PUT /api/clients/:id
 * Update a client
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = updateClientSchema.parse(req.body);

    const existing = await prisma.client.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data,
    });

    await createAuditLog({
      entityType: 'Client',
      entityId: client.id,
      action: 'UPDATE',
      before: existing as unknown as Record<string, unknown>,
      after: client as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

/**
 * DELETE /api/clients/:id
 * Delete a client
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.client.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await prisma.client.delete({
      where: { id: req.params.id },
    });

    await createAuditLog({
      entityType: 'Client',
      entityId: req.params.id,
      action: 'DELETE',
      before: existing as unknown as Record<string, unknown>,
      actorUserId: req.user?.id,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;
