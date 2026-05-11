import { Link } from 'react-router-dom';
import { CalendarIcon, UsersIcon, CheckCircleIcon, ArchiveIcon } from 'lucide-react';
import { formatDate } from '../utils/helpers.js';
import { calcHealthScore, healthLabel, deadlineStatus } from '../utils/projectHealth.js';

const STATUS_STYLES = {
  PLANNING:  'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
  ACTIVE:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400',
  ON_HOLD:   'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
};

const PRIORITY_DOT = {
  LOW:    'bg-zinc-400',
  MEDIUM: 'bg-amber-400',
  HIGH:   'bg-red-500',
};

const ProjectCard = ({ project, onArchive, onDelete }) => {
  const tasks      = project.tasks || [];
  const doneTasks  = tasks.filter((t) => t.status === 'DONE').length;
  const score      = project.healthScore ?? calcHealthScore(project, tasks);
  const health     = healthLabel(score);
  const deadline   = deadlineStatus(project.end_date);
  const members    = project.members || [];

  return (
    <div className={`relative bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 rounded-xl p-5 transition-all duration-200 group flex flex-col gap-3 ${project.isArchived ? 'opacity-60' : ''}`}>

      {/* Archive badge */}
      {project.isArchived && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <ArchiveIcon className="size-3" /> Archived
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            to={`/projectsDetail?id=${project.id}&tab=tasks`}
            className="font-semibold text-gray-900 dark:text-zinc-100 truncate block group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors text-sm"
          >
            {project.name}
          </Link>
          <p className="text-gray-500 dark:text-zinc-400 text-xs line-clamp-2 mt-0.5">
            {project.description || 'No description'}
          </p>
        </div>

        {/* Health score ring */}
        <div className={`flex-shrink-0 flex flex-col items-center px-2 py-1 rounded-lg ${health.bg}`}>
          <span className={`text-lg font-bold leading-none ${health.color}`}>{score}</span>
          <span className={`text-[10px] font-medium ${health.color}`}>{health.label}</span>
        </div>
      </div>

      {/* Status + Priority */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[project.status]}`}>
          {project.status.replace('_', ' ')}
        </span>
        <div className="flex items-center gap-1">
          <div className={`size-2 rounded-full ${PRIORITY_DOT[project.priority]}`} />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{project.priority.toLowerCase()}</span>
        </div>
        {deadline && (
          <span className={`text-xs font-medium ${deadline.color} ${deadline.urgent ? 'font-semibold' : ''}`}>
            · {deadline.label}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <CheckCircleIcon className="size-3" />
            {doneTasks}/{tasks.length} tasks
          </span>
          <span>{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all ${health.bar}`}
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Footer: members + deadline */}
      <div className="flex items-center justify-between pt-1">
        {/* Member avatars */}
        <div className="flex items-center">
          {members.slice(0, 4).map((m, i) => (
            <div
              key={m.id}
              className="size-6 rounded-full border-2 border-white dark:border-zinc-900 -ml-1.5 first:ml-0 bg-zinc-300 dark:bg-zinc-700 overflow-hidden flex-shrink-0"
              style={{ zIndex: 4 - i }}
              title={m.user?.name || m.user?.email}
            >
              {m.user?.image
                ? <img src={m.user.image} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-zinc-600 dark:text-zinc-300">
                    {(m.user?.name || m.user?.email || '?')[0].toUpperCase()}
                  </div>
              }
            </div>
          ))}
          {members.length > 4 && (
            <div className="size-6 rounded-full border-2 border-white dark:border-zinc-900 -ml-1.5 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-600 dark:text-zinc-300">
              +{members.length - 4}
            </div>
          )}
          {members.length === 0 && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <UsersIcon className="size-3" /> No members
            </span>
          )}
        </div>

        {/* End date */}
        {project.end_date && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <CalendarIcon className="size-3" />
            {formatDate(project.end_date, 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
