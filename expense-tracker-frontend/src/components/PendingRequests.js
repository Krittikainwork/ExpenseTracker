import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ApproveRejectModal from './ApproveRejectModal';

const PendingRequests = () => {
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    fetchPendingExpenses();
  }, []);

  const fetchPendingExpenses = async () => {
    try {
      const res = await axios.get('/api/expenses/pending');
      setPendingExpenses(res.data);
    } catch (err) {
      console.error('Error fetching pending expenses:', err);
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

  return (
    <div className="pending-requests">
      <table>
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Employee ID</th>
            <th>Title</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Date Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingExpenses.map((expense) => (
            <tr key={expense.expenseId}>
              <td>{expense.employeeName}</td>
              <td>{expense.employeeID}</td>
              <td>{expense.title}</td>
              <td>₹{expense.amount}</td>
              <td>{expense.category}</td>
              <td>{new Date(expense.dateSubmitted).toLocaleDateString()}</td>
              <td>
                <button onClick={() => openModal(expense, 'approve')}>Approve</button>
                <button onClick={() => openModal(expense, 'reject')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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