// src/components/AdminProcessedHistory.js
import '../styles/manager-theme.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css';

const money = (n) => (n ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

const AdminProcessedHistory = () => {
  const [rows, setRows] = useState([]);
  const [comment, setComment] = useState({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/expenses/processed'); // Admin can view via policy
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setToast('Failed to load processed history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const postComment = async (expenseId) => {
    const text = (comment[expenseId] || '').trim();
    if (!text) return;
    try {
      await axios.put(`/api/expenses/comment/${expenseId}`, { comment: text }); // Admin-only endpoint
      setComment(c => ({ ...c, [expenseId]: '' }));
      setToast('Comment posted.');
      load();
    } catch (e) {
      console.error(e);
      setToast('Failed to post comment.');
    }
  };

  return (
    <div className="mb-16">
      <div className="section-header">Processed Expense History</div>
      {toast && <div className="mb-8" style={{ color: '#0a7' }}>{toast}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <table className="data-table data-table--striped data-table--hover">
          <thead>
          <tr>
            <th>Employee Name</th>
            <th>Employee ID</th>
            <th>Title</th>
            <th>Amount (₹)</th>
            <th>Category</th>
            <th>Date Submitted</th>
            <th>Status</th>
            <th>Manager</th>
            <th>Manager Comment</th>
            <th>Admin Comment</th>
            <th className="t-center">Action</th>
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
              <td>
                <span className={
                  e.status === 'Approved' ? 'badge badge--approved'
                    : e.status === 'Rejected' ? 'badge badge--rejected'
                    : 'badge'
                }>
                  {e.status}
                </span>
              </td>
              <td>{e.manager ?? '-'}</td>
              <td>{e.managerComment ?? '-'}</td>
              <td>{e.adminComment ?? '-'}</td>
              <td className="t-center" style={{ minWidth: 220 }}>
                <div className="toolbar" style={{ gap: 8 }}>
                  <input
                    className="form-control"
                    value={comment[e.expenseId] || ''}
                    onChange={(ev) => setComment(prev => ({ ...prev, [e.expenseId]: ev.target.value }))}
                    placeholder="Add a comment"
                  />
                  <button className="btn btn-primary" onClick={() => postComment(e.expenseId)}>Post</button>
                </div>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={11} className="t-center" style={{ color:'#888', padding:12 }}>No processed items.</td></tr>
          )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminProcessedHistory;