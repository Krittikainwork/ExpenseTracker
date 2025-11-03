// src/components/Notifications.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  Paper, Stack, Typography, Button, List, ListItem, ListItemText, Alert
} from '@mui/material';

const fmt = (d) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '');

export default function Notifications({ onCount, onCountChange }) {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState('');

  const emitCount = (n) => {
    if (typeof onCount === 'function') onCount(n);
    if (typeof onCountChange === 'function') onCountChange(n); // compat with older prop name
  };

  const load = async () => {
    try {
      const res = await axios.get('/api/notifications');
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
      emitCount(list.length);
    } catch (err) {
      console.error('GET /api/notifications failed:', err);
      setToast('Failed to load notifications.');
    }
  };

  const clearAll = async () => {
    try {
      await axios.post('/api/notifications/clear');
      setItems([]);
      emitCount(0);
      setToast('Notifications cleared.');
    } catch (err) {
      console.error('POST /api/notifications/clear failed:', err);
      setToast('Failed to clear notifications.');
    }
  };

  useEffect(() => {
    load();
    const handler = () => clearAll();
    window.addEventListener('manager-clear-notifications', handler);
    return () => window.removeEventListener('manager-clear-notifications', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Notifications</Typography>
        <Button variant="outlined" size="small" onClick={clearAll}>Clear All</Button>
      </Stack>

      {toast && <Alert sx={{ mb: 1 }} severity={toast.startsWith('Failed') ? 'error' : 'success'}>{toast}</Alert>}

      {items.length === 0 ? (
        <Typography color="text.secondary">No new notifications</Typography>
      ) : (
        <List dense sx={{ overflowY: 'auto' }}>
          {items.map((n) => {
            const msg = String(n.message || '').toLowerCase();
            const severity =
              msg.includes('rejected') ? 'error' :
              msg.includes('approved') ? 'success' : 'info';
            return (
              <ListItem key={n.notificationId} sx={{ borderBottom: '1px solid #eee' }}>
                <ListItemText
                  primary={n.message}
                  secondary={fmt(n.createdAt)}
                  primaryTypographyProps={{ sx: { color: severity === 'error' ? 'error.main' : severity === 'success' ? 'success.main' : 'text.primary', fontWeight: 500 } }}
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
}
