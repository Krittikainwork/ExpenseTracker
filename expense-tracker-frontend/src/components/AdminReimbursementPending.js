
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Paper, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';


// simple helper to pick a color for status strings
const statusColor = (s) => {
  const st = String(s ?? '').toLowerCase();
  if (st === 'approved' || st === 'paid' || st === 'reimbursed' || st === 'completed') return '#2e7d32'; // green
  if (st === 'pending') return '#f57c00'; // orange
  if (st === 'rejected' || st === 'denied') return '#d32f2f'; // red
  return '#616161'; // neutral grey
};

function MarkPaidDialog({ open, onClose, onSave, expectedAmount }) {
  const [ref, setRef] = useState('');
  const [amt, setAmt] = useState('');
  useEffect(() => { if (!open) { setRef(''); setAmt(''); } }, [open]);

  // Normalize amounts to 2 decimal places for exact comparison
  const parseTwo = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return NaN;
    return Number(n.toFixed(2));
  };
  const entered = parseTwo(amt);
  const expected = parseTwo(expectedAmount);
  const amountMatches = !Number.isNaN(entered) && !Number.isNaN(expected) && entered === expected;

  const showAmountError = amt !== '' && !Number.isNaN(parseFloat(amt)) && !amountMatches;

  const canConfirm = ref.trim().length > 0 && amountMatches;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Mark as Reimbursed</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Transaction ID (UTR)" value={ref} onChange={(e) => setRef(e.target.value)} fullWidth />
          <TextField
            label={`Amount (must equal ₹${Number(expectedAmount ?? 0).toFixed(2)})`}
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            type="number"
            inputProps={{ min: 0.01, step: 0.01 }}
            fullWidth
            error={showAmountError}
            helperText={showAmountError ? `Amount must be exactly ₹${Number(expectedAmount ?? 0).toFixed(2)}` : ''}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button disabled={!canConfirm} onClick={() => onSave({ reference: ref.trim(), amount: Number(entered) })}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}



export default function AdminReimbursementPending({ month, year }) {

  const PAGE = 10;
  const [processed, setProcessed] = useState([]);
  const [map, setMap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // {expenseId}


  const load = async () => {
    setLoading(true);
    try {
      const res1 = await axios.get('/api/expenses/processed');
      const list = Array.isArray(res1.data) ? res1.data : [];
      const res2 = await axios.get('/api/reimbursements/map', { params: { month, year } });
      const m = Array.isArray(res2.data) ? res2.data : [];
      setProcessed(list); setMap(m);
    } catch { setProcessed([]); setMap([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month, year]);

 
  const mapById = useMemo(() => {
    const d = {}; map.forEach((x) => { d[x.expenseId] = x; }); return d;
  }, [map]);

  const pendingRows = useMemo(() => {
    return processed.filter((e) => {
      const approved = String(e?.status ?? '').toLowerCase() === 'approved';
      const reimb = !!mapById[e?.expenseId];
      return approved && !reimb;
    });
  }, [processed, mapById]);

  const markPaid = async (expenseId, payload) => {
    try { await axios.put(`/api/reimbursements/mark-paid/${expenseId}`, payload); setModal(null); load(); }
    catch {}
  };

 

  // find selected expense to pass expected amount into dialog
  const selectedExpense = modal ? pendingRows.find(p => p.expenseId === modal.expenseId) : null;

  const columns = [
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 160 },
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
    {
      field: 'action', headerName: 'Action', width: 160, sortable: false,
      renderCell: (params) =>
        params?.row ? (
          <Button size="small" onClick={() => setModal({ expenseId: params.row.expenseId })}>Mark Paid</Button>
        ) : null,
    },
  ];

  return (
    <Paper sx={{ p: 0 }}>
      <Box sx={{ height: 520, overflowX: 'auto' }}>
        <DataGrid
          rows={pendingRows}
          columns={columns}
          getRowId={(r) => r.expenseId}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: PAGE } } }}
          disableColumnMenu
        />
      </Box>
      <MarkPaidDialog
        open={!!modal}
        onClose={() => setModal(null)}
        expectedAmount={selectedExpense?.amount}
        onSave={(payload) => modal && markPaid(modal.expenseId, payload)}
      />
    </Paper>
  );
}
