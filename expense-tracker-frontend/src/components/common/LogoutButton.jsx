// src/components/common/LogoutButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const navigate = useNavigate();

  const logout = () => {
    // Keep this consistent with your auth handling
    localStorage.removeItem('authToken');
    localStorage.removeItem('user'); // if you store user
    // If you have an AuthContext, also clear it there.
    navigate('/login');
  };

  return (
    <button className="btn" onClick={logout} title="Logout">
      Logout
    </button>
  );
};

export default LogoutButton;
