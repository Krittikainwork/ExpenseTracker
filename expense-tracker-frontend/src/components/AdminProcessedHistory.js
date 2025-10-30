// src/components/AdminProcessedHistory.js
import '../styles/manager-theme.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css';

const money = (n) =>
  (n ?? 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

const PAGE = 10; // show 10 rows, then "See more"

const AdminProcessedHistory = () => {
  const [rows, setRows] = useState([]);
  const [visible, setVisible] = useState(PAGE);
  const [comment, setComment] = useState({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/expenses/processed'); // Admin can view via policy
      const list = Array.isArray(res.data) ? res.data : [];
      // Newest first (by dateSubmitted; fallback to expenseId)
      const sorted = [...list].sort((a, b) => {
        const da = a?.dateSubmitted ? new Date(a.dateSubmitted).getTime() : 0;
        const db = b?.dateSubmitted ? new Date(b.dateSubmitted).getTime() : 0;
        if (db !== da) return db - da;
        return (b?.expenseId ?? 0) - (a?.expenseId ?? 0);
      });
      setRows(sorted);
      setVisible(PAGE);
    } catch (e) {
      console.error(e);
      setToast('Failed to load processed history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const postComment = async (expenseId) => {
    const text = (comment[expenseId] ?? '').trim();
    if (!text) return;
    try {
      await axios.put(`/api/expenses/comment/${expenseId}`, { comment: text }); // Admin-only endpoint
      setComment((c) => ({ ...c, [expenseId]: '' }));
      setToast('Comment posted.');
      load();
    } catch (e) {
      console.error(e);
      setToast('Failed to post comment.');
    }
  };

  const showMore = () => setVisible((v) => Math.min(v + PAGE, rows.length));

  return (
    <div>
      {/* (Title is shown by the page card; keep table-only here to avoid duplicates) */}

      {toast && <div className="mb-8" style={{ color: '#0a7' }}>{toast}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.slice(0, visible).map((e) => (
                  <tr key={e.expenseId}>
                    <td>{e.employeeName}</td>
                    <td>{e.employeeID}</td>
                    <td>{e.title}</td>
                    <td>{money(e.amount)}</td>
                    <td>{e.category}</td>
                    <td>{new Date(e.dateSubmitted).toLocaleDateString()}</td>
                    <td>{e.status}</td>
                    <td>{e.manager ?? '-'}</td>
                    <td>{e.managerComment ?? '-'}</td>
                    <td>{e.adminComment ?? '-'}</td>
                    <td>
                      <input
                        value={comment[e.expenseId] ?? ''}
                        onChange={(ev) =>
                          setComment((prev) => ({ ...prev, [e.expenseId]: ev.target.value }))
                        }
                        placeholder="Add a comment"
                        style={{ width: 160 }}
                      />
                      <button onClick={() => postComment(e.expenseId)} style={{ marginLeft: 8 }}>
                        Post
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="t-center" style={{ color: '#888', padding: 12 }}>
                    No processed items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {visible < rows.length && (
            <div className="t-center" style={{ marginTop: 8 }}>
              <button className="btn-pill" onClick={showMore}>See more</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminProcessedHistory;