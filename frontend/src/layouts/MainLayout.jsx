import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldAlert,
  LayoutDashboard,
  FolderGit2,
  GitPullRequest,
  ShieldCheck,
  Box,
  Layers,
  Rocket,
  Activity,
  Terminal,
  Settings,
  Search,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Pipelines', path: '/pipelines', icon: GitPullRequest },
    { label: 'Security', path: '/security', icon: ShieldCheck },
    { label: 'Containers', path: '/containers', icon: Box },
    { label: 'Kubernetes', path: '/kubernetes', icon: Layers },
    { label: 'Deployments', path: '/deployments', icon: Rocket },
    { label: 'Monitoring', path: '/monitoring', icon: Activity },
    { label: 'Logs', path: '/logs', icon: Terminal },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#000000] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 h-16 bg-white dark:bg-[#000000] border-b border-slate-200 dark:border-zinc-800/80 px-4 md:px-6 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg focus:outline-none"
            aria-label="Toggle Navigation Drawer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="p-2 rounded-xl bg-cyan-600 text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                AegisFlow
              </span>
              <span className="text-[10px] tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold uppercase -mt-1">
                DevSecOps Engine
              </span>
            </div>
          </div>
        </div>

        {/* Global Search, Theme Switcher & User Bar */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center relative w-64 md:w-80">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search pipelines, CVEs, pods..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-cyan-600" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 space-y-3 text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider">Alerts & Feeds</span>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">3 New</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded bg-rose-50 dark:bg-slate-950 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-300">
                    <p className="font-semibold">CVE-2024-21626 Critical Alert</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">runc container breakout vulnerability flagged on Payment Gateway Service.</p>
                  </div>
                  <div className="p-2 rounded bg-emerald-50 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    <p className="font-semibold">Deployment Success</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Aegis API v1.8.2 rolled out to Production Kubernetes namespace.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-white leading-none">{user?.name || 'DevOps Lead'}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{user?.role || 'ADMIN'}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* BODY WITH RESPONSIVE SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#000000] border-r border-slate-200 dark:border-zinc-800/80 p-4 justify-between select-none transition-colors">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              DevSecOps Platform
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-cyan-50 dark:bg-zinc-900 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-zinc-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-900/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 transition-transform group-hover:scale-110 text-cyan-600 dark:text-cyan-400" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-50 dark:bg-zinc-900 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-zinc-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-900/60'
                }`
              }
            >
              <Settings className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Settings</span>
            </NavLink>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative flex flex-col w-72 bg-white dark:bg-[#0a0a0a] border-r border-slate-200 dark:border-zinc-800/80 p-4 justify-between h-full z-10">
              <div className="space-y-1">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800/80 mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">AegisFlow</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-cyan-50 dark:bg-zinc-900 text-cyan-700 dark:text-cyan-300 font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80">
                <NavLink
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-900"
                >
                  <Settings className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Settings</span>
                </NavLink>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-[#000000] transition-colors">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
