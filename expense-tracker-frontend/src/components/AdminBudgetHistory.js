import '../styles/manager-theme.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css';

const AdminBudgetHistory = ({ month, year }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [visible, setVisible] = useState({});
  const PAGE = 5;

  useEffect(() => { if (!month || !year) return; fetchHistory(); /* eslint-disable-next-line */ }, [month, year]);

  const fetchHistory = async () => {
    setLoading(true); setToast('');
    try {
      const res = await axios.get('/api/budget/history-detail', { params: { month, year } });
      const data = Array.isArray(res.data) ? res.data : [];
      setHistory(data);
      const initial = {};
      data.forEach(cat => { initial[cat.categoryId] = PAGE; });
      setVisible(initial);
    } catch (err) {
      console.error('Error fetching admin budget history:', err);
      setToast('Failed to load budget history. Try again.');
    } finally { setLoading(false); }
  };

  const seeMore = (categoryId, total) => {
    setVisible(v => ({ ...v, [categoryId]: Math.min((v[categoryId] || PAGE) + PAGE, total) }));
  };

  return (
    <div>
      {toast && <div className="mb-8" style={{ color: '#0a7' }}>{toast}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : history.length === 0 ? (
        <div>No history found for {month}/{year}.</div>
      ) : (
        history.map((cat) => {
          const total = (cat.history ?? []).length;
          const count = visible[cat.categoryId] ?? PAGE;
          const rows = (cat.history ?? []).slice(0, count);
          return (
            <div key={cat.categoryId} className="mb-12">
              <div className="muted mb-6">
                {cat.categoryName}
                <br />
                Initial: ₹{cat.initialMonthlyBudget ?? 0} &nbsp;&nbsp; Remaining: ₹{cat.remainingBudget ?? 0} &nbsp;&nbsp;
                Expenses Deducted: ₹{cat.expensesDeducted ?? 0}
              </div>
              <table className="data-table data-table--striped data-table--hover">
                <thead>
                  <tr>
                    <th>Input Amount (₹)</th>
                    <th>Cumulative Budget (₹)</th>
                    <th>Date</th>
                    <th>Action Type</th>
                    <th>Set By</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((h, idx) => (
                    <tr key={idx}>
                      <td>{h.budgetSet}</td>
                      <td>{h.budgetAmountBecomes}</td>
                      <td>{h.date}</td>
                      <td>{h.operation}</td>
                      <td>{h.setBy}</td>
                    </tr>
                  ))}
                  {total === 0 && (
                    <tr>
                      <td colSpan={5} className="t-center" style={{ color: '#888', padding: 12 }}>
                        No entries for this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {count < total && (
                <div className="t-center" style={{ marginTop: 8 }}>
                  <button className="btn-pill" onClick={() => seeMore(cat.categoryId, total)}>See more</button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default AdminBudgetHistory;