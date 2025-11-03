// src/components/Logout.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@mui/material';

export default function Logout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Best-effort server logout (non-blocking if API doesn’t exist)
      await axios.post('/api/auth/logout').catch(() => {});
    } finally {
      // Clear client state
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/login', { replace: true });
    }
  };

  return (
    <Button variant="outlined" color="error" onClick={handleLogout}>
      Logout
    </Button>
  );
}