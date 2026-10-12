import api from './api';

export const authApi = {
  login: async (credentials) => (await api.post('/auth/login', credentials)).data,
  register: async (userData) => (await api.post('/auth/register', userData)).data,
  refresh: async () => (await api.post('/auth/refresh')).data,
  logout: async () => (await api.post('/auth/logout')).data,
};
