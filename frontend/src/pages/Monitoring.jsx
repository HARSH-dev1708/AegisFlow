import React, { useEffect, useState } from 'react';
import { monitoringApi } from '../services/monitoringApi';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import { Activity, Cpu, HardDrive, Network, Zap, Clock, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const Monitoring = () => {
  const [data, setData] = useState(null);
  const [timeframe, setTimeframe] = useState('1H');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await monitoringApi.getOverview(timeframe);
      setData(overview);
    } catch (err) {
      setError(err.message || 'Failed to fetch telemetric metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeframe]);

  if (loading) return <SkeletonLoader count={4} type="card" />;
  if (error) return <ErrorState message={error} onRetry={fetchMetrics} />;

  return (
    <div className="space-y-6">
      {/* Header & Time Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Infrastructure APM & Telemetry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time APM metrics, HTTP throughput, p99 latency & cluster system metrics.
          </p>
        </div>

        {/* Time Filter Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs">
          {['1H', '6H', '24H', '7D'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeframe(range)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                timeframe === range
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of 6 APM Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Telemetry */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-blue-500" />
              CPU Utilization (%)
            </h3>
            <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">Avg 43.2%</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.cpu || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="CPU %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Telemetry */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <HardDrive className="w-4 h-4 text-purple-500" />
              Memory Allocation (GB)
            </h3>
            <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold">4.6 GB / 16 GB</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.memory || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="GB" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} name="Memory GB" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Bandwidth */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <Network className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Network I/O Throughput (MB/s)
            </h3>
            <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">190 In / 450 Out</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.network || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Line type="monotone" dataKey="in" stroke="#06b6d4" strokeWidth={2} name="Ingress MB/s" />
                <Line type="monotone" dataKey="out" stroke="#3b82f6" strokeWidth={2} name="Egress MB/s" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Requests per second */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-500" />
              HTTP Request Throughput (Req/Sec)
            </h3>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">1,890 RPS</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.requests || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="rps" fill="#f59e0b" radius={[4, 4, 0, 0]} name="RPS" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Percentiles */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-emerald-500" />
              Latency Percentiles (ms)
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">p50: 13ms | p99: 130ms</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.latency || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="ms" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} name="p50 (ms)" />
                <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} name="p95 (ms)" />
                <Line type="monotone" dataKey="p99" stroke="#f43f5e" strokeWidth={2} name="p99 (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Rate */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              HTTP 5xx Error Rate (%)
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">0.03% SLI Target</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.errors || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="rate" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} name="Error Rate %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
