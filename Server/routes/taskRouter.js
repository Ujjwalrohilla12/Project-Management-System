import express from 'express';
import {
  createTask,
  updateTask,
  deleteTask,
  getProjectTasks,
  createSubtask,
  getSubtasks,
  addAttachment,
  getAttachments,
  deleteAttachment,
  getTaskHistory,
  setRecurring,
  getRecurring,
  moveTask,
} from '../controller/taskController.js';
import { validate } from '../middleware/validate.js';
import { requireProjectAccess, requireProjectLead } from '../middleware/auth.js';
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  createSubtaskSchema,
  addAttachmentSchema,
  setRecurringSchema,
  moveTaskSchema,
} from '../middleware/schemas.js';

const router = express.Router();

// GET /api/tasks/project/:projectId — any project member
router.get('/project/:projectId', requireProjectAccess, getProjectTasks);

// POST /api/tasks — project lead or workspace admin only
router.post(
  '/',
  validate(createTaskSchema),
  requireProjectAccess,
  requireProjectLead,
  createTask
);

// PUT /api/tasks/:id — any project member (status updates etc.)
router.put('/:id', validate(updateTaskSchema), updateTask);

// DELETE /api/tasks — project lead or workspace admin only
router.delete(
  '/',
  validate(deleteTaskSchema),
  deleteTask
);

// ── Subtasks ──────────────────────────────────────────────────────
// POST /api/tasks/:taskId/subtasks — create subtask
router.post('/:taskId/subtasks', validate(createSubtaskSchema), createSubtask);

// GET /api/tasks/:taskId/subtasks — get subtasks
router.get('/:taskId/subtasks', getSubtasks);

// ── Attachments ───────────────────────────────────────────────────
// POST /api/tasks/:taskId/attachments — add attachment
router.post('/:taskId/attachments', validate(addAttachmentSchema), addAttachment);

// GET /api/tasks/:taskId/attachments — get attachments
router.get('/:taskId/attachments', getAttachments);

// DELETE /api/tasks/:taskId/attachments/:attachmentId — delete attachment
router.delete('/:taskId/attachments/:attachmentId', deleteAttachment);

// ── Task History ──────────────────────────────────────────────────
// GET /api/tasks/:taskId/history — get task history
router.get('/:taskId/history', getTaskHistory);

// ── Recurring Tasks ───────────────────────────────────────────────
// POST /api/tasks/:taskId/recurring — set recurring config
router.post('/:taskId/recurring', validate(setRecurringSchema), setRecurring);

// GET /api/tasks/:taskId/recurring — get recurring config
router.get('/:taskId/recurring', getRecurring);

// ── Kanban Operations ─────────────────────────────────────────────
// PUT /api/tasks/:taskId/move — move task in kanban
router.put('/:taskId/move', validate(moveTaskSchema), moveTask);

export default router;
