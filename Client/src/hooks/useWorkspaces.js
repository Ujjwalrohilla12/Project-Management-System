import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { workspaceService } from '../services/api.service.js';
import { setWorkspaces, setCurrentWorkspace, setLoading } from '../features/workspaceSlice.js';
import { setWorkspaceRole } from '../features/authSlice.js';

export const useWorkspaces = () => {
  const dispatch = useDispatch();
  const { isSignedIn, userId } = useAuth();
  const { workspaces, currentWorkspace, loading } = useSelector((s) => s.workspace);

  const fetchWorkspaces = useCallback(async () => {
    if (!isSignedIn) return;
    dispatch(setLoading(true));
    try {
      const { data } = await workspaceService.getAll();
      const ws = data.data.workspaces;
      dispatch(setWorkspaces(ws));

      const savedId = localStorage.getItem('currentWorkspaceId');
      const target = ws.find((w) => w.id === savedId) || ws[0];
      if (target) dispatch(setCurrentWorkspace(target.id));
    } catch (err) {
      toast.error(err.message || 'Failed to load workspaces');
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, isSignedIn]);

  // Sync workspace role whenever currentWorkspace or userId changes
  useEffect(() => {
    if (!currentWorkspace || !userId) {
      dispatch(setWorkspaceRole(null));
      return;
    }
    const membership = currentWorkspace.members?.find((m) => m.userId === userId);
    dispatch(setWorkspaceRole(membership?.role || 'MEMBER'));
  }, [currentWorkspace, userId, dispatch]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return { workspaces, currentWorkspace, loading, refetch: fetchWorkspaces };
};
