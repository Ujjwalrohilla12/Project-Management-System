import { prisma } from '../configs/prisma.js';

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data,
  priority = 'MEDIUM',
  expiresAt,
}) => {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data,
      priority,
      expiresAt,
    },
  });
};
