import React from 'react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const normalized = (status || '').toLowerCase();

  let styles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

  if (['healthy', 'success', 'passed', 'running', 'active', 'ready'].includes(normalized)) {
    styles = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30';
  } else if (['warning', 'in_review', 'open_warning'].includes(normalized)) {
    styles = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30';
  } else if (['failed', 'critical', 'stopped', 'error', 'crashloopbackoff'].includes(normalized)) {
    styles = 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30';
  } else if (['high'].includes(normalized)) {
    styles = 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-500/30';
  } else if (['medium', 'pending'].includes(normalized)) {
    styles = 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/30';
  } else if (['low', 'info'].includes(normalized)) {
    styles = 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30';
  }

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyles} ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        ['healthy', 'success', 'passed', 'running', 'active', 'ready'].includes(normalized) ? 'bg-emerald-500 animate-pulse' :
        ['failed', 'critical', 'stopped', 'error'].includes(normalized) ? 'bg-rose-500' :
        ['warning', 'in_review', 'high', 'medium'].includes(normalized) ? 'bg-amber-500' : 'bg-slate-500'
      }`} />
      {status}
    </span>
  );
};

export default StatusBadge;
