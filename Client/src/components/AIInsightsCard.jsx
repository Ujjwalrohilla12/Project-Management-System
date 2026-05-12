import { useState, useEffect } from 'react';
import { aiService } from '../services/api.service.js';
import { toast } from 'react-hot-toast';
import { SparklesIcon, ChartBarIcon, UserGroupIcon, ClockIcon, CheckCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const AIInsightsCard = ({ projectId, userId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [projectId]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // Load recommendations and workload data
      const [recommendationsRes, workloadRes] = await Promise.all([
        aiService.getRecommendations({ type: 'general', accepted: 'false' }),
        userId ? aiService.estimateWorkload() : Promise.resolve(null)
      ]);

      setInsights({
        recommendations: recommendationsRes.data.recommendations.slice(0, 3),
        workload: workloadRes?.data?.workload
      });
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptRecommendation = async (recommendationId) => {
    try {
      await aiService.acceptRecommendation(recommendationId);
      toast.success('Recommendation accepted!');
      // Update local state
      setInsights(prev => ({
        ...prev,
        recommendations: prev.recommendations.filter(r => r.id !== recommendationId)
      }));
    } catch (error) {
      toast.error('Failed to accept recommendation');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!insights || (!insights.recommendations.length && !insights.workload)) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="size-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-200">
          AI Insights
        </h3>
      </div>

      {/* Workload Overview */}
      {insights.workload && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="size-4 text-blue-600" />
            <span className="font-medium text-blue-900 dark:text-blue-200">Workload Analysis</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold text-blue-700 dark:text-blue-300">
                {insights.workload.currentLoad}h
              </div>
              <div className="text-blue-600 dark:text-blue-400">Current Load</div>
            </div>
            <div>
              <div className="font-semibold text-blue-700 dark:text-blue-300">
                {insights.workload.capacity}h
              </div>
              <div className="text-blue-600 dark:text-blue-400">Capacity</div>
            </div>
            <div>
              <div className={`font-semibold ${
                insights.workload.utilization > 80 ? 'text-red-600' :
                insights.workload.utilization > 60 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {insights.workload.utilization}%
              </div>
              <div className="text-blue-600 dark:text-blue-400">Utilization</div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LightBulbIcon className="size-4 text-yellow-600" />
            <span className="font-medium text-zinc-900 dark:text-zinc-200">Recommendations</span>
          </div>
          <div className="space-y-3">
            {insights.recommendations.map((rec) => (
              <div key={rec.id} className="flex items-start justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex-1">
                  <h5 className="font-medium text-yellow-900 dark:text-yellow-200 text-sm">
                    {rec.title}
                  </h5>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    {rec.description}
                  </p>
                </div>
                <button
                  onClick={() => acceptRecommendation(rec.id)}
                  className="ml-3 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-2">
          <button
            onClick={() => loadInsights()}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
          >
            <SparklesIcon className="size-3" />
            Refresh
          </button>
          <button
            onClick={() => window.location.href = '/ai-history'}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
          >
            <ClockIcon className="size-3" />
            History
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsCard;