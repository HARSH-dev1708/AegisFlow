import api from './api';

export const projectApi = {
  getProjects: async () => (await api.get('/projects')).data,
  getProjectById: async (id) => (await api.get(`/projects/${id}`)).data,
  createProject: async (projectData) => (await api.post('/projects', projectData)).data,
  updateProject: async (id, projectData) => (await api.put(`/projects/${id}`, projectData)).data,
  deleteProject: async (id) => (await api.delete(`/projects/${id}`)).data,
};
