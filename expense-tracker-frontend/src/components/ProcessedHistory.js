// src/components/ProcessedHistory.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css';
import '../styles/manager-theme.css';

const PAGE = 10;

const ProcessedHistory = () => {
  const [history, setHistory] = useState([]);
  const [visible, setVisible] = useState(PAGE);
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
      // Newest first
      const sorted = [...list].sort((a, b) => {
        const da = a?.dateSubmitted ? new Date(a.dateSubmitted).getTime() : 0;
        const db = b?.dateSubmitted ? new Date(b.dateSubmitted).getTime() : 0;
        if (db !== da) return db - da;
        return (b?.expenseId ?? 0) - (a?.expenseId ?? 0);
      });
      setHistory(sorted);
      setVisible(PAGE);
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
      const dateOnly = String(d).includes('T') ? String(d).split('T')[0] : String(d);
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const [y, m, dd] = parts;
        return `${dd}/${m}/${y}`;
      }
      return new Date(d).toLocaleDateString();
    } catch {
      return new Date(d).toLocaleDateString();
    }
  };

  const showMore = () => setVisible((v) => Math.min(v + PAGE, history.length));

  return (
    <div>
      {/* (Title is provided by the page card; keep table-only here) */}

      {toast && <div className="mb-8" style={{ color: '#0a7' }}>{toast}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <table className="data-table data-table--striped data-table--hover">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Title</th>
                <th>Amount (₹)</th>
                <th>Category</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th>Manager</th>
                <th>Manager Comment</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.slice(0, visible).map((item) => (
                  <tr key={item.expenseId}>
                    <td>{item.employeeName ?? '—'}</td>
                    <td>{item.employeeID ?? item.employeeId ?? '—'}</td>
                    <td>{item.title ?? '—'}</td>
                    <td>{formatAmount(item.amount)}</td>
                    <td>{item.category ?? item.categoryName ?? 'Unknown'}</td>
                    <td>{formatDate(item.dateSubmitted)}</td>
                    <td>{item.status ?? '—'}</td>
                    <td>{item.manager ?? item.managerName ?? '—'}</td>
                    <td>{item.managerComment ? item.managerComment : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="t-center" style={{ color: '#888', padding: 12 }}>
                    No processed expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {visible < history.length && (
            <div className="t-center" style={{ marginTop: 8 }}>
              <button className="btn-pill" onClick={showMore}>See more</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProcessedHistory;