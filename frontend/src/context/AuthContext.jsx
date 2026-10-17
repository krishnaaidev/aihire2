import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('aihire_token');
    const cachedUser = localStorage.getItem('aihire_user');

    if (token && cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('aihire_user');
      }
    }

    if (token) {
      authApi.getMe()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('aihire_user', JSON.stringify(userData));
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('aihire_token', res.access_token);
    localStorage.setItem('aihire_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const register = async (name, email, password, role = 'candidate') => {
    const res = await authApi.register(name, email, password, role);
    localStorage.setItem('aihire_token', res.access_token);
    localStorage.setItem('aihire_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('aihire_token');
    localStorage.removeItem('aihire_user');
    setUser(null);
  };

  const quickDemoLogin = async (role) => {
    if (role === 'recruiter') {
      return login('recruiter@aihire.com', 'password123');
    } else {
      return login('candidate@aihire.com', 'password123');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, quickDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
