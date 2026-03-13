import express from 'express';
import { getUserWorkspaces, createWorkspace, updateWorkspace } from '../controller/workspaceController.js';

const router = express.Router();

router.get('/', getUserWorkspaces);
router.post('/', createWorkspace);
router.put('/:id', updateWorkspace);

export default router;
