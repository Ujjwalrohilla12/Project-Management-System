import { z } from 'zod';

// ── Primitives ─────────────────────────────────────────────
const nonEmptyString = (label) =>
  z.string({ required_error: `${label} is required` }).trim().min(1, `${label} cannot be empty`);

// ── Workspace ──────────────────────────────────────────────
export const createWorkspaceSchema = z.object({
  name: nonEmptyString('Name').max(80),
  slug: nonEmptyString('Slug')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export const updateWorkspaceSchema = z.object({
  name: nonEmptyString('Name').max(80).optional(),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export const addWorkspaceMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).default('MEMBER'),
});

// ── Project ────────────────────────────────────────────────
export const createProjectSchema = z.object({
  workspaceId: nonEmptyString('Workspace ID'),
  name: nonEmptyString('Project name').max(120),
  description: z.string().max(1000).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  start_date: z.string().datetime({ offset: true }).optional().or(z.string().date()).optional(),
  end_date: z.string().datetime({ offset: true }).optional().or(z.string().date()).optional(),
  team_lead: z.string().email('Invalid team lead email').optional().or(z.literal('')),
  team_members: z.array(z.string().email()).default([]),
  progress: z.number().int().min(0).max(100).default(0),
});

export const updateProjectSchema = z.object({
  workspaceId: nonEmptyString('Workspace ID').optional(),
  name: nonEmptyString('Project name').max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
});

export const addProjectMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const deleteProjectSchema = z.object({
  workspaceId: nonEmptyString('Workspace ID'),
});

export const archiveProjectSchema = z.object({
  workspaceId: nonEmptyString('Workspace ID'),
  isArchived: z.boolean(),
});

export const listProjectsSchema = z.object({
  workspaceId: nonEmptyString('Workspace ID'),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
  search:     z.string().max(100).optional(),
  status:     z.enum(['PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED','ALL']).default('ALL'),
  priority:   z.enum(['LOW','MEDIUM','HIGH','ALL']).default('ALL'),
  sortBy:     z.enum(['createdAt','name','end_date','progress','healthScore']).default('createdAt'),
  sortOrder:  z.enum(['asc','desc']).default('desc'),
  archived:   z.coerce.boolean().default(false),
});

// ── Task ───────────────────────────────────────────────────
export const createTaskSchema = z.object({
  projectId:      nonEmptyString('Project ID'),
  parentId:       z.string().optional().nullable(),
  title:          nonEmptyString('Title').max(200),
  description:    z.string().max(5000).optional(),
  type:           z.enum(['TASK','BUG','FEATURE','IMPROVEMENT','OTHER']).default('TASK'),
  status:         z.enum(['TODO','IN_PROGRESS','DONE']).default('TODO'),
  priority:       z.enum(['LOW','MEDIUM','HIGH']).default('MEDIUM'),
  assigneeId:     z.string().optional().nullable(),
  due_date:       z.string().optional().nullable(),
  estimatedHours: z.number().min(0).max(9999).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title:          z.string().max(200).optional(),
  description:    z.string().max(5000).optional().nullable(),
  type:           z.enum(['TASK','BUG','FEATURE','IMPROVEMENT','OTHER']).optional(),
  status:         z.enum(['TODO','IN_PROGRESS','DONE']).optional(),
  priority:       z.enum(['LOW','MEDIUM','HIGH']).optional(),
  assigneeId:     z.string().optional().nullable(),
  due_date:       z.string().optional().nullable(),
  estimatedHours: z.number().min(0).max(9999).optional().nullable(),
  actualHours:    z.number().min(0).max(9999).optional().nullable(),
  order:          z.number().int().min(0).optional(),
});

export const deleteTaskSchema = z.object({
  taskIds: z.array(z.string().min(1)).min(1, 'At least one task ID is required'),
});

export const moveTaskSchema = z.object({
  status: z.enum(['TODO','IN_PROGRESS','DONE']),
  order:  z.number().int().min(0),
});

export const createSubtaskSchema = z.object({
  title:       nonEmptyString('Title').max(200),
  description: z.string().max(2000).optional(),
  assigneeId:  z.string().optional().nullable(),
  due_date:    z.string().optional().nullable(),
  priority:    z.enum(['LOW','MEDIUM','HIGH']).default('MEDIUM'),
});

export const addAttachmentSchema = z.object({
  name:     nonEmptyString('File name').max(255),
  url:      z.string().url('Invalid URL'),
  size:     z.number().int().min(0).optional(),
  mimeType: z.string().max(100).optional(),
});

export const setRecurringSchema = z.object({
  frequency: z.enum(['DAILY','WEEKLY','BIWEEKLY','MONTHLY']),
  interval:  z.number().int().min(1).max(365).default(1),
  nextDue:   z.string().datetime({ offset: true }),
  isActive:  z.boolean().default(true),
});

export const updateCommentSchema = z.object({
  content: nonEmptyString('Content').max(5000),
});

// ── Comment ────────────────────────────────────────────────
export const addCommentSchema = z.object({
  taskId: nonEmptyString('Task ID'),
  content: nonEmptyString('Content').max(5000),
});

// ── Organization (Workspace extended) ─────────────────────
export const updateOrgSettingsSchema = z.object({
  name: nonEmptyString('Name').max(80).optional(),
  description: z.string().max(500).optional().or(z.literal('')),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER'], { required_error: 'Role is required' }),
});

export const sendInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).default('MEMBER'),
});

export const cancelInvitationSchema = z.object({
  invitationId: nonEmptyString('Invitation ID'),
});

export const updateNotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  taskAssigned: z.boolean().optional(),
  taskDue: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
  teamMentions: z.boolean().optional(),
  deadlineReminders: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
});

export const orgPaginationSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  role:   z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'ALL']).default('ALL'),
});
