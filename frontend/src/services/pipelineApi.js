import api from './api';

export const pipelineApi = {
  getPipelines: async () => (await api.get('/pipelines')).data,
  getPipelineById: async (id) => (await api.get(`/pipelines/${id}`)).data,
  createPipeline: async (pipelineData) => (await api.post('/pipelines', pipelineData)).data,
  createWebhookRun: async (pipelineData) => (await api.post('/pipelines/webhook', pipelineData)).data,
  runPipeline: async (id) => (await api.post(`/pipelines/${id}/run`)).data,
  cancelPipeline: async (id) => (await api.post(`/pipelines/${id}/cancel`)).data,
  retryPipeline: async (id) => (await api.post(`/pipelines/${id}/retry`)).data,
  updateStageStatus: async (pipelineId, stageId, update) => (
    await api.patch(`/pipelines/${pipelineId}/stages/${stageId}`, update)
  ).data,
  appendPipelineLog: async (id, log) => (await api.post(`/pipelines/${id}/logs`, log)).data,
  getPipelineLogs: async (id) => (await api.get(`/pipelines/${id}/logs`)).data,
};
