import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Box, Paper, TextField, Button, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function AdminProcessedHistory() {
  const [rows, setRows] = useState([]);
  const [reimbList, setReimbList] = useState([]);
  const [comment, setComment] = useState('');
  const [targetId, setTargetId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/expenses/processed');
      const data = Array.isArray(res.data) ? res.data : [];
      setRows(data);
      const mres = await axios.get('/api/reimbursements/map-all');
      setReimbList(Array.isArray(mres.data) ? mres.data : []);
    } catch { setRows([]); setReimbList([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const reimbById = useMemo(() => {
    const d = {}; reimbList.forEach((x) => { d[x.expenseId] = x; }); return d;
  }, [reimbList]);

  const postComment = async () => {
    const text = (comment ?? '').trim();
    if (!text || !targetId) return;
    try {
      await axios.put(`/api/expenses/comment/${targetId}`, { comment: text });
      setComment(''); setTargetId(null); load();
    } catch {}
  };

  const statusColor = (s) => {
    const v = String(s || '').toLowerCase();
    if (v === 'approved') return '#2e7d32';      // green
    if (v === 'rejected') return '#d32f2f';      // red
    if (v === 'pending')  return '#ed6c02';      // orange
    return 'inherit';
  };

  const columns = [
    { field: 'employeeName', headerName: 'Employee Name', flex: 1, minWidth: 160 },
    { field: 'employeeID', headerName: 'Employee ID', width: 130 },
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
    {
      field: 'amount', headerName: 'Amount (₹)', width: 150,
      renderCell: (p) => {
        const v = p?.row?.amount;
        return `₹${Number(v ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    },
    { field: 'category', headerName: 'Category', width: 160 },
    { field: 'dateSubmitted', headerName: 'Date Submitted', width: 160,
      renderCell: (p) => {
        const v = p?.row?.dateSubmitted;
        return v ? dayjs(v).format('DD/MM/YYYY') : '—';
      }
    },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: (p) => {
        const s = p?.row?.status ?? '—';
        return <span style={{ fontWeight: 600, color: statusColor(s) }}>{s}</span>;
      }
    },
    { field: 'manager', headerName: 'Manager', width: 160 },
    { field: 'managerComment', headerName: 'Manager Comment', flex: 1, minWidth: 180 },
    {
      field: 'reimb', headerName: 'Reimbursement Status', width: 180, sortable: false,
      renderCell: (params) => {
        const e = params?.row; if (!e) return null;
        const m = reimbById[e.expenseId];
        if (m?.paidDateUtc) {
          return <span style={{ fontWeight: 600, color: '#2e7d32' }}>
            {`Paid (${dayjs(m.paidDateUtc).format('DD/MM/YYYY')})`}
          </span>;
        }
        if ((e.status || '').toLowerCase() === 'approved') {
          return <span style={{ fontWeight: 600, color: '#ed6c02' }}>Pending</span>;
        }
        return '—';
      },
    },
    { field: 'adminComment', headerName: 'Admin Comment', flex: 1, minWidth: 160 },
    {
      field: 'action', headerName: 'Action', width: 280, sortable: false,
      renderCell: (params) => {
        const id = params?.row?.expenseId;
        return (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
            <TextField
              size="small" placeholder="Add a comment"
              value={id === targetId ? comment : ''}
              onChange={(e) => { setTargetId(id); setComment(e.target.value); }}
              sx={{ flex: 1 }}
            />
            <Button size="small" onClick={postComment}>Post</Button>
          </Stack>
        );
      },
    },
  ];

  return (
    <Paper sx={{ p: 0 }}>
      <Box sx={{ height: 560, width: '100%', overflowX: 'auto' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.expenseId}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableColumnMenu
        />
      </Box>
    </Paper>
  );
}
