// src/pages/Login.js
import React, { useState } from 'react';
import { login } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });

      // Save token/user info
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('role', res.data.role);

      // IMPORTANT: refresh axios Authorization header after login
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

      // Redirect based on role
      if (res.data.role === 'Manager') {
        navigate('/manager');
      } else if (res.data.role === 'Employee') {
        navigate('/employee');
      } else if (res.data.role === 'Admin') {
        navigate('/admin'); // <— add Admin route
      } else {
        alert('Unknown role. Please contact admin.');
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Login</h2>
        <input type="email" placeholder="Email" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
        <p>Don't have an account? <Link to="/register">Register here</Link></p>
      </form>
    </div>
  );
}

export default Login;