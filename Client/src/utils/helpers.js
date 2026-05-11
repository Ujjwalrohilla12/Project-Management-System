import { format, isPast } from 'date-fns';

export const formatDate = (date, pattern = 'dd MMM yyyy') => {
  if (!date) return '—';
  try {
    return format(new Date(date), pattern);
  } catch {
    return '—';
  }
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'DONE') return false;
  return isPast(new Date(dueDate));
};

export const STATUS_COLORS = {
  PLANNING: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-200',
  ACTIVE: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-500 dark:text-emerald-900',
  ON_HOLD: 'bg-amber-200 text-amber-900 dark:bg-amber-500 dark:text-amber-900',
  COMPLETED: 'bg-blue-200 text-blue-900 dark:bg-blue-500 dark:text-blue-900',
  CANCELLED: 'bg-red-200 text-red-900 dark:bg-red-500 dark:text-red-900',
  TODO: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200',
  IN_PROGRESS: 'bg-amber-200 text-amber-800 dark:bg-amber-500 dark:text-amber-900',
  DONE: 'bg-emerald-200 text-emerald-800 dark:bg-emerald-500 dark:text-emerald-900',
};

export const PRIORITY_COLORS = {
  LOW: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-600 dark:text-red-400' },
  MEDIUM: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-600 dark:text-blue-400' },
  HIGH: { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-600 dark:text-emerald-400' },
};

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
