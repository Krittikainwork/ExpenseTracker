// src/services/authService.js
import axios from 'axios';

const API_BASE = 'http://localhost:5202/api/auth';

export const login = async (credentials) => {
  return axios.post(`${API_BASE}/login`, credentials);
};

export const register = async (data) => {
  return axios.post(`${API_BASE}/register`, data);
};
