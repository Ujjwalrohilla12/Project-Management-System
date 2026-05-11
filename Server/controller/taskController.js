import { prisma } from '../configs/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess, sendError } from '../middleware/responseFormatter.js';

const taskWithDetails = {
  include: {
    assignee: true,
    comments: { include: { user: true }, orderBy: { createdAt: 'asc' } },
    subtasks: {
      include: {
        assignee: true,
        comments: { include: { user: true } },
      },
      orderBy: { createdAt: 'asc' },
    },
    attachments: { include: { task: true }, orderBy: { createdAt: 'desc' } },
    history: { include: { task: true }, orderBy: { createdAt: 'desc' } },
    recurringTask: true,
  },
};

export const createTask = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { projectId, title, description, type, status, priority, assigneeId, due_date } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { include: { user: true } } },
  });
  if (!project) return sendError(res, 'Project not found', 404);
  if (project.team_lead !== userId) return sendError(res, 'Only project lead can create tasks', 403);

  if (assigneeId) {
    const isMember = project.members.some((m) => m.user.id === assigneeId);
    if (!isMember) return sendError(res, 'Assignee is not a member of this project', 400);
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description,
      type: type || 'TASK',
      priority: priority || 'MEDIUM',
      status: status || 'TODO',
      assigneeId: assigneeId || null,
      due_date: due_date ? new Date(due_date) : null,
    },
    ...taskWithDetails,
  });

  sendSuccess(res, { task }, 'Task created successfully', 201);
});

export const updateTask = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { id } = req.params;
  const { title, description, type, status, priority, assigneeId, due_date } = req.body;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return sendError(res, 'Task not found', 404);

  const project = await prisma.project.findUnique({
    where: { id: task.projectId },
    include: { members: { include: { user: true } } },
  });
  if (!project) return sendError(res, 'Project not found', 404);

  const isMember = project.members.some((m) => m.userId === userId);
  const isLead = project.team_lead === userId;
  if (!isLead && !isMember) return sendError(res, 'You are not a member of this project', 403);

  if (assigneeId) {
    const isMemberAssignee = project.members.some((m) => m.user.id === assigneeId);
    if (!isMemberAssignee) return sendError(res, 'Assignee is not a member of this project', 400);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
    },
    ...taskWithDetails,
  });

  // Log changes to history
  const changes = [];
  if (title !== undefined && task.title !== title) changes.push({ field: 'title', oldValue: task.title, newValue: title });
  if (description !== undefined && task.description !== description) changes.push({ field: 'description', oldValue: task.description, newValue: description });
  if (type !== undefined && task.type !== type) changes.push({ field: 'type', oldValue: task.type, newValue: type });
  if (status !== undefined && task.status !== status) changes.push({ field: 'status', oldValue: task.status, newValue: status });
  if (priority !== undefined && task.priority !== priority) changes.push({ field: 'priority', oldValue: task.priority, newValue: priority });
  if (assigneeId !== undefined && task.assigneeId !== assigneeId) changes.push({ field: 'assignee', oldValue: task.assigneeId, newValue: assigneeId });
  if (due_date !== undefined && task.due_date?.toISOString() !== (due_date ? new Date(due_date).toISOString() : null)) changes.push({ field: 'due_date', oldValue: task.due_date?.toISOString(), newValue: due_date });

  for (const change of changes) {
    await prisma.taskHistory.create({
      data: {
        taskId: id,
        actorId: userId,
        ...change,
      },
    });
  }

  sendSuccess(res, { task: updated }, 'Task updated successfully');
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { taskIds } = req.body;

  if (!taskIds?.length) return sendError(res, 'No task IDs provided', 400);

  const tasks = await prisma.task.findMany({ where: { id: { in: taskIds } } });
  if (!tasks.length) return sendError(res, 'Tasks not found', 404);

  const project = await prisma.project.findUnique({ where: { id: tasks[0].projectId } });
  if (!project) return sendError(res, 'Project not found', 404);
  if (project.team_lead !== userId) return sendError(res, 'Only project lead can delete tasks', 403);

  await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
  sendSuccess(res, {}, 'Tasks deleted successfully');
});

export const getProjectTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const tasks = await prisma.task.findMany({
    where: { projectId },
    ...taskWithDetails,
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, { tasks });
});

// ── Subtasks ──────────────────────────────────────────────────────
export const createSubtask = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { taskId } = req.params;
  const { title, description, assigneeId, due_date, priority } = req.body;

  const parentTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: { include: { user: true } } } } },
  });
  if (!parentTask) return sendError(res, 'Parent task not found', 404);

  const isMember = parentTask.project.members.some((m) => m.userId === userId);
  if (!isMember) return sendError(res, 'You are not a member of this project', 403);

  if (assigneeId) {
    const isMemberAssignee = parentTask.project.members.some((m) => m.user.id === assigneeId);
    if (!isMemberAssignee) return sendError(res, 'Assignee is not a member of this project', 400);
  }

  const subtask = await prisma.task.create({
    data: {
      projectId: parentTask.projectId,
      parentId: taskId,
      title,
      description,
      priority: priority || 'MEDIUM',
      assigneeId: assigneeId || null,
      due_date: due_date ? new Date(due_date) : null,
    },
    ...taskWithDetails,
  });

  // Log activity
  await prisma.taskHistory.create({
    data: {
      taskId,
      actorId: userId,
      field: 'subtask_created',
      newValue: subtask.id,
    },
  });

  sendSuccess(res, { subtask }, 'Subtask created successfully', 201);
});

export const getSubtasks = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const subtasks = await prisma.task.findMany({
    where: { parentId: taskId },
    ...taskWithDetails,
    orderBy: { createdAt: 'asc' },
  });
  sendSuccess(res, { subtasks });
});

// ── Attachments ───────────────────────────────────────────────────
export const addAttachment = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { taskId } = req.params;
  const { name, url, size, mimeType } = req.body;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });
  if (!task) return sendError(res, 'Task not found', 404);

  const isMember = task.project.members.some((m) => m.userId === userId);
  if (!isMember) return sendError(res, 'You are not a member of this project', 403);

  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId,
      uploadedBy: userId,
      name,
      url,
      size,
      mimeType,
    },
  });

  // Log activity
  await prisma.taskHistory.create({
    data: {
      taskId,
      actorId: userId,
      field: 'attachment_added',
      newValue: attachment.id,
    },
  });

  sendSuccess(res, { attachment }, 'Attachment added successfully', 201);
});

export const getAttachments = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const attachments = await prisma.taskAttachment.findMany({
    where: { taskId },
    include: { task: true },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, { attachments });
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { attachmentId } = req.params;

  const attachment = await prisma.taskAttachment.findUnique({
    where: { id: attachmentId },
    include: { task: { include: { project: { include: { members: true } } } } },
  });
  if (!attachment) return sendError(res, 'Attachment not found', 404);

  const isMember = attachment.task.project.members.some((m) => m.userId === userId);
  const isUploader = attachment.uploadedBy === userId;
  if (!isMember && !isUploader) return sendError(res, 'Access denied', 403);

  await prisma.taskAttachment.delete({ where: { id: attachmentId } });

  // Log activity
  await prisma.taskHistory.create({
    data: {
      taskId: attachment.taskId,
      actorId: userId,
      field: 'attachment_deleted',
      oldValue: attachment.id,
    },
  });

  sendSuccess(res, {}, 'Attachment deleted successfully');
});

// ── Task History ──────────────────────────────────────────────────
export const getTaskHistory = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const history = await prisma.taskHistory.findMany({
    where: { taskId },
    include: { task: true },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, { history });
});

// ── Recurring Tasks ───────────────────────────────────────────────
export const setRecurring = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { taskId } = req.params;
  const { frequency, interval, nextDue, isActive } = req.body;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });
  if (!task) return sendError(res, 'Task not found', 404);

  const isMember = task.project.members.some((m) => m.userId === userId);
  if (!isMember) return sendError(res, 'You are not a member of this project', 403);

  const recurring = await prisma.recurringTask.upsert({
    where: { taskId },
    update: {
      frequency,
      interval,
      nextDue: new Date(nextDue),
      isActive,
    },
    create: {
      taskId,
      frequency,
      interval,
      nextDue: new Date(nextDue),
      isActive,
    },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { isRecurring: isActive },
  });

  sendSuccess(res, { recurring }, 'Recurring task settings updated', 200);
});

export const getRecurring = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const recurring = await prisma.recurringTask.findUnique({
    where: { taskId },
  });
  sendSuccess(res, { recurring });
});

// ── Kanban Operations ─────────────────────────────────────────────
export const moveTask = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { taskId } = req.params;
  const { status, order } = req.body;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });
  if (!task) return sendError(res, 'Task not found', 404);

  const isMember = task.project.members.some((m) => m.userId === userId);
  if (!isMember) return sendError(res, 'You are not a member of this project', 403);

  const oldStatus = task.status;
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status, order },
    ...taskWithDetails,
  });

  // Log status change
  if (oldStatus !== status) {
    await prisma.taskHistory.create({
      data: {
        taskId,
        actorId: userId,
        field: 'status',
        oldValue: oldStatus,
        newValue: status,
      },
    });
  }

  sendSuccess(res, { task: updated }, 'Task moved successfully');
});
