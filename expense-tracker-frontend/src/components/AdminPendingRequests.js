import React, { useEffect, useState } from 'react';
import axios from 'axios';

const fileUrl = (u) => {
  if (!u) return null;
  if (u.startsWith('http')) return u;
  const base = axios.defaults.baseURL?.replace(/\/$/, '') || window.location.origin;
  return `${base}${u}`;
};
const ProofCell = ({ url }) => {
  if (!url) return <span style={{ color: '#999' }}>—</span>;
  const abs = fileUrl(url);
  const isImg = /\.(png|jpe?g|gif)$/i.test(abs);
  return (
    <div className="proof-cell">
      {isImg ? <a href={abs} target="_blank" rel="noreferrer"><img src={abs} alt="proof" /></a>
             : <a className="proof-link" href={abs} target="_blank" rel="noreferrer">View</a>}
    </div>
  );
};

const AdminPendingRequests = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true); setToast('');
    try {
      const res = await axios.get('/api/expenses/pending'); // admin can view via policy in your backend
      const list = Array.isArray(res.data) ? res.data : [];
      setRows(list);
    } catch (e) {
      setToast('Failed to load pending requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      {toast && <div className="mb-8" style={{ color: '#0a7' }}>{toast}</div>}
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
              <th>Bill Proof</th> {/* NEW */}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((e) => (
              <tr key={e.expenseId}>
                <td>{e.employeeName}</td>
                <td>{e.employeeID}</td>
                <td>{e.title}</td>
                <td>₹{Number(e.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{e.category}</td>
                <td>{e.dateSubmitted ? new Date(e.dateSubmitted).toLocaleDateString() : '—'}</td>
                <td><ProofCell url={e.receiptUrl} /></td> {/* NEW */}
              </tr>
            )) : (
              <tr><td colSpan={7} className="t-center" style={{ color: '#888', padding: 12 }}>No pending items.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPendingRequests;