import api from './api';
import { mockMonitoringData } from '../data/mockData';

export const monitoringApi = {
  getOverview: async () => {
    try {
      const res = await api.get('/monitoring/overview');
      return res.data;
    } catch {
      return mockMonitoringData;
    }
  },

  getCpuMetrics: async (timeframe = '1H') => {
    try {
      const res = await api.get(`/monitoring/cpu?range=${timeframe}`);
      return res.data;
    } catch {
      return mockMonitoringData.cpu;
    }
  },

  getMemoryMetrics: async (timeframe = '1H') => {
    try {
      const res = await api.get(`/monitoring/memory?range=${timeframe}`);
      return res.data;
    } catch {
      return mockMonitoringData.memory;
    }
  },

  getNetworkMetrics: async (timeframe = '1H') => {
    try {
      const res = await api.get(`/monitoring/network?range=${timeframe}`);
      return res.data;
    } catch {
      return mockMonitoringData.network;
    }
  },

  getRequestMetrics: async (timeframe = '1H') => {
    try {
      const res = await api.get(`/monitoring/requests?range=${timeframe}`);
      return res.data;
    } catch {
      return mockMonitoringData.requests;
    }
  },

  getLatencyMetrics: async (timeframe = '1H') => {
    try {
      const res = await api.get(`/monitoring/latency?range=${timeframe}`);
      return res.data;
    } catch {
      return mockMonitoringData.latency;
    }
  },

  getErrorMetrics: async (timeframe = '1H') => {
    try {
      const res = await api.get(`/monitoring/errors?range=${timeframe}`);
      return res.data;
    } catch {
      return mockMonitoringData.errors;
    }
  }
};
