// src/components/BudgetOverview.js
import '../styles/manager-theme.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css';

const BudgetOverview = ({ month, year, onNavigateToHistory, refreshSignal = 0 }) => {
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
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

  const clearOne = async (categoryId, categoryName) => {
    const ok = window.confirm(`Clear budget for "${categoryName}"?\nThis sets Initial, Remaining, and derived Expenses to 0 for ${month}/${year}.`);
    if (!ok) return;
    try {
      await axios.post('/api/budget/clear-one', { categoryId, month, year });
      setToast(`Cleared budget for ${categoryName}.`);
      fetchOverview();
    } catch (err) {
      console.error('Error clearing category budget:', err);
      setToast('Failed to clear budget. Please try again.');
    }
  };

  const clearMonth = async () => {
    const ok = window.confirm(`Clear ALL category budgets for ${month}/${year}?\nThis sets Initial, Remaining, and derived Expenses to 0.`);
    if (!ok) return;
    try {
      await axios.post('/api/budget/clear-month', { month, year });
      setToast(`Cleared budgets for ${month}/${year}.`);
      fetchOverview();
    } catch (err) {
      console.error('Error clearing month budgets:', err);
      setToast('Failed to clear month budgets. Please try again.');
    }
  };

  const handleViewHistory = () => {
    if (onNavigateToHistory) onNavigateToHistory(month, year);
    else window.location.assign(`/budget/history?month=${month}&year=${year}`);
  };

  return (
    <div>
      <div className="toolbar mb-8">
        <div className="muted">Live Budget Overview — {month}/{year}</div>
        <div style={{ marginLeft: 'auto' }} className="toolbar">
          <button onClick={clearMonth}>Clear All (Month)</button>
          <button onClick={handleViewHistory}>View Budget History</button>
        </div>
      </div>

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
              <th className="t-center">Actions</th>
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
                  <td className="t-center">
                    <button onClick={() => clearOne(item.categoryId, item.categoryName)}>Clear</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="t-center" style={{ color: '#888', padding: 12 }}>
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

export default BudgetOverview;