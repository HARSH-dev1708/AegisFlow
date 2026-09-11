import api from './api';
import { mockProjects } from '../data/mockData';

let localProjects = [...mockProjects];

export const projectApi = {
  getProjects: async () => {
    try {
      const res = await api.get('/projects');
      return res.data;
    } catch {
      return localProjects;
    }
  },

  getProjectById: async (id) => {
    try {
      const res = await api.get(`/projects/${id}`);
      return res.data;
    } catch {
      return localProjects.find(p => p.id === id) || localProjects[0];
    }
  },

  createProject: async (projectData) => {
    try {
      const res = await api.post('/projects', projectData);
      return res.data;
    } catch {
      const newProj = {
        id: `proj-${Date.now()}`,
        name: projectData.name || 'New Microservice',
        description: projectData.description || 'DevSecOps enabled cloud service.',
        environment: projectData.environment || 'Development',
        status: 'Healthy',
        securityScore: 85,
        repository: projectData.repository || 'aegisflow/new-service',
        branch: 'main',
        lastDeployment: 'Just now',
        containersCount: 1,
        podsCount: 2,
        activePipelines: 0
      };
      localProjects.unshift(newProj);
      return newProj;
    }
  },

  updateProject: async (id, projectData) => {
    try {
      const res = await api.put(`/projects/${id}`, projectData);
      return res.data;
    } catch {
      localProjects = localProjects.map(p => p.id === id ? { ...p, ...projectData } : p);
      return localProjects.find(p => p.id === id);
    }
  },

  deleteProject: async (id) => {
    try {
      const res = await api.delete(`/projects/${id}`);
      return res.data;
    } catch {
      localProjects = localProjects.filter(p => p.id !== id);
      return { success: true, id };
    }
  }
};
