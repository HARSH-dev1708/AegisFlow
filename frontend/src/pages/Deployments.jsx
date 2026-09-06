import React, { useEffect, useState } from 'react';
import { deploymentApi } from '../services/deploymentApi';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import { Rocket, Plus, RotateCcw } from 'lucide-react';

export const Deployments = () => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [form, setForm] = useState({
    project: 'Aegis API',
    version: 'v1.9.0',
    environment: 'Production',
    dockerImage: 'aegisflow/aegis-api:v1.9.0',
    namespace: 'production',
    replicas: 3
  });

  const fetchDeployments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deploymentApi.getDeployments();
      setDeployments(data);
    } catch (err) {
      setError(err.message || 'Failed to load deployment records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const handleDeploy = async (e) => {
    e.preventDefault();
    try {
      await deploymentApi.createDeployment(form);
      setShowDeployModal(false);
      fetchDeployments();
    } catch (err) {
      alert('Deployment failed: ' + err.message);
    }
  };

  const handleRollback = async (id) => {
    if (!window.confirm('Are you sure you want to rollback to this release version?')) return;
    try {
      await deploymentApi.rollbackDeployment(id);
      fetchDeployments();
    } catch (err) {
      alert('Rollback failed: ' + err.message);
    }
  };

  if (loading) return <SkeletonLoader count={4} type="table" />;
  if (error) return <ErrorState message={error} onRetry={fetchDeployments} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Rocket className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Release Deployments Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Production & staging release history, canary deployments & automated zero-downtime rollbacks.
          </p>
        </div>

        <button
          onClick={() => setShowDeployModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Deployment
        </button>
      </div>

      {/* Deployments Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Version Tag</th>
                <th className="p-4">Project</th>
                <th className="p-4">Environment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Docker Image</th>
                <th className="p-4">K8s Namespace</th>
                <th className="p-4">Deployed Time</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {deployments.map((dep) => (
                <tr key={dep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    <Rocket className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    {dep.version}
                  </td>
                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{dep.project}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {dep.environment}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={dep.status} />
                  </td>
                  <td className="p-4 font-mono text-cyan-700 dark:text-cyan-300 text-[11px]">{dep.dockerImage}</td>
                  <td className="p-4 font-mono text-purple-700 dark:text-purple-300 text-[11px]">{dep.namespace}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{dep.time}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleRollback(dep.id)}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ml-auto"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Rollback
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deployment Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Rocket className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Trigger Application Deployment
            </h3>
            <form onSubmit={handleDeploy} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Target Project</label>
                <select
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Aegis API">Aegis API</option>
                  <option value="Frontend SaaS">Frontend SaaS</option>
                  <option value="Payment Gateway Service">Payment Gateway Service</option>
                  <option value="Auth Service">Auth Service</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Version Tag</label>
                <input
                  type="text"
                  required
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Environment</label>
                <select
                  value={form.environment}
                  onChange={(e) => setForm({ ...form, environment: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Docker Image</label>
                <input
                  type="text"
                  required
                  value={form.dockerImage}
                  onChange={(e) => setForm({ ...form, dockerImage: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">K8s Namespace</label>
                  <input
                    type="text"
                    required
                    value={form.namespace}
                    onChange={(e) => setForm({ ...form, namespace: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Replicas</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.replicas}
                    onChange={(e) => setForm({ ...form, replicas: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold shadow-sm"
                >
                  Deploy Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deployments;
