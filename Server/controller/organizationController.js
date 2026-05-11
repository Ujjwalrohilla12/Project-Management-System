import { prisma } from '../configs/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess, sendError } from '../middleware/responseFormatter.js';
import { writeAuditLog, AUDIT_ACTIONS } from '../utils/auditLog.js';

// ── shared workspace include ───────────────────────────────
const wsBase = {
  include: {
    members: { include: { user: true }, orderBy: { createdAt: 'asc' } },
  },
};

// ── GET /api/org/:id ───────────────────────────────────────
export const getOrg = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    ...wsBase,
  });
  if (!workspace) return sendError(res, 'Organization not found', 404);
  sendSuccess(res, { org: workspace });
});

// ── PUT /api/org/:id ───────────────────────────────────────
export const updateOrg = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, image_url } = req.body;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return sendError(res, 'Organization not found', 404);
  if (workspace.ownerId !== req.userId) return sendError(res, 'Only the owner can update organization settings', 403);

  const updated = await prisma.workspace.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(image_url   !== undefined && { image_url }),
    },
    ...wsBase,
  });

  writeAuditLog({
    workspaceId: id,
    actorId:     req.userId,
    action:      AUDIT_ACTIONS.ORG_UPDATED,
    targetType:  'WORKSPACE',
    targetId:    id,
    targetName:  updated.name,
    metadata:    { fields: Object.keys(req.body) },
  });

  sendSuccess(res, { org: updated }, 'Organization updated');
});

// ── GET /api/org/:id/members ───────────────────────────────
// Query: page, limit, search, role
export const getMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, search = '', role = 'ALL' } = req.query;

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;

  // Build user filter
  const userWhere = search
    ? {
        OR: [
          { name:  { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : undefined;

  const memberWhere = {
    workspaceId: id,
    ...(role !== 'ALL' && { role }),
    ...(userWhere && { user: userWhere }),
  };

  const [members, total] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: memberWhere,
      include: { user: true },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limitNum,
    }),
    prisma.workspaceMember.count({ where: memberWhere }),
  ]);

  sendSuccess(res, {
    members,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// ── PUT /api/org/:id/members/:memberId/role ────────────────
export const updateMemberRole = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;
  const { role } = req.body;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return sendError(res, 'Organization not found', 404);

  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
    include: { user: true },
  });
  if (!member || member.workspaceId !== id) return sendError(res, 'Member not found', 404);

  // Cannot change the owner's role
  if (member.userId === workspace.ownerId) return sendError(res, 'Cannot change the owner\'s role', 403);
  // Cannot demote yourself if you are the only admin
  if (member.userId === req.userId && role !== 'ADMIN') {
    const adminCount = await prisma.workspaceMember.count({ where: { workspaceId: id, role: 'ADMIN' } });
    if (adminCount <= 1) return sendError(res, 'Cannot remove the last admin', 400);
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
    include: { user: true },
  });

  writeAuditLog({
    workspaceId: id,
    actorId:     req.userId,
    action:      AUDIT_ACTIONS.MEMBER_ROLE_UPDATED,
    targetType:  'USER',
    targetId:    member.userId,
    targetName:  member.user.email,
    metadata:    { from: member.role, to: role },
  });

  sendSuccess(res, { member: updated }, 'Role updated');
});

// ── DELETE /api/org/:id/members/:memberId ──────────────────
export const removeMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return sendError(res, 'Organization not found', 404);

  const member = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
    include: { user: true },
  });
  if (!member || member.workspaceId !== id) return sendError(res, 'Member not found', 404);

  // Owner cannot be removed
  if (member.userId === workspace.ownerId) return sendError(res, 'Cannot remove the workspace owner', 403);

  // Only admins can remove others; members can remove themselves
  const isSelf = member.userId === req.userId;
  if (!isSelf) {
    const actor = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.userId, workspaceId: id } },
    });
    if (!actor || actor.role !== 'ADMIN') return sendError(res, 'Only admins can remove members', 403);
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  writeAuditLog({
    workspaceId: id,
    actorId:     req.userId,
    action:      AUDIT_ACTIONS.MEMBER_REMOVED,
    targetType:  'USER',
    targetId:    member.userId,
    targetName:  member.user.email,
    metadata:    { removedSelf: isSelf },
  });

  sendSuccess(res, {}, 'Member removed');
});

// ── POST /api/org/:id/invitations ──────────────────────────
export const sendInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, role = 'MEMBER' } = req.body;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: { include: { user: true } } },
  });
  if (!workspace) return sendError(res, 'Organization not found', 404);

  // Check not already a member
  const alreadyMember = workspace.members.some((m) => m.user.email === email);
  if (alreadyMember) return sendError(res, 'User is already a member', 400);

  // Upsert invitation (re-send resets token + expiry)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.upsert({
    where: { workspaceId_email: { workspaceId: id, email } },
    update: {
      role,
      status:    'PENDING',
      token:     crypto.randomUUID(),
      expiresAt,
    },
    create: {
      workspaceId: id,
      email,
      role,
      expiresAt,
    },
  });

  writeAuditLog({
    workspaceId: id,
    actorId:     req.userId,
    action:      AUDIT_ACTIONS.MEMBER_INVITED,
    targetType:  'INVITATION',
    targetId:    invitation.id,
    targetName:  email,
    metadata:    { role },
  });

  sendSuccess(res, { invitation }, 'Invitation sent', 201);
});

// ── GET /api/org/:id/invitations ───────────────────────────
export const getInvitations = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status = 'PENDING' } = req.query;

  const where = {
    workspaceId: id,
    ...(status !== 'ALL' && { status }),
  };

  const invitations = await prisma.invitation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { invitations });
});

// ── DELETE /api/org/:id/invitations/:invitationId ──────────
export const cancelInvitation = asyncHandler(async (req, res) => {
  const { id, invitationId } = req.params;

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.workspaceId !== id) return sendError(res, 'Invitation not found', 404);
  if (invitation.status !== 'PENDING') return sendError(res, 'Invitation is no longer pending', 400);

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'CANCELLED' },
  });

  writeAuditLog({
    workspaceId: id,
    actorId:     req.userId,
    action:      AUDIT_ACTIONS.INVITATION_CANCELLED,
    targetType:  'INVITATION',
    targetId:    invitationId,
    targetName:  invitation.email,
  });

  sendSuccess(res, {}, 'Invitation cancelled');
});

// ── POST /api/org/invitations/accept ──────────────────────
// Called after user signs up/in — accepts invite by token
export const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) return sendError(res, 'Invalid invitation token', 404);
  if (invitation.status !== 'PENDING') return sendError(res, 'Invitation is no longer valid', 400);
  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    return sendError(res, 'Invitation has expired', 410);
  }

  // Verify the signed-in user's email matches the invitation
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return sendError(res, 'User not found', 404);
  if (user.email !== invitation.email) return sendError(res, 'This invitation was sent to a different email address', 403);

  // Check not already a member
  const existing = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: req.userId, workspaceId: invitation.workspaceId } },
  });
  if (existing) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'ACCEPTED' } });
    return sendSuccess(res, {}, 'Already a member');
  }

  // Add member + mark invitation accepted in a transaction
  const [member] = await prisma.$transaction([
    prisma.workspaceMember.create({
      data: { userId: req.userId, workspaceId: invitation.workspaceId, role: invitation.role },
      include: { user: true, workspace: true },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    }),
  ]);

  writeAuditLog({
    workspaceId: invitation.workspaceId,
    actorId:     req.userId,
    action:      AUDIT_ACTIONS.MEMBER_JOINED,
    targetType:  'USER',
    targetId:    req.userId,
    targetName:  user.email,
    metadata:    { via: 'invitation', role: invitation.role },
  });

  sendSuccess(res, { member }, 'Joined organization successfully');
});

// ── GET /api/org/:id/analytics ─────────────────────────────
export const getOrgAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      members: true,
      projects: {
        include: { tasks: true },
      },
    },
  });
  if (!workspace) return sendError(res, 'Organization not found', 404);

  const allTasks = workspace.projects.flatMap((p) => p.tasks);
  const now = new Date();

  const analytics = {
    totalMembers:      workspace.members.length,
    membersByRole: {
      ADMIN:   workspace.members.filter((m) => m.role === 'ADMIN').length,
      MANAGER: workspace.members.filter((m) => m.role === 'MANAGER').length,
      MEMBER:  workspace.members.filter((m) => m.role === 'MEMBER').length,
    },
    totalProjects:     workspace.projects.length,
    projectsByStatus: {
      PLANNING:  workspace.projects.filter((p) => p.status === 'PLANNING').length,
      ACTIVE:    workspace.projects.filter((p) => p.status === 'ACTIVE').length,
      ON_HOLD:   workspace.projects.filter((p) => p.status === 'ON_HOLD').length,
      COMPLETED: workspace.projects.filter((p) => p.status === 'COMPLETED').length,
      CANCELLED: workspace.projects.filter((p) => p.status === 'CANCELLED').length,
    },
    totalTasks:        allTasks.length,
    tasksByStatus: {
      TODO:        allTasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      DONE:        allTasks.filter((t) => t.status === 'DONE').length,
    },
    overdueTasks: allTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE'
    ).length,
    completionRate: allTasks.length
      ? Math.round((allTasks.filter((t) => t.status === 'DONE').length / allTasks.length) * 100)
      : 0,
  };

  sendSuccess(res, { analytics });
});

// ── GET /api/org/:id/audit-log ─────────────────────────────
export const getAuditLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 30 } = req.query;

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { workspaceId: id },
      include: { actor: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: 'desc' },
      skip:  (pageNum - 1) * limitNum,
      take:  limitNum,
    }),
    prisma.auditLog.count({ where: { workspaceId: id } }),
  ]);

  sendSuccess(res, {
    logs,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});
