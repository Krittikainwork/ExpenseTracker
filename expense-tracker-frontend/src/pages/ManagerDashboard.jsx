import React, { useEffect, useState } from 'react';
import PendingRequests from '../components/PendingRequests';
import BudgetForm from '../components/BudgetForm';
import BudgetOverview from '../components/BudgetOverview';
import ProcessedHistory from '../components/ProcessedHistory';
import Notifications from '../components/Notifications';
import Logout from '../components/Logout';
import styles from './ManagerDashboard.module.css';

const ManagerDashboard = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <h1 className={styles.title}>Manager Dashboard</h1>

        <section className={styles.section}>
          <h2>Pending Expense Requests</h2>
          <PendingRequests />
        </section>

        <section className={styles.section}>
          <h2>Set Budget</h2>
          <BudgetForm month={month} year={year} />
        </section>

        <section className={styles.section}>
          <h2>Budget Overview</h2>
          <BudgetOverview month={month} year={year} />
        </section>

        <section className={styles.section}>
          <h2>Processed Expense History</h2>
          <ProcessedHistory />
        </section>
      </div>

      <div className={styles.sidebar}>
        <Logout />
        <Notifications />
      </div>
    </div>
  );
};

export default ManagerDashboard;