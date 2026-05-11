import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { taskService } from '../services/api.service.js';
import { addTask } from '../features/workspaceSlice.js';
import Modal from './ui/Modal.jsx';

const INITIAL = { title: '', description: '', type: 'TASK', status: 'TODO', priority: 'MEDIUM', assigneeId: '', due_date: '' };

export default function CreateTaskDialog({ showCreateTask, setShowCreateTask, projectId }) {
  const dispatch = useDispatch();
  const currentWorkspace = useSelector((s) => s.workspace?.currentWorkspace);
  const project = currentWorkspace?.projects?.find((p) => p.id === projectId);
  const teamMembers = project?.members || [];

  const [formData, setFormData] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Creating task...');
    try {
      const { data } = await taskService.create({ ...formData, projectId, assigneeId: formData.assigneeId || null });
      dispatch(addTask(data.data.task));
      toast.success('Task created!', { id: toastId });
      setFormData(INITIAL);
      setShowCreateTask(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create task', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} title="Create New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <input value={formData.title} onChange={(e) => set('title', e.target.value)} placeholder="Task title" className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1" required />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea value={formData.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the task" className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1 h-20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <select value={formData.type} onChange={(e) => set('type', e.target.value)} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1">
              {['TASK','BUG','FEATURE','IMPROVEMENT','OTHER'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <select value={formData.priority} onChange={(e) => set('priority', e.target.value)} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1">
              {['LOW','MEDIUM','HIGH'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Assignee</label>
            <select value={formData.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1">
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.user.id} value={m.user.id}>{m.user.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select value={formData.status} onChange={(e) => set('status', e.target.value)} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm mt-1">
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Due Date</label>
          <div className="flex items-center gap-2 mt-1">
            <CalendarIcon className="size-4 text-zinc-500" />
            <input type="date" value={formData.due_date} onChange={(e) => set('due_date', e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-200 text-sm" />
          </div>
          {formData.due_date && <p className="text-xs text-zinc-500 mt-1">{format(new Date(formData.due_date), 'PPP')}</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setShowCreateTask(false)} className="rounded border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded px-5 py-2 text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-60">
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
