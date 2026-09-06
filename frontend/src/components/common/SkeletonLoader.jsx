import React from 'react';

export const SkeletonLoader = ({ count = 3, type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800/50 rounded-xl border border-slate-300 dark:border-slate-800 p-4 flex flex-col justify-between">
            <div className="h-4 bg-slate-300 dark:bg-slate-700/60 rounded w-1/3"></div>
            <div className="h-8 bg-slate-300 dark:bg-slate-700/80 rounded w-1/2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800/40 rounded-lg border border-slate-300 dark:border-slate-800 w-full"></div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
