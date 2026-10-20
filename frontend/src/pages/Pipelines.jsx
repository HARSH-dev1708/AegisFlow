import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pipelineApi } from '../services/pipelineApi';
import { projectApi } from '../services/projectApi';
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
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [triggerError, setTriggerError] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [triggerForm, setTriggerForm] = useState({ projectId: '', branch: 'main', commit: '' });

  const fetchPipelines = useCallback(async () => {
    try {
      const [pipelineData, projectData] = await Promise.all([
        pipelineApi.getPipelines(),
        projectApi.getProjects(),
      ]);
      setPipelines(pipelineData);
      setProjects(projectData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch pipelines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelines();
    const interval = window.setInterval(fetchPipelines, 5000);
    return () => window.clearInterval(interval);
  }, [fetchPipelines]);

  const handleTrigger = async (event) => {
    event.preventDefault();
    setTriggering(true);
    setTriggerError('');
    try {
      const run = await pipelineApi.createPipeline({
        projectId: Number(triggerForm.projectId),
        branch: triggerForm.branch,
        commit: triggerForm.commit,
      });
      setShowTriggerForm(false);
      setTriggerForm({ projectId: '', branch: 'main', commit: '' });
      navigate(`/pipelines/${run.id}`);
    } catch (err) {
      setTriggerError(err.response?.data?.detail || err.message || 'Could not create pipeline run');
    } finally {
      setTriggering(false);
    }
  };

  const handleCancel = async (id, e) => {
    e.stopPropagation();
    try {
      await pipelineApi.cancelPipeline(id);
      await fetchPipelines();
    } catch (err) {
      alert('Error cancelling pipeline: ' + err.message);
    }
  };

  const handleRetry = async (id, e) => {
    e.stopPropagation();
    try {
      const run = await pipelineApi.retryPipeline(id);
      navigate(`/pipelines/${run.id}`);
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
            Pipeline Run Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track CI runner callbacks, stage results, durations, and persisted build logs.
          </p>
        </div>
        <button
          onClick={() => { setTriggerError(''); setShowTriggerForm(true); }}
          disabled={projects.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          Create Manual Run
        </button>
      </div>

      {projects.length === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Create an active project before creating a pipeline run.
        </p>
      )}

      {showTriggerForm && (
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white">Create manual run</h2>
          {triggerError && <p role="alert" className="text-rose-600 dark:text-rose-300 text-xs">{triggerError}</p>}
          <form onSubmit={handleTrigger} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              required
              value={triggerForm.projectId}
              onChange={(event) => setTriggerForm({ ...triggerForm, projectId: event.target.value })}
              className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            >
              <option value="">Select project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <input
              required
              maxLength={100}
              value={triggerForm.branch}
              onChange={(event) => setTriggerForm({ ...triggerForm, branch: event.target.value })}
              placeholder="Branch"
              className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
            <input
              maxLength={50}
              value={triggerForm.commit}
              onChange={(event) => setTriggerForm({ ...triggerForm, commit: event.target.value })}
              placeholder="Commit (optional)"
              className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={triggering || !triggerForm.projectId}
                className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {triggering ? 'Creating...' : 'Create Run'}
              </button>
              <button
                type="button"
                onClick={() => setShowTriggerForm(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
                    <span className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {pipe.triggerSource}
                    </span>
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
                {['Running', 'Queued'].includes(pipe.status) ? (
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
