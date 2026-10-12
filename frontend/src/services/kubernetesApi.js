import api from './api';

export const kubernetesApi = {
  getOverview: async () => (await api.get('/kubernetes/overview')).data,
  getNodes: async () => (await api.get('/kubernetes/nodes')).data,
  getPods: async () => (await api.get('/kubernetes/pods')).data,
  getDeployments: async () => (await api.get('/kubernetes/deployments')).data,
  getServices: async () => (await api.get('/kubernetes/services')).data,
  getNamespaces: async () => (await api.get('/kubernetes/namespaces')).data,
};
