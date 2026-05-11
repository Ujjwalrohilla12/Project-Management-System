import { prisma } from '../configs/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess, sendError } from '../middleware/responseFormatter.js';
import { writeAuditLog, AUDIT_ACTIONS } from '../utils/auditLog.js';

export const getUserWorkspaces = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          members: { include: { user: true } },
          projects: {
            include: {
              members: { include: { user: true } },
              tasks: { include: { assignee: true, comments: { include: { user: true } } } },
              owner: true,
            },
          },
        },
      },
    },
  });

  const workspaces = memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }));

  sendSuccess(res, { workspaces });
});

export const createWorkspace = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { name, slug, image_url } = req.body;

  if (!name || !slug) return sendError(res, 'Name and slug are required');

  const workspace = await prisma.workspace.create({
    data: { id: slug, name, slug, ownerId: userId, image_url },
  });

  await prisma.workspaceMember.create({
    data: { userId, workspaceId: workspace.id, role: 'ADMIN' },
  });

  const full = await prisma.workspace.findUnique({
    where: { id: workspace.id },
    include: {
      members: { include: { user: true } },
      projects: {
        include: {
          members: { include: { user: true } },
          tasks: { include: { assignee: true, comments: { include: { user: true } } } },
          owner: true,
        },
      },
    },
  });

  writeAuditLog({
    workspaceId: full.id,
    actorId:     userId,
    action:      AUDIT_ACTIONS.ORG_CREATED,
    targetType:  'WORKSPACE',
    targetId:    full.id,
    targetName:  full.name,
  });

  sendSuccess(res, { workspace: full }, 'Workspace created successfully', 201);
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { id } = req.params;
  const { name, image_url } = req.body;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) return sendError(res, 'Workspace not found', 404);
  if (workspace.ownerId !== userId) return sendError(res, 'Only owner can update workspace', 403);

  const updated = await prisma.workspace.update({
    where: { id },
    data: { name, image_url },
    include: { members: { include: { user: true } } },
  });

  sendSuccess(res, { workspace: updated }, 'Workspace updated successfully');
});

export const addMember = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { id } = req.params;
  const { email, role = 'MEMBER' } = req.body;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!workspace) return sendError(res, 'Workspace not found', 404);

  const isAdmin = workspace.members.some((m) => m.userId === userId && m.role === 'ADMIN');
  if (!isAdmin) return sendError(res, 'Only admins can add members', 403);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return sendError(res, 'User not found', 404);

  const existing = workspace.members.find((m) => m.userId === user.id);
  if (existing) return sendError(res, 'User is already a member', 400);

  const member = await prisma.workspaceMember.create({
    data: { userId: user.id, workspaceId: id, role },
    include: { user: true },
  });

  sendSuccess(res, { member }, 'Member added successfully', 201);
});
