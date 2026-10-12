import api from './api';

export const deploymentApi = {
  getDeployments: async () => (await api.get('/deployments')).data,
  getDeploymentById: async (id) => (await api.get(`/deployments/${id}`)).data,
  createDeployment: async (deploymentData) => (await api.post('/deployments', deploymentData)).data,
  rollbackDeployment: async (id) => (await api.post(`/deployments/${id}/rollback`)).data,
};
