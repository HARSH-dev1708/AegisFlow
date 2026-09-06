import api from './api';
import { mockLogsData } from '../data/mockData';

let localLogs = [...mockLogsData];

export const logApi = {
  getLogs: async (params = {}) => {
    try {
      const res = await api.get('/logs', { params });
      return res.data;
    } catch {
      let filtered = [...localLogs];
      if (params.level && params.level !== 'ALL') {
        filtered = filtered.filter(l => l.level === params.level);
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(l => l.message.toLowerCase().includes(query) || l.service.toLowerCase().includes(query));
      }
      return filtered;
    }
  },

  addLogEntry: (logEntry) => {
    const entry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      level: logEntry.level || 'INFO',
      message: logEntry.message || 'Log message recorded',
      service: logEntry.service || 'System'
    };
    localLogs.push(entry);
    return entry;
  },

  clearLogs: async () => {
    try {
      await api.delete('/logs');
    } catch {
      localLogs = [];
    }
    return [];
  }
};
