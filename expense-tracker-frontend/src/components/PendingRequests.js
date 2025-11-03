// src/components/PendingRequests.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Paper, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ApproveRejectModal from './ApproveRejectModal';

export default function PendingRequests() {
  const [rows, setRows] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionType, setActionType] = useState(null);
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
  const openModal = (expense, type) => { setSelectedExpense(expense); setActionType(type); };
  const closeModal = () => { setSelectedExpense(null); setActionType(null); load(); };

  const columns = [
    { field: 'employeeName', headerName: 'Employee Name', flex: 1, minWidth: 160 },
    { field: 'employeeID', headerName: 'Employee ID', width: 130 },
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
    { field: 'amount', headerName: 'Amount (₹)', width: 140,
      renderCell: (p) => `₹${Number(p?.row?.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    { field: 'category', headerName: 'Category', width: 160 },
    // ❗ Bind to expenseDate now (BE patch adds it)
    { field: 'expenseDate', headerName: 'Expense Date', width: 160,
      renderCell: (p) => {
        const v = p?.row?.expenseDate;
        return v ? dayjs(v).format('DD/MM/YYYY') : '—';
      }
    },
    {
      field: 'actions', headerName: 'Actions', width: 200, sortable: false,
      renderCell: (params) => {
        const row = params?.row; if (!row) return null;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box role="button" onClick={() => openModal(row, 'approve')}
              sx={{ px: 1.5, py: 0.5, bgcolor: '#e8f5e9', color: '#2e7d32', borderRadius: 1, cursor: 'pointer', fontWeight: 600 }}>
              Approve
            </Box>
            <Box role="button" onClick={() => openModal(row, 'reject')}
              sx={{ px: 1.5, py: 0.5, bgcolor: '#ffebee', color: '#d32f2f', borderRadius: 1, cursor: 'pointer', fontWeight: 600 }}>
              Reject
            </Box>
          </Box>
        );
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

      {selectedExpense && (
        <ApproveRejectModal expense={selectedExpense} actionType={actionType} onClose={closeModal} />
      )}
    </Paper>
  );
}