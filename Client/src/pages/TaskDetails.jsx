import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarIcon, MessageCircle, PenIcon, Paperclip, Plus, Clock, History, CheckSquare, Square, MessageSquare, SparklesIcon } from 'lucide-react';
import { useComments } from '../hooks/useComments.js';
import { useAuth } from '@clerk/clerk-react';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import { taskService } from '../services/api.service.js';
import AISuggestionPanel from '../components/AISuggestionPanel.jsx';

const TaskDetails = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const taskId = searchParams.get('taskId');

  const { userId } = useAuth();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments', 'subtasks', 'attachments', 'history'

  // New states for advanced features
  const [subtasks, setSubtasks] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [newSubtask, setNewSubtask] = useState({ title: '', description: '', assigneeId: '', due_date: '', priority: 'MEDIUM' });
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  const { currentWorkspace } = useSelector((s) => s.workspace);
  const { comments, loading: commentsLoading, addComment } = useComments(taskId);

  const fetchTaskDetails = useCallback(() => {
    if (!projectId || !taskId || !currentWorkspace) return;
    const proj = currentWorkspace.projects?.find((p) => p.id === projectId);
    if (!proj) return;
    const tsk = proj.tasks?.find((t) => t.id === taskId);
    setTask(tsk || null);
    setProject(proj);
    setLoading(false);
  }, [currentWorkspace, projectId, taskId]);

  const fetchSubtasks = useCallback(async () => {
    if (!taskId) return;
    try {
      const { data } = await taskService.getSubtasks(taskId);
      setSubtasks(data.subtasks);
    } catch (error) {
      console.error('Failed to fetch subtasks:', error);
    }
  }, [taskId]);

  const fetchAttachments = useCallback(async () => {
    if (!taskId) return;
    try {
      const { data } = await taskService.getAttachments(taskId);
      setAttachments(data.attachments);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  }, [taskId]);

  const fetchHistory = useCallback(async () => {
    if (!taskId) return;
    try {
      const { data } = await taskService.getHistory(taskId);
      setHistory(data.history);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }, [taskId]);

  useEffect(() => { fetchTaskDetails(); }, [fetchTaskDetails]);
  useEffect(() => { if (taskId) { fetchSubtasks(); fetchAttachments(); fetchHistory(); } }, [taskId, fetchSubtasks, fetchAttachments, fetchHistory]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment);
    setNewComment('');
  };

  const handleCreateSubtask = async () => {
    if (!newSubtask.title.trim()) return;
    try {
      const { data } = await taskService.createSubtask(taskId, {
        ...newSubtask,
        due_date: newSubtask.due_date || null,
        assigneeId: newSubtask.assigneeId || null,
      });
      setSubtasks(prev => [...prev, data.subtask]);
      setNewSubtask({ title: '', description: '', assigneeId: '', due_date: '', priority: 'MEDIUM' });
      setShowSubtaskForm(false);
      toast.success('Subtask created successfully');
    } catch (error) {
      toast.error('Failed to create subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId, currentStatus) => {
    const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    try {
      await taskService.update(subtaskId, { status: newStatus });
      setSubtasks(prev => prev.map(st => st.id === subtaskId ? { ...st, status: newStatus } : st));
      toast.success('Subtask updated');
    } catch (error) {
      toast.error('Failed to update subtask');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      // For now, we'll simulate file upload. In a real app, you'd upload to a service like Cloudinary or S3
      const mockUrl = `https://example.com/files/${file.name}`;
      const { data } = await taskService.addAttachment(taskId, {
        name: file.name,
        url: mockUrl,
        size: file.size,
        mimeType: file.type,
      });
      setAttachments(prev => [...prev, data.attachment]);
      toast.success('Attachment added successfully');
    } catch (error) {
      toast.error('Failed to add attachment');
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto p-4 space-y-3">
      {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
  if (!task) return <div className="text-red-500 px-4 py-6">Task not found.</div>;

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 text-gray-900 dark:text-zinc-100 max-w-6xl mx-auto">
      {/* Left: Dynamic Content */}
      <div className="w-full lg:w-2/3">
        <div className="p-5 rounded-md border border-gray-300 dark:border-zinc-800 flex flex-col lg:h-[80vh]">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-zinc-700 mb-4">
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'comments' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-zinc-400'}`}
            >
              <MessageCircle className="size-4 inline mr-1" />
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('subtasks')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'subtasks' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-zinc-400'}`}
            >
              <CheckSquare className="size-4 inline mr-1" />
              Subtasks ({subtasks.length})
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'attachments' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-zinc-400'}`}
            >
              <Paperclip className="size-4 inline mr-1" />
              Attachments ({attachments.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-zinc-400'}`}
            >
              <History className="size-4 inline mr-1" />
              History ({history.length})
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'ai' ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-zinc-400'}`}
            >
              <SparklesIcon className="size-4 inline mr-1" />
              AI Assistant
            </button>
          </div>
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'comments' && (
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                  <MessageCircle className="size-5" /> Task Discussion
                </h2>
                {commentsLoading ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</div>
                ) : comments.length > 0 ? (
                  <div className="flex flex-col gap-4 mb-6 mr-2">
                    {comments.map((comment) => (
                      <div key={comment.id} className={`sm:max-w-4/5 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 border border-gray-300 dark:border-zinc-700 p-3 rounded-md ${comment.userId === userId ? 'ml-auto' : 'mr-auto'}`}>
                        <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-zinc-400">
                          {comment.user?.image && <img src={comment.user.image} alt="avatar" className="size-5 rounded-full" />}
                          <span className="font-medium text-gray-900 dark:text-white">{comment.user?.name || 'User'}</span>
                          <span className="text-xs text-gray-400 dark:text-zinc-600">
                            • {format(new Date(comment.createdAt), 'dd MMM yyyy, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-zinc-200">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-zinc-500 mb-4 text-sm">No comments yet. Be the first!</p>
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                  <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="w-full dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md p-2 text-sm text-gray-900 dark:text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600" rows={3} />
                  <button onClick={handleAddComment} disabled={!newComment.trim()} className="bg-gradient-to-l from-blue-500 to-blue-600 text-white text-sm px-5 py-2 rounded disabled:opacity-60">Post</button>
                </div>
              </div>
            )}

            {activeTab === 'subtasks' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <CheckSquare className="size-5" /> Subtasks
                  </h2>
                  <button
                    onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                    className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    <Plus className="size-4" />
                    Add Subtask
                  </button>
                </div>

                {showSubtaskForm && (
                  <div className="mb-4 p-3 border border-gray-300 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-800">
                    <input
                      type="text"
                      placeholder="Subtask title"
                      value={newSubtask.title}
                      onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full mb-2 p-2 border border-gray-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-700"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newSubtask.description}
                      onChange={(e) => setNewSubtask(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full mb-2 p-2 border border-gray-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-700"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <select
                        value={newSubtask.priority}
                        onChange={(e) => setNewSubtask(prev => ({ ...prev, priority: e.target.value }))}
                        className="p-2 border border-gray-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-700"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                      <input
                        type="date"
                        value={newSubtask.due_date}
                        onChange={(e) => setNewSubtask(prev => ({ ...prev, due_date: e.target.value }))}
                        className="p-2 border border-gray-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-700"
                      />
                      <button
                        onClick={handleCreateSubtask}
                        disabled={!newSubtask.title.trim()}
                        className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => setShowSubtaskForm(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {subtasks.length > 0 ? subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-zinc-700 rounded-md">
                      <button
                        onClick={() => handleToggleSubtask(subtask.id, subtask.status)}
                        className="text-gray-400 hover:text-green-500"
                      >
                        {subtask.status === 'DONE' ? <CheckSquare className="size-5" /> : <Square className="size-5" />}
                      </button>
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${subtask.status === 'DONE' ? 'line-through text-gray-500' : ''}`}>
                          {subtask.title}
                        </h4>
                        {subtask.description && (
                          <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">{subtask.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {subtask.assignee && (
                          <div className="flex items-center gap-1">
                            {subtask.assignee.image && <img src={subtask.assignee.image} className="size-4 rounded-full" />}
                            <span>{subtask.assignee.name}</span>
                          </div>
                        )}
                        {subtask.due_date && (
                          <span>{format(new Date(subtask.due_date), 'MMM dd')}</span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-600 dark:text-zinc-500 text-sm">No subtasks yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Paperclip className="size-5" /> Attachments
                  </h2>
                  <label className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 cursor-pointer">
                    <Plus className="size-4" />
                    Upload File
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-2">
                  {attachments.length > 0 ? attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-zinc-700 rounded-md">
                      <Paperclip className="size-4 text-gray-400" />
                      <div className="flex-1">
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {attachment.name}
                        </a>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {(attachment.size / 1024).toFixed(1)} KB • {format(new Date(attachment.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-600 dark:text-zinc-500 text-sm">No attachments yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                  <History className="size-5" /> Activity Timeline
                </h2>

                <div className="space-y-3">
                  {history.length > 0 ? history.map((entry) => (
                    <div key={entry.id} className="flex gap-3 p-3 border border-gray-200 dark:border-zinc-700 rounded-md">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-zinc-100">
                          <span className="font-medium">{entry.field}</span> changed
                          {entry.oldValue && <span className="text-gray-500"> from "{entry.oldValue}"</span>}
                          {entry.newValue && <span className="text-gray-500"> to "{entry.newValue}"</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                          {format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-600 dark:text-zinc-500 text-sm">No activity history yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <AISuggestionPanel
                taskId={taskId}
                projectId={projectId}
                onSuggestionApplied={() => {
                  // Refresh subtasks when AI suggestions are applied
                  fetchSubtasks();
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right: Task + Project Info */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800">
          <div className="mb-3">
            <h1 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{task.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-300 text-xs">{task.status}</span>
              <span className="px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-300 text-xs">{task.type}</span>
              <span className="px-2 py-0.5 rounded bg-green-200 dark:bg-emerald-900 text-green-900 dark:text-emerald-300 text-xs">{task.priority}</span>
              {task.isRecurring && <span className="px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-300 text-xs">Recurring</span>}
            </div>
          </div>
          {task.description && <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">{task.description}</p>}

          {/* Progress indicators */}
          {subtasks.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-zinc-400">Subtasks Progress</span>
                <span className="text-gray-900 dark:text-zinc-100">{subtasks.filter(st => st.status === 'DONE').length}/{subtasks.length}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${subtasks.length > 0 ? (subtasks.filter(st => st.status === 'DONE').length / subtasks.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}

          <hr className="border-zinc-200 dark:border-zinc-700 my-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              {task.assignee?.image && <img src={task.assignee.image} className="size-5 rounded-full" alt="" />}
              <span>Assignee: {task.assignee?.name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-gray-500 dark:text-zinc-500" />
              <span>Due: {task.due_date ? format(new Date(task.due_date), 'dd MMM yyyy') : '—'}</span>
            </div>
            {task.estimatedHours && (
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-gray-500 dark:text-zinc-500" />
                <span>Estimated: {task.estimatedHours}h</span>
              </div>
            )}
            {task.actualHours && (
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-gray-500 dark:text-zinc-500" />
                <span>Actual: {task.actualHours}h</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-gray-500 dark:text-zinc-500" />
              <span>Comments: {comments.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Paperclip className="size-4 text-gray-500 dark:text-zinc-500" />
              <span>Attachments: {attachments.length}</span>
            </div>
          </div>
        </div>

        {project && (
          <div className="p-4 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-800">
            <p className="text-xl font-medium mb-4">Project Details</p>
            <h2 className="text-gray-900 dark:text-zinc-100 flex items-center gap-2"><PenIcon className="size-4" /> {project.name}</h2>
            {project.start_date && <p className="text-xs mt-3">Start: {format(new Date(project.start_date), 'dd MMM yyyy')}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-zinc-400 mt-3">
              <span>Status: {project.status}</span>
              <span>Priority: {project.priority}</span>
              <span>Progress: {project.progress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetails;
