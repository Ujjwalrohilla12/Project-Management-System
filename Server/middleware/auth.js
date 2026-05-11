import { prisma } from '../configs/prisma.js';
import { sendError } from './responseFormatter.js';

// ── Role hierarchy ─────────────────────────────────────────
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
};

const ROLE_RANK = { ADMIN: 3, MANAGER: 2, MEMBER: 1 };

const hasRank = (userRole, requiredRole) =>
  (ROLE_RANK[userRole] || 0) >= (ROLE_RANK[requiredRole] || 0);

// ── protect ────────────────────────────────────────────────
// Verifies Clerk JWT. Attaches userId to req.
export const protect = async (req, res, next) => {
  try {
    const { userId } = await req.auth();
    if (!userId) return sendError(res, 'Unauthorized — please sign in', 401);
    req.userId = userId;
    next();
  } catch {
    sendError(res, 'Unauthorized — invalid or expired session', 401);
  }
};

// ── requireWorkspaceRole ───────────────────────────────────
// Usage: requireWorkspaceRole('ADMIN') or requireWorkspaceRole('MANAGER')
// Reads workspaceId from req.params.id | req.params.workspaceId | req.body.workspaceId
export const requireWorkspaceRole = (minRole = 'MEMBER') => async (req, res, next) => {
  try {
    const userId = req.userId;
    const workspaceId =
      req.params.id || req.params.workspaceId || req.body.workspaceId;

    if (!workspaceId) return sendError(res, 'Workspace ID is required', 400);

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!member) return sendError(res, 'You are not a member of this workspace', 403);
    if (!hasRank(member.role, minRole)) {
      return sendError(res, `Requires ${minRole} role or higher`, 403);
    }

    req.workspaceRole = member.role;
    next();
  } catch {
    sendError(res, 'Authorization check failed', 500);
  }
};

// ── requireProjectAccess ───────────────────────────────────
// Verifies user is a project member OR a workspace admin.
// Attaches req.projectRole = 'LEAD' | 'MEMBER' | 'WORKSPACE_ADMIN'
export const requireProjectAccess = async (req, res, next) => {
  try {
    const userId = req.userId;
    const projectId = req.params.projectId || req.params.id || req.body.projectId;

    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
        workspace: { include: { members: true } },
      },
    });

    if (!project) return sendError(res, 'Project not found', 404);

    const wsAdmin = project.workspace.members.find(
      (m) => m.userId === userId && m.role === 'ADMIN'
    );
    if (wsAdmin) {
      req.projectRole = 'WORKSPACE_ADMIN';
      req.project = project;
      return next();
    }

    const projectMember = project.members.find((m) => m.userId === userId);
    if (!projectMember) return sendError(res, 'You are not a member of this project', 403);

    req.projectRole = project.team_lead === userId ? 'LEAD' : 'MEMBER';
    req.project = project;
    next();
  } catch {
    sendError(res, 'Authorization check failed', 500);
  }
};

// ── requireProjectLead ─────────────────────────────────────
// Must run after requireProjectAccess
export const requireProjectLead = (req, res, next) => {
  if (req.projectRole === 'LEAD' || req.projectRole === 'WORKSPACE_ADMIN') return next();
  sendError(res, 'Only the project lead or workspace admin can perform this action', 403);
};
