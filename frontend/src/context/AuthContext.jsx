import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';
import { setAccessToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const clearSession = () => {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    };
    const initializeAuth = async () => {
      try {
        const data = await authApi.refresh();
        if (!active) return;
        setAccessToken(data.token);
        setToken(data.token);
        setUser(data.user);
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setLoading(false);
      }
    };
    const handleSessionExpired = () => clearSession();

    window.addEventListener('aegisflow:session-expired', handleSessionExpired);
    initializeAuth();
    return () => {
      active = false;
      window.removeEventListener('aegisflow:session-expired', handleSessionExpired);
    };
  }, []);

  const clearSession = () => {
    setAccessToken(null);
    setToken(null);
    setUser(null);
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authApi.login(credentials);
      setAccessToken(data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authApi.register(userData);
      setAccessToken(data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
