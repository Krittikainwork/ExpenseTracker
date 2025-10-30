import '../styles/manager-theme.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css';

/**
 * Manager-look table, no toolbar here (page renders the toolbar).
 * Uses manager overview endpoint so the data shape matches manager UI.
 */
const AdminBudgetOverview = ({ month, year, refreshSignal = 0 }) => {
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!month || !year) return;
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, refreshSignal]);

  const fetchOverview = async () => {
    setLoading(true);
    setToast('');
    try {
      const res = await axios.get(`/api/budget/overview?month=${month}&year=${year}`);
      setOverview(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching budget overview:', err);
      setToast('Failed to load overview. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      {toast && <div className="mb-8" style={{ color: '#0a7' }}>{toast}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <table className="data-table data-table--striped data-table--hover">
          <thead>
            <tr>
              <th>Category</th>
              <th className="t-right">Initial Budget (₹)</th>
              <th className="t-right">Remaining Budget (₹)</th>
              <th className="t-right">Expenses Deducted (₹)</th>
              <th className="t-center">Usage (%)</th>
              <th>Set By</th>
            </tr>
          </thead>
          <tbody>
            {overview.length > 0 ? (
              overview.map((item) => (
                <tr key={item.categoryId}>
                  <td>{item.categoryName}</td>
                  <td className="t-right">₹{item.initialMonthlyBudget}</td>
                  <td className="t-right">₹{item.remainingBudget}</td>
                  <td className="t-right">₹{item.expensesDeducted}</td>
                  <td className="t-center">{item.budgetUsagePercent}%</td>
                  <td>{item.budgetSetBy}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="t-center" style={{ color: '#888', padding: 12 }}>
                  No budgets found for {month}/{year}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminBudgetOverview;