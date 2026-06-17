import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const RequestContext = createContext();

export const useRequests = () => useContext(RequestContext);

export const RequestProvider = ({ children }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      // Add a timestamp to bypass any browser caching
      const res = await api.get(`/requests/?t=${new Date().getTime()}`);
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
      // Poll every 5 seconds globally
      const intervalId = setInterval(() => {
        fetchRequests();
      }, 5000);
      return () => clearInterval(intervalId);
    } else {
      setRequests([]);
    }
  }, [user]);

  return (
    <RequestContext.Provider value={{ requests, refreshRequests: fetchRequests }}>
      {children}
    </RequestContext.Provider>
  );
};
