// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard'; // <— new
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5202';
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

const RequireAdmin = ({ children }) => {
  const role = localStorage.getItem('role');
  if (role !== 'Admin') return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/admin"
               element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
      </Routes>
    </Router>
  );
}
export default App;