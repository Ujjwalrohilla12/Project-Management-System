import express from 'express';
import { getUserWorkspaces, createWorkspace, updateWorkspace, addMember } from '../controller/workspaceController.js';
import { validate } from '../middleware/validate.js';
import { requireWorkspaceRole } from '../middleware/auth.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addWorkspaceMemberSchema,
} from '../middleware/schemas.js';

const router = express.Router();

// GET /api/workspaces — any authenticated user
router.get('/', getUserWorkspaces);

// POST /api/workspaces — any authenticated user can create
router.post('/', validate(createWorkspaceSchema), createWorkspace);

// PUT /api/workspaces/:id — workspace owner only (checked inside controller)
router.put('/:id', validate(updateWorkspaceSchema), updateWorkspace);

// POST /api/workspaces/:id/members — workspace ADMIN only
router.post(
  '/:id/members',
  requireWorkspaceRole('ADMIN'),
  validate(addWorkspaceMemberSchema),
  addMember
);

export default router;
