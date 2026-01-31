import prisma from '../db/client.js';

// Use string type instead of Prisma enum
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: AuditAction;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  actorUserId?: string | null;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry) {
  return prisma.auditLog.create({
    data: {
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      beforeJson: entry.before ? JSON.stringify(entry.before) : null,
      afterJson: entry.after ? JSON.stringify(entry.after) : null,
      actorUserId: entry.actorUserId,
    },
  });
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(
  entityType?: string,
  entityId?: string,
  limit: number = 50
) {
  return prisma.auditLog.findMany({
    where: {
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      actor: {
        select: { id: true, email: true, name: true },
      },
    },
  });
}

/**
 * Revert an entity to a previous state
 */
export async function revertToVersion(
  auditLogId: string,
  actorUserId?: string
): Promise<{ success: boolean; message: string; data?: unknown }> {
  const auditLog = await prisma.auditLog.findUnique({
    where: { id: auditLogId },
  });

  if (!auditLog) {
    return { success: false, message: 'Audit log entry not found' };
  }

  if (!auditLog.beforeJson) {
    return { success: false, message: 'No previous state to revert to' };
  }

  const beforeState = JSON.parse(auditLog.beforeJson);
  const { entityType, entityId } = auditLog;

  try {
    let result: unknown;

    // Handle different entity types
    switch (entityType) {
      case 'InventoryLot':
        result = await prisma.inventoryLot.update({
          where: { id: entityId },
          data: {
            qtyKgRemaining: beforeState.qtyKgRemaining,
            costBasisSgdPerKg: beforeState.costBasisSgdPerKg,
            warehouseLocation: beforeState.warehouseLocation,
          },
        });
        break;

      case 'SupplierSKUOffer':
        result = await prisma.supplierSKUOffer.update({
          where: { id: entityId },
          data: {
            costJpyPerKg: beforeState.costJpyPerKg,
            moqKg: beforeState.moqKg,
          },
        });
        break;

      case 'Allocation':
        result = await prisma.allocation.update({
          where: { id: entityId },
          data: {
            qtyKgAllocated: beforeState.qtyKgAllocated,
            status: beforeState.status,
          },
        });
        break;

      case 'ClientContractLine':
        result = await prisma.clientContractLine.update({
          where: { id: entityId },
          data: {
            sellingSgdPerKg: beforeState.sellingSgdPerKg,
            discountPct: beforeState.discountPct,
            monthlyVolumeKg: beforeState.monthlyVolumeKg,
          },
        });
        break;

      case 'Supplier':
        result = await prisma.supplier.update({
          where: { id: entityId },
          data: {
            name: beforeState.name,
            country: beforeState.country,
            currency: beforeState.currency,
            typicalLeadTimeDays: beforeState.typicalLeadTimeDays,
            reliabilityScore: beforeState.reliabilityScore,
            minOrderKg: beforeState.minOrderKg,
            notes: beforeState.notes,
          },
        });
        break;

      case 'MatchaSKU':
        result = await prisma.matchaSKU.update({
          where: { id: entityId },
          data: {
            name: beforeState.name,
            qualityTier: beforeState.qualityTier,
            tastingNotes: beforeState.tastingNotes,
            intendedUse: beforeState.intendedUse,
            substitutableGroupId: beforeState.substitutableGroupId,
            active: beforeState.active,
          },
        });
        break;

      case 'Client':
        result = await prisma.client.update({
          where: { id: entityId },
          data: {
            name: beforeState.name,
            segment: beforeState.segment,
            defaultDiscountPct: beforeState.defaultDiscountPct,
            paymentTerms: beforeState.paymentTerms,
            notes: beforeState.notes,
          },
        });
        break;

      default:
        return { success: false, message: `Revert not supported for entity type: ${entityType}` };
    }

    // Log the revert action
    await createAuditLog({
      entityType,
      entityId,
      action: 'UPDATE',
      before: JSON.parse(auditLog.afterJson || '{}'),
      after: beforeState,
      actorUserId,
    });

    return { success: true, message: 'Successfully reverted to previous state', data: result };
  } catch (error) {
    console.error('Revert error:', error);
    return { success: false, message: 'Failed to revert: ' + (error as Error).message };
  }
}
