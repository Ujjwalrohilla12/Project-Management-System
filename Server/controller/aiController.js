const aiServiceManager = require('../services/ai/AIServiceManager');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Generate AI-powered subtasks for a task
 */
const generateSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        assignee: true
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: userId
      }
    });

    if (!projectMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get project context
    const teamSize = await prisma.projectMember.count({
      where: { projectId: task.projectId }
    });

    const context = {
      userId,
      projectId: task.projectId,
      teamSize,
      project: task.project
    };

    // Generate subtasks
    const subtasks = await aiServiceManager.generateSubtasks(task, context);

    // Save generated tasks
    const savedTasks = await aiServiceManager.saveGeneratedTasks(taskId, subtasks);

    res.json({
      success: true,
      subtasks: savedTasks,
      message: 'AI-generated subtasks created successfully'
    });

  } catch (error) {
    console.error('Error generating subtasks:', error);
    res.status(500).json({
      error: 'Failed to generate subtasks',
      message: error.message
    });
  }
};

/**
 * Estimate task complexity
 */
const estimateComplexity = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const context = {
      userId,
      projectId: task.projectId
    };

    const estimation = await aiServiceManager.estimateComplexity(task, context);

    res.json({
      success: true,
      estimation,
      taskId
    });

  } catch (error) {
    console.error('Error estimating complexity:', error);
    res.status(500).json({
      error: 'Failed to estimate complexity',
      message: error.message
    });
  }
};

/**
 * Generate AI recommendations
 */
const generateRecommendations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check project access
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId
      }
    });

    if (!projectMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get project context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            due_date: true
          }
        }
      }
    });

    const context = {
      userId,
      projectId,
      project: project,
      tasks: project.tasks
    };

    const recommendations = await aiServiceManager.generateRecommendations(context);

    // Save recommendations
    const savedRecommendations = [];
    for (const rec of recommendations) {
      const saved = await aiServiceManager.saveRecommendation(
        userId,
        rec.type || 'general',
        rec.title,
        rec.description,
        null,
        projectId,
        rec.metadata
      );
      savedRecommendations.push(saved);
    }

    res.json({
      success: true,
      recommendations: savedRecommendations
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
};

/**
 * Suggest task dependencies
 */
const suggestDependencies = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId
      }
    });

    if (!projectMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true
      }
    });

    const context = {
      userId,
      projectId
    };

    const dependencies = await aiServiceManager.suggestDependencies(tasks, context);

    res.json({
      success: true,
      dependencies
    });

  } catch (error) {
    console.error('Error suggesting dependencies:', error);
    res.status(500).json({
      error: 'Failed to suggest dependencies',
      message: error.message
    });
  }
};

/**
 * Generate optimal task sequence
 */
const generateTaskSequence = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId
      }
    });

    if (!projectMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        due_date: true
      }
    });

    const context = {
      userId,
      projectId
    };

    const sequence = await aiServiceManager.generateTaskSequence(tasks, context);

    res.json({
      success: true,
      sequence
    });

  } catch (error) {
    console.error('Error generating task sequence:', error);
    res.status(500).json({
      error: 'Failed to generate task sequence',
      message: error.message
    });
  }
};

/**
 * Estimate workload
 */
const estimateWorkload = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { in: ['TODO', 'IN_PROGRESS'] }
      },
      select: {
        id: true,
        title: true,
        priority: true,
        estimatedHours: true,
        due_date: true
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    const workload = await aiServiceManager.estimateWorkload(tasks, user);

    res.json({
      success: true,
      workload
    });

  } catch (error) {
    console.error('Error estimating workload:', error);
    res.status(500).json({
      error: 'Failed to estimate workload',
      message: error.message
    });
  }
};

/**
 * Generate productivity suggestions
 */
const generateProductivitySuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's tasks and history
    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      select: {
        id: true,
        title: true,
        status: true,
        due_date: true
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    // Calculate basic history metrics
    const completedThisWeek = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: 'DONE',
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const history = {
      completedThisWeek,
      avgTasksPerDay: Math.round(completedThisWeek / 7),
      peakHours: '9-11 AM', // Placeholder - could be calculated from actual data
      commonTypes: ['TASK', 'FEATURE'] // Placeholder
    };

    const suggestions = await aiServiceManager.generateProductivitySuggestions(user, tasks, history);

    // Save suggestions as recommendations
    const savedSuggestions = [];
    for (const suggestion of suggestions) {
      const saved = await aiServiceManager.saveRecommendation(
        userId,
        'productivity',
        suggestion.title,
        suggestion.description
      );
      savedSuggestions.push(saved);
    }

    res.json({
      success: true,
      suggestions: savedSuggestions
    });

  } catch (error) {
    console.error('Error generating productivity suggestions:', error);
    res.status(500).json({
      error: 'Failed to generate productivity suggestions',
      message: error.message
    });
  }
};

/**
 * Get AI history/logs
 */
const getAIHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.aILog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          task: { select: { id: true, title: true } },
          project: { select: { id: true, name: true } }
        }
      }),
      prisma.aILog.count({ where: { userId } })
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching AI history:', error);
    res.status(500).json({
      error: 'Failed to fetch AI history',
      message: error.message
    });
  }
};

/**
 * Get AI recommendations
 */
const getAIRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, accepted, page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(type && { type }),
      ...(accepted !== undefined && { isAccepted: accepted === 'true' })
    };

    const [recommendations, total] = await Promise.all([
      prisma.aIRecommendation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          task: { select: { id: true, title: true } },
          project: { select: { id: true, name: true } }
        }
      }),
      prisma.aIRecommendation.count({ where })
    ]);

    res.json({
      success: true,
      recommendations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    res.status(500).json({
      error: 'Failed to fetch AI recommendations',
      message: error.message
    });
  }
};

/**
 * Accept AI recommendation
 */
const acceptRecommendation = async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const userId = req.user.id;

    const recommendation = await prisma.aIRecommendation.findFirst({
      where: {
        id: recommendationId,
        userId
      }
    });

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    await prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: { isAccepted: true }
    });

    res.json({
      success: true,
      message: 'Recommendation accepted'
    });

  } catch (error) {
    console.error('Error accepting recommendation:', error);
    res.status(500).json({
      error: 'Failed to accept recommendation',
      message: error.message
    });
  }
};

/**
 * Accept AI-generated subtask
 */
const acceptGeneratedTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const generatedTask = await prisma.aIGeneratedTask.findUnique({
      where: { id: taskId },
      include: { parentTask: true }
    });

    if (!generatedTask) {
      return res.status(404).json({ error: 'Generated task not found' });
    }

    // Check permissions
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: generatedTask.parentTask.projectId,
        userId
      }
    });

    if (!projectMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create actual task from generated task
    const task = await prisma.task.create({
      data: {
        projectId: generatedTask.parentTask.projectId,
        parentId: generatedTask.parentTaskId,
        title: generatedTask.title,
        description: generatedTask.description,
        type: generatedTask.type,
        priority: generatedTask.priority,
        estimatedHours: generatedTask.estimatedHours,
        assigneeId: generatedTask.parentTask.assigneeId
      }
    });

    // Mark as accepted
    await prisma.aIGeneratedTask.update({
      where: { id: taskId },
      data: { isAccepted: true }
    });

    res.json({
      success: true,
      task,
      message: 'Subtask created successfully'
    });

  } catch (error) {
    console.error('Error accepting generated task:', error);
    res.status(500).json({
      error: 'Failed to accept generated task',
      message: error.message
    });
  }
};

module.exports = {
  generateSubtasks,
  estimateComplexity,
  generateRecommendations,
  suggestDependencies,
  generateTaskSequence,
  estimateWorkload,
  generateProductivitySuggestions,
  getAIHistory,
  getAIRecommendations,
  acceptRecommendation,
  acceptGeneratedTask
};