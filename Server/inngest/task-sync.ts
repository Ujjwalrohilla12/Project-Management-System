import { inngest } from './index.js';
import { prisma } from '../configs/prisma.js';
import { createNotification } from '../utils/notification.js';

// Recurring task processing
async function processRecurringTasks() {
  const now = new Date();

  // Find all active recurring tasks that are due
  const dueTasks = await prisma.recurringTask.findMany({
    where: {
      isActive: true,
      nextDue: { lte: now },
    },
    include: { task: true },
  });

  for (const recurring of dueTasks) {
    try {
      // Create a new instance of the task
      const newTask = await prisma.task.create({
        data: {
          projectId: recurring.task.projectId,
          parentId: recurring.task.parentId,
          title: recurring.task.title,
          description: recurring.task.description,
          type: recurring.task.type,
          status: 'TODO', // Always start as TODO
          priority: recurring.task.priority,
          assigneeId: recurring.task.assigneeId,
          due_date: new Date(recurring.nextDue), // Use the calculated next due date
          estimatedHours: recurring.task.estimatedHours,
          isRecurring: false, // The new instance is not recurring itself
        },
      });

      // Calculate next due date
      let nextDue = new Date(recurring.nextDue);
      switch (recurring.frequency) {
        case 'DAILY':
          nextDue.setDate(nextDue.getDate() + recurring.interval);
          break;
        case 'WEEKLY':
          nextDue.setDate(nextDue.getDate() + (recurring.interval * 7));
          break;
        case 'BIWEEKLY':
          nextDue.setDate(nextDue.getDate() + (recurring.interval * 14));
          break;
        case 'MONTHLY':
          nextDue.setMonth(nextDue.getMonth() + recurring.interval);
          break;
      }

      // Update the recurring task with new next due date and last run
      await prisma.recurringTask.update({
        where: { id: recurring.id },
        data: {
          nextDue: nextDue,
          lastRun: now,
        },
      });

      // Log the creation in task history
      await prisma.taskHistory.create({
        data: {
          taskId: recurring.taskId,
          actorId: 'system', // System-generated
          field: 'recurring_instance_created',
          newValue: newTask.id,
        },
      });

      console.log(`Created recurring task instance: ${newTask.id} for task: ${recurring.taskId}`);
    } catch (error) {
      console.error(`Failed to process recurring task ${recurring.id}:`, error);
    }
  }
}

async function sendTaskNotification(userId: string, type: string, title: string, message: string, data: object) {
  const preferences = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (preferences && !preferences.inAppEnabled) return;
  if (type === 'TASK_DUE_SOON' && preferences?.deadlineReminders === false) return;
  if (type === 'TASK_OVERDUE' && preferences?.taskDue === false) return;
  if (type === 'WORKLOAD_ALERT' && preferences?.weeklyDigest === false) return;

  await createNotification({
    userId,
    type,
    title,
    message,
    data,
    priority: 'HIGH',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

async function processScheduledNotifications() {
  const now = new Date();
  const dueSoon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const dueSoonTasks = await prisma.task.findMany({
    where: {
      assigneeId: { not: null },
      status: { in: ['TODO', 'IN_PROGRESS'] },
      due_date: { gte: now, lte: dueSoon },
    },
    include: { project: true },
  });

  for (const task of dueSoonTasks) {
    await sendTaskNotification(
      task.assigneeId,
      'TASK_DUE_SOON',
      'Upcoming due date',
      `Your task “${task.title}” is due soon (${new Date(task.due_date).toLocaleDateString()}).`,
      { taskId: task.id, projectId: task.projectId }
    );
  }

  const overdueTasks = await prisma.task.findMany({
    where: {
      assigneeId: { not: null },
      status: { in: ['TODO', 'IN_PROGRESS'] },
      due_date: { lt: now },
    },
    include: { project: true },
  });

  for (const task of overdueTasks) {
    await sendTaskNotification(
      task.assigneeId,
      'TASK_OVERDUE',
      'Task overdue',
      `Your task “${task.title}” is overdue. Please update progress or reassign as needed.`,
      { taskId: task.id, projectId: task.projectId }
    );
  }

  const workloadGroups = await prisma.task.groupBy({
    by: ['assigneeId'],
    where: {
      assigneeId: { not: null },
      status: { in: ['TODO', 'IN_PROGRESS'] },
    },
    _count: { id: true },
  });

  for (const group of workloadGroups) {
    if (group._count.id >= 10) {
      await sendTaskNotification(
        group.assigneeId,
        'WORKLOAD_ALERT',
        'Workload alert',
        `You have ${group._count.id} active tasks assigned. Consider rebalancing your workload.`,
        { activeTasks: group._count.id }
      );
    }
  }
}

// Inngest function for recurring tasks
const processRecurringTasksFn = inngest.createFunction(
  { id: 'process-recurring-tasks' },
  { cron: '0 */4 * * *' }, // Run every 4 hours
  async () => {
    console.log('Processing recurring tasks...');
    await processRecurringTasks();
    await processScheduledNotifications();
    console.log('Recurring tasks and notifications processed successfully');
  }
);

export const taskFunctions = [processRecurringTasksFn];