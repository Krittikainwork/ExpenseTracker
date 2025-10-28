import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css'; 
import '../styles/manager-theme.css';// <-- ensure this theme file is added as shared earlier

const ProcessedHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setToast('');
    try {
      const res = await axios.get('/api/expenses/processed'); // unchanged endpoint
      const list = Array.isArray(res.data) ? res.data : [];
      setHistory(list);
    } catch (err) {
      console.error('Error fetching processed history:', err);
      setToast('Failed to load processed history. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (v) => {
    if (v === null || v === undefined || v === '') return '₹0.00';
    const num = Number(v);
    if (Number.isNaN(num)) return `₹${v}`;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      // If ISO string, prefer dd/MM/yyyy
      const dateOnly = String(d).includes('T') ? String(d).split('T')[0] : String(d);
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const [y, m, dd] = parts;
        return `${dd}/${m}/${y}`;
      }
      // Fallback to locale
      return new Date(d).toLocaleDateString();
    } catch {
      return new Date(d).toLocaleDateString();
    }
  };

  const statusBadgeClass = (s) => {
    const val = (s || '').toLowerCase();
    if (val === 'approved') return 'badge badge--ok';
    if (val === 'pending') return 'badge badge--warn';
    return 'badge badge--danger'; // rejected or anything else
  };

  return (
    <div>
      {/* small header bar for context */}
      <div className="toolbar mb-8">
        <div className="muted">Processed Expense History</div>
        <div style={{ marginLeft: 'auto' }} />
      </div>

      {toast && <div className="mb-8" style={{ color: '#d33' }}>{toast}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <table className="data-table data-table--striped data-table--hover">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Title</th>
              <th className="t-right">Amount (₹)</th>
              <th>Category</th>
              <th>Date Submitted</th>
              <th className="t-center">Status</th>
              <th>Manager</th>
              <th>Manager Comment</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((item) => (
                <tr key={item.expenseId}>
                  <td>{item.employeeName ?? '—'}</td>
                  <td>{item.employeeID ?? item.employeeId ?? '—'}</td>
                  <td>{item.title ?? '—'}</td>
                  <td className="t-right">{formatAmount(item.amount)}</td>
                  <td>{item.category ?? item.categoryName ?? 'Unknown'}</td>
                  <td>{formatDate(item.dateSubmitted)}</td>
                  <td className="t-center">
                    <span className={statusBadgeClass(item.status)}>{item.status ?? '—'}</span>
                  </td>
                  <td>{item.manager ?? item.managerName ?? '—'}</td>
                  <td>{item.managerComment ? item.managerComment : '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="t-center" style={{ padding: 12, color: '#888' }}>
                  No processed expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProcessedHistory;