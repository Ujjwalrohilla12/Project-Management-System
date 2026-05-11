import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Search, FolderOpen, LayoutGrid, List, SlidersHorizontal, ArchiveIcon, Trash2Icon, RefreshCwIcon } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ProjectCard from '../components/ProjectCard.jsx';
import CreateProjectDialog from '../components/CreateProjectDialog.jsx';
import PermissionGate from '../components/ui/PermissionGate.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { projectService } from '../services/api.service.js';
import { removeProject, updateProject } from '../features/workspaceSlice.js';
import { calcHealthScore, healthLabel, deadlineStatus } from '../utils/projectHealth.js';
import { formatDate } from '../utils/helpers.js';
import { usePermissions } from '../hooks/usePermissions.js';

const STATUS_STYLES = {
  PLANNING:  'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
  ACTIVE:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400',
  ON_HOLD:   'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
};

export default function Projects() {
  const dispatch    = useDispatch();
  const { canManageProjects, isWorkspaceAdmin } = usePermissions();
  const allProjects = useSelector((s) => s?.workspace?.currentWorkspace?.projects || []);
  const wsLoading   = useSelector((s) => s.workspace.loading);

  const [view,         setView]         = useState('grid');
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy,       setSortBy]       = useState('createdAt');
  const [sortOrder,    setSortOrder]    = useState('desc');
  const [showArchived, setShowArchived] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId,   setDeletingId]   = useState(null);
  const [archivingId,  setArchivingId]  = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // project object

  // Client-side filter + sort (data already in Redux from workspace fetch)
  const filtered = useMemo(() => {
    let list = allProjects.filter((p) => p.isArchived === showArchived);
    if (search)                list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'ALL') list = list.filter((p) => p.status === statusFilter);
    if (priorityFilter !== 'ALL') list = list.filter((p) => p.priority === priorityFilter);

    list = [...list].sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (sortBy === 'healthScore') { va = a.healthScore ?? calcHealthScore(a, a.tasks || []); vb = b.healthScore ?? calcHealthScore(b, b.tasks || []); }
      if (sortBy === 'end_date')    { va = va ? new Date(va) : new Date(0); vb = vb ? new Date(vb) : new Date(0); }
      if (sortBy === 'name')        { return sortOrder === 'asc' ? va?.localeCompare(vb) : vb?.localeCompare(va); }
      if (sortOrder === 'asc')      return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });
    return list;
  }, [allProjects, search, statusFilter, priorityFilter, sortBy, sortOrder, showArchived]);

  const handleArchive = async (project) => {
    setArchivingId(project.id);
    const toastId = toast.loading(project.isArchived ? 'Restoring...' : 'Archiving...');
    try {
      const { data } = await projectService.archive(project.id, {
        isArchived: !project.isArchived,
        workspaceId: project.workspaceId,
      });
      dispatch(updateProject(data.data.project));
      toast.success(project.isArchived ? 'Project restored' : 'Project archived', { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setArchivingId(null);
    }
  };

  const handleDelete = async (project) => {
    setDeletingId(project.id);
    const toastId = toast.loading('Deleting project...');
    try {
      await projectService.delete(project.id);
      dispatch(removeProject(project.id));
      toast.success('Project deleted', { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const selectCls = 'px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            {showArchived ? 'Archived Projects' : 'Projects'}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-0.5">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowArchived((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition ${showArchived ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
          >
            <ArchiveIcon className="size-4" />
            {showArchived ? 'Active' : 'Archived'}
          </button>
          <PermissionGate permission="canManageProjects">
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition"
            >
              <Plus className="size-4" /> New Project
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select value={statusFilter}   onChange={(e) => setStatusFilter(e.target.value)}   className={selectCls}>
          <option value="ALL">All Status</option>
          {['ACTIVE','PLANNING','ON_HOLD','COMPLETED','CANCELLED'].map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={selectCls}>
          <option value="ALL">All Priority</option>
          {['HIGH','MEDIUM','LOW'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={`${sortBy}:${sortOrder}`} onChange={(e) => { const [b, o] = e.target.value.split(':'); setSortBy(b); setSortOrder(o); }} className={selectCls}>
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="end_date:asc">Deadline soon</option>
          <option value="progress:desc">Most progress</option>
          <option value="healthScore:asc">Needs attention</option>
        </select>
        {/* View toggle */}
        <div className="flex border border-gray-300 dark:border-zinc-700 rounded-lg overflow-hidden ml-auto">
          <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'}`}>
            <LayoutGrid className="size-4 text-gray-600 dark:text-zinc-400" />
          </button>
          <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'}`}>
            <List className="size-4 text-gray-600 dark:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {wsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-5 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
            <FolderOpen className="w-10 h-10 text-gray-400 dark:text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {showArchived ? 'No archived projects' : 'No projects found'}
          </h3>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">
            {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : showArchived ? 'Archived projects will appear here' : 'Create your first project to get started'}
          </p>
          <PermissionGate permission="canManageProjects">
            {!showArchived && (
              <button onClick={() => setIsDialogOpen(true)} className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                <Plus className="size-4" /> Create Project
              </button>
            )}
          </PermissionGate>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <div key={project.id} className="relative group/card">
              <ProjectCard project={project} />
              {/* Action overlay — admin only */}
              {(canManageProjects || isWorkspaceAdmin) && (
                <div className="absolute top-3 right-3 hidden group-hover/card:flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm p-1">
                  <button
                    onClick={() => handleArchive(project)}
                    disabled={archivingId === project.id}
                    title={project.isArchived ? 'Restore' : 'Archive'}
                    className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 disabled:opacity-50"
                  >
                    {project.isArchived ? <RefreshCwIcon className="size-3.5" /> : <ArchiveIcon className="size-3.5" />}
                  </button>
                  {isWorkspaceAdmin && (
                    <button
                      onClick={() => setConfirmDelete(project)}
                      disabled={deletingId === project.id}
                      title="Delete"
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 disabled:opacity-50"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-900/60 text-xs uppercase text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Priority</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Deadline</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Progress</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">Health</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">Members</th>
                {(canManageProjects || isWorkspaceAdmin) && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {filtered.map((project) => {
                const score    = project.healthScore ?? calcHealthScore(project, project.tasks || []);
                const health   = healthLabel(score);
                const deadline = deadlineStatus(project.end_date);
                return (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/projectsDetail?id=${project.id}&tab=tasks`} className="font-medium text-gray-900 dark:text-zinc-100 hover:text-blue-500 dark:hover:text-blue-400 truncate block max-w-48">
                        {project.name}
                      </a>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-48">{project.description || '—'}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[project.status]}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                      {project.priority.toLowerCase()}
                    </td>
                    <td className={`px-4 py-3 hidden lg:table-cell text-xs ${deadline?.color || 'text-zinc-500 dark:text-zinc-400'}`}>
                      {project.end_date ? formatDate(project.end_date, 'MMM d, yyyy') : '—'}
                      {deadline && <span className="block text-[10px]">{deadline.label}</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-zinc-700 h-1.5 rounded-full">
                          <div className={`h-1.5 rounded-full ${health.bar}`} style={{ width: `${project.progress || 0}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500">{project.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${health.bg} ${health.color}`}>
                        {score} · {health.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex -space-x-1">
                        {(project.members || []).slice(0, 3).map((m) => (
                          <div key={m.id} className="size-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-700 overflow-hidden" title={m.user?.name}>
                            {m.user?.image ? <img src={m.user.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold">{(m.user?.name || '?')[0]}</div>}
                          </div>
                        ))}
                        {(project.members || []).length > 3 && <div className="size-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-600">+{project.members.length - 3}</div>}
                      </div>
                    </td>
                    {(canManageProjects || isWorkspaceAdmin) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleArchive(project)} disabled={archivingId === project.id} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 disabled:opacity-50" title={project.isArchived ? 'Restore' : 'Archive'}>
                            {project.isArchived ? <RefreshCwIcon className="size-3.5" /> : <ArchiveIcon className="size-3.5" />}
                          </button>
                          {isWorkspaceAdmin && (
                            <button onClick={() => setConfirmDelete(project)} disabled={deletingId === project.id} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 disabled:opacity-50" title="Delete">
                              <Trash2Icon className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Project</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
              Are you sure you want to permanently delete <span className="font-medium text-gray-900 dark:text-white">"{confirmDelete.name}"</span>? This will also delete all tasks and comments. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deletingId === confirmDelete.id} className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-60">
                {deletingId === confirmDelete.id ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
    </div>
  );
}
