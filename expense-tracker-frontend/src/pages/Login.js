// src/pages/Login.js
import React, { useState } from 'react';
import { login } from '../services/authService';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Container, Paper, Stack, TextField, Button, Typography,
  Alert, IconButton, InputAdornment, Link
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg('');
    setLoading(true);
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('role', res.data.role);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      const role = res.data.role;
      if (role === 'Manager') navigate('/manager');
      else if (role === 'Employee') navigate('/employee');
      else if (role === 'Admin') navigate('/admin');
      else setErrMsg('Unknown role. Please contact admin.');
    } catch {
      setErrMsg('Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'grid', placeItems: 'center',
      background:
        'radial-gradient(1200px 600px at 10% 10%, rgba(91,141,239,.25), transparent 45%), ' +
        'radial-gradient(1200px 600px at 90% 90%, rgba(124,77,255,.30), transparent 45%), ' +
        'linear-gradient(180deg, #f7f9fc 0%, #eef2f9 100%)'
    }}>
     
<Box sx={{ position: 'fixed', top: 12, left: 16, zIndex: 1200 }}>
  <Button component={RouterLink} to="/" variant="text">← Back to Home</Button>
</Box>

      <Container maxWidth="sm" sx={{ position: 'relative' }}>
        

        <Paper sx={{ p: 4, width: '100%', borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={700} mb={1}>Welcome back</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Sign in to continue to ExpenseTracker</Typography>

          {errMsg && <Alert severity="error" sx={{ mb: 2 }}>{errMsg}</Alert>}

          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Stack spacing={2.2}>
              <TextField name="email" label="Email" type="email" value={form.email} onChange={onChange} required fullWidth />
              <TextField
                name="password" label="Password" type={showPw ? 'text' : 'password'} value={form.password}
                onChange={onChange} required fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw((s) => !s)} edge="end">
                        {showPw ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" disabled={loading} size="large">{loading ? 'Signing in…' : 'Login'}</Button>
              <Typography variant="body2" color="text.secondary">
                Don&apos;t have an account?{' '}
                <Link component={RouterLink} to="/register" underline="hover">Register</Link>
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Container>

    
    </Box>
  );
}