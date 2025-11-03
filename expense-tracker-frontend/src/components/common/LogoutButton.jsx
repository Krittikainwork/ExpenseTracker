// src/components/common/LogoutButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@mui/material';

export default function LogoutButton() {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/login', { replace: true });
    }
  };

  return (
    <Button variant="outlined" color="error" onClick={logout} title="Logout">
      Logout
    </Button>
  );
}