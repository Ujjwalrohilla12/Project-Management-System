import { useState } from 'react';
import { aiService } from '../services/api.service.js';
import { toast } from 'react-hot-toast';
import { SparklesIcon, CpuChipIcon, LightBulbIcon, ClockIcon } from '@heroicons/react/24/outline';

const AISuggestionPanel = ({ taskId, projectId, onSuggestionApplied }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [activeTab, setActiveTab] = useState('subtasks');

  const generateSubtasks = async () => {
    setLoading(true);
    try {
      const response = await aiService.generateSubtasks(taskId);
      setSuggestions(prev => ({ ...prev, subtasks: response.data.subtasks }));
      toast.success('AI-generated subtasks ready!');
    } catch (error) {
      toast.error('Failed to generate subtasks');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const estimateComplexity = async () => {
    setLoading(true);
    try {
      const response = await aiService.estimateComplexity(taskId);
      setSuggestions(prev => ({ ...prev, complexity: response.data.estimation }));
      toast.success('Complexity estimation complete!');
    } catch (error) {
      toast.error('Failed to estimate complexity');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await aiService.generateRecommendations(projectId);
      setSuggestions(prev => ({ ...prev, recommendations: response.data.recommendations }));
      toast.success('AI recommendations generated!');
    } catch (error) {
      toast.error('Failed to generate recommendations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const acceptGeneratedTask = async (generatedTaskId) => {
    try {
      await aiService.acceptGeneratedTask(generatedTaskId);
      toast.success('Subtask added to project!');
      onSuggestionApplied?.();
      // Remove from suggestions
      setSuggestions(prev => ({
        ...prev,
        subtasks: prev.subtasks?.filter(t => t.id !== generatedTaskId)
      }));
    } catch (error) {
      toast.error('Failed to accept subtask');
      console.error(error);
    }
  };

  const acceptRecommendation = async (recommendationId) => {
    try {
      await aiService.acceptRecommendation(recommendationId);
      toast.success('Recommendation accepted!');
      // Mark as accepted in UI
      setSuggestions(prev => ({
        ...prev,
        recommendations: prev.recommendations?.map(r =>
          r.id === recommendationId ? { ...r, isAccepted: true } : r
        )
      }));
    } catch (error) {
      toast.error('Failed to accept recommendation');
      console.error(error);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <SparklesIcon className="size-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-200">
          AI Assistant
        </h3>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <button
          onClick={generateSubtasks}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
        >
          <CpuChipIcon className="size-4" />
          {loading ? 'Generating...' : 'Generate Subtasks'}
        </button>

        <button
          onClick={estimateComplexity}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          <ClockIcon className="size-4" />
          {loading ? 'Estimating...' : 'Estimate Complexity'}
        </button>

        <button
          onClick={generateRecommendations}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
        >
          <LightBulbIcon className="size-4" />
          {loading ? 'Thinking...' : 'Get Recommendations'}
        </button>
      </div>

      {/* Results Tabs */}
      {suggestions && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <div className="flex gap-4 mb-4">
            {suggestions.subtasks && (
              <button
                onClick={() => setActiveTab('subtasks')}
                className={`px-3 py-1 rounded ${
                  activeTab === 'subtasks'
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Subtasks ({suggestions.subtasks.length})
              </button>
            )}
            {suggestions.complexity && (
              <button
                onClick={() => setActiveTab('complexity')}
                className={`px-3 py-1 rounded ${
                  activeTab === 'complexity'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Complexity
              </button>
            )}
            {suggestions.recommendations && (
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-3 py-1 rounded ${
                  activeTab === 'recommendations'
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Recommendations ({suggestions.recommendations.length})
              </button>
            )}
          </div>

          {/* Subtasks Tab */}
          {activeTab === 'subtasks' && suggestions.subtasks && (
            <div className="space-y-3">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-200">AI-Generated Subtasks</h4>
              {suggestions.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex-1">
                    <h5 className="font-medium text-zinc-900 dark:text-zinc-200">{subtask.title}</h5>
                    {subtask.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{subtask.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        subtask.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                        subtask.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {subtask.priority}
                      </span>
                      {subtask.estimatedHours && (
                        <span className="text-xs text-zinc-500">
                          {subtask.estimatedHours}h estimated
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => acceptGeneratedTask(subtask.id)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Complexity Tab */}
          {activeTab === 'complexity' && suggestions.complexity && (
            <div className="space-y-4">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-200">Complexity Analysis</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {suggestions.complexity.complexity}/10
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Complexity Score</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {suggestions.complexity.estimatedHours}h
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Estimated Time</div>
                </div>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <h5 className="font-medium text-zinc-900 dark:text-zinc-200 mb-2">Analysis</h5>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {suggestions.complexity.reasoning}
                </p>
                <div className="mt-2 text-xs text-zinc-500">
                  Confidence: {Math.round(suggestions.complexity.confidence * 100)}%
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && suggestions.recommendations && (
            <div className="space-y-3">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-200">AI Recommendations</h4>
              {suggestions.recommendations.map((rec) => (
                <div key={rec.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-zinc-900 dark:text-zinc-200">{rec.title}</h5>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          rec.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rec.priority}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {rec.type}
                        </span>
                      </div>
                    </div>
                    {!rec.isAccepted && (
                      <button
                        onClick={() => acceptRecommendation(rec.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors ml-4"
                      >
                        Accept
                      </button>
                    )}
                    {rec.isAccepted && (
                      <span className="text-sm text-green-600 dark:text-green-400 ml-4">
                        ✓ Accepted
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISuggestionPanel;