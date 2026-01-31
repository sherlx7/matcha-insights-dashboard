import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getAuditLogs, revertToVersion } from '../services/auditService.js';

const router = Router();

/**
 * GET /api/audit
 * Get audit logs
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { entity_type, entity_id, limit = '50' } = req.query;

    const logs = await getAuditLogs(
      entity_type as string | undefined,
      entity_id as string | undefined,
      Math.min(parseInt(limit as string), 100)
    );

    res.json({
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * POST /api/revert
 * Revert an entity to a previous state
 */
router.post('/revert', requireAuth, requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      auditLogId: z.string().uuid(),
    });
    const { auditLogId } = schema.parse(req.body);

    const result = await revertToVersion(auditLogId, req.user?.id);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error reverting change:', error);
    res.status(500).json({ error: 'Failed to revert change' });
  }
});

export default router;
