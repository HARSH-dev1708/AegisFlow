import React, { useEffect, useState } from 'react';
import { containerApi } from '../services/containerApi';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import {
  Box,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Cpu,
  HardDrive,
  Search,
  XCircle
} from 'lucide-react';

export const Containers = () => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedLogs, setSelectedLogs] = useState(null);
  const [logModalContainer, setLogModalContainer] = useState(null);

  const fetchContainers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await containerApi.getContainers();
      setContainers(data);
    } catch (err) {
      setError(err.message || 'Failed to load container instances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const handleStart = async (id) => {
    try {
      await containerApi.startContainer(id);
      fetchContainers();
    } catch (err) {
      alert('Failed to start container: ' + err.message);
    }
  };

  const handleStop = async (id) => {
    try {
      await containerApi.stopContainer(id);
      fetchContainers();
    } catch (err) {
      alert('Failed to stop container: ' + err.message);
    }
  };

  const handleRestart = async (id) => {
    try {
      await containerApi.restartContainer(id);
      fetchContainers();
    } catch (err) {
      alert('Failed to restart container: ' + err.message);
    }
  };

  const handleViewLogs = async (container) => {
    try {
      const logs = await containerApi.getContainerLogs(container.id);
      setSelectedLogs(logs);
      setLogModalContainer(container);
    } catch (err) {
      alert('Failed to fetch container logs: ' + err.message);
    }
  };

  if (loading) return <SkeletonLoader count={4} type="table" />;
  if (error) return <ErrorState message={error} onRetry={fetchContainers} />;

  const filtered = containers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.image.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Box className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            OCI Container Workloads
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Docker engine telemetry, container lifecycle management & stdout logs.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search containers or images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Containers Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Container</th>
                <th className="p-4">Docker Image</th>
                <th className="p-4">Status</th>
                <th className="p-4">CPU Usage</th>
                <th className="p-4">Memory</th>
                <th className="p-4">Ports</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((cnt) => (
                <tr key={cnt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    {cnt.name}
                  </td>
                  <td className="p-4 font-mono text-cyan-700 dark:text-cyan-300 text-[11px]">{cnt.image}</td>
                  <td className="p-4">
                    <StatusBadge status={cnt.status} />
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-blue-500" /> {cnt.cpu}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-purple-500" /> {cnt.memory}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{cnt.ports}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {cnt.status === 'Running' ? (
                        <button
                          onClick={() => handleStop(cnt.id)}
                          title="Stop Container"
                          className="p-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-lg"
                        >
                          <Square className="w-3.5 h-3.5 fill-rose-500" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStart(cnt.id)}
                          title="Start Container"
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-lg"
                        >
                          <Play className="w-3.5 h-3.5 fill-emerald-500" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRestart(cnt.id)}
                        title="Restart Container"
                        className="p-1.5 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 rounded-lg"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleViewLogs(cnt)}
                        title="View Container Logs"
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs Modal */}
      {selectedLogs && logModalContainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111827] w-full max-w-2xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Logs: {logModalContainer.name} ({logModalContainer.image})
              </h3>
              <button onClick={() => setSelectedLogs(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 space-y-2 max-h-80 overflow-y-auto">
              {selectedLogs.map((line, idx) => (
                <div key={idx} className="leading-relaxed">{line}</div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLogs(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Containers;
