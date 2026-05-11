import express from 'express';
import { addComment, getTaskComments } from '../controller/commentController.js';
import { validate } from '../middleware/validate.js';
import { addCommentSchema } from '../middleware/schemas.js';

const router = express.Router();

// GET /api/comments/:taskId — any authenticated user (membership checked in controller)
router.get('/:taskId', getTaskComments);

// POST /api/comments — any project member (membership checked in controller)
router.post('/', validate(addCommentSchema), addComment);

export default router;
