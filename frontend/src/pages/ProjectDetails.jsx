import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi } from '../services/projectApi';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import {
  FolderGit2,
  Rocket,
  Settings,
  GitPullRequest,
  ShieldCheck,
  Box,
  Layers,
  Terminal,
  Activity,
  ArrowLeft,
  GitBranch
} from 'lucide-react';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await projectApi.getProjectById(id);
        setProject(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <SkeletonLoader count={4} type="card" />;
  if (error || !project) return <ErrorState message={error || 'Project not found'} onRetry={() => navigate('/projects')} />;

  const tabs = [
    { label: 'Overview', icon: Activity },
    { label: 'Pipelines', icon: GitPullRequest },
    { label: 'Security', icon: ShieldCheck },
    { label: 'Containers', icon: Box },
    { label: 'Kubernetes', icon: Layers },
    { label: 'Deployments', icon: Rocket },
    { label: 'Logs', icon: Terminal },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/projects')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <FolderGit2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{project.name}</h1>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                <span>Env: <strong className="text-slate-900 dark:text-slate-200">{project.environment}</strong></span>
                <span>•</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" /> {project.repository} ({project.branch || 'main'})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/deployments')}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Rocket className="w-4 h-4" />
              Deploy
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-4 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.label;
            return (
              <button
                key={t.label}
                onClick={() => setActiveTab(t.label)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-cyan-50 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Security Score</span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{project.securityScore} / 100</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">SAST & secrets scans active with 0 blocking CVEs.</p>
          </div>
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Containers Active</span>
            <div className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">{project.containersCount || 4} Instances</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Docker image v1.8.2 running cleanly.</p>
          </div>
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Kubernetes Pods</span>
            <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{project.podsCount || 8} Replicas</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ingress router healthy with 99.9% uptime.</p>
          </div>
        </div>
      )}

      {activeTab === 'Pipelines' && (
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Active Pipelines for {project.name}</h3>
          <p className="text-slate-500 dark:text-slate-400">Trigger manual pipeline runs or inspect step logs.</p>
          <button onClick={() => navigate('/pipelines')} className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-semibold">
            View All Pipelines Matrix
          </button>
        </div>
      )}

      {activeTab === 'Security' && (
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Security Profile & Vulnerability Audit</h3>
          <p className="text-slate-500 dark:text-slate-400">Check static analysis and dependency CVE findings for this repository.</p>
          <button onClick={() => navigate('/security')} className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-semibold">
            Open Security Scanner Hub
          </button>
        </div>
      )}

      {activeTab === 'Containers' && (
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Docker Container Instances</h3>
          <p className="text-slate-500 dark:text-slate-400">Inspect container CPU, Memory and stdout logs.</p>
          <button onClick={() => navigate('/containers')} className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-semibold">
            Open Container Manager
          </button>
        </div>
      )}

      {activeTab === 'Kubernetes' && (
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Kubernetes Cluster & Pod Mesh</h3>
          <p className="text-slate-500 dark:text-slate-400">View pods, services, ingress routers, and namespaces.</p>
          <button onClick={() => navigate('/kubernetes')} className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-semibold">
            Open Kubernetes Console
          </button>
        </div>
      )}

      {activeTab === 'Deployments' && (
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Deployment Rollout History</h3>
          <p className="text-slate-500 dark:text-slate-400">View release versioning and instant rollbacks.</p>
          <button onClick={() => navigate('/deployments')} className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-semibold">
            Open Deployment History
          </button>
        </div>
      )}

      {activeTab === 'Logs' && (
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Live Terminal Log Output</h3>
          <p className="text-slate-500 dark:text-slate-400">Stream runtime standard output logs in real-time.</p>
          <button onClick={() => navigate('/logs')} className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-semibold">
            Open Terminal Log Stream
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
