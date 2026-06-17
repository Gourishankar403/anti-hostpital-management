import axios from 'axios';

const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
const protocol = window.location.protocol;

const api = axios.create({
  // Use VITE_API_BASE_URL from .env if available, otherwise dynamically use the server's IP/Domain
  baseURL: import.meta.env.VITE_API_BASE_URL || `${protocol}//${hostname}:8001/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
