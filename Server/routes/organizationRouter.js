import express from 'express';
import {
  getOrg,
  updateOrg,
  getMembers,
  updateMemberRole,
  removeMember,
  sendInvitation,
  getInvitations,
  cancelInvitation,
  acceptInvitation,
  getOrgAnalytics,
  getAuditLog,
} from '../controller/organizationController.js';
import { validate } from '../middleware/validate.js';
import { requireWorkspaceRole } from '../middleware/auth.js';
import {
  updateOrgSettingsSchema,
  updateMemberRoleSchema,
  sendInvitationSchema,
} from '../middleware/schemas.js';

const router = express.Router();

// ── Org settings ───────────────────────────────────────────
router.get('/:id',    requireWorkspaceRole('MEMBER'), getOrg);
router.put('/:id',    requireWorkspaceRole('ADMIN'),  validate(updateOrgSettingsSchema), updateOrg);

// ── Members ────────────────────────────────────────────────
router.get('/:id/members',                    requireWorkspaceRole('MEMBER'), getMembers);
router.put('/:id/members/:memberId/role',     requireWorkspaceRole('ADMIN'),  validate(updateMemberRoleSchema), updateMemberRole);
router.delete('/:id/members/:memberId',       requireWorkspaceRole('MEMBER'), removeMember);

// ── Invitations ────────────────────────────────────────────
router.get('/:id/invitations',                requireWorkspaceRole('ADMIN'),  getInvitations);
router.post('/:id/invitations',               requireWorkspaceRole('ADMIN'),  validate(sendInvitationSchema), sendInvitation);
router.delete('/:id/invitations/:invitationId', requireWorkspaceRole('ADMIN'), cancelInvitation);

// ── Accept invitation (any authenticated user) ─────────────
router.post('/invitations/accept', acceptInvitation);

// ── Analytics ──────────────────────────────────────────────
router.get('/:id/analytics', requireWorkspaceRole('MEMBER'), getOrgAnalytics);

// ── Audit log ──────────────────────────────────────────────
router.get('/:id/audit-log', requireWorkspaceRole('ADMIN'), getAuditLog);

export default router;
