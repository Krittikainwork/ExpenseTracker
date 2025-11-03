// src/pages/AdminDashboard.jsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  AppBar, Toolbar, Typography, Container, Grid, Paper, Stack, Box, Button,
  TextField, Select, MenuItem, Alert
} from '@mui/material';
import Logout from '../components/Logout';
import AdminPendingRequests from '../components/AdminPendingRequests';
import AdminBudgetOverview from '../components/AdminBudgetOverview';
import AdminBudgetHistory from '../components/AdminBudgetHistory';
import AdminProcessedHistory from '../components/AdminProcessedHistory';
import AdminReimbursementPending from '../components/AdminReimbursementPending';
import BudgetForm from '../components/BudgetForm';

export default function AdminDashboard() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showHistory, setShowHistory] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [toast, setToast] = useState('');

  const onBudgetSet = () => setRefreshSignal((x) => x + 1);

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Welcome Admin</Typography>
          <Logout />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Typography variant="subtitle1" fontWeight={700}>Select Month / Year</Typography>
            <Select value={month} onChange={(e) => setMonth(e.target.value)} sx={{ minWidth: 100 }}>
              {Array.from({ length: 12 }).map((_, i) => (<MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>))}
            </Select>
            <TextField type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} sx={{ width: 120 }} />
            <Box sx={{ flexGrow: 1 }} />
            {/* Top "Clear All (Month)" and "View Budget History" buttons removed as per requirement */}
          </Stack>
          {toast && <Alert sx={{ mt: 2 }} severity={toast.startsWith('Failed') ? 'error' : 'success'}>{toast}</Alert>}
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8} lg={9}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Pending Expense Requests</Typography>
              <AdminPendingRequests />
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
              {/* Show title only for overview; history has its own header */}
              {!showHistory && (
                <Typography variant="h6" fontWeight={700} mb={1}>
                  Set Budget & Live Overview
                </Typography>
              )}

              {!showHistory ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <BudgetForm month={month} year={year} onBudgetSet={onBudgetSet} roles={['Admin']} />
                  </Box>
                  <AdminBudgetOverview
                    month={month}
                    year={year}
                    refreshSignal={refreshSignal}
                    onNavigateToHistory={() => setShowHistory(true)}
                    roles={['Admin']}
                  />
                </>
              ) : (
                <AdminBudgetHistory month={month} year={year} onBack={() => setShowHistory(false)} />
              )}
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Processed Expense History</Typography>
              <AdminProcessedHistory />
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Reimbursement Pending</Typography>
              <AdminReimbursementPending month={month} year={year} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ p: 2, position: 'sticky', top: 16 }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Admin Tools</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage budgets, view histories, and monitor reimbursements.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}