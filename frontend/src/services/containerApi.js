import api from './api';
import { mockContainers } from '../data/mockData';

let localContainers = [...mockContainers];

export const containerApi = {
  getContainers: async () => {
    try {
      const res = await api.get('/containers');
      return res.data;
    } catch {
      return localContainers;
    }
  },

  getContainerById: async (id) => {
    try {
      const res = await api.get(`/containers/${id}`);
      return res.data;
    } catch {
      return localContainers.find(c => c.id === id) || localContainers[0];
    }
  },

  startContainer: async (id) => {
    try {
      const res = await api.post(`/containers/${id}/start`);
      return res.data;
    } catch {
      localContainers = localContainers.map(c => c.id === id ? { ...c, status: 'Running', cpu: '10%', memory: '190MB' } : c);
      return { success: true, message: `Container ${id} started` };
    }
  },

  stopContainer: async (id) => {
    try {
      const res = await api.post(`/containers/${id}/stop`);
      return res.data;
    } catch {
      localContainers = localContainers.map(c => c.id === id ? { ...c, status: 'Stopped', cpu: '--', memory: '--' } : c);
      return { success: true, message: `Container ${id} stopped` };
    }
  },

  restartContainer: async (id) => {
    try {
      const res = await api.post(`/containers/${id}/restart`);
      return res.data;
    } catch {
      localContainers = localContainers.map(c => c.id === id ? { ...c, status: 'Running', cpu: '14%', memory: '210MB' } : c);
      return { success: true, message: `Container ${id} restarted` };
    }
  },

  getContainerLogs: async (id) => {
    try {
      const res = await api.get(`/containers/${id}/logs`);
      return res.data;
    } catch {
      return [
        `2026-09-03T10:30:00Z [INFO] Initializing container runtime engine for ${id}`,
        `2026-09-03T10:30:02Z [INFO] Listening on 0.0.0.0:8080`,
        `2026-09-03T10:30:05Z [INFO] Spring Boot application started successfully (JVM running for 3.2s)`
      ];
    }
  }
};
