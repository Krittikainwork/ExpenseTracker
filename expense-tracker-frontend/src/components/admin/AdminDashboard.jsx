// src/components/admin/AdminDashboard.jsx
import React, { useState } from 'react';
import AdminBudgetOverview from './AdminBudgetOverview';
import BudgetHistory from './BudgetHistory';
import ProcessedExpensesWithComments from './ProcessedExpensesWithComments';
import EmployeesTable from './EmployeesTable';
import AdminNotifications from './AdminNotifications';
import LogoutButton from '../common/LogoutButton';

const AdminDashboard = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1..12
  const [year, setYear] = useState(now.getFullYear());

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Expense Tracker — Admin</h2>
        <div className="filters">
          <label>
            Month
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            Year
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ width: 90 }}
            />
          </label>
        </div>
        <div className="header-actions">
          <LogoutButton />
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h3>Live Budget Overview</h3>
          <AdminBudgetOverview />
        </section>

        <section className="panel">
          <h3>Budget History</h3>
          <BudgetHistory />
        </section>

        <section className="panel">
          <h3>Processed Expense History</h3>
          <ProcessedExpensesWithComments month={month} year={year} />
        </section>

        <section className="panel">
          <h3>Registered Employees</h3>
          <EmployeesTable />
        </section>

        <aside className="panel notifications-panel">
          <h3>Notifications</h3>
          <AdminNotifications />
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboard;