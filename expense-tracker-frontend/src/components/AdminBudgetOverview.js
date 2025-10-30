import '../styles/manager-theme.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css';

const RoleModal = ({ title, roles = ['Admin'], onCancel, onConfirm }) => {
  const [selected, setSelected] = useState(roles[0] || '');
  const confirm = () => { if (!selected) return; onConfirm(selected); };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, minWidth: 320 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>{title}</div>
        <label>Role:</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} required>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={confirm} style={{ marginLeft: 'auto' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

const AdminBudgetOverview = ({ month, year, onNavigateToHistory, refreshSignal = 0, roles = ['Admin'] }) => {
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null);

  useEffect(() => { if (!month || !year) return; fetchOverview(); /* eslint-disable-next-line */ }, [month, year, refreshSignal]);

  const fetchOverview = async () => {
    setLoading(true); setToast('');
    try {
      const res = await axios.get(`/api/budget/overview?month=${month}&year=${year}`);
      setOverview(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching budget overview:', err);
      setToast('Failed to load overview. Try again.');
    } finally { setLoading(false); }
  };

  const clearOne = (categoryId, categoryName) => { setModal({ type: 'one', categoryId, categoryName }); };
  const clearMonth = () => { setModal({ type: 'month' }); };

  const handleConfirm = async (selectedRole) => {
    const setByRole = selectedRole;
    try {
      if (modal?.type === 'one') {
        await axios.post('/api/budget/clear-one', { categoryId: modal.categoryId, month, year, setByRole });
        setToast(`Cleared budget for ${modal.categoryName}.`);
      } else {
        await axios.post('/api/budget/clear-month', { month, year, setByRole });
        setToast(`Cleared budgets for ${month}/${year}.`);
      }
      setModal(null);
      fetchOverview();
    } catch (err) {
      console.error('Error clearing budget:', err);
      setToast('Failed to clear budget. Please try again.');
    }
  };

  return (
    <div>
      {toast && <div className="mb-8" style={{ color: '#0a7' }}>{toast}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <table className="data-table data-table--striped data-table--hover">
          <thead>
            <tr>
              <th>Category</th>
              <th>Initial Budget (₹)</th>
              <th>Remaining Budget (₹)</th>
              <th>Expenses Deducted (₹)</th>
              <th>Usage (%)</th>
              <th>Set By</th>
              <th className="t-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {overview.length > 0 ? (
              overview.map((item) => (
                <tr key={item.categoryId}>
                  <td>{item.categoryName}</td>
                  <td>₹{item.initialMonthlyBudget}</td>
                  <td>₹{item.remainingBudget}</td>
                  <td>₹{item.expensesDeducted}</td>
                  <td>{item.budgetUsagePercent}%</td>
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

      {modal && (
        <RoleModal
          title={modal.type === 'one' ? `Cleared by (category: ${modal.categoryName})` : 'Cleared by (All categories for month)'}
          roles={roles}
          onCancel={() => setModal(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
};

export default AdminBudgetOverview;