// src/pages/EmployeeDashboard.js
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  AppBar, Toolbar, Typography, Container, Paper, Stack, Box,
  Button, TextField, MenuItem, Alert, IconButton, Badge
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { DataGrid } from '@mui/x-data-grid';
import Logout from '../components/Logout';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// NEW: charts imports
import EmployeeMonthlyTrend from '../components/charts/EmployeeMonthlyTrend';
import EmployeeCategoryBreakdown from '../components/charts/EmployeeCategoryBreakdown';
import EmployeeStatusDistribution from '../components/charts/EmployeeStatusDistribution';

// Submission form categories (unchanged)
const categories = [
  { id: 1, name: 'Travel' },
  { id: 2, name: 'Meals' },
  { id: 3, name: 'Supplies' },
  { id: 4, name: 'Lodging' },
  { id: 5, name: 'Software & Subscriptions' },
];

export default function EmployeeDashboard() {
  const [rows, setRows] = useState([]);
  const [reimbMap, setReimbMap] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [notifToast, setNotifToast] = useState('');
  const [form, setForm] = useState({ title: '', amount: '', categoryId: '', expenseDate: '' });
  const [pickedDate, setPickedDate] = useState(null);
 
  const token = localStorage.getItem('token');

  // NEW: Section refs for quick navigation
   const notifRef = useRef(null);
  const submitRef = useRef(null);
  const myRef = useRef(null);
  const insightsRef = useRef(null);

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // --- Load "My Expenses" ---
  const loadMy = async () => {
    try {
      const res = await axios.get('/api/expenses/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      const sorted = [...data].sort((a, b) => {
        const ad = a?.dateSubmitted ? Date.parse(a.dateSubmitted)
          : (a?.expenseDate ? Date.parse(a.expenseDate) : -Infinity);
        const bd = b?.dateSubmitted ? Date.parse(b.dateSubmitted)
          : (b?.expenseDate ? Date.parse(b.expenseDate) : -Infinity);
        if (bd !== ad) return bd - ad;
        return (b?.expenseId ?? 0) - (a?.expenseId ?? 0);
      });
      setRows(sorted);
    } catch (err) {
      console.error('GET /api/expenses/my failed', err);
      setRows([]);
    }
  };

  // --- Load reimbursement map ---
  const loadReimb = async () => {
    try {
      const res = await axios.get('/api/reimbursements/status/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = Array.isArray(res.data) ? res.data : [];
      const map = {};
      list.forEach((x) => { map[x.expenseId] = x; });
      setReimbMap(map);
    } catch (err) {
      console.error('GET /api/reimbursements/status/my failed:', err);
    }
  };

  // --- Load notifications ---
  const loadNotifs = async () => {
    try {
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('GET /api/notifications failed:', err);
      setNotifToast('Failed to load notifications.');
    }
  };

  // --- Clear all notifications ---
  const clearAllNotifications = async () => {
    try {
      await axios.post('/api/notifications/clear', null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setNotifToast('Notifications cleared.');
    } catch (err) {
      console.error('POST /api/notifications/clear failed:', err);
      setNotifToast('Failed to clear notifications.');
    }
  };

  useEffect(() => {
    loadMy();
    loadReimb();
    loadNotifs();
    const id = setInterval(loadNotifs, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Submit new expense ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.categoryId || !pickedDate) {
      alert('Please fill Title, Amount, Category, and Expense Date.');
      return;
    }
    const expenseDateUtcMidnight =
      `${dayjs(pickedDate).format('YYYY-MM-DD')}T00:00:00Z`;
    const payload = {
      title: form.title,
      amount: Number(form.amount),
      categoryId: Number(form.categoryId),
      expenseDate: expenseDateUtcMidnight,
    };
    try {
      await axios.post('/api/expenses/submit', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      alert('Expense submitted successfully');
      setForm({ title: '', amount: '', categoryId: '', expenseDate: '' });
      setPickedDate(null);
      loadMy();
      loadNotifs();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' ? err.response.data : '') ||
        'Failed to submit expense.';
      console.error('POST /api/expenses/submit failed:', err?.response || err);
      alert(msg);
    }
  };

  // --- Reimbursement cell ---
  const reimbCell = (row) => {
    const m = reimbMap[row.expenseId];
    if (m?.paidDateUtc) {
      const s = dayjs(m.paidDateUtc).format('DD/MM/YYYY');
      return <span style={{ color: '#2e7d32', fontWeight: 600 }}>Paid ({s})</span>;
    }
    if ((row.status || '').toLowerCase() === 'approved') {
      return <span style={{ color: '#ed6c02', fontWeight: 600 }}>Pending</span>;
    }
    return '—';
  };

  // --- DataGrid columns ---
  const columns = [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
    {
      field: 'amount', headerName: 'Amount (₹)', width: 140,
      renderCell: (p) =>
        `₹${Number(p?.row?.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    { field: 'categoryName', headerName: 'Category', width: 160 },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: (params) => {
        const status = params?.row?.status;
        const color = status === 'Approved' ? '#2e7d32' : status === 'Rejected' ? '#d32f2f' : '#6b7280';
        return <span style={{ color, fontWeight: 600 }}>{status ?? '—'}</span>;
      },
    },
    {
      field: 'expenseDate', headerName: 'Expense Date', width: 160,
      renderCell: (p) => {
        const v = p?.row?.expenseDate;
        return v ? dayjs(v).format('DD/MM/YYYY') : '—';
      }
    },
    { field: 'managerComment', headerName: 'Manager Comment', flex: 1, minWidth: 160 },
    {
      field: 'reimb', headerName: 'Reimbursement', width: 160,
      renderCell: (params) => (params?.row ? reimbCell(params.row) : null),
      sortable: false,
    },
  ];

  // --- Bell scroll to notifications ---
  const notifCount = notifications.length;
  const scrollToNotif = () => {
    notifRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    notifRef.current?.classList.add('flash-highlight');
    setTimeout(() => notifRef.current?.classList.remove('flash-highlight'), 1500);
  };

  return (
    <>
      {/* AppBar */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Welcome Employee</Typography>

          {/* NEW: quick nav buttons on the blue bar */}
      
          {/* NEW: quick nav buttons on the blue bar */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mx: 2 }}>
            <Button color="inherit" size="small" sx={{ color: 'rgba(31, 2, 2, 0.95)', fontWeight: 600, textTransform: 'none' }} onClick={() => scrollTo(submitRef)}>Submit</Button>
            <Button color="inherit" size="small" sx={{ color: 'rgba(22, 21, 21, 0.95)', fontWeight: 600, textTransform: 'none' }} onClick={() => scrollTo(myRef)}>My Expenses</Button>
            <Button color="inherit" size="small" sx={{ color: 'rgba(19, 17, 17, 0.95)', fontWeight: 600, textTransform: 'none' }} onClick={() => scrollTo(insightsRef)}>Insights</Button>

          </Box>


          <IconButton color="inherit" title="Notifications" onClick={scrollToNotif}>
            <Badge badgeContent={notifCount} color="error">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
          <Logout />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Submit Card */}
        <Paper sx={{ p: 2, mb: 3 }} ref={submitRef}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={700}>Submit New Expense</Typography>
            <Button onClick={handleSubmit} type="submit" form="submit-expense-form">Submit Expense</Button>
          </Stack>
          <Box component="form" id="submit-expense-form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
              <TextField
                label="Expense Title" name="title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required fullWidth
              />
              <TextField
                label="Amount" name="amount" type="number" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required fullWidth inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                select label="Category" name="categoryId" value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required fullWidth
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </TextField>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Expense Date" value={pickedDate}
                  onChange={(d) => setPickedDate(d)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </LocalizationProvider>
            </Stack>
          </Box>
        </Paper>

        {/* My Expenses */}
        <Paper sx={{ p: 2, mb: 3 }} ref={myRef}>
          <Typography variant="h6" fontWeight={700}>My Expenses</Typography>
          <Box sx={{ width: '100%', height: 520, overflowX: 'auto', mt: 1 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(r) => r.expenseId}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableColumnMenu
            />
          </Box>
        </Paper>

        {/* NEW: Employee Charts Section (stacked to avoid overlap) */}
        <Paper sx={{ p: 2, mb: 3 }} ref={insightsRef}>
          <Typography variant="h6" fontWeight={700} mb={1}>Insights</Typography>
          <Stack spacing={2}>
            <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
              <EmployeeMonthlyTrend />
            </Box>
            <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
              <EmployeeCategoryBreakdown />
            </Box>
            <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
              <EmployeeStatusDistribution />
            </Box>
          </Stack>
        </Paper>

        {/* Notifications */}
        <Paper sx={{ p: 2 }} ref={notifRef}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={700}>Notifications</Typography>
            <Button variant="outlined" size="small" onClick={clearAllNotifications}>Clear All</Button>
          </Stack>
          {notifToast && <Alert sx={{ mt: 1 }} severity={notifToast.startsWith('Failed') ? 'error' : 'success'}>{notifToast}</Alert>}
          {notifications.length === 0 ? (
            <Typography sx={{ mt: 1 }} color="text.secondary">No new notifications</Typography>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {notifications.map((n) => (
                <Box key={n.notificationId} sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                  <Typography sx={{ fontWeight: 500 }}>{n.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(n.createdAt).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Container>

      {/* flash highlight style */}
      <style>{`.flash-highlight { box-shadow: 0 0 0 3px rgba(91,141,239,.35); border-radius: 12px; }`}</style>
    </>
  );
}