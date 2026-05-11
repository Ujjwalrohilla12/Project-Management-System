import express from 'express';
import {
  getProjects, getProject, createProject, updateProject,
  archiveProject, deleteProject, addMember, removeMember, getProjectAnalytics,
} from '../controller/projectController.js';
import { validate } from '../middleware/validate.js';
import { requireWorkspaceRole, requireProjectAccess, requireProjectLead } from '../middleware/auth.js';
import {
  createProjectSchema, updateProjectSchema,
  addProjectMemberSchema, archiveProjectSchema,
} from '../middleware/schemas.js';

const router = express.Router();

// List projects (paginated, filtered, searched)
router.get('/', getProjects);

// Get single project
router.get('/:id', getProject);

// Get project analytics
router.get('/:id/analytics', getProjectAnalytics);

// Create — workspace ADMIN only
router.post('/', validate(createProjectSchema), requireWorkspaceRole('ADMIN'), createProject);

// Update — project lead or workspace ADMIN (checked in controller)
router.put('/:id', validate(updateProjectSchema), updateProject);

// Archive / restore
router.patch('/:id/archive', validate(archiveProjectSchema), archiveProject);

// Delete — workspace ADMIN only (checked in controller)
router.delete('/:id', deleteProject);

// Member management
router.post('/:projectId/members', requireProjectAccess, requireProjectLead, validate(addProjectMemberSchema), addMember);
router.delete('/:projectId/members/:memberId', requireProjectAccess, requireProjectLead, removeMember);

export default router;
