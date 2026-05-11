import { prisma } from '../configs/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess, sendError } from '../middleware/responseFormatter.js';
import { calcHealthScore } from '../utils/healthScore.js';
import { writeAuditLog, AUDIT_ACTIONS } from '../utils/auditLog.js';

// ── Shared include ─────────────────────────────────────────
const projectWithDetails = {
  include: {
    members: { include: { user: true } },
    tasks:   { include: { assignee: true, comments: { include: { user: true } } } },
    owner:   true,
  },
};

// ── Helper: compute & persist health score ─────────────────
async function refreshHealthScore(projectId) {
  const p = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: true },
  });
  if (!p) return;
  const score = calcHealthScore(p, p.tasks);
  await prisma.project.update({ where: { id: projectId }, data: { healthScore: score } });
  return score;
}

// ── GET /api/projects?workspaceId=&page=&limit=&search=&status=&priority=&sortBy=&sortOrder=&archived=
export const getProjects = asyncHandler(async (req, res) => {
  const {
    workspaceId, page = 1, limit = 20, search = '',
    status = 'ALL', priority = 'ALL',
    sortBy = 'createdAt', sortOrder = 'desc',
    archived = 'false',
  } = req.query;

  if (!workspaceId) return sendError(res, 'workspaceId is required', 400);

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const isArchived = archived === 'true';

  const where = {
    workspaceId,
    isArchived,
    ...(status   !== 'ALL' && { status }),
    ...(priority !== 'ALL' && { priority }),
    ...(search && {
      OR: [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      ...projectWithDetails,
      orderBy: { [sortBy]: sortOrder },
      skip:  (pageNum - 1) * limitNum,
      take:  limitNum,
    }),
    prisma.project.count({ where }),
  ]);

  sendSuccess(res, {
    projects,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

// ── GET /api/projects/:id ──────────────────────────────────
export const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await prisma.project.findUnique({ where: { id }, ...projectWithDetails });
  if (!project) return sendError(res, 'Project not found', 404);
  sendSuccess(res, { project });
});

// ── POST /api/projects ─────────────────────────────────────
export const createProject = asyncHandler(async (req, res) => {
  const { userId } = req;
  const { workspaceId, description, name, start_date, end_date, team_members, team_lead, progress, priority, status } = req.body;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: { include: { user: true } } },
  });
  if (!workspace) return sendError(res, 'Workspace not found', 404);

  const isAdmin = workspace.members.some((m) => m.userId === userId && m.role === 'ADMIN');
  if (!isAdmin) return sendError(res, 'Only workspace admins can create projects', 403);

  let teamLeadId = null;
  if (team_lead) {
    const leadUser = await prisma.user.findUnique({ where: { email: team_lead }, select: { id: true } });
    teamLeadId = leadUser?.id || null;
  }

  const project = await prisma.project.create({
    data: {
      workspaceId, name, description,
      start_date: start_date ? new Date(start_date) : null,
      end_date:   end_date   ? new Date(end_date)   : null,
      team_lead:  teamLeadId,
      progress:   progress || 0,
      priority:   priority || 'MEDIUM',
      status:     status   || 'PLANNING',
    },
  });

  if (team_members?.length > 0) {
    const membersToAdd = workspace.members
      .filter((m) => team_members.includes(m.user.email))
      .map((m) => ({ projectId: project.id, userId: m.userId }));
    if (membersToAdd.length > 0) {
      await prisma.projectMember.createMany({ data: membersToAdd, skipDuplicates: true });
    }
  }

  // Also add team lead as member if not already
  if (teamLeadId) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: teamLeadId } },
      update: {},
      create: { projectId: project.id, userId: teamLeadId },
    });
  }

  await refreshHealthScore(project.id);

  const full = await prisma.project.findUnique({ where: { id: project.id }, ...projectWithDetails });

  writeAuditLog({
    workspaceId,
    actorId:    userId,
    action:     'PROJECT_CREATED',
    targetType: 'PROJECT',
    targetId:   project.id,
    targetName: project.name,
  });

  sendSuccess(res, { project: full }, 'Project created successfully', 201);
});

// ── PUT /api/projects/:id ──────────────────────────────────
export const updateProject = asyncHandler(async (req, res) => {
  const { userId } = req;
  const { id } = req.params;
  const { description, name, status, start_date, end_date, progress, priority, workspaceId } = req.body;

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return sendError(res, 'Project not found', 404);

  const wsId = workspaceId || existing.workspaceId;
  const workspace = await prisma.workspace.findUnique({ where: { id: wsId }, include: { members: true } });
  if (!workspace) return sendError(res, 'Workspace not found', 404);

  const isAdmin = workspace.members.some((m) => m.userId === userId && m.role === 'ADMIN');
  const isLead  = existing.team_lead === userId;
  if (!isAdmin && !isLead) return sendError(res, 'Only project lead or workspace admin can update', 403);

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(status      !== undefined && { status }),
      ...(priority    !== undefined && { priority }),
      ...(progress    !== undefined && { progress }),
      ...(start_date  !== undefined && { start_date: start_date ? new Date(start_date) : null }),
      ...(end_date    !== undefined && { end_date:   end_date   ? new Date(end_date)   : null }),
    },
    ...projectWithDetails,
  });

  await refreshHealthScore(id);
  const withScore = await prisma.project.findUnique({ where: { id }, ...projectWithDetails });

  writeAuditLog({
    workspaceId: existing.workspaceId,
    actorId:     userId,
    action:      'PROJECT_UPDATED',
    targetType:  'PROJECT',
    targetId:    id,
    targetName:  updated.name,
    metadata:    { fields: Object.keys(req.body) },
  });

  sendSuccess(res, { project: withScore }, 'Project updated successfully');
});

// ── PATCH /api/projects/:id/archive ───────────────────────
export const archiveProject = asyncHandler(async (req, res) => {
  const { userId } = req;
  const { id } = req.params;
  const { isArchived } = req.body;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return sendError(res, 'Project not found', 404);

  const workspace = await prisma.workspace.findUnique({
    where: { id: project.workspaceId },
    include: { members: true },
  });
  const isAdmin = workspace?.members.some((m) => m.userId === userId && m.role === 'ADMIN');
  const isLead  = project.team_lead === userId;
  if (!isAdmin && !isLead) return sendError(res, 'Only project lead or workspace admin can archive', 403);

  const updated = await prisma.project.update({
    where: { id },
    data: { isArchived: Boolean(isArchived) },
    ...projectWithDetails,
  });

  writeAuditLog({
    workspaceId: project.workspaceId,
    actorId:     userId,
    action:      isArchived ? 'PROJECT_ARCHIVED' : 'PROJECT_UNARCHIVED',
    targetType:  'PROJECT',
    targetId:    id,
    targetName:  project.name,
  });

  sendSuccess(res, { project: updated }, isArchived ? 'Project archived' : 'Project restored');
});

// ── DELETE /api/projects/:id ───────────────────────────────
export const deleteProject = asyncHandler(async (req, res) => {
  const { userId } = req;
  const { id } = req.params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return sendError(res, 'Project not found', 404);

  const workspace = await prisma.workspace.findUnique({
    where: { id: project.workspaceId },
    include: { members: true },
  });
  const isAdmin = workspace?.members.some((m) => m.userId === userId && m.role === 'ADMIN');
  if (!isAdmin) return sendError(res, 'Only workspace admins can delete projects', 403);

  await prisma.project.delete({ where: { id } });

  writeAuditLog({
    workspaceId: project.workspaceId,
    actorId:     userId,
    action:      'PROJECT_DELETED',
    targetType:  'PROJECT',
    targetId:    id,
    targetName:  project.name,
  });

  sendSuccess(res, {}, 'Project deleted');
});

// ── POST /api/projects/:projectId/members ──────────────────
export const addMember = asyncHandler(async (req, res) => {
  const { userId } = req;
  const { projectId } = req.params;
  const { email } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: true } },
      workspace: { include: { members: true } },
    },
  });
  if (!project) return sendError(res, 'Project not found', 404);

  const isAdmin = project.workspace.members.some((m) => m.userId === userId && m.role === 'ADMIN');
  const isLead  = project.team_lead === userId;
  if (!isAdmin && !isLead) return sendError(res, 'Only project lead or workspace admin can add members', 403);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return sendError(res, 'User not found', 404);

  const alreadyMember = project.members.some((m) => m.userId === user.id);
  if (alreadyMember) return sendError(res, 'User is already a member', 400);

  const member = await prisma.projectMember.create({
    data: { projectId, userId: user.id },
    include: { user: true },
  });

  sendSuccess(res, { member }, 'Member added successfully', 201);
});

// ── DELETE /api/projects/:projectId/members/:memberId ──────
export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req;
  const { projectId, memberId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: { include: { members: true } } },
  });
  if (!project) return sendError(res, 'Project not found', 404);

  const isAdmin = project.workspace.members.some((m) => m.userId === userId && m.role === 'ADMIN');
  const isLead  = project.team_lead === userId;
  if (!isAdmin && !isLead) return sendError(res, 'Only project lead or workspace admin can remove members', 403);

  const member = await prisma.projectMember.findUnique({ where: { id: memberId } });
  if (!member || member.projectId !== projectId) return sendError(res, 'Member not found', 404);

  await prisma.projectMember.delete({ where: { id: memberId } });
  sendSuccess(res, {}, 'Member removed');
});

// ── GET /api/projects/:id/analytics ───────────────────────
export const getProjectAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: { include: { assignee: true } },
      members: { include: { user: true } },
    },
  });
  if (!project) return sendError(res, 'Project not found', 404);

  const now   = new Date();
  const tasks = project.tasks;
  const total = tasks.length;

  // Task breakdowns
  const byStatus   = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  const byType     = { TASK: 0, BUG: 0, FEATURE: 0, IMPROVEMENT: 0, OTHER: 0 };
  const byPriority = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  const byAssignee = {};

  tasks.forEach((t) => {
    if (byStatus[t.status]   !== undefined) byStatus[t.status]++;
    if (byType[t.type]       !== undefined) byType[t.type]++;
    if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
    if (t.assignee) {
      const key = t.assignee.id;
      if (!byAssignee[key]) byAssignee[key] = { user: t.assignee, total: 0, done: 0 };
      byAssignee[key].total++;
      if (t.status === 'DONE') byAssignee[key].done++;
    }
  });

  // Deadline info
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE').length;
  const daysLeft = project.end_date
    ? Math.ceil((new Date(project.end_date) - now) / (1000 * 60 * 60 * 24))
    : null;

  // Weekly task completion (last 8 weeks)
  const weeklyData = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const completed = tasks.filter(
      (t) => t.status === 'DONE' && t.updatedAt >= weekStart && t.updatedAt < weekEnd
    ).length;
    weeklyData.push({
      week: `W${8 - i}`,
      completed,
      date: weekStart.toISOString().split('T')[0],
    });
  }

  const healthScore = calcHealthScore(project, tasks);

  sendSuccess(res, {
    analytics: {
      total, overdue, daysLeft, healthScore,
      completionRate: total > 0 ? Math.round((byStatus.DONE / total) * 100) : 0,
      byStatus:   Object.entries(byStatus).map(([name, value]) => ({ name: name.replace('_', ' '), value })),
      byType:     Object.entries(byType).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
      byPriority: Object.entries(byPriority).map(([name, value]) => ({ name, value })),
      byAssignee: Object.values(byAssignee),
      weeklyCompletion: weeklyData,
    },
  });
});
