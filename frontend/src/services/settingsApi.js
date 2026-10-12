import api from './api';

export const settingsApi = {
  getSettings: async () => {
    const res = await api.get('/settings');
    return res.data;
  },

  updateSettings: async (settings) => {
    const res = await api.patch('/settings', settings);
    return res.data;
  }
};
