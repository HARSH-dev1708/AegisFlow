import api from './api';

export const pipelineApi = {
  getPipelines: async () => (await api.get('/pipelines')).data,
  getPipelineById: async (id) => (await api.get(`/pipelines/${id}`)).data,
  createPipeline: async (pipelineData) => (await api.post('/pipelines', pipelineData)).data,
  runPipeline: async (id) => (await api.post(`/pipelines/${id}/run`)).data,
  cancelPipeline: async (id) => (await api.post(`/pipelines/${id}/cancel`)).data,
  retryPipeline: async (id) => (await api.post(`/pipelines/${id}/retry`)).data,
  getPipelineLogs: async (id) => (await api.get(`/pipelines/${id}/logs`)).data,
};
