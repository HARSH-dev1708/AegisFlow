import api from './api';
import { mockKubernetesData } from '../data/mockData';

export const kubernetesApi = {
  getOverview: async () => {
    try {
      const res = await api.get('/kubernetes/overview');
      return res.data;
    } catch {
      return mockKubernetesData.overview;
    }
  },

  getNodes: async () => {
    try {
      const res = await api.get('/kubernetes/nodes');
      return res.data;
    } catch {
      return mockKubernetesData.nodes;
    }
  },

  getPods: async () => {
    try {
      const res = await api.get('/kubernetes/pods');
      return res.data;
    } catch {
      return mockKubernetesData.pods;
    }
  },

  getDeployments: async () => {
    try {
      const res = await api.get('/kubernetes/deployments');
      return res.data;
    } catch {
      return mockKubernetesData.deployments;
    }
  },

  getServices: async () => {
    try {
      const res = await api.get('/kubernetes/services');
      return res.data;
    } catch {
      return mockKubernetesData.services;
    }
  },

  getNamespaces: async () => {
    try {
      const res = await api.get('/kubernetes/namespaces');
      return res.data;
    } catch {
      return mockKubernetesData.namespaces;
    }
  }
};
