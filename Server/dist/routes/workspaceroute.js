import express from 'express';
import { getUserWorkspaces } from '../controller/workspaceController.js';

const router = express.Router();

router.get('/', getUserWorkspaces);

export default router;
