import api from './api';
import { mockSecurityOverview } from '../data/mockData';

let localSecurity = { ...mockSecurityOverview };

export const securityApi = {
  getOverview: async () => {
    try {
      const res = await api.get('/security/overview');
      return res.data;
    } catch {
      return localSecurity;
    }
  },

  getFindings: async () => {
    try {
      const res = await api.get('/security/findings');
      return res.data;
    } catch {
      return localSecurity.vulnerabilities;
    }
  },

  getFindingById: async (id) => {
    try {
      const res = await api.get(`/security/findings/${id}`);
      return res.data;
    } catch {
      return localSecurity.vulnerabilities.find(v => v.id === id) || localSecurity.vulnerabilities[0];
    }
  },

  triggerScan: async (projectId) => {
    try {
      const res = await api.post(`/security/scan/${projectId}`);
      return res.data;
    } catch {
      return { success: true, message: `Security scan initiated for project ${projectId}` };
    }
  },

  updateFindingStatus: async (id, status) => {
    try {
      const res = await api.patch(`/security/findings/${id}`, { status });
      return res.data;
    } catch {
      localSecurity.vulnerabilities = localSecurity.vulnerabilities.map(v => v.id === id ? { ...v, status } : v);
      return localSecurity.vulnerabilities.find(v => v.id === id);
    }
  }
};
