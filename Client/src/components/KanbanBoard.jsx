import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { updateTask } from '../features/workspaceSlice.js';
import { taskService } from '../services/api.service.js';
import { format } from 'date-fns';
import { CalendarIcon, MessageSquare, Paperclip, User, Clock } from 'lucide-react';

const statusColumns = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900' },
  { id: 'DONE', title: 'Done', color: 'bg-green-100 dark:bg-green-900' },
];

const priorityColors = {
  LOW: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  MEDIUM: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  HIGH: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
};

const typeIcons = {
  BUG: '🐛',
  FEATURE: '✨',
  TASK: '📋',
  IMPROVEMENT: '🔧',
  OTHER: '📝',
};

const KanbanBoard = ({ tasks, projectId }) => {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({ assignee: '', priority: '', type: '' });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.assignee && task.assignee?.name !== filters.assignee) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.type && task.type !== filters.type) return false;
      return true;
    });
  }, [tasks, filters]);

  const tasksByStatus = useMemo(() => {
    const grouped = { TODO: [], IN_PROGRESS: [], DONE: [] };
    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    // Sort by order within each column
    Object.keys(grouped).forEach(status => {
      grouped[status].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    return grouped;
  }, [filteredTasks]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId;
    const tasksInColumn = tasksByStatus[newStatus];
    let newOrder = destination.index;

    // Calculate new order based on surrounding tasks
    if (destination.index === 0) {
      newOrder = tasksInColumn[0]?.order ? tasksInColumn[0].order - 1 : 0;
    } else if (destination.index >= tasksInColumn.length) {
      newOrder = tasksInColumn[tasksInColumn.length - 1]?.order ? tasksInColumn[tasksInColumn.length - 1].order + 1 : destination.index;
    } else {
      const prevTask = tasksInColumn[destination.index - 1];
      const nextTask = tasksInColumn[destination.index];
      newOrder = ((prevTask?.order || 0) + (nextTask?.order || 0)) / 2;
    }

    try {
      const { data } = await taskService.move(draggableId, { status: newStatus, order: newOrder });
      dispatch(updateTask(data.data.task));

      if (task.status !== newStatus) {
        toast.success(`Task moved to ${statusColumns.find(c => c.id === newStatus)?.title}`);
      }
    } catch (error) {
      toast.error('Failed to move task');
      console.error('Drag error:', error);
    }
  };

  const filterOptions = {
    assignee: ['', ...Array.from(new Set(tasks.map(t => t.assignee?.name).filter(Boolean)))],
    priority: ['', 'LOW', 'MEDIUM', 'HIGH'],
    type: ['', 'TASK', 'BUG', 'FEATURE', 'IMPROVEMENT', 'OTHER'],
  };

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filters.assignee}
          onChange={(e) => setFilters(f => ({ ...f, assignee: e.target.value }))}
          className="px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-sm"
        >
          <option value="">All Assignees</option>
          {filterOptions.assignee.slice(1).map(assignee => (
            <option key={assignee} value={assignee}>{assignee}</option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
          className="px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
          className="px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-sm"
        >
          <option value="">All Types</option>
          <option value="TASK">Task</option>
          <option value="BUG">Bug</option>
          <option value="FEATURE">Feature</option>
          <option value="IMPROVEMENT">Improvement</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statusColumns.map(column => (
            <div key={column.id} className="flex flex-col">
              <div className={`${column.color} p-3 rounded-t-lg border border-gray-300 dark:border-zinc-700`}>
                <h3 className="font-semibold text-gray-900 dark:text-zinc-100">
                  {column.title} ({tasksByStatus[column.id].length})
                </h3>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] p-3 rounded-b-lg border-x border-b border-gray-300 dark:border-zinc-700 ${
                      snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-zinc-900'
                    }`}
                  >
                    {tasksByStatus[column.id].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white dark:bg-zinc-800 p-4 mb-3 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                              snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                            }`}
                            onClick={() => window.open(`/taskDetails?projectId=${projectId}&taskId=${task.id}`, '_blank')}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-zinc-100 text-sm line-clamp-2">
                                {task.title}
                              </h4>
                              <span className="text-lg ml-2">{typeIcons[task.type]}</span>
                            </div>

                            {task.description && (
                              <p className="text-xs text-gray-600 dark:text-zinc-400 mb-3 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-500">
                              <div className="flex items-center gap-3">
                                {task.assignee && (
                                  <div className="flex items-center gap-1">
                                    <User className="size-3" />
                                    <span>{task.assignee.name}</span>
                                  </div>
                                )}

                                {task.due_date && (
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="size-3" />
                                    <span>{format(new Date(task.due_date), 'MMM dd')}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {task.comments?.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="size-3" />
                                    <span>{task.comments.length}</span>
                                  </div>
                                )}

                                {task.attachments?.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Paperclip className="size-3" />
                                    <span>{task.attachments.length}</span>
                                  </div>
                                )}

                                {task.subtasks?.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">
                                      {task.subtasks.filter(st => st.status === 'DONE').length}/{task.subtasks.length}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>

                              {task.estimatedHours && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-500">
                                  <Clock className="size-3" />
                                  <span>{task.estimatedHours}h</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;