import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pipelineApi } from '../services/pipelineApi';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import {
  GitPullRequest,
  Play,
  RotateCcw,
  XCircle,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Terminal
} from 'lucide-react';

export const Pipelines = () => {
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPipelines = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pipelineApi.getPipelines();
      setPipelines(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch pipelines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  const handleRun = async (id, e) => {
    e.stopPropagation();
    try {
      await pipelineApi.runPipeline(id);
      fetchPipelines();
    } catch (err) {
      alert('Error starting pipeline: ' + err.message);
    }
  };

  const handleCancel = async (id, e) => {
    e.stopPropagation();
    try {
      await pipelineApi.cancelPipeline(id);
      fetchPipelines();
    } catch (err) {
      alert('Error cancelling pipeline: ' + err.message);
    }
  };

  const handleRetry = async (id, e) => {
    e.stopPropagation();
    try {
      await pipelineApi.retryPipeline(id);
      fetchPipelines();
    } catch (err) {
      alert('Error retrying pipeline: ' + err.message);
    }
  };

  if (loading) return <SkeletonLoader count={3} type="card" />;
  if (error) return <ErrorState message={error} onRetry={fetchPipelines} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GitPullRequest className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            DevSecOps Pipeline Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated CI/CD workflows with built-in SAST, container security scanning & K8s deployment.
          </p>
        </div>
        <button
          onClick={() => pipelineApi.createPipeline({ projectName: 'Aegis API', branch: 'main' }).then(fetchPipelines)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          Trigger New Pipeline
        </button>
      </div>

      <div className="space-y-4">
        {pipelines.map((pipe) => (
          <div
            key={pipe.id}
            onClick={() => navigate(`/pipelines/${pipe.id}`)}
            className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer space-y-4 shadow-sm group"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400">
                  <GitPullRequest className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {pipe.projectName}
                    </span>
                    <StatusBadge status={pipe.status} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>Branch: <strong className="text-slate-700 dark:text-slate-200">{pipe.branch}</strong> ({pipe.commit})</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {pipe.author}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {pipe.startTime}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {pipe.status === 'Running' ? (
                  <button
                    onClick={(e) => handleCancel(pipe.id, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-lg text-xs font-medium"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleRetry(pipe.id, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 rounded-lg text-xs font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Pipeline
                  </button>
                )}
                <button
                  onClick={() => navigate(`/pipelines/${pipe.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  View Logs
                </button>
              </div>
            </div>

            {/* Visual Stage Flow */}
            <div className="overflow-x-auto py-2">
              <div className="flex items-center gap-2 min-w-max">
                {pipe.stages.map((stage, idx) => {
                  const isPassed = stage.status === 'PASSED';
                  const isRunning = stage.status === 'RUNNING';
                  const isFailed = stage.status === 'FAILED';

                  return (
                    <React.Fragment key={stage.name}>
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
                        isPassed ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                        isRunning ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/40 animate-pulse' :
                        isFailed ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30' :
                        'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                      }`}>
                        {isPassed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {isFailed && <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>{stage.name}</span>
                        {stage.duration !== '--' && <span className="text-[10px] opacity-75">({stage.duration})</span>}
                      </div>

                      {idx < pipe.stages.length - 1 && (
                        <div className={`w-4 h-0.5 ${isPassed ? 'bg-emerald-400 dark:bg-emerald-500/50' : isRunning ? 'bg-cyan-400 dark:bg-cyan-500/50' : 'bg-slate-300 dark:bg-slate-800'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pipelines;
