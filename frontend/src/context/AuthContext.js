import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('crave_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await authAPI.getMe();
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('crave_token');
      localStorage.removeItem('crave_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data.data;
    localStorage.setItem('crave_token', token);
    localStorage.setItem('crave_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const signup = async (data) => {
    const res = await authAPI.signup(data);
    const { token, user } = res.data.data;
    localStorage.setItem('crave_token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('crave_token');
    localStorage.removeItem('crave_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(prev => ({ ...prev, ...updatedUser }));

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
