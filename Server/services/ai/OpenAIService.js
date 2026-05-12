import { AIServiceInterface } from './AIServiceInterface.js';
import OpenAI from 'openai';

/**
 * OpenAI Implementation of AI Service
 */
export class OpenAIService extends AIServiceInterface {
  constructor(apiKey) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateSubtasks(task, context) {
    const prompt = this.buildSubtaskPrompt(task, context);

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert project manager who breaks down complex tasks into actionable subtasks. Provide detailed, realistic subtasks with time estimates.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      return this.parseSubtaskResponse(content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate subtasks');
    }
  }

  async estimateComplexity(task, context) {
    const prompt = `Analyze this task and estimate its complexity and time requirements:

Task: ${task.title}
Description: ${task.description || 'No description provided'}
Priority: ${task.priority}
Type: ${task.type}

Provide a complexity score (1-10) and estimated hours. Consider:
- Technical complexity
- Dependencies
- Required skills
- Similar past tasks

Respond in JSON format:
{
  "complexity": number,
  "estimatedHours": number,
  "reasoning": "string",
  "confidence": number
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a project estimation expert. Provide realistic time and complexity estimates.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const content = response.choices[0].message.content;
      return JSON.parse(this.extractJSON(content));
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to estimate complexity');
    }
  }

  async generateRecommendations(context) {
    const prompt = `Based on the following project context, provide smart recommendations:

Project: ${context.project?.name || 'Unknown'}
Tasks: ${context.tasks?.length || 0} total tasks
Completed: ${context.tasks?.filter(t => t.status === 'DONE').length || 0}
In Progress: ${context.tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0}
Overdue: ${context.tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date()).length || 0}

Provide 3-5 actionable recommendations to improve project efficiency and productivity.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a senior project manager providing strategic recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      return this.parseRecommendations(content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  async suggestDependencies(tasks, context) {
    const taskList = tasks.map(t => `${t.id}: ${t.title}`).join('\n');
    const prompt = `Analyze these tasks and suggest dependencies:

${taskList}

Identify which tasks should be completed before others can start. Consider logical dependencies, prerequisites, and workflow requirements.

Respond with an array of dependency pairs in JSON format:
[{"from": "task_id", "to": "task_id", "reason": "explanation"}]`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a dependency analysis expert. Identify task relationships and prerequisites.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      return JSON.parse(this.extractJSON(content));
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to suggest dependencies');
    }
  }

  async generateTaskSequence(tasks, context) {
    const taskList = tasks.map(t => `${t.id}: ${t.title} (${t.priority}, ${t.status})`).join('\n');
    const prompt = `Optimize the execution order of these tasks:

${taskList}

Consider:
- Priority levels
- Dependencies
- Current status
- Logical workflow
- Resource availability

Provide the optimal sequence as an ordered array of task IDs.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a workflow optimization expert. Provide the most efficient task execution order.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const content = response.choices[0].message.content;
      return JSON.parse(this.extractJSON(content));
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate task sequence');
    }
  }

  async estimateWorkload(tasks, user) {
    const taskList = tasks.map(t => `${t.title} (${t.priority}, ${t.estimatedHours || '?'}h)`).join('\n');
    const prompt = `Analyze workload for user:

Tasks assigned:
${taskList}

Current workload assessment:
- Total estimated hours: ${tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)}
- High priority tasks: ${tasks.filter(t => t.priority === 'HIGH').length}
- Overdue tasks: ${tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length}

Provide workload analysis in JSON format:
{
  "capacity": number, // hours per week
  "currentLoad": number, // current estimated hours
  "utilization": number, // percentage 0-100
  "recommendations": ["string"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a workload management expert. Analyze capacity and provide recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      });

      const content = response.choices[0].message.content;
      return JSON.parse(this.extractJSON(content));
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to estimate workload');
    }
  }

  async generateProductivitySuggestions(user, tasks, history) {
    const prompt = `Based on user's task history and current workload, provide productivity suggestions:

Completed tasks this week: ${history?.completedThisWeek || 0}
Average tasks per day: ${history?.avgTasksPerDay || 0}
Most productive time: ${history?.peakHours || 'Unknown'}
Common task types: ${history?.commonTypes?.join(', ') || 'Mixed'}

Current tasks: ${tasks.length}
Overdue: ${tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length}

Provide 3-5 specific, actionable productivity suggestions.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity coach. Provide personalized, actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const content = response.choices[0].message.content;
      return this.parseProductivitySuggestions(content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate productivity suggestions');
    }
  }

  // Helper methods
  buildSubtaskPrompt(task, context) {
    return `Break down this task into specific, actionable subtasks:

Task: ${task.title}
Description: ${task.description || 'No description provided'}
Priority: ${task.priority}
Type: ${task.type}
Estimated Hours: ${task.estimatedHours || 'Not specified'}

Project Context: ${context.project?.name || 'No project context'}
Team Size: ${context.teamSize || 1}

Provide 3-8 detailed subtasks with:
- Clear, actionable titles
- Brief descriptions
- Estimated time in hours
- Suggested priority (HIGH/MEDIUM/LOW)
- Dependencies if any

Format as JSON array:
[
  {
    "title": "string",
    "description": "string",
    "estimatedHours": number,
    "priority": "HIGH|MEDIUM|LOW",
    "dependencies": ["subtask_id"]
  }
]`;
  }

  parseSubtaskResponse(content) {
    try {
      return JSON.parse(this.extractJSON(content));
    } catch (error) {
      // Fallback parsing if JSON is malformed
      const lines = content.split('\n').filter(line => line.trim());
      return lines.map((line, index) => ({
        title: line.replace(/^\d+\.\s*/, '').trim(),
        description: '',
        estimatedHours: 1,
        priority: 'MEDIUM',
        dependencies: []
      }));
    }
  }

  parseRecommendations(content) {
    const recommendations = content.split('\n')
      .filter(line => line.trim() && /^\d+\./.test(line))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());

    return recommendations.map(rec => ({
      title: rec,
      description: rec,
      type: 'general',
      priority: 'MEDIUM'
    }));
  }

  parseProductivitySuggestions(content) {
    const suggestions = content.split('\n')
      .filter(line => line.trim() && /^\d+\./.test(line))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());

    return suggestions.map(suggestion => ({
      title: suggestion,
      description: suggestion,
      type: 'productivity',
      priority: 'MEDIUM'
    }));
  }

  extractJSON(content) {
    // Extract JSON from markdown code blocks or raw JSON
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                     content.match(/```\s*([\s\S]*?)\s*```/) ||
                     content.match(/\{[\s\S]*\}/) ||
                     content.match(/\[[\s\S]*\]/);

    return jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
  }
}