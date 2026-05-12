import { prisma } from '../configs/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendSuccess, sendError } from '../middleware/responseFormatter.js';

const defaultPreferences = {
  emailEnabled: true,
  inAppEnabled: true,
  taskAssigned: true,
  taskDue: true,
  projectUpdates: true,
  teamMentions: true,
  deadlineReminders: true,
  weeklyDigest: true,
};

export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, read, type } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    userId: req.userId,
    ...(read !== undefined && { isRead: read === 'true' }),
    ...(type ? { type } : {}),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.notification.count({ where }),
  ]);

  sendSuccess(res, {
    notifications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getNotificationSummary = asyncHandler(async (req, res) => {
  const [total, unread] = await Promise.all([
    prisma.notification.count({ where: { userId: req.userId } }),
    prisma.notification.count({ where: { userId: req.userId, isRead: false } }),
  ]);

  sendSuccess(res, { summary: { total, unread } });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isRead = true } = req.body;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.userId) {
    return sendError(res, 'Notification not found', 404);
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead },
  });

  sendSuccess(res, { notification: updated });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.userId, isRead: false },
    data: { isRead: true },
  });

  sendSuccess(res, { updated: result.count });
});

export const getNotificationPreferences = asyncHandler(async (req, res) => {
  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId: req.userId },
  });

  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        userId: req.userId,
        ...defaultPreferences,
      },
    });
  }

  sendSuccess(res, { preferences });
});

export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const data = req.body;

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: req.userId },
    update: {
      ...data,
    },
    create: {
      userId: req.userId,
      ...defaultPreferences,
      ...data,
    },
  });

  sendSuccess(res, { preferences }, 'Notification preferences updated');
});
