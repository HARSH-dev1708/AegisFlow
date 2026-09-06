import api from './api';
import { mockDashboardData } from '../data/mockData';

export const dashboardApi = {
  getDashboardStats: async () => {
    try {
      const res = await api.get('/dashboard');
      return res.data;
    } catch {
      return mockDashboardData;
    }
  }
};
