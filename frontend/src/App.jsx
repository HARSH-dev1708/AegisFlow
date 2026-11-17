import { useState, useEffect, useCallback } from 'react';
import {
  GitPullRequest,
  Terminal,
  ExternalLink,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Layers,
  ArrowRight,
  Play,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Box,
  Cpu,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [environments, setEnvironments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [simLoading, setSimLoading] = useState(false);

  // Simulator form state
  const [simPrNumber, setSimPrNumber] = useState(101);
  const [simRepo, setSimRepo] = useState('harsh-dev1708/aegisflow-demo');
  const [simTitle, setSimTitle] = useState('feat: add real-time checkout telemetry');
  const [simBranch, setSimBranch] = useState('feat/checkout-telemetry');

  const fetchControlPlaneState = useCallback(async () => {
    try {
      const [envRes, logRes] = await Promise.all([
        fetch(`${API_BASE}/environments`),
        fetch(`${API_BASE}/logs`),
      ]);

      if (!envRes.ok || !logRes.ok) throw new Error('Control plane unreachable');

      const [envData, logData] = await Promise.all([envRes.json(), logRes.json()]);
      setEnvironments(envData);
      setLogs(logData);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Poll backend every 2.5 seconds for real-time container & log updates
  useEffect(() => {
    fetchControlPlaneState();
    const interval = setInterval(fetchControlPlaneState, 2500);
    return () => clearInterval(interval);
  }, [fetchControlPlaneState]);

  const triggerSimulation = async (action, overridePr = null) => {
    setSimLoading(true);
    try {
      await fetch(`${API_BASE}/webhooks/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          prNumber: overridePr ?? Number(simPrNumber),
          repoFullName: simRepo,
          prTitle: simTitle,
          branch: simBranch,
          author: 'harsh-dev',
        }),
      });
      await fetchControlPlaneState();
      if (action === 'opened' && !overridePr) {
        setSimPrNumber((prev) => Number(prev) + 1);
      }
    } finally {
      setSimLoading(false);
    }
  };

  const handleDestroy = async (id) => {
    await fetch(`${API_BASE}/environments/${id}`, { method: 'DELETE' });
    await fetchControlPlaneState();
  };

  const runningEnvs = environments.filter((e) => e.status === 'RUNNING');
  const destroyedEnvs = environments.filter((e) => e.status === 'DESTROYED');

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E7E5E4]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1C1917] text-[#FAF9F6] flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-lg">AegisFlow</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
                v1.0 Control Plane
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E7E5E4] text-stone-600">
              <Cpu className="w-4 h-4 text-amber-600" />
              <span>
                Port Pool: <strong className="text-stone-900">{runningEnvs.length}</strong> / 50 active
              </span>
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium ${
                backendOnline
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {backendOnline ? 'Engine Online (:5000)' : 'Engine Offline'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-12">
        {/* Hero Section: PR Request to Live Preview */}
        <section className="grid lg:grid-cols-12 gap-8 items-center bg-white border border-[#E7E5E4] rounded-3xl p-8 lg:p-10 shadow-sm">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Event-Driven Ephemeral Infrastructure
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-[1.15] text-[#1C1917]">
              From Pull Request to{' '}
              <span className="text-emerald-700 underline decoration-emerald-300 decoration-4 underline-offset-4">
                Live Isolated Preview
              </span>{' '}
              in Seconds.
            </h1>

            <p className="text-stone-600 text-base sm:text-lg leading-relaxed max-w-2xl">
              AegisFlow listens to HMAC-SHA256 verified GitHub webhooks, dynamically allocates a host
              port (<code className="text-sm bg-stone-100 px-1.5 py-0.5 rounded font-mono">8101–8150</code>),
              and orchestrates isolated <code className="text-sm bg-stone-100 px-1.5 py-0.5 rounded font-mono">nginx:alpine</code>{' '}
              containers via Docker Engine—destroying them automatically on merge or close.
            </p>

            {/* Architecture Flow Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-medium text-stone-700">
              <span className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E7E5E4] flex items-center gap-1.5">
                <GitPullRequest className="w-3.5 h-3.5 text-emerald-600" /> 1. PR Opened / Synced
              </span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
              <span className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E7E5E4] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> 2. HMAC Verify & Dockerode
              </span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
              <span className="px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E7E5E4] flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-stone-900" /> 3. Live Port :8101+
              </span>
            </div>
          </div>

          {/* Interactive Webhook Simulator Card */}
          <div className="lg:col-span-5 bg-[#FAF9F6] border border-[#E7E5E4] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-stone-700 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600" /> Instant PR Event Simulator
              </h2>
              <span className="text-xs text-stone-500">Real Docker Container</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-stone-600 mb-1">PR #</label>
                <input
                  type="number"
                  value={simPrNumber}
                  onChange={(e) => setSimPrNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-stone-600 mb-1">Branch</label>
                <input
                  type="text"
                  value={simBranch}
                  onChange={(e) => setSimBranch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Pull Request Title</label>
              <input
                type="text"
                value={simTitle}
                onChange={(e) => setSimTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E7E5E4] text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => triggerSimulation('opened')}
                disabled={simLoading || !backendOnline}
                className="flex-1 bg-[#1C1917] hover:bg-stone-800 disabled:opacity-50 text-white font-medium text-sm py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <GitPullRequest className="w-4 h-4 text-emerald-400" />
                {simLoading ? 'Provisioning...' : 'Simulate PR Opened'}
              </button>
            </div>
          </div>
        </section>

        {/* Active Environments + Live Logs Split Grid */}
        <section className="grid lg:grid-cols-12 gap-8">
          {/* Left 7 Columns: Active Preview Containers */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Active Preview Containers
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {runningEnvs.length} Running
                </span>
              </h2>
              <span className="text-xs text-stone-500">Polling every 2.5s</span>
            </div>

            {runningEnvs.length === 0 ? (
              <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-10 text-center space-y-2">
                <Box className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="font-medium text-stone-700">No active PR containers running</p>
                <p className="text-sm text-stone-500">
                  Open a Pull Request on GitHub or click <strong>Simulate PR Opened</strong> above to spin up an isolated preview environment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {runningEnvs.map((env) => (
                  <div
                    key={env._id}
                    className="bg-white border border-[#E7E5E4] rounded-2xl p-5 shadow-xs hover:border-stone-300 transition space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            PORT {env.port}
                          </span>
                          <span className="text-xs font-mono text-stone-500">{env.repoFullName}</span>
                        </div>
                        <h3 className="font-semibold text-base text-stone-900">
                          #{env.prNumber} — {env.prTitle}
                        </h3>
                      </div>

                      <a
                        href={env.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
                      >
                        Open Preview <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs text-stone-600">
                      <div className="flex items-center gap-4 font-mono">
                        <span>branch: {env.branch}</span>
                        <span className="flex items-center gap-1">
                          <GitCommit className="w-3.5 h-3.5 text-stone-400" />
                          {env.commitSha?.slice(0, 7)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerSimulation('synchronize', env.prNumber)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition cursor-pointer"
                          title="Simulate new commit pushed to PR"
                        >
                          <RefreshCw className="w-3 h-3" /> Push Commit
                        </button>
                        <button
                          onClick={() => handleDestroy(env._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition cursor-pointer"
                          title="Close PR & Destroy Container"
                        >
                          <Trash2 className="w-3 h-3" /> Close & Destroy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recently Destroyed Environments */}
            {destroyedEnvs.length > 0 && (
              <div className="pt-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Recently Reclaimed Environments ({destroyedEnvs.length})
                </h3>
                <div className="bg-white border border-[#E7E5E4] rounded-2xl divide-y divide-stone-100">
                  {destroyedEnvs.slice(0, 4).map((env) => (
                    <div
                      key={env._id}
                      className="px-4 py-3 flex items-center justify-between text-xs text-stone-500"
                    >
                      <span>
                        <strong className="text-stone-700">#{env.prNumber}</strong> {env.prTitle}
                      </span>
                      <span className="font-mono bg-stone-100 px-2 py-0.5 rounded">
                        Port {env.port} Released
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Columns: Live Audit Log Stream */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-stone-700" />
              Webhook & Docker Audit Stream
            </h2>

            <div className="bg-[#1C1917] text-stone-200 rounded-2xl p-4 font-mono text-xs space-y-3 max-h-[520px] overflow-y-auto shadow-sm">
              {logs.length === 0 ? (
                <p className="text-stone-500 py-6 text-center">
                  Waiting for webhook events or container actions...
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log._id}
                    className="border-b border-stone-800 pb-2.5 last:border-none last:pb-0 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          log.status === 'SUCCESS'
                            ? 'text-emerald-400'
                            : log.status === 'ERROR'
                            ? 'text-rose-400'
                            : log.status === 'WARNING'
                            ? 'text-amber-400'
                            : 'text-sky-400'
                        }`}
                      >
                        {log.status === 'ERROR' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {log.eventType}
                      </span>
                      <span className="text-stone-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-stone-300 leading-relaxed break-words">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
