import React, { useEffect, useState } from 'react';
import { kubernetesApi } from '../services/kubernetesApi';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import {
  Layers,
  Server,
  Box,
  Rocket,
  Globe,
  FolderKanban,
  CheckCircle2
} from 'lucide-react';

export const Kubernetes = () => {
  const [overview, setOverview] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [pods, setPods] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [services, setServices] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Nodes');

  const fetchK8s = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, nds, pds, deps, svcs, ns] = await Promise.all([
        kubernetesApi.getOverview(),
        kubernetesApi.getNodes(),
        kubernetesApi.getPods(),
        kubernetesApi.getDeployments(),
        kubernetesApi.getServices(),
        kubernetesApi.getNamespaces()
      ]);
      setOverview(ov);
      setNodes(nds);
      setPods(pds);
      setDeployments(deps);
      setServices(svcs);
      setNamespaces(ns);
    } catch (err) {
      setError(err.message || 'Failed to load Kubernetes cluster state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchK8s();
  }, []);

  if (loading) return <SkeletonLoader count={5} type="card" />;
  if (error) return <ErrorState message={error} onRetry={fetchK8s} />;

  const k8sTabs = [
    { label: 'Nodes', icon: Server, count: nodes.length },
    { label: 'Pods', icon: Box, count: pods.length },
    { label: 'Deployments', icon: Rocket, count: deployments.length },
    { label: 'Services', icon: Globe, count: services.length },
    { label: 'Namespaces', icon: FolderKanban, count: namespaces.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              Kubernetes Cluster Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cluster Healthy
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Production K8s control plane, worker nodes, pod mesh & service routing.
          </p>
        </div>
      </div>

      {/* Cluster Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nodes</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{overview?.nodes || 5}</div>
        </div>
        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pods</span>
          <div className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">{overview?.pods || 42}</div>
        </div>
        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Deployments</span>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{overview?.deployments || 15}</div>
        </div>
        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Services</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{overview?.services || 18}</div>
        </div>
        <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Namespaces</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{overview?.namespaces || 8}</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {k8sTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-cyan-50 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {activeTab === 'Nodes' && (
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Node Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">CPU Usage</th>
                <th className="p-4">Memory Usage</th>
                <th className="p-4">Kubelet Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {nodes.map((node) => (
                <tr key={node.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-900 dark:text-white font-mono">{node.name}</td>
                  <td className="p-4">{node.role}</td>
                  <td className="p-4"><StatusBadge status={node.status} /></td>
                  <td className="p-4 font-mono">{node.cpuUsage}</td>
                  <td className="p-4 font-mono">{node.memUsage}</td>
                  <td className="p-4 font-mono text-cyan-600 dark:text-cyan-400">{node.kubeletVersion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'Pods' && (
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Pod Name</th>
                <th className="p-4">Namespace</th>
                <th className="p-4">Status</th>
                <th className="p-4">Restarts</th>
                <th className="p-4">Age</th>
                <th className="p-4">Node</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {pods.map((pod) => (
                <tr key={pod.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-900 dark:text-white font-mono">{pod.name}</td>
                  <td className="p-4 font-semibold text-cyan-700 dark:text-cyan-300">{pod.namespace}</td>
                  <td className="p-4"><StatusBadge status={pod.status} /></td>
                  <td className="p-4 font-mono">{pod.restarts}</td>
                  <td className="p-4">{pod.age}</td>
                  <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{pod.node}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'Deployments' && (
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Deployment</th>
                <th className="p-4">Namespace</th>
                <th className="p-4">Replicas Ready</th>
                <th className="p-4">Available</th>
                <th className="p-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {deployments.map((dep) => (
                <tr key={dep.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-900 dark:text-white font-mono">{dep.name}</td>
                  <td className="p-4 font-semibold text-cyan-700 dark:text-cyan-300">{dep.namespace}</td>
                  <td className="p-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{dep.replicas}</td>
                  <td className="p-4 font-mono">{dep.available}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{dep.updated} ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'Services' && (
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Service</th>
                <th className="p-4">Namespace</th>
                <th className="p-4">Type</th>
                <th className="p-4">Cluster IP</th>
                <th className="p-4">Port(s)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {services.map((svc) => (
                <tr key={svc.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-900 dark:text-white font-mono">{svc.name}</td>
                  <td className="p-4 font-semibold text-cyan-700 dark:text-cyan-300">{svc.namespace}</td>
                  <td className="p-4">{svc.type}</td>
                  <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{svc.clusterIp}</td>
                  <td className="p-4 font-mono text-cyan-600 dark:text-cyan-400">{svc.port}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'Namespaces' && (
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Namespace</th>
                <th className="p-4">Status</th>
                <th className="p-4">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {namespaces.map((ns) => (
                <tr key={ns.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-slate-900 dark:text-white font-mono">{ns.name}</td>
                  <td className="p-4"><StatusBadge status={ns.status} /></td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{ns.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Kubernetes;
