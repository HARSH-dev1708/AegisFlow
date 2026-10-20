import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
let accessToken = null;
let refreshPromise = null;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
  withCredentials: true,
});

export const setAccessToken = (token) => {
  accessToken = token;
};

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isAuthRequest = request?.url?.includes('/auth/');
    if (error.response?.status !== 401 || !request || request._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      refreshPromise ??= axios.post(`${BASE_URL}/auth/refresh`, {}, {
        withCredentials: true,
        timeout: 8000,
      }).then(({ data }) => {
        setAccessToken(data.token);
        return data.token;
      }).finally(() => {
        refreshPromise = null;
      });
      const refreshedToken = await refreshPromise;
      request.headers.Authorization = `Bearer ${refreshedToken}`;
      return api(request);
    } catch (refreshError) {
      setAccessToken(null);
      window.dispatchEvent(new Event('aegisflow:session-expired'));
      return Promise.reject(refreshError);
    }
  }
);

export default api;
