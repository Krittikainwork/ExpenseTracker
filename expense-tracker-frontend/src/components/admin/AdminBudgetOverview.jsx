// src/components/admin/AdminBudgetOverview.jsx
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminBudgetOverview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  // ENDPOINT: GET /api/budgets/overview  -> { total, spent, remaining, lastTopUp, updatedAt, managerName }
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets/overview');
      setOverview(res.data || null);
    } catch (e) {
      console.error('Budget overview load error:', e);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const fmtAmt = (v) =>
    typeof v === 'number'
      ? `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      : v ?? '—';

  return (
    <div>
      {loading && !overview ? (
        <div>Loading…</div>
      ) : overview ? (
        <div className="cards">
          <div className="card">
            <div className="card-title">Total Budget</div>
            <div className="card-value">{fmtAmt(overview.total)}</div>
          </div>
          <div className="card">
            <div className="card-title">Spent</div>
            <div className="card-value">{fmtAmt(overview.spent)}</div>
          </div>
          <div className="card">
            <div className="card-title">Remaining</div>
            <div className="card-value">{fmtAmt(overview.remaining)}</div>
          </div>
          <div className="card">
            <div className="card-title">Last Top-up</div>
            <div className="card-value">
              {fmtAmt(overview.lastTopUp?.amount)}{' '}
              <span className="muted">
                ({overview.lastTopUp?.date
                  ? new Date(overview.lastTopUp.date).toLocaleString('en-IN')
                  : '—'}
                )
              </span>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Updated By</div>
            <div className="card-value">{overview.managerName ?? '—'}</div>
          </div>
          <div className="card">
            <div className="card-title">Updated At</div>
            <div className="card-value">
              {overview.updatedAt
                ? new Date(overview.updatedAt).toLocaleString('en-IN')
                : '—'}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">No budget data available.</div>
      )}
    </div>
  );
};

export default AdminBudgetOverview;