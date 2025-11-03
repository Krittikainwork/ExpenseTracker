// src/components/BudgetHistory.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Paper, Typography, Alert, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Stack
} from '@mui/material';

const PAGE = 5;

export default function BudgetHistory({ month, year, onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [visible, setVisible] = useState({}); // {categoryId: count}

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const fetchHistory = async () => {
    setLoading(true); setToast('');
    try {
      const res = await axios.get('/api/budget/history-detail', { params: { month, year } });
      const data = Array.isArray(res.data) ? res.data : [];
      setHistory(data);
      const initial = {};
      data.forEach(cat => { initial[cat.categoryId] = PAGE; });
      setVisible(initial);
    } catch (err) {
      console.error('Error fetching budget history:', err);
      setToast('Failed to load budget history. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const seeMore = (categoryId, total) => {
    setVisible(v => ({ ...v, [categoryId]: Math.min((v[categoryId] || PAGE) + PAGE, total) }));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Budget History Timeline — {month}/{year}
        </Typography>
        <Button variant="outlined" onClick={() => (onBack ? onBack() : window.history.back())}>
          ← Back to Overview
        </Button>
      </Stack>

      {toast && <Alert severity={toast.startsWith('Failed') ? 'error' : 'success'} sx={{ mb: 2 }}>{toast}</Alert>}

      {loading ? (
        <Typography>Loading…</Typography>
      ) : history.length === 0 ? (
        <Typography>No history found for {month}/{year}.</Typography>
      ) : (
        history.map((cat) => {
          const total = (cat.history ?? []).length;
          const count = visible[cat.categoryId] ?? PAGE;
          const rows = (cat.history ?? []).slice(0, count);

          return (
            <Paper key={cat.categoryId} sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>{cat.categoryName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Initial: ₹{cat.initialMonthlyBudget ?? 0} &nbsp;|&nbsp;
                  Remaining: ₹{cat.remainingBudget ?? 0} &nbsp;|&nbsp;
                  Expenses Deducted: ₹{cat.expensesDeducted ?? 0}
                </Typography>
              </Stack>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Input Amount (₹)</TableCell>
                    <TableCell>Cumulative Budget (₹)</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Action Type</TableCell>
                    <TableCell>Set By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((h, idx) => (
                    <TableRow key={idx}>
                      <TableCell>₹{h.budgetSet}</TableCell>
                      <TableCell>₹{h.budgetAmountBecomes}</TableCell>
                      <TableCell>{h.date}</TableCell>
                      <TableCell>{h.operation}</TableCell>
                      <TableCell>{h.setBy}</TableCell>
                    </TableRow>
                  ))}
                  {total === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: '#888' }}>
                        No entries for this category.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {count < total && (
                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Button variant="outlined" onClick={() => seeMore(cat.categoryId, total)}>See more</Button>
                </Box>
              )}
            </Paper>
          );
        })
      )}
    </Box>
  );
}
