import React, { useEffect, useState, useRef } from 'react';
import { logApi } from '../services/logApi';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import {
  Terminal,
  Search,
  Trash2,
  Download,
  ArrowDownCircle,
  Play,
  Pause
} from 'lucide-react';

export const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isStreaming, setIsStreaming] = useState(true);
  const logsEndRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const data = await logApi.getLogs({ search, level: levelFilter });
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Failed to stream logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, levelFilter]);

  // Live log generator simulation
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      const services = ['AuthService', 'ContainerRuntime', 'KubeController', 'IngressRouter', 'PipelineEngine'];
      const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
      const messages = [
        'Health check ping responded with 200 OK',
        'Incoming OAuth token verified successfully',
        'Ingress connection pool active (32 concurrent workers)',
        'High latency detected on internal microservice bridge (112ms)',
        'Container memory utilization reached 78% threshold'
      ];

      const idx = Math.floor(Math.random() * services.length);
      const newEntry = logApi.addLogEntry({
        level: levels[idx],
        service: services[idx],
        message: messages[idx]
      });

      setLogs((prev) => [...prev, newEntry]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleClear = async () => {
    await logApi.clearLogs();
    setLogs([]);
  };

  const handleDownload = () => {
    const textContent = logs.map(l => `${l.timestamp} [${l.level}] [${l.service}] ${l.message}`).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegisflow-logs-${Date.now()}.log`;
    a.click();
  };

  if (loading) return <SkeletonLoader count={6} type="table" />;
  if (error) return <ErrorState message={error} onRetry={fetchLogs} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Terminal Log Stream
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized stdout/stderr log aggregator for microservices, Docker & Kubernetes pods.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isStreaming
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isStreaming ? 'Live Stream On' : 'Stream Paused'}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Log
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search log messages, services, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-[11px]">
            {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  levelFilter === lvl
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-800 text-cyan-600"
          />
          <ArrowDownCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          Auto-scroll to latest
        </label>
      </div>

      {/* Terminal View Container */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="bg-slate-100 dark:bg-[#050505] px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 ml-2">stdout.log — bash / devsecops-stream</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{logs.length} Lines Recorded</span>
        </div>

        <div className="bg-slate-900 dark:bg-[#000000] p-4 font-mono text-xs text-slate-200 space-y-1 max-h-[550px] overflow-y-auto selection:bg-cyan-500 selection:text-black">
          {logs.map((log) => {
            const isError = log.level === 'ERROR';
            const isWarn = log.level === 'WARN';

            return (
              <div key={log.id} className="hover:bg-slate-800/80 px-2 py-1 rounded flex items-start gap-3">
                <span className="text-slate-500 select-none text-[11px] shrink-0 font-semibold">{log.timestamp}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold shrink-0 ${
                  isError ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  isWarn ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {log.level}
                </span>
                <span className="text-purple-400 shrink-0 font-semibold">[{log.service}]</span>
                <span className={`flex-1 ${isError ? 'text-rose-300 font-semibold' : isWarn ? 'text-amber-300' : 'text-slate-200'}`}>
                  {log.message}
                </span>
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default Logs;
