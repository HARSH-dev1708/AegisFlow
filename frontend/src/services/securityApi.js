import api from './api';

export const securityApi = {
  getOverview: async () => (await api.get('/security/overview')).data,
  getFindings: async () => (await api.get('/security/findings')).data,
  getFindingById: async (id) => (await api.get(`/security/findings/${id}`)).data,
  triggerScan: async (projectId) => (await api.post(`/security/scan/${projectId}`)).data,
  updateFindingStatus: async (id, status) => (await api.patch(`/security/findings/${id}`, { status })).data,
};
