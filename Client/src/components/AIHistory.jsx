import { useState, useEffect } from 'react';
import { aiService } from '../../services/api.service';
import { format } from 'date-fns';
import { ClockIcon, CpuChipIcon, LightBulbIcon, ChartBarIcon, UserIcon } from '@heroicons/react/24/outline';

const AIHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      const response = await aiService.getHistory({ page, limit: 20 });
      if (page === 1) {
        setHistory(response.data.logs);
      } else {
        setHistory(prev => [...prev, ...response.data.logs]);
      }
      setHasMore(response.data.logs.length === 20);
    } catch (error) {
      console.error('Failed to load AI history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'generate_subtasks':
        return <CpuChipIcon className="size-4 text-purple-600" />;
      case 'estimate_complexity':
        return <ChartBarIcon className="size-4 text-blue-600" />;
      case 'generate_recommendations':
        return <LightBulbIcon className="size-4 text-green-600" />;
      case 'estimate_workload':
        return <UserIcon className="size-4 text-orange-600" />;
      default:
        return <ClockIcon className="size-4 text-zinc-600" />;
    }
  };

  const getActionLabel = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && page === 1) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-200 mb-2">
          AI Activity History
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Track your AI interactions and generated content
        </p>
      </div>

      <div className="space-y-4">
        {history.map((log) => (
          <div key={log.id} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-200">
                    {getActionLabel(log.action)}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    log.success
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {log.success ? 'Success' : 'Failed'}
                  </span>
                </div>

                <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  <div>
                    {format(new Date(log.createdAt), 'MMM dd, yyyy hh:mm a')}
                  </div>

                  {log.task && (
                    <div>
                      Task: <span className="font-medium">{log.task.title}</span>
                    </div>
                  )}

                  {log.project && (
                    <div>
                      Project: <span className="font-medium">{log.project.name}</span>
                    </div>
                  )}

                  {log.tokensUsed && (
                    <div className="flex items-center gap-4">
                      <span>Tokens: {log.tokensUsed.toLocaleString()}</span>
                      {log.cost && (
                        <span>Cost: ${log.cost.toFixed(4)}</span>
                      )}
                    </div>
                  )}
                </div>

                {!log.success && log.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                    {log.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={() => setPage(prev => prev + 1)}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-200 rounded-lg transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {history.length === 0 && !loading && (
        <div className="text-center py-12">
          <ClockIcon className="size-12 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-200 mb-2">
            No AI activity yet
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Start using AI features to see your activity history here.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIHistory;