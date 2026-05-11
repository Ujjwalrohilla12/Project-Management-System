import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { CheckCircle, Clock, AlertTriangle, Users, TrendingUp, HeartPulseIcon } from 'lucide-react';
import { calcHealthScore, healthLabel } from '../utils/projectHealth.js';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const PRIORITY_BAR = { LOW: '#94a3b8', MEDIUM: '#f59e0b', HIGH: '#ef4444' };

const MetricCard = ({ icon, label, value, color, bg }) => (
  <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
      </div>
      <div className={`p-2.5 rounded-xl ${bg}`}>{icon}</div>
    </div>
  </div>
);

const ProjectAnalytics = ({ project, tasks }) => {
  const now = new Date();

  const { stats, statusData, typeData, priorityData, weeklyData, assigneeData } = useMemo(() => {
    const total = tasks.length;
    const stats = { total, completed: 0, inProgress: 0, todo: 0, overdue: 0 };
    const statusMap   = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const typeMap     = { TASK: 0, BUG: 0, FEATURE: 0, IMPROVEMENT: 0, OTHER: 0 };
    const priorityMap = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    const assigneeMap = {};

    tasks.forEach((t) => {
      if (t.status === 'DONE')        stats.completed++;
      if (t.status === 'IN_PROGRESS') stats.inProgress++;
      if (t.status === 'TODO')        stats.todo++;
      if (t.due_date && new Date(t.due_date) < now && t.status !== 'DONE') stats.overdue++;
      if (statusMap[t.status]     !== undefined) statusMap[t.status]++;
      if (typeMap[t.type]         !== undefined) typeMap[t.type]++;
      if (priorityMap[t.priority] !== undefined) priorityMap[t.priority]++;
      if (t.assignee) {
        const k = t.assignee.id;
        if (!assigneeMap[k]) assigneeMap[k] = { name: t.assignee.name || t.assignee.email, image: t.assignee.image, total: 0, done: 0 };
        assigneeMap[k].total++;
        if (t.status === 'DONE') assigneeMap[k].done++;
      }
    });

    // Weekly completion (last 8 weeks)
    const weeklyData = Array.from({ length: 8 }, (_, i) => {
      const wStart = new Date(now); wStart.setDate(wStart.getDate() - (7 - i) * 7); wStart.setHours(0,0,0,0);
      const wEnd   = new Date(wStart); wEnd.setDate(wEnd.getDate() + 7);
      return {
        week:      `W${i + 1}`,
        completed: tasks.filter((t) => t.status === 'DONE' && new Date(t.updatedAt) >= wStart && new Date(t.updatedAt) < wEnd).length,
        created:   tasks.filter((t) => new Date(t.createdAt) >= wStart && new Date(t.createdAt) < wEnd).length,
      };
    });

    return {
      stats,
      statusData:   Object.entries(statusMap).map(([k, v]) => ({ name: k.replace('_', ' '), value: v })),
      typeData:     Object.entries(typeMap).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v })),
      priorityData: Object.entries(priorityMap).map(([k, v]) => ({ name: k, value: v, fill: PRIORITY_BAR[k] })),
      weeklyData,
      assigneeData: Object.values(assigneeMap).sort((a, b) => b.total - a.total),
    };
  }, [tasks]);

  const score  = project?.healthScore ?? calcHealthScore(project, tasks);
  const health = healthLabel(score);
  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<TrendingUp className="size-5 text-emerald-500" />}   label="Completion Rate" value={`${completionRate}%`} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-100 dark:bg-emerald-500/10" />
        <MetricCard icon={<Clock className="size-5 text-blue-500" />}           label="In Progress"     value={stats.inProgress}     color="text-blue-600 dark:text-blue-400"     bg="bg-blue-100 dark:bg-blue-500/10"     />
        <MetricCard icon={<AlertTriangle className="size-5 text-red-500" />}    label="Overdue"         value={stats.overdue}         color="text-red-600 dark:text-red-400"       bg="bg-red-100 dark:bg-red-500/10"       />
        <MetricCard icon={<Users className="size-5 text-purple-500" />}         label="Team Size"       value={project?.members?.length || 0} color="text-purple-600 dark:text-purple-400" bg="bg-purple-100 dark:bg-purple-500/10" />
      </div>

      {/* Health score + weekly burndown */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health score */}
        <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Project Health</p>
          <div className="relative size-28">
            <svg className="size-28 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-200 dark:text-zinc-700" />
              <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="2.5"
                stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'}
                strokeDasharray={`${score} ${100 - score}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${health.color}`}>{score}</span>
              <span className="text-xs text-zinc-500">/ 100</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${health.bg} ${health.color}`}>{health.label}</span>
        </div>

        {/* Weekly burndown */}
        <div className="lg:col-span-2 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-200 mb-4">Weekly Activity (last 8 weeks)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} name="Completed" />
              <Line type="monotone" dataKey="created"   stroke="#3b82f6" strokeWidth={2} dot={false} name="Created"   strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status + Type charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-200 mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-200 mb-4">Tasks by Type</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">No tasks yet</div>
          )}
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-200 mb-4">Priority Breakdown</h3>
        <div className="space-y-3">
          {priorityData.map((p) => {
            const pct = stats.total > 0 ? Math.round((p.value / stats.total) * 100) : 0;
            return (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-700 dark:text-zinc-300 capitalize">{p.name.toLowerCase()}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">{p.value} tasks · {pct}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.fill }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assignee workload */}
      {assigneeData.length > 0 && (
        <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-200 mb-4">Team Workload</h3>
          <div className="space-y-3">
            {assigneeData.map((a) => {
              const pct = a.total > 0 ? Math.round((a.done / a.total) * 100) : 0;
              return (
                <div key={a.name} className="flex items-center gap-3">
                  <div className="size-7 rounded-full bg-zinc-300 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                    {a.image ? <img src={a.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">{(a.name || '?')[0].toUpperCase()}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-700 dark:text-zinc-300 truncate">{a.name}</span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs flex-shrink-0">{a.done}/{a.total} done</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAnalytics;
