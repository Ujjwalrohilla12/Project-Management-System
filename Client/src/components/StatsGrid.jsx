import { FolderOpen, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { SkeletonStatCard } from './ui/Skeleton.jsx';

export default function StatsGrid() {
  const { userId } = useAuth();
  const currentWorkspace = useSelector((s) => s?.workspace?.currentWorkspace);
  const loading = useSelector((s) => s.workspace.loading);

  const [stats, setStats] = useState({ totalProjects: 0, completedProjects: 0, myTasks: 0, overdueIssues: 0 });

  useEffect(() => {
    if (!currentWorkspace) return;
    const allTasks = currentWorkspace.projects.flatMap((p) => p.tasks);
    setStats({
      totalProjects: currentWorkspace.projects.length,
      completedProjects: currentWorkspace.projects.filter((p) => p.status === 'COMPLETED').length,
      myTasks: allTasks.filter((t) => t.assigneeId === userId).length,
      overdueIssues: allTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE').length,
    });
  }, [currentWorkspace, userId]);

  const statCards = [
    { Icon: FolderOpen, title: 'Total Projects', value: stats.totalProjects, subtitle: `in ${currentWorkspace?.name || '...'}`, bgColor: 'bg-blue-500/10', textColor: 'text-blue-500' },
    { Icon: CheckCircle, title: 'Completed', value: stats.completedProjects, subtitle: `of ${stats.totalProjects} total`, bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-500' },
    { Icon: Users, title: 'My Tasks', value: stats.myTasks, subtitle: 'assigned to me', bgColor: 'bg-purple-500/10', textColor: 'text-purple-500' },
    { Icon: AlertTriangle, title: 'Overdue', value: stats.overdueIssues, subtitle: 'need attention', bgColor: 'bg-amber-500/10', textColor: 'text-amber-500' },
  ];

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-9">
      {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-9">
      {statCards.map(({ Icon, title, value, subtitle, bgColor, textColor }, i) => (
        <div key={i} className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200 rounded-md">
          <div className="p-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{title}</p>
                <p className="text-3xl font-bold text-zinc-800 dark:text-white">{value}</p>
                {subtitle && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{subtitle}</p>}
              </div>
              <div className={`p-3 rounded-xl ${bgColor}`}>
                <Icon size={20} className={textColor} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
