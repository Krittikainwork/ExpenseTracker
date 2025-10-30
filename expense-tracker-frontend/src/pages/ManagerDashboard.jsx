import React, { useEffect, useState } from 'react';
import PendingRequests from '../components/PendingRequests';
import BudgetForm from '../components/BudgetForm';
import BudgetOverview from '../components/BudgetOverview';
import BudgetHistory from '../components/BudgetHistory';
import ProcessedHistory from '../components/ProcessedHistory';
import Notifications from '../components/Notifications';
import { FaBell, FaSignOutAlt } from 'react-icons/fa';
import '../styles/manager-theme.css';
import '../styles/dashboard-theme.css';
import axios from 'axios';

const ManagerDashboard = () => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showHistory, setShowHistory] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  // 🔔 Bell badge count
  const [notifCount, setNotifCount] = useState(0);

  // Lightweight, non-intrusive polling to mirror Employee behavior
  useEffect(() => {
    let active = true;

    const fetchNotifCount = async () => {
      try {
        const res = await axios.get('/api/notifications');
        if (!active) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setNotifCount(list.length);
      } catch {
        // silent fail; badge just won't change this tick
      }
    };

    // initial load + 30s interval
    fetchNotifCount();
    const id = setInterval(fetchNotifCount, 30000);

    // also reflect "Clear All" coming from the notifications panel
    const onCleared = () => setNotifCount(0);
    window.addEventListener('manager-clear-notifications', onCleared);

    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener('manager-clear-notifications', onCleared);
    };
  }, []);

  const [toast, setToast] = useState('');

  const onBudgetSet = () => setRefreshSignal((x) => x + 1);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.assign('/login');
  };

  // (kept) Toolbar Clear All action (Manager)
  const clearMonthFromToolbar = async () => {
    try {
      await axios.post('/api/budget/clear-month', { month, year, setByRole: 'Manager' });
      setToast(`Cleared budgets for ${month}/${year}.`);
      setRefreshSignal((x) => x + 1);
    } catch (err) {
      console.error('Error clearing month budgets:', err);
      setToast('Failed to clear month budgets. Please try again.');
    }
  };

  return (
    <div className="layout">
      {/* ===== Topbar (gradient, welcome, bell, logout) ===== */}
      <div className="topbar topbar--gradient">
        <div className="brand">Expense Tracker</div>
        <span className="welcome">Welcome, Manager</span>

        <div className="topbar__actions">
          {/* Notifications bell with badge (now styled to be more prominent) */}
          <button
            className="icon-btn icon-btn--bell"
            title="Notifications"
            onClick={() => {
              const notifSection = document.querySelector('.notif-card');
              notifSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <FaBell />
            {notifCount > 0 && <span className="badge">{notifCount}</span>}
          </button>

          {/* Logout */}
          <button className="icon-btn" title="Logout" onClick={handleLogout}>
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      {/* ===== Main + Sidebar ===== */}
      <div className="layout__content">
        {/* ==== LEFT: Main column ==== */}
        <div className="main">
          {/* Month / Year toolbar */}
          <div className="toolbar mb-12">
            <div className="toolbar__inputs">
              <label>Month</label>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>

              <label style={{ marginLeft: 16 }}>Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                style={{ width: 100 }}
              />
            </div>
          </div>

          {/* Pending Requests */}
          <div className="card mb-12">
            <div className="card-title">Pending Expense Requests</div>
            <PendingRequests />
          </div>

          {/* Set Budget */}
          <div className="card mb-12">
            <div className="card-title">Set Budget</div>
            <BudgetForm month={month} year={year} onBudgetSet={onBudgetSet} roles={['Manager']} />
          </div>

          {/* Overview / History */}
          <div className="card mb-12">
            <div className="card-title">{showHistory ? 'Budget History Timeline' : 'Live Budget Overview'}</div>

            {showHistory ? (
              // Child owns the back button (prevents double toolbar)
              <BudgetHistory month={month} year={year} onBack={() => setShowHistory(false)} />
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
                <BudgetOverview
                  month={month}
                  year={year}
                  refreshSignal={refreshSignal}
                  onNavigateToHistory={() => setShowHistory(true)}
                  roles={['Manager']}
                />
              </>
            )}
          </div>

          {/* Processed History */}
          <div className="card mb-12">
            <div className="card-title">Processed Expense History</div>
            <ProcessedHistory />
          </div>
        </div>

        {/* ==== RIGHT: Notifications sidebar ==== */}
        <aside className="sidebar">
          <div className="card notif-card">
            <div className="card-title toolbar">
              <span>Notifications</span>
              <button
                className="btn-pill btn-pill--light"
                onClick={() => {
                  // Notify panel to clear its list
                  const ev = new CustomEvent('manager-clear-notifications');
                  window.dispatchEvent(ev);
                  // Ensure the badge clears immediately
                  setNotifCount(0);
                }}
              >
                Clear All
              </button>
            </div>

            {/* Notification list (scrolls within card) */}
            <div className="notif-list">
              {/* This still drives real-time badge updates on fetches */}
              <Notifications onCountChange={(n) => setNotifCount(n)} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ManagerDashboard;