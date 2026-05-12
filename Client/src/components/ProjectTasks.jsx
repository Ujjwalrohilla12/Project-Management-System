import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteTask, updateTask } from '../features/workspaceSlice.js';
import { taskService } from '../services/api.service.js';
import { Bug, CalendarIcon, GitCommit, MessageSquare, Square, Trash, XIcon, Zap, Kanban, List } from 'lucide-react';
import KanbanBoard from './KanbanBoard.jsx';

const typeIcons = {
  BUG: { icon: Bug, color: 'text-red-600 dark:text-red-400' },
  FEATURE: { icon: Zap, color: 'text-blue-600 dark:text-blue-400' },
  TASK: { icon: Square, color: 'text-green-600 dark:text-green-400' },
  IMPROVEMENT: { icon: GitCommit, color: 'text-purple-600 dark:text-purple-400' },
  OTHER: { icon: MessageSquare, color: 'text-amber-600 dark:text-amber-400' },
};

const priorityTexts = {
  LOW: { background: 'bg-red-100 dark:bg-red-950', prioritycolor: 'text-red-600 dark:text-red-400' },
  MEDIUM: { background: 'bg-blue-100 dark:bg-blue-950', prioritycolor: 'text-blue-600 dark:text-blue-400' },
  HIGH: { background: 'bg-emerald-100 dark:bg-emerald-950', prioritycolor: 'text-emerald-600 dark:text-emerald-400' },
};

const ProjectTasks = ({ tasks, projectId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [filters, setFilters] = useState({ status: '', type: '', priority: '', assignee: '' });
  const [view, setView] = useState('list'); // 'list' or 'kanban'

  const assigneeList = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.assignee?.name).filter(Boolean))),
    [tasks]
  );

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const { status, type, priority, assignee } = filters;
    return (
      (!status || task.status === status) &&
      (!type || task.type === type) &&
      (!priority || task.priority === priority) &&
      (!assignee || task.assignee?.name === assignee)
    );
  }), [filters, tasks]);

  const handleStatusChange = async (task, newStatus) => {
    const toastId = toast.loading('Updating status...');
    try {
      const { data } = await taskService.update(task.id, { status: newStatus });
      dispatch(updateTask(data.data.task));
      toast.success('Status updated', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Failed to update status', { id: toastId });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete selected tasks?')) return;
    const toastId = toast.loading('Deleting tasks...');
    try {
      await taskService.delete(selectedTasks);
      dispatch(deleteTask(selectedTasks));
      setSelectedTasks([]);
      toast.success('Tasks deleted', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Failed to delete tasks', { id: toastId });
    }
  };

  const filterOptions = {
    status: [{ label: 'All Statuses', value: '' }, { label: 'To Do', value: 'TODO' }, { label: 'In Progress', value: 'IN_PROGRESS' }, { label: 'Done', value: 'DONE' }],
    type: [{ label: 'All Types', value: '' }, { label: 'Task', value: 'TASK' }, { label: 'Bug', value: 'BUG' }, { label: 'Feature', value: 'FEATURE' }, { label: 'Improvement', value: 'IMPROVEMENT' }, { label: 'Other', value: 'OTHER' }],
    priority: [{ label: 'All Priorities', value: '' }, { label: 'Low', value: 'LOW' }, { label: 'Medium', value: 'MEDIUM' }, { label: 'High', value: 'HIGH' }],
    assignee: [{ label: 'All Assignees', value: '' }, ...assigneeList.map((n) => ({ label: n, value: n }))],
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        {/* View Toggle */}
        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              view === 'list'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100'
            }`}
          >
            <List className="size-4 inline mr-1" />
            List
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              view === 'kanban'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100'
            }`}
          >
            <Kanban className="size-4 inline mr-1" />
            Kanban
          </button>
        </div>

        {view === 'list' && (
          <>
            {['status', 'type', 'priority', 'assignee'].map((name) => (
              <select key={name} name={name} value={filters[name]} onChange={(e) => setFilters((p) => ({ ...p, [name]: e.target.value }))} className="border not-dark:bg-white border-zinc-300 dark:border-zinc-800 outline-none px-3 py-1 rounded text-sm text-zinc-900 dark:text-zinc-200">
                {filterOptions[name].map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ))}
            {Object.values(filters).some(Boolean) && (
              <button onClick={() => setFilters({ status: '', type: '', priority: '', assignee: '' })} className="px-3 py-1 flex items-center gap-2 rounded bg-gradient-to-br from-purple-400 to-purple-500 text-zinc-100 text-sm">
                <XIcon className="size-3" /> Reset
              </button>
            )}
            {selectedTasks.length > 0 && (
              <button onClick={handleDelete} className="px-3 py-1 flex items-center gap-2 rounded bg-gradient-to-br from-indigo-400 to-indigo-500 text-zinc-100 text-sm">
                <Trash className="size-3" /> Delete ({selectedTasks.length})
              </button>
            )}
          </>
        )}
      </div>

      {view === 'kanban' ? (
        <KanbanBoard tasks={tasks} projectId={projectId} />
      ) : (
        <div className="overflow-auto rounded-lg lg:border border-zinc-300 dark:border-zinc-800">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full text-sm text-left not-dark:bg-white text-zinc-900 dark:text-zinc-300">
            <thead className="text-xs uppercase dark:bg-zinc-800/70 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="pl-2 pr-1">
                  <input onChange={() => selectedTasks.length === tasks.length ? setSelectedTasks([]) : setSelectedTasks(tasks.map((t) => t.id))} checked={selectedTasks.length === tasks.length && tasks.length > 0} type="checkbox" className="size-3 accent-zinc-600" />
                </th>
                <th className="px-4 pl-0 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? filteredTasks.map((task) => {
                const { icon: Icon, color } = typeIcons[task.type] || {};
                const { background, prioritycolor } = priorityTexts[task.priority] || {};
                return (
                  <tr key={task.id} onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)} className="border-t border-zinc-300 dark:border-zinc-800 group hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer">
                    <td onClick={(e) => e.stopPropagation()} className="pl-2 pr-1">
                      <input type="checkbox" className="size-3 accent-zinc-600" onChange={() => setSelectedTasks((p) => p.includes(task.id) ? p.filter((i) => i !== task.id) : [...p, task.id])} checked={selectedTasks.includes(task.id)} />
                    </td>
                    <td className="px-4 pl-0 py-2">{task.title}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className={`size-4 ${color}`} />}
                        <span className={`uppercase text-xs ${color}`}>{task.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-1 rounded ${background} ${prioritycolor}`}>{task.priority}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()} className="px-4 py-2">
                      <select value={task.status} onChange={(e) => handleStatusChange(task, e.target.value)} className="group-hover:ring ring-zinc-100 outline-none px-2 pr-4 py-1 rounded text-sm text-zinc-900 dark:text-zinc-200 cursor-pointer">
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {task.assignee?.image && <img src={task.assignee.image} className="size-5 rounded-full" alt="" />}
                        {task.assignee?.name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <CalendarIcon className="size-4" />
                        {task.due_date ? format(new Date(task.due_date), 'dd MMMM') : '—'}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="7" className="text-center text-zinc-500 py-6">No tasks found for the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden flex flex-col gap-4">
          {filteredTasks.length > 0 ? filteredTasks.map((task) => {
            const { icon: Icon, color } = typeIcons[task.type] || {};
            const { background, prioritycolor } = priorityTexts[task.priority] || {};
            return (
              <div key={task.id} className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-zinc-900 dark:text-zinc-200 text-sm font-semibold">{task.title}</h3>
                  <input type="checkbox" className="size-4 accent-zinc-600" onChange={() => setSelectedTasks((p) => p.includes(task.id) ? p.filter((i) => i !== task.id) : [...p, task.id])} checked={selectedTasks.includes(task.id)} />
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  {Icon && <Icon className={`size-4 ${color}`} />}
                  <span className={`${color} uppercase`}>{task.type}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded w-fit ${background} ${prioritycolor}`}>{task.priority}</span>
                <select value={task.status} onChange={(e) => handleStatusChange(task, e.target.value)} className="w-full mt-1 bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-700 outline-none px-2 py-1 rounded text-sm text-zinc-900 dark:text-zinc-200">
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {task.assignee?.image && <img src={task.assignee.image} className="size-5 rounded-full" alt="" />}
                  {task.assignee?.name || '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <CalendarIcon className="size-4" />
                  {task.due_date ? format(new Date(task.due_date), 'dd MMMM') : '—'}
                </div>
              </div>
            );
          }) : <p className="text-center text-zinc-500 py-4">No tasks found.</p>}
        </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTasks;
