import express from 'express';
import {
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
  acceptGeneratedTask,
} from '../controller/aiController.js';

const router = express.Router();

// Task AI features
router.post('/tasks/:taskId/subtasks/generate', generateSubtasks);
router.post('/tasks/:taskId/complexity', estimateComplexity);

// Project AI features
router.post('/projects/:projectId/recommendations', generateRecommendations);
router.post('/projects/:projectId/dependencies', suggestDependencies);
router.post('/projects/:projectId/sequence', generateTaskSequence);

// User AI features
router.post('/workload', estimateWorkload);
router.post('/productivity', generateProductivitySuggestions);

// AI data management
router.get('/history', getAIHistory);
router.get('/recommendations', getAIRecommendations);
router.put('/recommendations/:recommendationId/accept', acceptRecommendation);
router.put('/generated-tasks/:taskId/accept', acceptGeneratedTask);

export default router;