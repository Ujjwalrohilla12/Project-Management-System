import { format } from 'date-fns';
import { Plus, Save, Trash2Icon, UserMinusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { projectService } from '../services/api.service.js';
import { updateProject } from '../features/workspaceSlice.js';
import AddProjectMember from './AddProjectMember.jsx';
import { usePermissions } from '../hooks/usePermissions.js';

export default function ProjectSettings({ project }) {
  const dispatch = useDispatch();
  const { isProjectLead, isWorkspaceAdmin } = usePermissions();
  const canEdit = isProjectLead || isWorkspaceAdmin;

  const [formData,     setFormData]     = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [removingId,   setRemovingId]   = useState(null);

  useEffect(() => { if (project) setFormData({ ...project }); }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Saving changes...');
    try {
      const { data } = await projectService.update(formData.id, {
        workspaceId: formData.workspaceId,
        name:        formData.name,
        description: formData.description,
        status:      formData.status,
        priority:    formData.priority,
        progress:    formData.progress,
        start_date:  formData.start_date,
        end_date:    formData.end_date,
      });
      dispatch(updateProject(data.data.project));
      toast.success('Project updated!', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Failed to update project', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.user?.email} from this project?`)) return;
    setRemovingId(member.id);
    const toastId = toast.loading('Removing member...');
    try {
      const { data } = await projectService.removeMember(project.id, member.id);
      // Refresh project in store
      dispatch(updateProject({ ...project, members: project.members.filter((m) => m.id !== member.id) }));
      toast.success('Member removed', { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setRemovingId(null);
    }
  };

  if (!formData) return null;

  const inputCls = 'w-full px-3 py-2 rounded-lg mt-1.5 border text-sm dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 focus:outline-none focus:border-blue-500';
  const cardCls  = 'rounded-xl border p-6 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-200 dark:border-zinc-800';
  const labelCls = 'text-sm text-zinc-600 dark:text-zinc-400';

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Project details form */}
      <div className={cardCls}>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-200 mb-5">Project Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Project Name</label>
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} disabled={!canEdit} required />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputCls + ' h-24 resize-none'} disabled={!canEdit} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={inputCls} disabled={!canEdit}>
                {['PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className={inputCls} disabled={!canEdit}>
                {['LOW','MEDIUM','HIGH'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" value={formData.start_date ? format(new Date(formData.start_date), 'yyyy-MM-dd') : ''} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className={inputCls} disabled={!canEdit} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" value={formData.end_date ? format(new Date(formData.end_date), 'yyyy-MM-dd') : ''} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className={inputCls} disabled={!canEdit} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Progress: {formData.progress}%</label>
            <input type="range" min="0" max="100" step="5" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })} className="w-full mt-2 accent-blue-500" disabled={!canEdit} />
          </div>
          {canEdit && (
            <button type="submit" disabled={submitting} className="flex items-center gap-2 text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60 ml-auto">
              <Save className="size-4" /> {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>
      </div>

      {/* Team members */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-200">
            Team Members <span className="text-sm font-normal text-zinc-500">({project.members.length})</span>
          </h2>
          {canEdit && (
            <button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Plus className="size-3.5" /> Add
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {project.members.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">No members yet</p>
          ) : project.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-7 rounded-full bg-zinc-300 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                  {member.user?.image
                    ? <img src={member.user.image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">{(member.user?.name || member.user?.email || '?')[0].toUpperCase()}</div>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-900 dark:text-zinc-200 truncate">{member.user?.name || member.user?.email}</p>
                  {member.user?.name && <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{member.user.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {project.team_lead === member.userId && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">Lead</span>
                )}
                {canEdit && project.team_lead !== member.userId && (
                  <button
                    onClick={() => handleRemoveMember(member)}
                    disabled={removingId === member.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                    title="Remove member"
                  >
                    <UserMinusIcon className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <AddProjectMember isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} projectId={project.id} />
      </div>
    </div>
  );
}
