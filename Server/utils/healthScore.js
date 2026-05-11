/**
 * Calculates a project health score (0–100).
 *
 * Factors (weighted):
 *  - Completion rate of tasks          (35 pts)
 *  - Overdue task penalty              (25 pts)
 *  - Deadline proximity / on-track     (25 pts)
 *  - Progress vs time elapsed          (15 pts)
 */
export function calcHealthScore(project, tasks) {
  const now = new Date();
  const total = tasks.length;

  // ── 1. Completion rate (35 pts) ────────────────────────
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const completionScore = total > 0 ? (done / total) * 35 : 35;

  // ── 2. Overdue penalty (25 pts) ────────────────────────
  const overdue = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE'
  ).length;
  const overdueRatio = total > 0 ? overdue / total : 0;
  const overdueScore = (1 - overdueRatio) * 25;

  // ── 3. Deadline proximity (25 pts) ─────────────────────
  let deadlineScore = 25; // full score if no deadline
  if (project.end_date) {
    const end = new Date(project.end_date);
    if (end < now && project.status !== 'COMPLETED') {
      // Past deadline and not done
      deadlineScore = 0;
    } else if (project.status === 'COMPLETED' || project.status === 'CANCELLED') {
      deadlineScore = 25;
    } else {
      const start = project.start_date ? new Date(project.start_date) : new Date(project.createdAt);
      const totalDuration = end - start;
      const elapsed = now - start;
      const timeRatio = totalDuration > 0 ? Math.min(elapsed / totalDuration, 1) : 0;
      const progressRatio = (project.progress || 0) / 100;
      // If progress >= time elapsed → on track
      deadlineScore = progressRatio >= timeRatio ? 25 : Math.max(0, (progressRatio / Math.max(timeRatio, 0.01)) * 25);
    }
  }

  // ── 4. Progress vs time (15 pts) ───────────────────────
  const progressScore = ((project.progress || 0) / 100) * 15;

  const raw = completionScore + overdueScore + deadlineScore + progressScore;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function healthLabel(score) {
  if (score >= 80) return { label: 'Healthy',   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/10' };
  if (score >= 60) return { label: 'At Risk',   color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-100 dark:bg-amber-500/10' };
  if (score >= 40) return { label: 'Warning',   color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/10' };
  return              { label: 'Critical',  color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-500/10' };
}
