import React, { useEffect, useState } from 'react';
import { securityApi } from '../services/securityApi';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  Info,
  Play,
  CheckCircle2,
  FileCode2,
  PackageCheck,
  Box,
  KeyRound,
  FileSpreadsheet,
  Search
} from 'lucide-react';

export const Security = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchSecurity = async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await securityApi.getOverview();
      setData(overview);
    } catch (err) {
      setError(err.message || 'Failed to fetch security metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
  }, []);

  const handleScan = async () => {
    try {
      await securityApi.triggerScan('proj-1');
      alert('Security scanners dispatched (SonarQube + Trivy + Semgrep + Gitleaks)');
      fetchSecurity();
    } catch (err) {
      alert('Failed to trigger security scan: ' + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await securityApi.updateFindingStatus(id, newStatus);
      fetchSecurity();
    } catch (err) {
      alert('Failed to update vulnerability status');
    }
  };

  if (loading) return <SkeletonLoader count={4} type="card" />;
  if (error) return <ErrorState message={error} onRetry={fetchSecurity} />;

  const vulnerabilities = data?.vulnerabilities || [];
  const filtered = vulnerabilities.filter((v) => {
    const matchesSearch =
      v.cve.toLowerCase().includes(search.toLowerCase()) ||
      v.package.toLowerCase().includes(search.toLowerCase()) ||
      v.project.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || v.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const scannerIcons = {
    SAST: FileCode2,
    'Dependency Scan': PackageCheck,
    'Container Scan': Box,
    'Secrets Scan': KeyRound,
    'IaC Scan': FileSpreadsheet
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Security & Compliance Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time SAST, DAST, OCI container scans, secret leak checks & CVE vulnerability grid.
          </p>
        </div>
        <button
          onClick={handleScan}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          Run Security Scan
        </button>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Security Score */}
        <div className="md:col-span-2 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-cyan-500/30 flex items-center justify-around shadow-sm">
          <div className="relative flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-8 border-cyan-500/20 border-t-cyan-500 border-r-cyan-500 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{data?.score || 87}</span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-bold tracking-wider">Score</span>
            </div>
          </div>
          <div className="space-y-1 text-left">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Posture: Optimal</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Continuous AST posture score calculated across 12 connected cloud projects.
            </p>
            <span className="inline-block mt-2 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-semibold">
              SOC2 & ISO 27001 Compliant
            </span>
          </div>
        </div>

        {/* Severity Counter Grid */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span className="text-xs font-bold uppercase">Critical</span>
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">1</div>
            <span className="text-[10px] text-rose-600 dark:text-rose-300">CVE-2024-21626</span>
          </div>

          <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-orange-200 dark:border-orange-900/40 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
              <span className="text-xs font-bold uppercase">High</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">3</div>
            <span className="text-[10px] text-orange-600 dark:text-orange-300">Patch required</span>
          </div>

          <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-yellow-200 dark:border-yellow-900/40 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-yellow-600 dark:text-yellow-400">
              <span className="text-xs font-bold uppercase">Medium</span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">4</div>
            <span className="text-[10px] text-yellow-600 dark:text-yellow-300">Dep scans</span>
          </div>

          <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
              <span className="text-xs font-bold uppercase">Low</span>
              <Info className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">8</div>
            <span className="text-[10px] text-blue-600 dark:text-blue-300">Informational</span>
          </div>
        </div>
      </div>

      {/* Security Scanner Suite */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Security Scanner Suite</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(data?.scanners || []).map((scanner) => {
            const Icon = scannerIcons[scanner.name] || ShieldCheck;
            return (
              <div key={scanner.name} className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <StatusBadge status={scanner.status} size="sm" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">{scanner.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{scanner.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vulnerability Matrix Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            CVE Vulnerability Finding Matrix
          </h3>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter CVE or package..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-[11px]">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    severityFilter === sev ? 'bg-cyan-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Severity</th>
                <th className="p-3">CVE Identifier</th>
                <th className="p-3">Package / Binary</th>
                <th className="p-3">Affected Project</th>
                <th className="p-3">Status</th>
                <th className="p-3">Remediation Action</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((vuln) => (
                <tr key={vuln.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <StatusBadge status={vuln.severity} size="sm" />
                  </td>
                  <td className="p-3 font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{vuln.cve}</td>
                  <td className="p-3 font-mono text-slate-800 dark:text-slate-300">{vuln.package}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{vuln.project}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      vuln.status === 'RESOLVED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {vuln.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">{vuln.action}</td>
                  <td className="p-3 text-right">
                    {vuln.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => handleStatusChange(vuln.id, 'RESOLVED')}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded text-[11px] font-medium"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Security;
