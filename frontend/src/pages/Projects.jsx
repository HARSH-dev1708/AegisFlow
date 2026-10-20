import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../services/projectApi';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { ErrorState } from '../components/common/ErrorState';
import { FolderGit2, Plus, GitBranch, ArrowUpRight, Search, Pencil, Archive, RotateCcw } from 'lucide-react';

export const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', environmentId: '', repository: '' });

  const fetchProjects = useCallback(async () => {
    try {
      const [projectData, environmentData] = await Promise.all([
        projectApi.getProjects(showArchived),
        projectApi.getEnvironments(),
      ]);
      setProjects(projectData);
      setEnvironments(environmentData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const changeArchiveFilter = (archived) => {
    if (archived === showArchived) return;
    setLoading(true);
    setShowArchived(archived);
  };

  const openCreate = () => {
    const defaultEnvironment = environments.find((environment) => environment.name.toLowerCase() === 'development')
      || environments[0];
    setEditingProject(null);
    setIsModalOpen(true);
    setActionError('');
    setForm({
      name: '',
      description: '',
      environmentId: defaultEnvironment ? String(defaultEnvironment.id) : '',
      repository: '',
    });
  };

  const openEdit = (project) => {
    const environment = environments.find((item) => item.name === project.environment);
    setEditingProject(project);
    setIsModalOpen(true);
    setActionError('');
    setForm({
      name: project.name,
      description: project.description || '',
      environmentId: environment ? String(environment.id) : '',
      repository: project.repository || '',
    });
  };

  const closeModal = () => {
    setEditingProject(null);
    setIsModalOpen(false);
    setActionError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setActionError('');
    try {
      const projectData = {
        name: form.name,
        description: form.description,
        environmentId: Number(form.environmentId),
        repository: form.repository,
      };
      if (editingProject) {
        await projectApi.updateProject(editingProject.id, projectData);
      } else {
        await projectApi.createProject(projectData);
      }
      closeModal();
      await fetchProjects();
    } catch (err) {
      setActionError(err.response?.data?.detail || err.message || 'Could not save this project');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (project) => {
    if (!window.confirm(`Archive "${project.name}"? Its project history will be kept and it can be restored later.`)) return;
    setBusyProjectId(project.id);
    setActionError('');
    try {
      await projectApi.archiveProject(project.id);
      await fetchProjects();
    } catch (err) {
      setActionError(err.response?.data?.detail || err.message || 'Could not archive this project');
    } finally {
      setBusyProjectId(null);
    }
  };

  const handleRestore = async (project) => {
    setBusyProjectId(project.id);
    setActionError('');
    try {
      await projectApi.restoreProject(project.id);
      await fetchProjects();
    } catch (err) {
      setActionError(err.response?.data?.detail || err.message || 'Could not restore this project');
    } finally {
      setBusyProjectId(null);
    }
  };

  const canManage = (project) => user?.role?.toUpperCase() === 'ADMIN'
    || String(project.ownerId) === String(user?.id);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.environment.toLowerCase().includes(search.toLowerCase()) ||
    (p.repository || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <SkeletonLoader count={4} type="table" />;
  if (error) return <ErrorState message={error} onRetry={fetchProjects} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Microservice Projects
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage DevSecOps repositories, deployment environments, and security profiles.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={showArchived || environments.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeArchiveFilter(false)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold ${!showArchived ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
          >
            Active
          </button>
          <button
            onClick={() => changeArchiveFilter(true)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold ${showArchived ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
          >
            Archived
          </button>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name or environment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {actionError && !isModalOpen && (
        <div role="alert" className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
          {actionError}
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Project</th>
                <th className="p-4">Environment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Deployment</th>
                <th className="p-4">Security Score</th>
                <th className="p-4">Repository</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    {showArchived ? 'No archived projects.' : 'No projects yet. Create one to get started.'}
                  </td>
                </tr>
              )}
              {filtered.map((proj) => (
                <tr
                  key={proj.id}
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-400">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors block">
                          {proj.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{proj.description}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {proj.environment}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={proj.status} />
                  </td>
                  <td className="p-4"><StatusBadge status={proj.deploymentStatus} size="sm" /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
                        <div
                          className={`h-full rounded-full ${
                            proj.securityScore >= 85 ? 'bg-emerald-500' : proj.securityScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${proj.securityScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{proj.securityScore}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {proj.repository ? (
                      <a
                        href={proj.repository}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 hover:underline"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        Repository
                      </a>
                    ) : <span>No repository</span>}
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      {canManage(proj) && !showArchived && (
                        <>
                          <button
                            type="button"
                            title="Edit project"
                            onClick={(event) => { event.stopPropagation(); openEdit(proj); }}
                            className="p-2 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Archive project"
                            disabled={busyProjectId === proj.id}
                            onClick={(event) => { event.stopPropagation(); handleArchive(proj); }}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {canManage(proj) && showArchived && (
                        <button
                          type="button"
                          title="Restore project"
                          disabled={busyProjectId === proj.id}
                          onClick={(event) => { event.stopPropagation(); handleRestore(proj); }}
                          className="p-2 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform text-xs font-semibold">
                        Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project create/edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h3>
            {actionError && (
              <div role="alert" className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                {actionError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. Auth Microservice"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Description</label>
                <textarea
                  maxLength={500}
                  placeholder="Short service description..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Environment</label>
                <select
                  required
                  value={form.environmentId}
                  onChange={(e) => setForm({ ...form, environmentId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select an environment</option>
                  {environments.map((environment) => (
                    <option key={environment.id} value={environment.id}>{environment.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">Repository URL</label>
                <input
                  type="url"
                  maxLength={255}
                  placeholder="https://github.com/org/repo"
                  value={form.repository}
                  onChange={(e) => setForm({ ...form, repository: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.environmentId}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
