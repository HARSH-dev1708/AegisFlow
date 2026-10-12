import api from './api';

export const containerApi = {
  getContainers: async () => (await api.get('/containers')).data,
  getContainerById: async (id) => (await api.get(`/containers/${id}`)).data,
  startContainer: async (id) => (await api.post(`/containers/${id}/start`)).data,
  stopContainer: async (id) => (await api.post(`/containers/${id}/stop`)).data,
  restartContainer: async (id) => (await api.post(`/containers/${id}/restart`)).data,
  getContainerLogs: async (id) => (await api.get(`/containers/${id}/logs`)).data,
};
