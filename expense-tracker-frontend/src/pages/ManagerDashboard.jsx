// src/pages/ManagerDashboard.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs'; // <-- required by ManagerNotificationsList below
import {
  AppBar, Toolbar, Typography, Container, Grid, Paper, Stack, Box, Button,
  TextField, Select, MenuItem, Alert, IconButton, Badge
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import Logout from '../components/Logout';
import PendingRequests from '../components/PendingRequests';
import BudgetForm from '../components/BudgetForm';
import BudgetOverview from '../components/BudgetOverview';
import BudgetHistory from '../components/BudgetHistory';
import ProcessedHistory from '../components/ProcessedHistory';

export default function ManagerDashboard() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showHistory, setShowHistory] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [toast, setToast] = useState('');
  const notifRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await axios.get('/api/notifications');
        if (!alive) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setNotifCount(list.length);
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    const onCleared = () => setNotifCount(0);
    window.addEventListener('manager-clear-notifications', onCleared);
    return () => { alive = false; clearInterval(id); window.removeEventListener('manager-clear-notifications', onCleared); };
  }, []);

  const onBudgetSet = () => setRefreshSignal((x) => x + 1);

  const scrollToNotif = () => {
    notifRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    notifRef.current?.classList.add('flash-highlight');
    setTimeout(() => notifRef.current?.classList.remove('flash-highlight'), 1500);
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Welcome Manager</Typography>
          <IconButton color="inherit" title="Notifications" onClick={scrollToNotif}>
            <Badge badgeContent={notifCount} color="error"><NotificationsNoneIcon /></Badge>
          </IconButton>
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
              <PendingRequests />
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
              {/* Show title only for overview; BudgetHistory renders its own heading */}
              {!showHistory && (
                <Typography variant="h6" fontWeight={700} mb={1}>
                  Set Budget & Live Overview
                </Typography>
              )}

              {!showHistory ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <BudgetForm month={month} year={year} onBudgetSet={onBudgetSet} roles={['Manager']} />
                  </Box>
                  <BudgetOverview
                    month={month}
                    year={year}
                    refreshSignal={refreshSignal}
                    onNavigateToHistory={() => setShowHistory(true)}
                    roles={['Manager', 'Admin']}
                  />
                </>
              ) : (
                <BudgetHistory month={month} year={year} onBack={() => setShowHistory(false)} />
              )}
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700} mb={1}>Processed Expense History</Typography>
              <ProcessedHistory />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ p: 2, position: 'sticky', top: 16 }} ref={notifRef}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={700}>Notifications</Typography>
                <Button variant="outlined" size="small" onClick={() => {
                  const ev = new CustomEvent('manager-clear-notifications');
                  window.dispatchEvent(ev);
                  setNotifCount(0);
                }}>Clear All</Button>
              </Stack>
              <ManagerNotificationsList />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <style>{`.flash-highlight { box-shadow: 0 0 0 3px rgba(91,141,239,.35); border-radius: 12px; }`}</style>
    </>
  );
}

// Inline, headerless notifications list (uses dayjs imported above)
function ManagerNotificationsList() {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState('');
  const load = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setToast('Failed to load notifications.'); }
  };
  useEffect(() => {
    load();
    const handler = () => clearAll();
    window.addEventListener('manager-clear-notifications', handler);
    return () => window.removeEventListener('manager-clear-notifications', handler);
    // eslint-disable-next-line
  }, []);
  const clearAll = async () => {
    try { await axios.post('/api/notifications/clear'); setItems([]); setToast('Notifications cleared.'); }
    catch { setToast('Failed to clear notifications.'); }
  };
  return (
    <>
      {toast && <Alert sx={{ mb: 1 }} severity={toast.startsWith('Failed') ? 'error' : 'success'}>{toast}</Alert>}
      {items.length === 0 ? (
        <Typography color="text.secondary">No new notifications</Typography>
      ) : (
        <Stack spacing={1}>
          {items.map((n) => (
            <Box key={n.notificationId} sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
              <Typography sx={{ fontWeight: 500 }}>{n.message}</Typography>
              <Typography variant="caption" color="text.secondary">
                {dayjs(n.createdAt).format('DD/MM/YYYY HH:mm')}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </>
  );
}