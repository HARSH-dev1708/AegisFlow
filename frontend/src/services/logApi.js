import api from './api';

export const logApi = {
  getLogs: async (params = {}) => (await api.get('/logs', { params })).data,
  addLogEntry: async (logEntry) => (await api.post('/logs', {
    level: logEntry.level || 'INFO',
    message: logEntry.message || 'Log message recorded',
    service: logEntry.service || 'System',
    projectId: logEntry.projectId,
  })).data,
  clearLogs: async () => (await api.delete('/logs')).data,
};
