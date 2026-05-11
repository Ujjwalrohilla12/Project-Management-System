import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { commentService } from '../services/api.service.js';

export const useComments = (taskId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const { data } = await commentService.getByTask(taskId);
      setComments(data.data.comments);
    } catch (err) {
      toast.error(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const addComment = async (content) => {
    const toastId = toast.loading('Adding comment...');
    try {
      const { data } = await commentService.add({ taskId, content });
      setComments((prev) => [...prev, data.data.comment]);
      toast.success('Comment added', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Failed to add comment', { id: toastId });
    }
  };

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 15000);
    return () => clearInterval(interval);
  }, [fetchComments]);

  return { comments, loading, addComment, refetch: fetchComments };
};
