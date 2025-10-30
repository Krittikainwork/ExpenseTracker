import React, { useState } from 'react';
import AdminPendingRequests from '../components/AdminPendingRequests';
import AdminBudgetOverview from '../components/AdminBudgetOverview';
import AdminBudgetHistory from '../components/AdminBudgetHistory';
import AdminProcessedHistory from '../components/AdminProcessedHistory';
import AdminReimbursementPending from '../components/AdminReimbursementPending'; // ✅ NEW
import BudgetForm from '../components/BudgetForm';
import { FaSignOutAlt } from 'react-icons/fa';
import '../styles/manager-theme.css';
import '../styles/dashboard-theme.css';
import axios from 'axios';

const AdminDashboard = () => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showHistory, setShowHistory] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [toast, setToast] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.assign('/login');
  };

  const onBudgetSet = () => setRefreshSignal((x) => x + 1);

  // Keep the Clear All action here (Admin role)
  const clearMonthFromToolbar = async () => {
    try {
      await axios.post('/api/budget/clear-month', { month, year, setByRole: 'Admin' });
      setToast(`Cleared budgets for ${month}/${year}.`);
      setRefreshSignal((x) => x + 1);
    } catch (err) {
      console.error('Error clearing month budgets:', err);
      setToast('Failed to clear month budgets. Please try again.');
    }
  };

  return (
    <div className="dashboard">
      {/* ===== Topbar ===== */}
      <div className="topbar topbar--gradient">
        <div className="brand">Expense Tracker</div>
        <div className="spacer" />
        <div className="welcome">Welcome, Admin</div>
        <button className="icon-btn" title="Logout" onClick={handleLogout}>
          <FaSignOutAlt />
        </button>
      </div>

      {/* ===== Month/Year toolbar ===== */}
      <div className="toolbar mb-12">
        <label style={{ marginRight: 8 }}>Month</label>
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
        <label style={{ marginLeft: 16, marginRight: 8 }}>Year</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value, 10))}
          style={{ width: 100 }}
        />
      </div>

      {/* ===== Pending (read-only) ===== */}
      <div className="card mb-12">
        <div className="card-title">Pending Expense Requests</div>
        <AdminPendingRequests />
      </div>

      {/* ===== Set Budget (Admin can set/top-up) ===== */}
      <div className="card mb-12">
        <div className="card-title">Set Budget</div>
        <BudgetForm month={month} year={year} onBudgetSet={onBudgetSet} roles={['Admin']} />
      </div>

      {/* ===== Overview / History ===== */}
      <div className="card mb-12">
        <div className="card-title">{showHistory ? 'Budget History Timeline' : 'Live Budget Overview'}</div>

        {showHistory ? (
          <>
            <div className="toolbar mb-8">
              <div className="muted">Budget History Timeline — {month}/{year}</div>
              <button onClick={() => setShowHistory(false)}>&larr; Back to Overview</button>
            </div>
            <AdminBudgetHistory month={month} year={year} />
          </>
        ) : (
          <>
            <div className="toolbar mb-8">
              <div className="muted">Live Budget Overview — {month}/{year}</div>
              <div style={{ marginLeft: 'auto' }} className="toolbar">
                <button className="btn-pill" onClick={clearMonthFromToolbar}>Clear All (Month)</button>
                <button className="btn-pill" onClick={() => setShowHistory(true)}>View Budget History</button>
              </div>
            </div>
            {toast && <div className="mb-8" style={{ color: '#0a7' }}>{toast}</div>}
            <AdminBudgetOverview
              month={month}
              year={year}
              refreshSignal={refreshSignal}
              onNavigateToHistory={() => setShowHistory(true)}
              roles={['Admin']}
            />
          </>
        )}
      </div>

      {/* ===== Processed History ===== */}
      <div className="card mb-12">
        <div className="card-title">Processed Expense History</div>
        <AdminProcessedHistory />
      </div>

      {/* ===== Reimbursement Pending (NEW) ===== */}
      <div className="card mb-12">
        <div className="card-title">Reimbursement Pending</div>
        <AdminReimbursementPending month={month} year={year} />
      </div>
    </div>
  );
};

export default AdminDashboard;
