import { useState } from 'react';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectService } from '../services/api.service.js';
import Modal from './ui/Modal.jsx';

const AddProjectMember = ({ isDialogOpen, setIsDialogOpen, projectId }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Adding member...');
    try {
      await projectService.addMember(projectId, { email });
      toast.success('Member added!', { id: toastId });
      setEmail('');
      setIsDialogOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to add member', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Add Project Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Email Address</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" className="pl-10 w-full rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 text-sm py-2 focus:outline-none focus:border-blue-500" required />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => setIsDialogOpen(false)} className="px-5 py-2 rounded text-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">Cancel</button>
          <button type="submit" disabled={submitting} className="px-5 py-2 rounded text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-60">
            {submitting ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProjectMember;
