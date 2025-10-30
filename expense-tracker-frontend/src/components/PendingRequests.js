import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ApproveRejectModal from './ApproveRejectModal';

const PendingRequests = () => {
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingExpenses();
  }, []);

  const fetchPendingExpenses = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/expenses/pending');
      const list = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      setPendingExpenses(list || []);
    } catch (err) {
      console.error('Error fetching pending expenses:', err);
      setPendingExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (expense, type) => {
    setSelectedExpense(expense);
    setActionType(type);
  };

  const closeModal = () => {
    setSelectedExpense(null);
    setActionType(null);
    fetchPendingExpenses(); // Refresh after action
  };

  const fmtAmt = (v) =>
    typeof v === 'number'
      ? `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      : (v ?? '—');

  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN');
    } catch {
      return String(d);
    }
  };

  return (
    <div className="pending-requests">
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <table className="data-table data-table--striped data-table--hover">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Title</th>
              <th className="t-right">Amount (₹)</th>
              <th>Category</th>
              <th>Expense Date</th>
              <th className="t-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingExpenses.length > 0 ? (
              pendingExpenses.map((expense) => (
                <tr key={expense.expenseId ?? `${expense.employeeID}-${expense.title}`}>
                  <td>{expense.employeeName ?? '—'}</td>
                  <td>{expense.employeeID ?? expense.employeeId ?? '—'}</td>
                  <td>{expense.title ?? '—'}</td>
                  <td className="t-right">{fmtAmt(expense.amount)}</td>
                  <td>{expense.category ?? expense.categoryName ?? 'Unknown'}</td>
                  <td>{fmtDate(expense.dateSubmitted)}</td>
                  <td className="t-center">
                    <div className="btn-group">
                      <button
                        className="btn btn--success"
                        onClick={() => openModal(expense, 'approve')}
                        title="Approve"
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn--danger"
                        onClick={() => openModal(expense, 'reject')}
                        title="Reject"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="t-center empty-state">
                  No requests currently.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {selectedExpense && (
        <ApproveRejectModal
          expense={selectedExpense}
          actionType={actionType}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default PendingRequests;