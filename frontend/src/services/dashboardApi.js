import api from './api';

export const dashboardApi = {
  getDashboardStats: async () => (await api.get('/dashboard')).data,
};
