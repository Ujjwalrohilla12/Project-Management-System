const OpenAIService = require('./OpenAIService');
const { PrismaClient } = require('@prisma/client');

class AIServiceManager {
  constructor() {
    this.prisma = new PrismaClient();
    this.providers = new Map();
    this.currentProvider = null;

    // Initialize available providers
    this.initializeProviders();
  }

  initializeProviders() {
    // Load OpenAI if API key is available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.providers.set('openai', new OpenAIService(openaiKey));
      this.currentProvider = 'openai'; // Default to OpenAI
    }

    // Future: Add other providers like Claude, Gemini, etc.
    // const claudeKey = process.env.ANTHROPIC_API_KEY;
    // if (claudeKey) {
    //   this.providers.set('claude', new ClaudeService(claudeKey));
    // }
  }

  setProvider(providerName) {
    if (!this.providers.has(providerName)) {
      throw new Error(`AI provider '${providerName}' not available`);
    }
    this.currentProvider = providerName;
  }

  getProvider() {
    if (!this.currentProvider || !this.providers.has(this.currentProvider)) {
      throw new Error('No AI provider configured');
    }
    return this.providers.get(this.currentProvider);
  }

  async logAIInteraction(userId, action, prompt, response = null, taskId = null, projectId = null, error = null) {
    try {
      await this.prisma.aILog.create({
        data: {
          userId,
          taskId,
          projectId,
          action,
          prompt,
          response: response ? JSON.stringify(response) : null,
          success: !error,
          error: error?.message,
          tokensUsed: response?.tokensUsed,
          cost: response?.cost
        }
      });
    } catch (logError) {
      console.error('Failed to log AI interaction:', logError);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  async saveRecommendation(userId, type, title, description, taskId = null, projectId = null, metadata = null) {
    try {
      return await this.prisma.aIRecommendation.create({
        data: {
          userId,
          taskId,
          projectId,
          type,
          title,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });
    } catch (error) {
      console.error('Failed to save AI recommendation:', error);
      throw error;
    }
  }

  async saveGeneratedTasks(parentTaskId, subtasks) {
    try {
      const createdTasks = [];
      for (const subtask of subtasks) {
        const task = await this.prisma.aIGeneratedTask.create({
          data: {
            parentTaskId,
            title: subtask.title,
            description: subtask.description,
            type: subtask.type || 'TASK',
            priority: subtask.priority || 'MEDIUM',
            estimatedHours: subtask.estimatedHours,
            sequence: subtask.sequence || 0,
            dependencies: subtask.dependencies || [],
            aiMetadata: subtask.metadata ? JSON.stringify(subtask.metadata) : null
          }
        });
        createdTasks.push(task);
      }
      return createdTasks;
    } catch (error) {
      console.error('Failed to save generated tasks:', error);
      throw error;
    }
  }

  // AI Service Methods with logging
  async generateSubtasks(task, context) {
    const provider = this.getProvider();
    const prompt = this.buildSubtaskPrompt(task, context);

    try {
      const result = await provider.generateSubtasks(task, context);
      await this.logAIInteraction(
        context.userId,
        'generate_subtasks',
        prompt,
        { subtasks: result },
        task.id
      );
      return result;
    } catch (error) {
      await this.logAIInteraction(
        context.userId,
        'generate_subtasks',
        prompt,
        null,
        task.id,
        null,
        error
      );
      throw error;
    }
  }

  async estimateComplexity(task, context) {
    const provider = this.getProvider();
    const prompt = `Estimate complexity for task: ${task.title}`;

    try {
      const result = await provider.estimateComplexity(task, context);
      await this.logAIInteraction(
        context.userId,
        'estimate_complexity',
        prompt,
        result,
        task.id
      );
      return result;
    } catch (error) {
      await this.logAIInteraction(
        context.userId,
        'estimate_complexity',
        prompt,
        null,
        task.id,
        null,
        error
      );
      throw error;
    }
  }

  async generateRecommendations(context) {
    const provider = this.getProvider();
    const prompt = `Generate recommendations for project/tasks`;

    try {
      const result = await provider.generateRecommendations(context);
      await this.logAIInteraction(
        context.userId,
        'generate_recommendations',
        prompt,
        { recommendations: result },
        null,
        context.projectId
      );
      return result;
    } catch (error) {
      await this.logAIInteraction(
        context.userId,
        'generate_recommendations',
        prompt,
        null,
        null,
        context.projectId,
        error
      );
      throw error;
    }
  }

  async suggestDependencies(tasks, context) {
    const provider = this.getProvider();
    const prompt = `Suggest dependencies for ${tasks.length} tasks`;

    try {
      const result = await provider.suggestDependencies(tasks, context);
      await this.logAIInteraction(
        context.userId,
        'suggest_dependencies',
        prompt,
        { dependencies: result },
        null,
        context.projectId
      );
      return result;
    } catch (error) {
      await this.logAIInteraction(
        context.userId,
        'suggest_dependencies',
        prompt,
        null,
        null,
        context.projectId,
        error
      );
      throw error;
    }
  }

  async generateTaskSequence(tasks, context) {
    const provider = this.getProvider();
    const prompt = `Generate task sequence for ${tasks.length} tasks`;

    try {
      const result = await provider.generateTaskSequence(tasks, context);
      await this.logAIInteraction(
        context.userId,
        'generate_task_sequence',
        prompt,
        { sequence: result },
        null,
        context.projectId
      );
      return result;
    } catch (error) {
      await this.logAIInteraction(
        context.userId,
        'generate_task_sequence',
        prompt,
        null,
        context.projectId,
        error
      );
      throw error;
    }
  }

  async estimateWorkload(tasks, user) {
    const provider = this.getProvider();
    const prompt = `Estimate workload for user with ${tasks.length} tasks`;

    try {
      const result = await provider.estimateWorkload(tasks, user);
      await this.logAIInteraction(
        user.id,
        'estimate_workload',
        prompt,
        result
      );
      return result;
    } catch (error) {
      await this.logAIInteraction(
        user.id,
        'estimate_workload',
        prompt,
        null,
        null,
        null,
        error
      );
      throw error;
    }
  }

  async generateProductivitySuggestions(user, tasks, history) {
    const provider = this.getProvider();
    const prompt = `Generate productivity suggestions for user`;

    try {
      const result = await provider.generateProductivitySuggestions(user, tasks, history);
      await this.logAIInteraction(
        user.id,
        'generate_productivity_suggestions',
        prompt,
        { suggestions: result }
      );
      return result;
    } catch (error) {
      await this.logAIInteraction(
        user.id,
        'generate_productivity_suggestions',
        prompt,
        null,
        null,
        null,
        error
      );
      throw error;
    }
  }

  // Helper method
  buildSubtaskPrompt(task, context) {
    return `Generate subtasks for: ${task.title} (${task.description || 'No description'})`;
  }

  // Cleanup
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
const aiServiceManager = new AIServiceManager();

module.exports = aiServiceManager;