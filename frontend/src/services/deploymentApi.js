import api from './api';
import { mockDeployments } from '../data/mockData';

let localDeployments = [...mockDeployments];

export const deploymentApi = {
  getDeployments: async () => {
    try {
      const res = await api.get('/deployments');
      return res.data;
    } catch {
      return localDeployments;
    }
  },

  getDeploymentById: async (id) => {
    try {
      const res = await api.get(`/deployments/${id}`);
      return res.data;
    } catch {
      return localDeployments.find(d => d.id === id) || localDeployments[0];
    }
  },

  createDeployment: async (deploymentData) => {
    try {
      const res = await api.post('/deployments', deploymentData);
      return res.data;
    } catch {
      const newDep = {
        id: `dep-${Date.now()}`,
        version: deploymentData.version || 'v1.9.0',
        project: deploymentData.project || 'Aegis API',
        environment: deploymentData.environment || 'Production',
        status: 'Success',
        time: 'Just now',
        dockerImage: deploymentData.dockerImage || 'aegisflow/aegis-api:v1.9.0',
        namespace: deploymentData.namespace || 'production',
        replicas: deploymentData.replicas || 3,
        deployedBy: 'DevOps Lead'
      };
      localDeployments.unshift(newDep);
      return newDep;
    }
  },

  rollbackDeployment: async (id) => {
    try {
      const res = await api.post(`/deployments/${id}/rollback`);
      return res.data;
    } catch {
      const rolledBack = {
        id: `dep-${Date.now()}`,
        version: 'v1.8.1-rollback',
        project: 'Aegis API',
        environment: 'Production',
        status: 'Success',
        time: 'Just now',
        dockerImage: 'aegisflow/aegis-api:v1.8.1',
        namespace: 'production',
        replicas: 3,
        deployedBy: 'DevOps Rollback Engine'
      };
      localDeployments.unshift(rolledBack);
      return rolledBack;
    }
  }
};
