import { prisma } from '../configs/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess, sendError } from '../middleware/responseFormatter.js';

export const addComment = asyncHandler(async (req, res) => {
  const { userId } = await req.auth();
  const { content, taskId } = req.body;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return sendError(res, 'Task not found', 404);

  const project = await prisma.project.findUnique({
    where: { id: task.projectId },
    include: { members: true },
  });
  if (!project) return sendError(res, 'Project not found', 404);

  const isMember = project.members.some((m) => m.userId === userId);
  const isLead = project.team_lead === userId;
  if (!isMember && !isLead) return sendError(res, 'You are not a member of this project', 403);

  const comment = await prisma.comment.create({
    data: { taskId, content, userId },
    include: { user: true },
  });

  sendSuccess(res, { comment }, 'Comment added', 201);
});

export const getTaskComments = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });
  sendSuccess(res, { comments });
});
