// src/components/admin/ProcessedExpensesWithComments.jsx
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import AdminCommentModal from './AdminCommentModal';

const ProcessedExpensesWithComments = ({ month, year }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentTarget, setCommentTarget] = useState(null); // expense row

  // ENDPOINT: GET /api/expenses/processed?month=&year=
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses/processed', { params: { month, year } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      setRows(list || []);
    } catch (e) {
      console.error('Processed expenses load error:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!month || !year) return;
    load();
  }, [month, year]);

  const fmtAmt = (v) =>
    typeof v === 'number' ? `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : v ?? '—';

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

  const onCommentAdded = async () => {
    setCommentTarget(null);
    await load(); // refresh to show last commented time if backend returns it
  };

  return (
    <div>
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
              <th>Status</th>
              <th>Date Processed</th>
              <th className="t-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((r) => (
                <tr key={r.expenseId}>
                  <td>{r.employeeName ?? '—'}</td>
                  <td>{r.employeeID ?? r.employeeId ?? '—'}</td>
                  <td>{r.title ?? '—'}</td>
                  <td className="t-right">{fmtAmt(r.amount)}</td>
                  <td>{r.category ?? r.categoryName ?? 'Unknown'}</td>
                  <td>{r.status ?? '—'}</td>
                  <td>{fmtDate(r.dateProcessed ?? r.dateSubmitted)}</td>
                  <td className="t-center">
                    <button
                      className="btn btn--primary"
                      onClick={() => setCommentTarget(r)}
                      title="Add Comment"
                    >
                      Add Comment
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="t-center empty-state">
                  No processed expenses found for the selected month/year.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {commentTarget && (
        <AdminCommentModal
          expense={commentTarget}
          onClose={() => setCommentTarget(null)}
          onSubmitted={onCommentAdded}
        />
      )}
    </div>
  );
};

export default ProcessedExpensesWithComments;