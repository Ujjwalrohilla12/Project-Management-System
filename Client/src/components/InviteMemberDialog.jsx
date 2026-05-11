import { useState } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { workspaceService } from '../services/api.service.js';
import Modal from './ui/Modal.jsx';

const InviteMemberDialog = ({ isDialogOpen, setIsDialogOpen }) => {
  const currentWorkspace = useSelector((s) => s.workspace?.currentWorkspace);
  const [formData, setFormData] = useState({ email: '', role: 'MEMBER' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    setSubmitting(true);
    const toastId = toast.loading('Inviting member...');
    try {
      await workspaceService.addMember(currentWorkspace.id, formData);
      toast.success('Member invited!', { id: toastId });
      setFormData({ email: '', role: 'MEMBER' });
      setIsDialogOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to invite member', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Invite Team Member">
      {currentWorkspace && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 -mt-2 mb-4">
          Inviting to: <span className="text-blue-600 dark:text-blue-400">{currentWorkspace.name}</span>
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Email Address</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email address" className="pl-10 w-full rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 text-sm py-2 focus:outline-none focus:border-blue-500" required />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Role</label>
          <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 py-2 px-3 mt-1 text-sm">
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => setIsDialogOpen(false)} className="px-5 py-2 rounded text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
          <button type="submit" disabled={!currentWorkspace || submitting} className="px-5 py-2 rounded text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-60">
            {submitting ? 'Inviting...' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteMemberDialog;
