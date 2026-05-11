import { inngest } from './index.js';
import { prisma } from '../configs/prisma.js';

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

// Inngest function for recurring tasks
const processRecurringTasksFn = inngest.createFunction(
  { id: 'process-recurring-tasks' },
  { cron: '0 */4 * * *' }, // Run every 4 hours
  async () => {
    console.log('Processing recurring tasks...');
    await processRecurringTasks();
    console.log('Recurring tasks processed successfully');
  }
);

export const taskFunctions = [processRecurringTasksFn];