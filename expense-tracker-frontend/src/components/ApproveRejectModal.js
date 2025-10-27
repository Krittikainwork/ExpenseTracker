import React, { useState } from 'react';
import axios from 'axios';

const ApproveRejectModal = ({ expense, actionType, onClose }) => {
  const [managerName, setManagerName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      managerName,
      managerOfficialId: managerId,
      managerComment: comment,
    };

    try {
      const endpoint =
        actionType === 'approve'
          ? `http://localhost:5202/api/expenses/approve/${expense.expenseId}`
          : `http://localhost:5202/api/expenses/reject/${expense.expenseId}`;

      await axios.put(endpoint, payload);
      onClose();
    } catch (err) {
      console.error(`Error during ${actionType}:`, err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{actionType === 'approve' ? 'Approve Expense' : 'Reject Expense'}</h3>
        <p><strong>Title:</strong> {expense.title}</p>
        <p><strong>Amount:</strong> ₹{expense.amount}</p>
        <p><strong>Category:</strong> {expense.category}</p>

        <label>Manager Name:</label>
        <input
          type="text"
          value={managerName}
          onChange={(e) => setManagerName(e.target.value)}
          required
        />

        <label>Manager ID:</label>
        <input
          type="text"
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          required
        />

        <label>Comment (optional):</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="modal-actions">
          <button onClick={handleSubmit} disabled={loading}>
            Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ApproveRejectModal;