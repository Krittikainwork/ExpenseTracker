import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Paper, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function ProcessedHistory() {
  const PAGE = 10;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/expenses/processed');
      const data = Array.isArray(res.data) ? res.data : [];
      setRows(data);
    } catch (err) { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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
      field: 'amount', headerName: 'Amount (₹)', width: 140,
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
  ];

  return (
    <Paper sx={{ p: 0 }}>
      <Box sx={{ width: '100%', height: 520, overflowX: 'auto' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.expenseId}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: PAGE } } }}
          disableColumnMenu
        />
      </Box>
    </Paper>
  );
}
