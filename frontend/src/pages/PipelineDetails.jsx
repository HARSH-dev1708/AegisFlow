import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pipelineApi } from '../services/pipelineApi';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import {
  ArrowLeft,
  GitPullRequest,
  RotateCcw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  User,
  Copy
} from 'lucide-react';

export const PipelineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const pipe = await pipelineApi.getPipelineById(id);
        setPipeline(pipe);
        const logData = await pipelineApi.getPipelineLogs(id);
        setLogs(logData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <SkeletonLoader count={4} type="card" />;
  if (error || !pipeline) return <ErrorState message={error || 'Pipeline not found'} onRetry={() => navigate('/pipelines')} />;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/pipelines')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pipelines Matrix
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <GitPullRequest className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{pipeline.projectName} Run #{pipeline.id}</h1>
                <StatusBadge status={pipeline.status} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                <span>Branch: <strong className="text-slate-900 dark:text-slate-200">{pipeline.branch}</strong> ({pipeline.commit})</span>
                <span>•</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {pipeline.author}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Total Duration: {pipeline.duration}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => pipelineApi.retryPipeline(pipeline.id).then(() => window.location.reload())}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Re-run Pipeline
            </button>
          </div>
        </div>

        {/* Detailed Stages Grid */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Stage Execution Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {pipeline.stages.map((stage) => {
              const isPassed = stage.status === 'PASSED';
              const isRunning = stage.status === 'RUNNING';
              const isFailed = stage.status === 'FAILED';

              return (
                <div
                  key={stage.name}
                  className={`p-3 rounded-xl border flex flex-col justify-between text-xs space-y-2 ${
                    isPassed ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' :
                    isRunning ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40 animate-pulse' :
                    isFailed ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30' :
                    'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] truncate">{stage.name}</span>
                    {isPassed && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isFailed && <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] font-mono opacity-80">{stage.duration}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Execution Logs Output */}
      <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-mono">
            <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Build Standard Console Output
          </h3>
          <button
            onClick={() => { navigator.clipboard.writeText(logs.join('\n')); alert('Logs copied to clipboard!'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Console Log
          </button>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5 max-h-96 overflow-y-auto selection:bg-cyan-500 selection:text-black">
          {logs.map((line, i) => (
            <div key={i} className="leading-relaxed hover:bg-slate-900 px-2 py-0.5 rounded">
              <span className="text-slate-600 select-none mr-3">{i + 1}</span>
              <span>{line}</span>
            </div>
          ))}
          <div className="text-cyan-400 font-semibold pt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            [INFO] Pipeline step monitor active...
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineDetails;
