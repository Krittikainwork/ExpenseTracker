import '../styles/manager-theme.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css';

const AdminBudgetHistory = ({ month, year }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!month || !year) return;
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const fetchHistory = async () => {
    setLoading(true);
    setToast('');
    try {
      const res = await axios.get('/api/budget/history-detail', { params: { month, year } });
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching admin budget history:', err);
      setToast('Failed to load budget history. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      {toast && <div className="mb-8" style={{ color: '#d33' }}>{toast}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : history.length === 0 ? (
        <div style={{ color: '#888' }}>No history found for {month}/{year}.</div>
      ) : (
        history.map((cat) => (
          <div key={cat.categoryId} className="mb-16">
            <div className="mb-8" style={{ fontWeight: 600 }}>{cat.categoryName}</div>

            <div className="muted mb-8">
              Initial: ₹{cat.initialMonthlyBudget ?? 0} &nbsp;|&nbsp; Remaining: ₹{cat.remainingBudget ?? 0}
              &nbsp;|&nbsp; Expenses Deducted: ₹{cat.expensesDeducted ?? 0}
            </div>

            <table className="data-table data-table--striped data-table--hover">
              <thead>
                <tr>
                  <th className="t-right">Input Amount (₹)</th>
                  <th className="t-right">Cumulative Budget (₹)</th>
                  <th>Date</th>
                  <th>Action Type</th>
                </tr>
              </thead>
              <tbody>
                {(cat.history ?? []).map((h, idx) => (
                  <tr key={`${cat.categoryId}-${idx}`}>
                    <td className="t-right">{h.budgetSet}</td>
                    <td className="t-right">{h.budgetAmountBecomes}</td>
                    <td>{h.date}</td>
                    <td>{h.operation}</td>
                  </tr>
                ))}
                {(cat.history ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 8, color: '#888' }}>
                      No entries for this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminBudgetHistory;