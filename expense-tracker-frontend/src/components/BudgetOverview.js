// src/components/BudgetOverview.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Paper, Typography, Alert, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';

function RoleModal({ title, roles = ['Manager', 'Admin'], onCancel, onConfirm }) {
  const [selected, setSelected] = useState(roles[0] || '');
  const confirm = () => { if (!selected) return; onConfirm(selected); };
  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="role-select">Role</InputLabel>
          <Select labelId="role-select" label="Role" value={selected} onChange={(e) => setSelected(e.target.value)} required>
            {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">Cancel</Button>
        <Button onClick={confirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function BudgetOverview({ month, year, onNavigateToHistory, refreshSignal = 0, roles = ['Manager', 'Admin'] }) {
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null); // {type:'one'|'month', categoryId?, categoryName?}
  const token = localStorage.getItem('token') || '';

  useEffect(() => { fetchOverview(); /* eslint-disable-next-line */ }, [month, year, refreshSignal]);

  const fetchOverview = async () => {
    setLoading(true); setToast('');
    try {
      const res = await axios.get(`/api/budget/overview?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverview(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('GET /api/budget/overview failed:', err?.response || err);
      setToast(err?.response?.data?.message || 'Failed to load overview.');
    } finally { setLoading(false); }
  };

  const clearOne = (categoryId, categoryName) => setModal({ type: 'one', categoryId, categoryName });
  const clearMonth = () => setModal({ type: 'month' });

  const handleConfirm = async (selectedRole) => {
    setToast('');
    try {
      if (modal?.type === 'one') {
        // EXACT shape: ClearOneRequest (CategoryId, Month, Year, SetByRole)
        const payload = { CategoryId: modal.categoryId, Month: month, Year: year, SetByRole: selectedRole };
        await axios.post('/api/budget/clear-one', payload, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        setToast(`Cleared budget for ${modal.categoryName}.`);
      } else {
        // EXACT shape: ClearMonthRequest (Month, Year, SetByRole)
        const payload = { Month: month, Year: year, SetByRole: selectedRole };
        await axios.post('/api/budget/clear-month', payload, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        setToast(`Cleared budgets for ${month}/${year}.`);
      }
      setModal(null);
      fetchOverview();
    } catch (err) {
      console.error('Budget clear failed:', err?.response || err);
      setToast(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' ? err.response.data : 'Failed to clear budget.')
      );
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700}>Live Budget Overview — {month}/{year}</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => onNavigateToHistory?.()}>View Budget History</Button>
          <Button onClick={clearMonth}>Clear All (Month)</Button>
        </Stack>
      </Stack>

      {toast && <Alert severity={toast.startsWith('Failed') ? 'error' : 'success'} sx={{ mb: 2 }}>{toast}</Alert>}

      {loading ? (
        <Typography>Loading…</Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Initial Budget (₹)</TableCell>
                <TableCell>Remaining Budget (₹)</TableCell>
                <TableCell>Expenses Deducted (₹)</TableCell>
                <TableCell>Usage (%)</TableCell>
                <TableCell>Set By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overview.length > 0 ? (
                overview.map(item => (
                  <TableRow key={item.categoryId}>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell>₹{item.initialMonthlyBudget}</TableCell>
                    <TableCell>₹{item.remainingBudget}</TableCell>
                    <TableCell>₹{item.expensesDeducted}</TableCell>
                    <TableCell>{item.budgetUsagePercent}%</TableCell>
                    <TableCell>{item.budgetSetBy}</TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" onClick={() => clearOne(item.categoryId, item.categoryName)}>Clear</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={7}>No budgets found for {month}/{year}.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      {modal && (
        <RoleModal
          title={modal.type === 'one' ? `Clear budget: ${modal.categoryName}` : 'Clear all budgets for this month?'}
          roles={roles}
          onCancel={() => setModal(null)}
          onConfirm={handleConfirm}
        />
      )}
    </Paper>
  );
}