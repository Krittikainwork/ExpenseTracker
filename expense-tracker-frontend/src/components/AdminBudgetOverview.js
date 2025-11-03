import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Paper, Typography, Alert, Box, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Stack, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';

function ConfirmRoleDialog({ open, title, roles = ['Admin'], onClose, onConfirm }) {
  const [selected, setSelected] = useState(roles[0] || '');
  const confirm = () => { if (!selected) return; onConfirm(selected); };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="role-select">Role</InputLabel>
          <Select
            labelId="role-select" label="Role"
            value={selected} onChange={(e) => setSelected(e.target.value)} required
          >
            {roles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={confirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminBudgetOverview({
  month, year, onNavigateToHistory, refreshSignal = 0, roles = ['Admin']
}) {
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (!month || !year) return;
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, refreshSignal]);

  const fetchOverview = async () => {
    setLoading(true);
    setToast('');
    try {
      const res = await axios.get(`/api/budget/overview?month=${month}&year=${year}`);
      setOverview(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching budget overview:', err);
      setToast('Failed to load overview. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearOne = (categoryId, categoryName) => {
    setModal({ type: 'one', categoryId, categoryName });
  };

  const clearMonth = () => {
    setModal({ type: 'month' });
  };

  const handleConfirm = async (selectedRole) => {
    const setByRole = selectedRole;
    try {
      if (modal?.type === 'one') {
        await axios.post('/api/budget/clear-one', { categoryId: modal.categoryId, month, year, setByRole });
        setToast(`Cleared budget for ${modal.categoryName}.`);
      } else {
        await axios.post('/api/budget/clear-month', { month, year, setByRole });
        setToast(`Cleared budgets for ${month}/${year}.`);
      }
      setModal(null);
      fetchOverview();
    } catch (err) {
      console.error('Error clearing budget:', err);
      setToast('Failed to clear budget. Please try again.');
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
                overview.map((item) => (
                  <TableRow key={item.categoryId}>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell>₹{item.initialMonthlyBudget}</TableCell>
                    <TableCell>₹{item.remainingBudget}</TableCell>
                    <TableCell>₹{item.expensesDeducted}</TableCell>
                    <TableCell>{item.budgetUsagePercent}%</TableCell>
                    <TableCell>{item.budgetSetBy}</TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small"
                        onClick={() => clearOne(item.categoryId, item.categoryName)}
                      >
                        Clear
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7}>No budgets found for {month}/{year}.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <ConfirmRoleDialog
        open={!!modal}
        title={modal?.type === 'one' ? `Clear budget: ${modal?.categoryName}` : 'Clear all budgets for this month?'}
        roles={roles}
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
      />
    </Paper>
  );
}