import api from './api';
import { mockPipelines } from '../data/mockData';

let localPipelines = [...mockPipelines];

export const pipelineApi = {
  getPipelines: async () => {
    try {
      const res = await api.get('/pipelines');
      return res.data;
    } catch {
      return localPipelines;
    }
  },

  getPipelineById: async (id) => {
    try {
      const res = await api.get(`/pipelines/${id}`);
      return res.data;
    } catch {
      return localPipelines.find(p => p.id === id) || localPipelines[0];
    }
  },

  createPipeline: async (pipelineData) => {
    try {
      const res = await api.post('/pipelines', pipelineData);
      return res.data;
    } catch {
      const newPipe = {
        id: `pipe-${Date.now()}`,
        projectId: pipelineData.projectId || 'proj-1',
        projectName: pipelineData.projectName || 'Aegis API',
        branch: pipelineData.branch || 'main',
        commit: Math.random().toString(36).substring(2, 9),
        author: 'DevOps Engineer',
        status: 'Running',
        startTime: 'Just now',
        duration: '0m 10s',
        stages: [
          { name: 'Code', status: 'PASSED', duration: '5s' },
          { name: 'Build', status: 'RUNNING', duration: '--' },
          { name: 'Test', status: 'PENDING', duration: '--' },
          { name: 'SAST', status: 'PENDING', duration: '--' },
          { name: 'Dependency Scan', status: 'PENDING', duration: '--' },
          { name: 'Docker Build', status: 'PENDING', duration: '--' },
          { name: 'Container Scan', status: 'PENDING', duration: '--' },
          { name: 'Kubernetes Deploy', status: 'PENDING', duration: '--' },
          { name: 'Production', status: 'PENDING', duration: '--' }
        ]
      };
      localPipelines.unshift(newPipe);
      return newPipe;
    }
  },

  runPipeline: async (id) => {
    try {
      const res = await api.post(`/pipelines/${id}/run`);
      return res.data;
    } catch {
      localPipelines = localPipelines.map(p => p.id === id ? { ...p, status: 'Running', startTime: 'Just now' } : p);
      return { success: true, message: `Pipeline ${id} started` };
    }
  },

  cancelPipeline: async (id) => {
    try {
      const res = await api.post(`/pipelines/${id}/cancel`);
      return res.data;
    } catch {
      localPipelines = localPipelines.map(p => p.id === id ? { ...p, status: 'Cancelled' } : p);
      return { success: true, message: `Pipeline ${id} cancelled` };
    }
  },

  retryPipeline: async (id) => {
    try {
      const res = await api.post(`/pipelines/${id}/retry`);
      return res.data;
    } catch {
      localPipelines = localPipelines.map(p => p.id === id ? { ...p, status: 'Running', startTime: 'Just now' } : p);
      return { success: true, message: `Pipeline ${id} restarted` };
    }
  },

  getPipelineLogs: async (id) => {
    try {
      const res = await api.get(`/pipelines/${id}/logs`);
      return res.data;
    } catch {
      return [
        `[INFO] Starting build for pipeline ${id}`,
        `[INFO] Checking out repository source...`,
        `[INFO] Running static analysis SAST scan...`,
        `[SUCCESS] Zero high severity SAST bugs found.`,
        `[INFO] Building OCI Docker Image tags: aegis:${id}`,
        `[INFO] Pushing image to secure private registry...`
      ];
    }
  }
};
