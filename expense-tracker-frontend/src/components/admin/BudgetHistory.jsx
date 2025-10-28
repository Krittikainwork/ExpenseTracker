// src/components/admin/BudgetHistory.jsx
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const BudgetHistory = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // ENDPOINT: GET /api/budgets/history -> [{ id, type: 'Set'|'TopUp', amount, managerName, notes, date }]
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets/history');
      const list = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      setRows(list || []);
    } catch (e) {
      console.error('Budget history error:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtAmt = (v) =>
    typeof v === 'number' ? `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : v ?? '—';

  const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString('en-IN') : '—';

  return (
    <div>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <table className="data-table data-table--striped data-table--hover">
          <thead>
            <tr>
              <th>Type</th>
              <th className="t-right">Amount (₹)</th>
              <th>Manager</th>
              <th>Notes</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.type}</td>
                  <td className="t-right">{fmtAmt(r.amount)}</td>
                  <td>{r.managerName ?? '—'}</td>
                  <td>{r.notes ?? '—'}</td>
                  <td>{fmtDateTime(r.date)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="t-center empty-state">
                  No history entries to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BudgetHistory;