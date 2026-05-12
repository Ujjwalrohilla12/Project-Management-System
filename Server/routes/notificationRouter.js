import express from 'express';
import { validate } from '../middleware/validate.js';
import {
  getNotifications,
  getNotificationSummary,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../controller/notificationController.js';
import { updateNotificationPreferencesSchema } from '../middleware/schemas.js';

const router = express.Router();

router.get('/', getNotifications);
router.get('/summary', getNotificationSummary);
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', validate(updateNotificationPreferencesSchema), updateNotificationPreferences);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllNotificationsRead);

export default router;
