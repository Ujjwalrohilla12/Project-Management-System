import { AlertTriangleIcon } from 'lucide-react';
import Modal from './Modal.jsx';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = true, loading = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
    <div className="flex gap-4">
      {danger && (
        <div className="flex-shrink-0 p-2 rounded-full bg-red-100 dark:bg-red-500/10 h-fit">
          <AlertTriangleIcon className="size-5 text-red-500" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded text-white disabled:opacity-50 ${
              danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </Modal>
);

export default ConfirmModal;
