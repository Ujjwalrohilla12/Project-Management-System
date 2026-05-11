import { useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { BuildingIcon } from 'lucide-react';
import Modal from './ui/Modal.jsx';
import { workspaceService } from '../services/api.service.js';
import { addWorkspace } from '../features/workspaceSlice.js';

const toSlug = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CreateWorkspaceModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: '', slug: '', description: '', image_url: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleNameChange = (v) => {
    set('name', v);
    if (!slugTouched) set('slug', toSlug(v));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Creating organization...');
    try {
      const { data } = await workspaceService.create({
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        image_url: form.image_url || undefined,
      });
      dispatch(addWorkspace(data.data.workspace));
      toast.success('Organization created!', { id: toastId });
      setForm({ name: '', slug: '', description: '', image_url: '' });
      setSlugTouched(false);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create organization', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 text-sm focus:outline-none focus:border-blue-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Organization">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center mb-2">
          <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-500/10">
            <BuildingIcon className="size-8 text-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300">Organization Name <span className="text-red-500">*</span></label>
          <input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Acme Corp"
            className={inputCls}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300">Slug <span className="text-red-500">*</span></label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-shrink-0">aegisflow.app/</span>
            <input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
              placeholder="acme-corp"
              className={inputCls}
              required
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
        </div>

        <div>
          <label className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What does your organization do?"
            className={inputCls + ' h-20 resize-none'}
            maxLength={500}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-zinc-700 dark:text-zinc-300">Logo URL</label>
          <input
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            placeholder="https://example.com/logo.png"
            className={inputCls}
            type="url"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !form.name || !form.slug} className="px-4 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-60">
            {submitting ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkspaceModal;
