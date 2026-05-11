import { prisma } from '../configs/prisma.js';

/**
 * Write an audit log entry. Fire-and-forget — errors are swallowed
 * so they never break the main request flow.
 */
export const writeAuditLog = (opts) => {
  prisma.auditLog
    .create({
      data: {
        workspaceId: opts.workspaceId,
        actorId:     opts.actorId,
        action:      opts.action,
        targetType:  opts.targetType,
        targetId:    opts.targetId   || null,
        targetName:  opts.targetName || null,
        metadata:    opts.metadata   || undefined,
      },
    })
    .catch((err) => console.error('[AuditLog] write failed:', err.message));
};

export const AUDIT_ACTIONS = {
  ORG_CREATED:          'ORG_CREATED',
  ORG_UPDATED:          'ORG_UPDATED',
  MEMBER_INVITED:       'MEMBER_INVITED',
  MEMBER_JOINED:        'MEMBER_JOINED',
  MEMBER_REMOVED:       'MEMBER_REMOVED',
  MEMBER_ROLE_UPDATED:  'MEMBER_ROLE_UPDATED',
  INVITATION_CANCELLED: 'INVITATION_CANCELLED',
  INVITATION_RESENT:    'INVITATION_RESENT',
};
