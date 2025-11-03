// src/pages/Register.js
import React, { useState } from 'react';
import { register } from '../services/authService';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Paper, Stack, TextField, Button, Typography, Alert, Link
} from '@mui/material';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', employeeId: '' });
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg(''); setOkMsg(''); setLoading(true);
    try {
      await register(form);
      setOkMsg('Registration successful. You can now log in.');
      setTimeout(() => navigate('/login'), 700);
    } catch (err) {
      setErrMsg('Registration failed. Please try again.');
      console.error(err);
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
      {/* Standalone Back button — placed above the dialog, no absolute positioning */}
      <Box sx={{ width: '100%', maxWidth: 600, mb: 1, px: 2 }}>
        <Button component={RouterLink} to="/" variant="text">
          ← Back to Home
        </Button>
      </Box>

      <Container maxWidth="sm">
        <Paper sx={{ p: 4, width: '100%', borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={700} mb={1}>Create your account</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Join ExpenseTracker</Typography>

          {errMsg && <Alert severity="error" sx={{ mb: 2 }}>{errMsg}</Alert>}
          {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}

          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Stack spacing={2.2}>
              <TextField name="fullName" label="Full Name" value={form.fullName} onChange={onChange} required fullWidth />
              <TextField name="email" label="Email" type="email" value={form.email} onChange={onChange} required fullWidth />
              <TextField name="password" label="Password" type="password" value={form.password} onChange={onChange} required fullWidth />
              <TextField name="employeeId" label="Employee ID" value={form.employeeId} onChange={onChange} required fullWidth />
              <Button type="submit" disabled={loading} size="large">{loading ? 'Creating…' : 'Register'}</Button>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" underline="hover">Login</Link>
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}