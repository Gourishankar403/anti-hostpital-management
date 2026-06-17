import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (localStorage.getItem('token')) {
          const res = await api.get('/auth/me');
          setUser(res.data);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
        } else {
          console.error("Network error during auth check, keeping token", error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const res = await api.post('/auth/login', formData);
    localStorage.setItem('token', res.data.access_token);
    const userRes = await api.get('/auth/me');
    setUser(userRes.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
