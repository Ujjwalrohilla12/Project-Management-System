import api from '../configs/api.js';

// ── Workspace ──────────────────────────────────────────────
export const workspaceService = {
  getAll:    ()         => api.get('/api/workspaces'),
  create:    (data)     => api.post('/api/workspaces', data),
  update:    (id, data) => api.put(`/api/workspaces/${id}`, data),
  addMember: (id, data) => api.post(`/api/workspaces/${id}/members`, data),
};

// ── Organization ───────────────────────────────────────────
export const orgService = {
  get:              (id)               => api.get(`/api/org/${id}`),
  update:           (id, data)         => api.put(`/api/org/${id}`, data),
  // Members
  getMembers:       (id, params)       => api.get(`/api/org/${id}/members`, { params }),
  updateMemberRole: (id, mId, data)    => api.put(`/api/org/${id}/members/${mId}/role`, data),
  removeMember:     (id, mId)          => api.delete(`/api/org/${id}/members/${mId}`),
  // Invitations
  getInvitations:   (id, params)       => api.get(`/api/org/${id}/invitations`, { params }),
  sendInvitation:   (id, data)         => api.post(`/api/org/${id}/invitations`, data),
  cancelInvitation: (id, invId)        => api.delete(`/api/org/${id}/invitations/${invId}`),
  acceptInvitation: (data)             => api.post('/api/org/invitations/accept', data),
  // Analytics & audit
  getAnalytics:     (id)               => api.get(`/api/org/${id}/analytics`),
  getAuditLog:      (id, params)       => api.get(`/api/org/${id}/audit-log`, { params }),
};

// ── Project ────────────────────────────────────────────────
export const projectService = {
  getAll:       (params)       => api.get('/api/projects', { params }),
  get:          (id)           => api.get(`/api/projects/${id}`),
  getAnalytics: (id)           => api.get(`/api/projects/${id}/analytics`),
  create:       (data)         => api.post('/api/projects', data),
  update:       (id, data)     => api.put(`/api/projects/${id}`, data),
  archive:      (id, data)     => api.patch(`/api/projects/${id}/archive`, data),
  delete:       (id)           => api.delete(`/api/projects/${id}`),
  addMember:    (projectId, data) => api.post(`/api/projects/${projectId}/members`, data),
  removeMember: (projectId, memberId) => api.delete(`/api/projects/${projectId}/members/${memberId}`),
};

// ── Task ───────────────────────────────────────────────────
export const taskService = {
  getByProject: (projectId)  => api.get(`/api/tasks/project/${projectId}`),
  create:       (data)       => api.post('/api/tasks', data),
  update:       (id, data)   => api.put(`/api/tasks/${id}`, data),
  delete:       (taskIds)    => api.delete('/api/tasks', { data: { taskIds } }),
  // Subtasks
  createSubtask: (taskId, data) => api.post(`/api/tasks/${taskId}/subtasks`, data),
  getSubtasks:   (taskId)       => api.get(`/api/tasks/${taskId}/subtasks`),
  // Attachments
  addAttachment:    (taskId, data)          => api.post(`/api/tasks/${taskId}/attachments`, data),
  getAttachments:   (taskId)                => api.get(`/api/tasks/${taskId}/attachments`),
  deleteAttachment: (taskId, attachmentId)  => api.delete(`/api/tasks/${taskId}/attachments/${attachmentId}`),
  // History
  getHistory: (taskId) => api.get(`/api/tasks/${taskId}/history`),
  // Recurring
  setRecurring: (taskId, data) => api.post(`/api/tasks/${taskId}/recurring`, data),
  getRecurring: (taskId)       => api.get(`/api/tasks/${taskId}/recurring`),
  // Kanban
  move: (taskId, data) => api.put(`/api/tasks/${taskId}/move`, data),
};

// ── Comment ────────────────────────────────────────────────
export const commentService = {
  getByTask: (taskId) => api.get(`/api/comments/${taskId}`),
  add:       (data)   => api.post('/api/comments', data),
  update:    (id, data) => api.put(`/api/comments/${id}`, data),
  delete:    (id)     => api.delete(`/api/comments/${id}`),
};

// ── AI ─────────────────────────────────────────────────────
export const aiService = {
  // Task AI features
  generateSubtasks: (taskId) => api.post(`/api/ai/tasks/${taskId}/subtasks/generate`),
  estimateComplexity: (taskId) => api.post(`/api/ai/tasks/${taskId}/complexity`),

  // Project AI features
  generateRecommendations: (projectId) => api.post(`/api/ai/projects/${projectId}/recommendations`),
  suggestDependencies: (projectId) => api.post(`/api/ai/projects/${projectId}/dependencies`),
  generateTaskSequence: (projectId) => api.post(`/api/ai/projects/${projectId}/sequence`),

  // User AI features
  estimateWorkload: () => api.post('/api/ai/workload'),
  generateProductivitySuggestions: () => api.post('/api/ai/productivity'),

  // AI data management
  getHistory: (params) => api.get('/api/ai/history', { params }),
  getRecommendations: (params) => api.get('/api/ai/recommendations', { params }),
  acceptRecommendation: (recommendationId) => api.put(`/api/ai/recommendations/${recommendationId}/accept`),
  acceptGeneratedTask: (taskId) => api.put(`/api/ai/generated-tasks/${taskId}/accept`),
};
