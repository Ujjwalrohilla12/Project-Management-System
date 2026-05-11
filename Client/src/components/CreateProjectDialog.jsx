import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { XIcon } from 'lucide-react';
import { projectService } from '../services/api.service.js';
import { addProject } from '../features/workspaceSlice.js';
import Modal from './ui/Modal.jsx';

const INITIAL = {
  name: '', description: '', status: 'PLANNING', priority: 'MEDIUM',
  start_date: '', end_date: '', team_members: [], team_lead: '', progress: 0,
};

const CreateProjectDialog = ({ isDialogOpen, setIsDialogOpen }) => {
  const dispatch = useDispatch();
  const { currentWorkspace } = useSelector((s) => s.workspace);
  const [formData, setFormData] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  const removeTeamMember = (email) =>
    set('team_members', formData.team_members.filter((m) => m !== email));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    setSubmitting(true);
    const toastId = toast.loading('Creating project...');
    try {
      const { data } = await projectService.create({ ...formData, workspaceId: currentWorkspace.id });
      dispatch(addProject(data.data.project));
      toast.success('Project created!', { id: toastId });
      setFormData(INITIAL);
      setIsDialogOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create project', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Create New Project">
      {currentWorkspace && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 -mt-2 mb-4">
          In workspace: <span className="text-blue-600 dark:text-blue-400">{currentWorkspace.name}</span>
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Project Name</label>
          <input value={formData.name} onChange={(e) => set('name', e.target.value)} placeholder="Enter project name" className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea value={formData.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe your project" className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm h-20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Status</label>
            <select value={formData.status} onChange={(e) => set('status', e.target.value)} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm">
              {['PLANNING','ACTIVE','COMPLETED','ON_HOLD','CANCELLED'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Priority</label>
            <select value={formData.priority} onChange={(e) => set('priority', e.target.value)} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm">
              {['LOW','MEDIUM','HIGH'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Start Date</label>
            <input type="date" value={formData.start_date} onChange={(e) => set('start_date', e.target.value)} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm" />
          </div>
          <div>
            <label className="block text-sm mb-1">End Date</label>
            <input type="date" value={formData.end_date} onChange={(e) => set('end_date', e.target.value)} min={formData.start_date} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Project Lead</label>
          <select value={formData.team_lead} onChange={(e) => { set('team_lead', e.target.value); if (e.target.value) set('team_members', [...new Set([...formData.team_members, e.target.value])]); }} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm">
            <option value="">No lead</option>
            {currentWorkspace?.members?.map((m) => (
              <option key={m.user.email} value={m.user.email}>{m.user.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Team Members</label>
          <select className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-sm"
            onChange={(e) => { if (e.target.value && !formData.team_members.includes(e.target.value)) set('team_members', [...formData.team_members, e.target.value]); e.target.value = ''; }}>
            <option value="">Add team members</option>
            {currentWorkspace?.members?.filter((m) => !formData.team_members.includes(m.user.email)).map((m) => (
              <option key={m.user.email} value={m.user.email}>{m.user.email}</option>
            ))}
          </select>
          {formData.team_members.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.team_members.map((email) => (
                <div key={email} className="flex items-center gap-1 bg-blue-200/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md text-sm">
                  {email}
                  <button type="button" onClick={() => removeTeamMember(email)}><XIcon className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2 text-sm">
          <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
          <button type="submit" disabled={!currentWorkspace || submitting} className="px-4 py-2 rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-60">
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectDialog;
