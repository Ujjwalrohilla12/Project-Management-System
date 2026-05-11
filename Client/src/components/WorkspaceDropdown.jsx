import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, BuildingIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentWorkspace } from '../features/workspaceSlice';
import { useNavigate } from 'react-router-dom';
import CreateWorkspaceModal from './CreateWorkspaceModal.jsx';

function WorkspaceDropdown() {
  const { workspaces, currentWorkspace } = useSelector((s) => s.workspace);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSelectWorkspace = (id) => {
    dispatch(setCurrentWorkspace(id));
    setIsOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div className="relative m-4" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen((p) => !p)}
          className="w-full flex items-center justify-between p-3 h-auto text-left rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <div className="flex items-center gap-3">
            {currentWorkspace?.image_url ? (
              <img src={currentWorkspace.image_url} alt={currentWorkspace.name} className="w-8 h-8 rounded shadow object-cover" />
            ) : (
              <div className="w-8 h-8 rounded shadow bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {currentWorkspace?.name?.[0]?.toUpperCase() || 'W'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                {currentWorkspace?.name || 'Select Workspace'}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-zinc-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg top-full left-0 mt-1">
            <div className="p-2">
              <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2 font-medium">
                Workspaces
              </p>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => onSelectWorkspace(ws.id)}
                    className="flex items-center gap-3 p-2 cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {ws.image_url ? (
                      <img src={ws.image_url} alt={ws.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {ws.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{ws.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{ws.members?.length || 0} members</p>
                    </div>
                    {currentWorkspace?.id === ws.id && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-200 dark:border-zinc-700" />

            <div className="p-2">
              <button
                onClick={() => { setIsOpen(false); setShowCreate(true); }}
                className="flex items-center gap-2 w-full px-2 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Organization
              </button>
              {currentWorkspace && (
                <button
                  onClick={() => { setIsOpen(false); navigate('/organization'); }}
                  className="flex items-center gap-2 w-full px-2 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <BuildingIcon className="w-4 h-4" />
                  Manage Organization
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <CreateWorkspaceModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

export default WorkspaceDropdown;
