import { prisma } from '../utils/prisma.js';

export async function logAudit(actor, action, entity, entityId, details) {
  try {
    await prisma.auditLog.create({
      data: {
        actor: actor || 'system',
        action,
        entity: entity || null,
        entityId: entityId ? String(entityId) : null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (e) {
    console.error('[audit] failed', e.message);
  }
}
