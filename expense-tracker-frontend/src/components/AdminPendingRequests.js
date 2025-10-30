// src/components/AdminPendingRequests.js
import '../styles/manager-theme.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css';

const money = (n) => (n ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

const AdminPendingRequests = () => {
  const [rows, setRows] = useState([]);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setToast('');
    try {
      const res = await axios.get('/api/expenses/pending'); // Admin can view via policy
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setToast('Failed to load pending requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      {toast && <div className="mb-8" style={{ color: '#d33' }}>{toast}</div>}
      {loading ? <div>Loading…</div> : (
        <table className="data-table data-table--striped data-table--hover">
          <thead>
          <tr>
            <th>Employee Name</th>
            <th>Employee ID</th>
            <th>Title</th>
            <th>Amount (₹)</th>
            <th>Category</th>
            <th>Date Submitted</th>
          </tr>
          </thead>
          <tbody>
          {rows.length > 0 ? rows.map((e) => (
            <tr key={e.expenseId}>
              <td>{e.employeeName}</td>
              <td>{e.employeeID}</td>
              <td>{e.title}</td>
              <td>{money(e.amount)}</td>
              <td>{e.category}</td>
              <td>{new Date(e.dateSubmitted).toLocaleDateString()}</td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="t-center" style={{ color:'#888', padding:12 }}>No pending requests.</td></tr>
          )}
          </tbody>
        </table>
      )}
    </>
  );
};

export default AdminPendingRequests;