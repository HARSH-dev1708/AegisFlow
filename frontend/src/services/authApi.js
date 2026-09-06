import api from './api';

export const authApi = {
  login: async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials);
      return res.data;
    } catch {
      // Mock Fallback
      console.warn('Backend unavailable. Using Auth mock response.');
      const mockUser = {
        id: 'usr-1',
        name: credentials.email ? credentials.email.split('@')[0] : 'DevOps Lead',
        email: credentials.email || 'devops@aegisflow.io',
        role: 'ADMIN',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockTokenStr'
      };
      return {
        token: mockUser.token,
        user: mockUser
      };
    }
  },

  register: async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      return res.data;
    } catch {
      // Mock Fallback
      console.warn('Backend unavailable. Using Register mock response.');
      const newUser = {
        id: `usr-${Date.now()}`,
        name: userData.name || 'New Engineer',
        email: userData.email || 'user@aegisflow.io',
        role: 'DEVELOPER',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockTokenStrNew'
      };
      return {
        token: newUser.token,
        user: newUser
      };
    }
  },

  getMe: async () => {
    try {
      const res = await api.get('/auth/me');
      return res.data;
    } catch {
      const stored = localStorage.getItem('aegisflow_user');
      return stored ? JSON.parse(stored) : {
        id: 'usr-1',
        name: 'DevOps Lead',
        email: 'devops@aegisflow.io',
        role: 'ADMIN'
      };
    }
  }
};
