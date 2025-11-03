// src/components/BudgetForm.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Stack, TextField, Select, MenuItem, Button, Alert, Typography,
  FormControl, InputLabel
} from '@mui/material';

export default function BudgetForm({ month, year, onBudgetSet, roles = ['Manager'] }) {
  const [categoryId, setCategoryId] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [toast, setToast] = useState('');

  // Categories for dropdown
  const [categories, setCategories] = useState([]);
  const [catsError, setCatsError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setCatsError('');
        const res = await axios.get('/api/categories');
        if (!alive) return;
        const items = Array.isArray(res.data) ? res.data : [];
        setCategories(items);
      } catch (err) {
        setCatsError('Failed to load categories.');
        console.error('GET /api/categories failed:', err?.response || err);
      }
    })();
    return () => { alive = false; };
  }, []);

  const submitBudget = async () => {
    setToast('');
    try {
      // EXACT shape: SetBudgetRequest (CategoryId, InitialAmount, Month, Year, SetByRole)
      const payload = {
        CategoryId: Number(categoryId),
        InitialAmount: Number(initialAmount),
        Month: month,
        Year: year,
        SetByRole: roles[0],
      };
      await axios.post('/api/budget/set', payload, {
        headers: { 'Content-Type': 'application/json' }, // Authorization is already on axios.defaults
      });
      setToast('Budget set.');
      onBudgetSet?.();
      setCategoryId('');
      setInitialAmount('');
    } catch (err) {
      console.error('POST /api/budget/set failed:', err?.response || err);
      setToast(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' ? err.response.data : 'Failed to set budget.')
      );
    }
  };

  const canSubmit = categoryId && initialAmount !== '';

  return (
    <Stack spacing={2}>
      {toast && <Alert severity={toast.startsWith('Failed') ? 'error' : 'success'}>{toast}</Alert>}
      <Typography variant="subtitle2">Month {month} / Year {year}</Typography>

      {/* Category dropdown (replaces "Category ID" textbox) */}
      <FormControl fullWidth>
        <InputLabel id="bf-category-label">Category</InputLabel>
        <Select
          labelId="bf-category-label"
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {catsError && <Alert severity="error">{catsError}</Alert>}

      <TextField
        label="Initial Amount"
        type="number"
        value={initialAmount}
        onChange={(e) => setInitialAmount(e.target.value)}
        fullWidth
      />

      <Stack direction="row" spacing={1} alignItems="center">
        <Select value={roles[0]} disabled size="small">
          {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </Select>
        <Button onClick={submitBudget} disabled={!canSubmit}>Set Budget</Button>
      </Stack>
    </Stack>
  );
}