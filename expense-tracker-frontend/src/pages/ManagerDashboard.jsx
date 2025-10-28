import React, { useState } from 'react';
import PendingRequests from '../components/PendingRequests';
import BudgetForm from '../components/BudgetForm';
import BudgetOverview from '../components/BudgetOverview';
import BudgetHistory from '../components/BudgetHistory';
import ProcessedHistory from '../components/ProcessedHistory';
import Notifications from '../components/Notifications';
import styles from './ManagerDashboard.module.css';
import '../styles/manager-theme.css';

const ManagerDashboard = () => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showHistory, setShowHistory] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  const onBudgetSet = () => setRefreshSignal((x) => x + 1);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.assign('/login');
  };

  return (
    <div className={`manager-root ${styles.container}`}>
      {/* ===== LEFT (main) ===== */}
      <div className={styles.main}>
        {/* ===== Topbar ===== */}
        <div className="manager-topbar">
          <div className="manager-topbar__brand">Expense Tracker</div>
          <div className="manager-topbar__welcome">Welcome, Manager</div>
          <div className="manager-topbar__spacer" />

          {/* ===== Icons on right ===== */}
          <div className="topbar-icons">
            {/* Notification Bell */}
            <button
              className="icon-btn icon-badge"
              title="Notifications"
              aria-label="Notifications"
              onClick={() => {
                const notifSection = document.querySelector('.notif-card');
                notifSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z" />
              </svg>
              {notifCount > 0 && (
                <span className="icon-badge__dot">{notifCount}</span>
              )}
            </button>

            {/* Logout Button */}
            <button
              className="icon-btn"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16 17v2H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h11v2H6v10h10Zm3.707-5.707-3-3-1.414 1.414L17.586 11H11v2h6.586l-2.293 2.293 1.414 1.414 3-3a1 1 0 0 0 0-1.414Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ===== Month / Year Bar ===== */}
        <div className="card mb-16">
          <div
            className="card__body"
            style={{ display: 'flex', gap: 12, alignItems: 'center' }}
          >
            <div>
              <div className="muted">Month</div>
              <select
                className="round-select"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="muted">Year</div>
              <input
                className="round-input"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                style={{ width: 100 }}
              />
            </div>
            {showHistory && (
              <div style={{ marginLeft: 'auto' }}>
                <button
                  className="round-input"
                  onClick={() => setShowHistory(false)}
                >
                  ← Back to Overview
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="card mb-16">
          <div className="card__header">Pending Expense Requests</div>
          <div className="card__body">
            <PendingRequests month={month} year={year} />
          </div>
        </div>

        {/* Budget Form */}
        <div className="card mb-16">
          <div className="card__header">Set Budget</div>
          <div className="card__body">
            <BudgetForm month={month} year={year} onBudgetSet={onBudgetSet} />
          </div>
        </div>

        {/* Budget Overview / History */}
        <div className="card mb-16">
          <div className="card__header">
            {showHistory
              ? 'Budget History Timeline'
              : 'Live Budget Overview'}
          </div>
          <div className="card__body">
            {showHistory ? (
              <BudgetHistory
                month={month}
                year={year}
                onBack={() => setShowHistory(false)}
              />
            ) : (
              <BudgetOverview
                month={month}
                year={year}
                onNavigateToHistory={() => setShowHistory(true)}
                refreshSignal={refreshSignal}
              />
            )}
          </div>
        </div>

        {/* Processed History */}
        <div className="card mb-16">
          <div className="card__header">Processed Expense History</div>
          <div className="card__body">
            <ProcessedHistory />
          </div>
        </div>
      </div>

      {/* ===== RIGHT SIDEBAR ===== */}
      <div className={styles.sidebar}>
        <div className="notif-card">
          <div
            className="notif-card__title"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z" />
            </svg>
            Notifications
            <button
              className="clear-all-btn"
              title="Clear all notifications"
              onClick={() => {
                const ev = new CustomEvent('manager-clear-notifications');
                window.dispatchEvent(ev);
              }}
              style={{ marginLeft: 'auto' }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm0 6h2v9H9V9Zm4 0h2v9h-2V9Z" />
              </svg>
              <span style={{ marginLeft: 6 }}>Clear All</span>
            </button>
          </div>
          <div className="card__body">
            <Notifications onCount={(n) => setNotifCount(n)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
