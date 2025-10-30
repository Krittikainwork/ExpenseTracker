import React, { useState } from 'react';
import AdminPendingRequests from '../components/AdminPendingRequests';
import AdminBudgetOverview from '../components/AdminBudgetOverview';
import AdminBudgetHistory from '../components/AdminBudgetHistory';
import AdminProcessedHistory from '../components/AdminProcessedHistory';
import { FaSignOutAlt } from 'react-icons/fa';

import '../styles/manager-theme.css';
import '../styles/dashboard-theme.css';

const AdminDashboard = () => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showHistory, setShowHistory] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.assign('/login');
  };

  const handleBackToOverview = () => setShowHistory(false);
  const onGotoHistory = () => setShowHistory(true);

  return (
    <div className="layout grid" style={{ padding: '20px' }}>
      {/* ===== LEFT (main) ===== */}
      <div className="col col--main">

        {/* Topbar (Manager styling) */}
        <div className="topbar" style={{ marginBottom: '30px' }}>
          <div className="title" style={{ fontSize: '1.6rem' }}>Expense Tracker</div>
          <div className="subtitle" style={{ fontSize: '1.1rem' }}>Welcome, Admin</div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn--ghost" onClick={handleLogout} title="Logout">
              <FaSignOutAlt size={16} />
            </button>
          </div>
        </div>

        {/* Month/Year toolbar */}
        <div className="toolbar mb-16" style={{ marginBottom: '35px' }}>
          <div>
            <label className="muted" style={{ marginRight: 6 }}>Month</label>
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
              {[...Array(12)].map((_, i) => (<option key={i+1} value={i+1}>{i+1}</option>))}
            </select>
          </div>
          <div style={{ marginLeft: 12 }}>
            <label className="muted" style={{ marginRight: 6 }}>Year</label>
            <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} style={{ width: 100 }} />
          </div>
        </div>

        {/* Pending (read-only) */}
        <div className="section mb-24" style={{ marginBottom: '40px' }}>
          <div className="section-header" style={{ fontSize: '1.3rem', fontWeight: 600 }}>
            Pending Expense Requests
          </div>
          <AdminPendingRequests />
        </div>

        {/* Overview / History toggle */}
        <div className="section mb-24" style={{ marginBottom: '40px' }}>
          <div className="section-header" style={{ fontSize: '1.3rem', fontWeight: 600 }}>
            {showHistory ? 'Budget History Timeline' : 'Live Budget Overview'}
          </div>

          {showHistory ? (
            <>
              <div className="toolbar mb-12">
                <div className="muted">Budget History Timeline — {month}/{year}</div>
                <div style={{ marginLeft: 'auto' }}>
                  <button className="btn btn-primary" onClick={handleBackToOverview}>← Back to Overview</button>
                </div>
              </div>
              <AdminBudgetHistory month={month} year={year} />
            </>
          ) : (
            <>
              <div className="toolbar mb-12">
                <div className="muted">Live Budget Overview — {month}/{year}</div>
                <div style={{ marginLeft: 'auto' }}>
                  <button className="btn btn-primary" onClick={onGotoHistory}>View Budget History</button>
                </div>
              </div>
              <AdminBudgetOverview month={month} year={year} />
            </>
          )}
        </div>

        {/* Processed History */}
        <div className="section mb-24" style={{ marginBottom: '40px' }}>
          <div className="section-header" style={{ fontSize: '1.3rem', fontWeight: 600 }}>
            Processed Expense History
          </div>
          <AdminProcessedHistory />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
