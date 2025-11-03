// src/pages/Home.js
import React from 'react';
import { Box, Stack, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SavingsIcon from '@mui/icons-material/Savings';

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(1200px 600px at 10% 10%, rgba(91,141,239,.25), transparent 45%), ' +
          'radial-gradient(1200px 600px at 90% 90%, rgba(124,77,255,.30), transparent 45%), ' +
          'linear-gradient(180deg, #f7f9fc 0%, #eef2f9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Corner actions */}
      <Stack direction="row" spacing={2} sx={{ position: 'absolute', top: 20, right: 20 }}>
        <Button component={RouterLink} to="/login" variant="outlined" color="primary">
          Login
        </Button>
        <Button component={RouterLink} to="/register" color="secondary">
          Register
        </Button>
      </Stack>

      {/* Hero content */}
      <Stack spacing={3} sx={{ maxWidth: 900, textAlign: 'center', px: 2 }}>
        <Typography variant="h2" fontWeight={800} sx={{ letterSpacing: 0.5 }}>
          Welcome to <span style={{ color: '#5B8DEF' }}>Expense Tracker</span>
        </Typography>

        <Typography variant="h6" color="text.secondary">
          Track expenses, manage budgets, and streamline approvals — all in one elegant dashboard.
        </Typography>

        {/* Feature highlight cards */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="center">
          <Paper sx={{ p: 3, borderRadius: 3, minWidth: 240 }}>
            <Stack spacing={1} alignItems="center">
              <ReceiptLongIcon color="primary" fontSize="large" />
              <Typography fontWeight={700}>Submit & Monitor</Typography>
              <Typography color="text.secondary" variant="body2">
                Quick submission, live status, and instant notifications.
              </Typography>
            </Stack>
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 3, minWidth: 240 }}>
            <Stack spacing={1} alignItems="center">
              <TrendingUpIcon color="secondary" fontSize="large" />
              <Typography fontWeight={700}>Approve with Ease</Typography>
              <Typography color="text.secondary" variant="body2">
                Fast approvals, comments, and processed histories.
              </Typography>
            </Stack>
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 3, minWidth: 240 }}>
            <Stack spacing={1} alignItems="center">
              <SavingsIcon color="success" fontSize="large" />
              <Typography fontWeight={700}>Budgets that Work</Typography>
              <Typography color="text.secondary" variant="body2">
                Set, clear, and track category budgets effortlessly.
              </Typography>
            </Stack>
          </Paper>
        </Stack>

        {/* CTA */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ pt: 1 }}>
          <Button component={RouterLink} to="/login" size="large" color="primary">
            Get Started
          </Button>
          <Button component={RouterLink} to="/register" size="large" variant="outlined" color="secondary">
            Create an Account
          </Button>
      
        </Stack>
      </Stack>
    </Box>
  );
}
