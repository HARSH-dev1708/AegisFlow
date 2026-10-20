import api from './api';

export const projectApi = {
  getProjects: async (archived = false) => (await api.get('/projects', { params: { archived } })).data,
  getEnvironments: async () => (await api.get('/environments')).data,
  getProjectById: async (id) => (await api.get(`/projects/${id}`)).data,
  createProject: async (projectData) => (await api.post('/projects', projectData)).data,
  updateProject: async (id, projectData) => (await api.put(`/projects/${id}`, projectData)).data,
  archiveProject: async (id) => (await api.patch(`/projects/${id}/archive`)).data,
  restoreProject: async (id) => (await api.patch(`/projects/${id}/restore`)).data,
};
