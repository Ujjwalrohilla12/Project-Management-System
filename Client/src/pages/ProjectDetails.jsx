import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, SettingsIcon, BarChart3Icon, CalendarIcon, FileStackIcon, ClockIcon, HeartPulseIcon } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useAuth } from '@clerk/clerk-react';
import ProjectAnalytics from '../components/ProjectAnalytics.jsx';
import ProjectSettings from '../components/ProjectSettings.jsx';
import CreateTaskDialog from '../components/CreateTaskDialog.jsx';
import ProjectCalendar from '../components/ProjectCalendar.jsx';
import ProjectTasks from '../components/ProjectTasks.jsx';
import PermissionGate from '../components/ui/PermissionGate.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { setProjectRole } from '../features/authSlice.js';
import { calcHealthScore, healthLabel, deadlineStatus } from '../utils/projectHealth.js';

const STATUS_STYLES = {
  PLANNING:  'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
  ACTIVE:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400',
  ON_HOLD:   'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
};

export default function ProjectDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const id  = searchParams.get('id');

  const navigate       = useNavigate();
  const dispatch       = useDispatch();
  const { userId }     = useAuth();
  const projects       = useSelector((s) => s?.workspace?.currentWorkspace?.projects || []);
  const workspaceRole  = useSelector((s) => s.auth.workspaceRole);
  const wsLoading      = useSelector((s) => s.workspace.loading);

  const [project,        setProject]        = useState(null);
  const [tasks,          setTasks]          = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeTab,      setActiveTab]      = useState(tab || 'tasks');

  useEffect(() => { if (tab) setActiveTab(tab); }, [tab]);

  useEffect(() => {
    if (!projects.length) return;
    const proj = projects.find((p) => p.id === id);
    setProject(proj || null);
    setTasks(proj?.tasks || []);

    if (proj && userId) {
      const isWsAdmin = workspaceRole === 'ADMIN';
      const isLead    = proj.team_lead === userId;
      const isMember  = proj.members?.some((m) => m.userId === userId);
      if (isWsAdmin)     dispatch(setProjectRole('WORKSPACE_ADMIN'));
      else if (isLead)   dispatch(setProjectRole('LEAD'));
      else if (isMember) dispatch(setProjectRole('MEMBER'));
      else               dispatch(setProjectRole(null));
    }
  }, [id, projects, userId, workspaceRole, dispatch]);

  if (wsLoading) return (
    <div className="max-w-6xl mx-auto space-y-4">
      {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  if (!project) return (
    <div className="p-6 text-center text-zinc-900 dark:text-zinc-200">
      <p className="text-3xl md:text-5xl mt-40 mb-10">Project not found</p>
      <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 rounded bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600">
        Back to Projects
      </button>
    </div>
  );

  const score    = project.healthScore ?? calcHealthScore(project, tasks);
  const health   = healthLabel(score);
  const deadline = deadlineStatus(project.end_date);
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;

  const TABS = [
    { key: 'tasks',     label: 'Tasks',     icon: FileStackIcon  },
    { key: 'calendar',  label: 'Calendar',  icon: CalendarIcon   },
    { key: 'analytics', label: 'Analytics', icon: BarChart3Icon  },
    { key: 'settings',  label: 'Settings',  icon: SettingsIcon   },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto text-zinc-900 dark:text-white">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex max-md:flex-col gap-4 flex-wrap items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
            <ArrowLeftIcon className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold">{project.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[project.status]}`}>
                {project.status.replace('_', ' ')}
              </span>
              {deadline && (
                <span className={`text-xs font-medium ${deadline.color}`}>{deadline.label}</span>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Health score badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${health.bg} border-transparent`}>
            <HeartPulseIcon className={`size-4 ${health.color}`} />
            <div>
              <div className={`text-sm font-bold leading-none ${health.color}`}>{score}/100</div>
              <div className={`text-[10px] ${health.color}`}>{health.label}</div>
            </div>
          </div>

          <PermissionGate permission="canManageTasks">
            <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90">
              <PlusIcon className="size-4" /> New Task
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* ── Info cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks',  value: tasks.length,                                                                    color: 'text-zinc-900 dark:text-white' },
          { label: 'Completed',    value: doneTasks,                                                                        color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'In Progress',  value: tasks.filter((t) => t.status === 'IN_PROGRESS').length,                          color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Team Members', value: project.members?.length || 0,                                                    color: 'text-blue-600 dark:text-blue-400' },
        ].map((card) => (
          <div key={card.label} className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-zinc-600 dark:text-zinc-400">Overall Progress</span>
          <span className="font-medium">{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${health.bar}`}
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
          <span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No start date'}</span>
          <span>{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No deadline'}</span>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setSearchParams({ id, tab: t.key }); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === t.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'tasks'     && <ProjectTasks tasks={tasks} />}
          {activeTab === 'analytics' && <ProjectAnalytics tasks={tasks} project={project} />}
          {activeTab === 'calendar'  && <ProjectCalendar tasks={tasks} />}
          {activeTab === 'settings'  && <ProjectSettings project={project} />}
        </div>
      </div>

      {showCreateTask && (
        <CreateTaskDialog showCreateTask={showCreateTask} setShowCreateTask={setShowCreateTask} projectId={id} />
      )}
    </div>
  );
}
