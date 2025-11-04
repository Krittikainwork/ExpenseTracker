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

// charts imports (unchanged from previous update)
import BudgetVsExpenses from '../components/charts/BudgetVsExpenses';
import PendingByCategory from '../components/charts/PendingByCategory';

export default function ManagerDashboard() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showHistory, setShowHistory] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [toast, setToast] = useState('');

  // NEW: refs for quick nav
  const pendingRef = useRef(null);
  const budgetSectionRef = useRef(null);
  const budgetOverviewAnchorRef = useRef(null);
  const processedRef = useRef(null);
  const chartsBudgetRef = useRef(null);
  const chartsPendingRef = useRef(null);
  const notifRef = useRef(null);

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

  // Ensure correct view before scrolling
  const goToOverviewSection = () => {
    if (showHistory) setShowHistory(false);
    // scroll to the BudgetOverview anchor inside the card
    setTimeout(() => scrollTo(budgetOverviewAnchorRef), 50);
  };
  const goToHistorySection = () => {
    if (!showHistory) setShowHistory(true);
    // scroll to the whole budget section card (history lives there)
    setTimeout(() => scrollTo(budgetSectionRef), 50);
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Welcome Manager</Typography>

          {/* NEW: quick nav buttons on AppBar */}
       
          {/* NEW: quick nav buttons on AppBar */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mx: 2 }}>
            <Button color="inherit" size="small" sx={{ color: 'rgba(18, 17, 17, 0.95)', fontWeight: 600, textTransform: 'none' }} onClick={() => scrollTo(pendingRef)}>Pending Requests</Button>
            <Button color="inherit" size="small" sx={{ color: 'rgba(21, 20, 20, 0.95)', fontWeight: 600, textTransform: 'none' }} onClick={() => scrollTo(budgetSectionRef)}>Set Budget & Overview</Button>
            <Button color="inherit" size="small" sx={{ color: 'rgba(15, 13, 13, 0.95)', fontWeight: 600, textTransform: 'none' }} onClick={goToOverviewSection}>Live Budget Overview</Button>
            <Button color="inherit" size="small" sx={{ color: 'rgba(20, 18, 18, 0.95)', fontWeight: 600, textTransform: 'none' }} onClick={goToHistorySection}>Budget History</Button>
            <Button color="inherit" size="small" sx={{ color: 'rgba(14, 13, 13, 0.95)', fontWeight: 600, textTransform: 'none' }} onClick={() => scrollTo(processedRef)}>Processed History</Button>

          </Box>


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
            <Paper sx={{ p: 2, mb: 3 }} ref={pendingRef}>
              <Typography variant="h6" fontWeight={700} mb={1}>Pending Expense Requests</Typography>
              <PendingRequests />
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }} ref={budgetSectionRef}>
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
                  {/* Anchor inside the card to jump directly to the overview table */}
                  <Box ref={budgetOverviewAnchorRef}>
                    <BudgetOverview
                      month={month}
                      year={year}
                      refreshSignal={refreshSignal}
                      onNavigateToHistory={() => setShowHistory(true)}
                      roles={['Manager', 'Admin']}
                    />
                  </Box>
                </>
              ) : (
                <BudgetHistory month={month} year={year} onBack={() => setShowHistory(false)} />
              )}
            </Paper>

            <Paper sx={{ p: 2 }} ref={processedRef}>
              <Typography variant="h6" fontWeight={700} mb={1}>Processed Expense History</Typography>
              <ProcessedHistory />
            </Paper>

            {/* Charts */}
            <Paper sx={{ p: 2, mt: 3, mb: 3 }} ref={chartsBudgetRef}>
              <Typography variant="h6" fontWeight={700} mb={1}>Charts — Budget vs Actual</Typography>
              <BudgetVsExpenses month={month} year={year} />
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }} ref={chartsPendingRef}>
              <Typography variant="h6" fontWeight={700} mb={1}>Charts — Pending by Category</Typography>
              <PendingByCategory />
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