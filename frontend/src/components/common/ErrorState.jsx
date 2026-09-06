import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorState = ({ title = 'Failed to load data', message = 'An unexpected error occurred while communicating with backend APIs.', onRetry }) => {
  return (
    <div className="bg-rose-50 dark:bg-rose-950/20 p-8 rounded-xl border border-rose-200 dark:border-rose-900/30 text-center flex flex-col items-center justify-center my-6">
      <div className="p-3 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-3 border border-rose-500/20">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200">{title}</h3>
      <p className="text-xs text-rose-700 dark:text-rose-300/70 max-w-md mt-1 mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};

export default ErrorState;
