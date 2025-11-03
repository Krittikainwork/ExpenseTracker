// src/components/ApproveRejectModal.js
import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Typography, Button
} from '@mui/material';

export default function ApproveRejectModal({ expense, actionType, onClose, onSuccess }) {
  const [managerName, setManagerName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const open = !!expense;
  const isApprove = actionType === 'approve';

  const handleSubmit = async () => {
    if (!expense) return;
    setLoading(true);
    const payload = {
      managerName,
      managerOfficialId: managerId,
      managerComment: comment,
    };
    try {
      const endpoint = isApprove
        ? `/api/expenses/approve/${expense.expenseId}`
        : `/api/expenses/reject/${expense.expenseId}`;
      await axios.put(endpoint, payload);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(`Error during ${actionType}:`, err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isApprove ? 'Approve Expense' : 'Reject Expense'}</DialogTitle>
      <DialogContent>
        {expense && (
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Title: {expense.title}</Typography>
            <Typography variant="subtitle2">Amount: ₹{expense.amount}</Typography>
            <Typography variant="subtitle2">Category: {expense.category}</Typography>
          </Stack>
        )}
        <Stack spacing={2}>
          <TextField label="Manager Name" value={managerName} onChange={(e) => setManagerName(e.target.value)} required fullWidth />
          <TextField label="Manager ID" value={managerId} onChange={(e) => setManagerId(e.target.value)} required fullWidth />
          <TextField label="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}