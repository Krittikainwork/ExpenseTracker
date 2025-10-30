import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const formatINR = (v) =>
  `₹${Number(v ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TXModal = ({ open, onClose, onSave }) => {
  const [ref, setRef] = useState('');
  const [amt, setAmt] = useState('');
  if (!open) return null;

  const canConfirm = ref.trim().length > 0 && Number(amt) > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, minWidth: 360 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Mark as Reimbursed</div>
        <label>Transaction ID (UTR)</label>
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UTR / TXN ID" required />
        <label style={{ marginTop: 8 }}>Amount</label>
        <input value={amt} onChange={(e) => setAmt(e.target.value)} type="number" min="0.01" step="0.01" placeholder="Enter amount" required />
        <div className="toolbar" style={{ marginTop: 12 }}>
          <button onClick={onClose}>Cancel</button>
          <button
            style={{ marginLeft: 'auto' }}
            disabled={!canConfirm}
            onClick={() => onSave({ reference: ref.trim(), amount: Number(amt) })}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const PAGE = 10;

const AdminReimbursementPending = ({ month, year }) => {
  const [processed, setProcessed] = useState([]);
  const [map, setMap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null); // {expenseId}
  const [visible, setVisible] = useState(PAGE);

  const load = async () => {
    setLoading(true); setToast('');
    try {
      const res1 = await axios.get('/api/expenses/processed');
      const list = Array.isArray(res1.data) ? res1.data : [];
      const res2 = await axios.get('/api/reimbursements/map', { params: { month, year } });
      const m = Array.isArray(res2.data) ? res2.data : [];

      const sorted = [...list].sort((a, b) => {
        const da = a?.dateSubmitted ? new Date(a.dateSubmitted).getTime() : 0;
        const db = b?.dateSubmitted ? new Date(b.dateSubmitted).getTime() : 0;
        if (db !== da) return db - da;
        return (b?.expenseId ?? 0) - (a?.expenseId ?? 0);
      });

      setProcessed(sorted);
      setMap(m);
      setVisible(PAGE);
    } catch (e) {
      console.error(e);
      setToast('Failed to load reimbursement data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const mapById = useMemo(() => {
    const d = {};
    map.forEach((x) => { d[x.expenseId] = x; });
    return d;
  }, [map]);

  const pending = useMemo(() => {
    return processed.filter((e) => {
      const approved = String(e.status ?? '').toLowerCase() === 'approved';
      const reimb = !!mapById[e.expenseId];
      return approved && !reimb;
    });
  }, [processed, mapById]);

  const markPaid = async (expenseId, payload) => {
    try {
      await axios.put(`/api/reimbursements/mark-paid/${expenseId}`, payload);
      setToast('Marked as reimbursed.');
      setModal(null);
      load();
    } catch (e) {
      console.error(e);
      setToast('Failed to mark reimbursed.');
    }
  };

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
                <th>Employee</th>
                <th>Title</th>
                <th>Amount (₹)</th>
                <th>Category</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th className="t-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.length > 0 ? (
                pending.slice(0, visible).map((e) => (
                  <tr key={e.expenseId}>
                    <td>{e.employeeName ?? '—'}</td>
                    <td>{e.title ?? '—'}</td>
                    <td>{formatINR(e.amount)}</td>
                    <td>{e.category ?? e.categoryName ?? '—'}</td>
                    <td>{e.dateSubmitted ? new Date(e.dateSubmitted).toLocaleDateString() : '—'}</td>
                    <td>{e.status}</td>
                    <td className="t-center">
                      <button className="btn-pill" onClick={() => setModal({ expenseId: e.expenseId })}>
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="t-center" style={{ color: '#888', padding: 12 }}>
                    No pending reimbursements for {month}/{year}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {visible < pending.length && (
            <div className="t-center" style={{ marginTop: 8 }}>
              <button className="btn-pill" onClick={() => setVisible((v) => Math.min(v + PAGE, pending.length))}>
                See more
              </button>
            </div>
          )}

          <TXModal
            open={!!modal}
            onClose={() => setModal(null)}
            onSave={(payload) => markPaid(modal.expenseId, payload)}
          />
        </>
      )}
    </div>
  );
};

export default AdminReimbursementPending;