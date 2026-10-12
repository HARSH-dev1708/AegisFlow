import api from './api';

export const monitoringApi = {
  getOverview: async (timeframe = '1H') =>
    (await api.get('/monitoring/overview', { params: { range: timeframe } })).data,
  getCpuMetrics: async (timeframe = '1H') =>
    (await api.get('/monitoring/cpu', { params: { range: timeframe } })).data,
  getMemoryMetrics: async (timeframe = '1H') =>
    (await api.get('/monitoring/memory', { params: { range: timeframe } })).data,
  getNetworkMetrics: async (timeframe = '1H') =>
    (await api.get('/monitoring/network', { params: { range: timeframe } })).data,
  getRequestMetrics: async (timeframe = '1H') =>
    (await api.get('/monitoring/requests', { params: { range: timeframe } })).data,
  getLatencyMetrics: async (timeframe = '1H') =>
    (await api.get('/monitoring/latency', { params: { range: timeframe } })).data,
  getErrorMetrics: async (timeframe = '1H') =>
    (await api.get('/monitoring/errors', { params: { range: timeframe } })).data,
};
