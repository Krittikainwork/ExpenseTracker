import '../styles/manager-theme.css';
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import '../styles/dashboard-theme.css';

const money = (n) =>
  (n ?? 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

// PAGE size for "See more"
const PAGE = 10;

const AdminProcessedHistory = () => {
  const [rows, setRows] = useState([]);
  const [map, setMap] = useState([]); // reimbursement map
  const [comment, setComment] = useState({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  // NEW: visible count for "See more"
  const [visible, setVisible] = useState(PAGE);

  const load = async () => {
    setLoading(true);
    try {
      // processed items (existing endpoint)
      const res = await axios.get('/api/expenses/processed');
      const list = Array.isArray(res.data) ? res.data : [];
      // newest first by dateSubmitted, fallback to expenseId
      const sorted = [...list].sort((a, b) => {
        const da = a?.dateSubmitted ? new Date(a.dateSubmitted).getTime() : 0;
        const db = b?.dateSubmitted ? new Date(b.dateSubmitted).getTime() : 0;
        if (db !== da) return db - da;
        return (b?.expenseId ?? 0) - (a?.expenseId ?? 0);
      });
      setRows(sorted);

      // reimbursement map (global) for status column
      const mres = await axios.get('/api/reimbursements/map-all');
      const m = Array.isArray(mres.data) ? mres.data : [];
      setMap(m);

      // reset paging after refresh
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

  const mapById = useMemo(() => {
    const d = {};
    map.forEach((x) => {
      d[x.expenseId] = x;
    });
    return d;
  }, [map]);

  const postComment = async (expenseId) => {
    const text = (comment[expenseId] ?? '').trim();
    if (!text) return;
    try {
      await axios.put(`/api/expenses/comment/${expenseId}`, { comment: text });
      setComment((c) => ({ ...c, [expenseId]: '' }));
      setToast('Comment posted.');
      load();
    } catch (e) {
      console.error(e);
      setToast('Failed to post comment.');
    }
  };

  const reimbCell = (e) => {
    const m = mapById[e.expenseId];
    if (m?.paidDateUtc) {
      const dd = new Date(m.paidDateUtc);
      const s = `${String(dd.getDate()).padStart(2, '0')}/${String(dd.getMonth() + 1).padStart(2, '0')}/${dd.getFullYear()}`;
      return <span className="badge badge--ok">Paid&nbsp;({s})</span>;
    }
    if (String(e.status ?? '').toLowerCase() === 'approved') {
      return <span className="badge badge--warn">Pending</span>;
    }
    return '—';
  };

  // NEW: handler for "See more"
  const showMore = () => setVisible((v) => Math.min(v + PAGE, rows.length));

  return (
    <div>
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
                <th>Reimbursement Status</th> {/* status column retained */}
                <th>Admin Comment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                // NEW: slice by visible count
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
                    <td>{reimbCell(e)}</td>
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
                  <td colSpan={12} className="t-center" style={{ color: '#888', padding: 12 }}>
                    No processed items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* NEW: See more button */}
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