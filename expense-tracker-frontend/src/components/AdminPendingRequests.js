// src/components/AdminPendingRequests.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Paper, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function AdminPendingRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/expenses/pending');
      const data = Array.isArray(res.data) ? res.data : [];
      setRows(data);
    } catch {
      setRows([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { field: 'employeeName', headerName: 'Employee Name', flex: 1, minWidth: 160 },
    { field: 'employeeID', headerName: 'Employee ID', width: 130 },
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
    { field: 'amount', headerName: 'Amount (₹)', width: 150,
      renderCell: (p) => `₹${Number(p?.row?.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    { field: 'category', headerName: 'Category', width: 160 },
    // ❗ Bind to expenseDate (BE patch adds it)
    { field: 'expenseDate', headerName: 'Expense Date', width: 160,
      renderCell: (p) => {
        const v = p?.row?.expenseDate;
        return v ? dayjs(v).format('DD/MM/YYYY') : '—';
      }
    },
  ];

  return (
    <Paper sx={{ p: 0 }}>
      <Box sx={{ height: 520, overflowX: 'auto' }}>
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