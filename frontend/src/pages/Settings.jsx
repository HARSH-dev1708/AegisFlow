import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, ShieldCheck, Server, Save, User } from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api');
  const [jwtSecret, setJwtSecret] = useState('aegisflow_jwt_secret_key_prod_99');
  const [enableWebhooks, setEnableWebhooks] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Platform & Engine Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Spring Boot REST endpoint URLs, JWT token secret key, webhooks & organization parameters.
          </p>
        </div>

        {saved && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 text-xs font-semibold">
            Settings Saved Successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Backend REST API Connection */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Spring Boot REST Backend Target
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-medium">API Base URL (`VITE_API_BASE_URL`)</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-medium">JWT Token Secret Header</label>
              <input
                type="password"
                value={jwtSecret}
                onChange={(e) => setJwtSecret(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* User Account Info */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Active User Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Name</span>
              <span className="font-semibold text-slate-900 dark:text-white">{user?.name || 'DevOps Lead'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Email</span>
              <span className="font-semibold text-cyan-600 dark:text-cyan-300">{user?.email || 'devops@aegisflow.io'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Role</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{user?.role || 'ADMIN'}</span>
            </div>
          </div>
        </div>

        {/* Security Scan Rules & Integrations */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Security & Integration Webhooks
          </h3>
          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={enableWebhooks}
                onChange={(e) => setEnableWebhooks(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-800 text-cyan-600"
              />
              <span>Trigger Slack / Teams webhooks on Critical CVE alerts</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
