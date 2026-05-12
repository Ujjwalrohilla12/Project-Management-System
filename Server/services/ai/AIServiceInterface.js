/**
 * AI Service Interface
 * Defines the contract for AI providers
 */
export class AIServiceInterface {
  /**
   * Generate subtasks for a given task
   * @param {Object} task - The parent task
   * @param {Object} context - Additional context (project, user, etc.)
   * @returns {Promise<Array>} Array of subtask suggestions
   */
  async generateSubtasks(task, context) {
    throw new Error('Method not implemented');
  }

  /**
   * Estimate task complexity and time
   * @param {Object} task - The task to analyze
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Complexity estimation
   */
  async estimateComplexity(task, context) {
    throw new Error('Method not implemented');
  }

  /**
   * Generate smart recommendations
   * @param {Object} context - Context for recommendations
   * @returns {Promise<Array>} Array of recommendations
   */
  async generateRecommendations(context) {
    throw new Error('Method not implemented');
  }

  /**
   * Suggest task dependencies
   * @param {Array} tasks - Array of tasks to analyze
   * @param {Object} context - Project context
   * @returns {Promise<Array>} Dependency suggestions
   */
  async suggestDependencies(tasks, context) {
    throw new Error('Method not implemented');
  }

  /**
   * Generate optimal task sequence
   * @param {Array} tasks - Tasks to sequence
   * @param {Object} context - Project context
   * @returns {Promise<Array>} Ordered task sequence
   */
  async generateTaskSequence(tasks, context) {
    throw new Error('Method not implemented');
  }

  /**
   * Estimate workload for user/project
   * @param {Array} tasks - Tasks to analyze
   * @param {Object} user - User context
   * @returns {Promise<Object>} Workload estimation
   */
  async estimateWorkload(tasks, user) {
    throw new Error('Method not implemented');
  }

  /**
   * Generate productivity suggestions
   * @param {Object} user - User context
   * @param {Array} tasks - User's tasks
   * @param {Object} history - User's work history
   * @returns {Promise<Array>} Productivity suggestions
   */
  async generateProductivitySuggestions(user, tasks, history) {
    throw new Error('Method not implemented');
  }
}