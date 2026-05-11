const express = require('express');
const router = express.Router();
const aiController = require('../controller/aiController');
const authMiddleware = require('./authMiddleware');

// All AI routes require authentication
router.use(authMiddleware);

// Task AI features
router.post('/tasks/:taskId/subtasks/generate', aiController.generateSubtasks);
router.post('/tasks/:taskId/complexity', aiController.estimateComplexity);

// Project AI features
router.post('/projects/:projectId/recommendations', aiController.generateRecommendations);
router.post('/projects/:projectId/dependencies', aiController.suggestDependencies);
router.post('/projects/:projectId/sequence', aiController.generateTaskSequence);

// User AI features
router.post('/workload', aiController.estimateWorkload);
router.post('/productivity', aiController.generateProductivitySuggestions);

// AI data management
router.get('/history', aiController.getAIHistory);
router.get('/recommendations', aiController.getAIRecommendations);
router.put('/recommendations/:recommendationId/accept', aiController.acceptRecommendation);
router.put('/generated-tasks/:taskId/accept', aiController.acceptGeneratedTask);

module.exports = router;