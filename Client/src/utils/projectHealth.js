export function calcHealthScore(project, tasks = []) {
  const now   = new Date();
  const total = tasks.length;

  const done    = tasks.filter((t) => t.status === 'DONE').length;
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE').length;

  const completionScore = total > 0 ? (done / total) * 35 : 35;
  const overdueScore    = (1 - (total > 0 ? overdue / total : 0)) * 25;

  let deadlineScore = 25;
  if (project.end_date) {
    const end = new Date(project.end_date);
    if (end < now && project.status !== 'COMPLETED') {
      deadlineScore = 0;
    } else if (['COMPLETED', 'CANCELLED'].includes(project.status)) {
      deadlineScore = 25;
    } else {
      const start     = project.start_date ? new Date(project.start_date) : new Date(project.createdAt);
      const totalDur  = end - start;
      const elapsed   = now - start;
      const timeRatio = totalDur > 0 ? Math.min(elapsed / totalDur, 1) : 0;
      const progRatio = (project.progress || 0) / 100;
      deadlineScore   = progRatio >= timeRatio ? 25 : Math.max(0, (progRatio / Math.max(timeRatio, 0.01)) * 25);
    }
  }

  const progressScore = ((project.progress || 0) / 100) * 15;
  return Math.round(Math.min(100, Math.max(0, completionScore + overdueScore + deadlineScore + progressScore)));
}

export function healthLabel(score) {
  if (score >= 80) return { label: 'Healthy',  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/10', bar: 'bg-emerald-500' };
  if (score >= 60) return { label: 'At Risk',  color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-100 dark:bg-amber-500/10',   bar: 'bg-amber-500'   };
  if (score >= 40) return { label: 'Warning',  color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/10', bar: 'bg-orange-500'  };
  return              { label: 'Critical', color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-500/10',     bar: 'bg-red-500'     };
}

export function deadlineStatus(endDate) {
  if (!endDate) return null;
  const now  = new Date();
  const end  = new Date(endDate);
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (days < 0)  return { label: `${Math.abs(days)}d overdue`, color: 'text-red-500',    urgent: true  };
  if (days === 0) return { label: 'Due today',                  color: 'text-orange-500', urgent: true  };
  if (days <= 7)  return { label: `${days}d left`,              color: 'text-amber-500',  urgent: true  };
  return               { label: `${days}d left`,              color: 'text-zinc-500 dark:text-zinc-400', urgent: false };
}
