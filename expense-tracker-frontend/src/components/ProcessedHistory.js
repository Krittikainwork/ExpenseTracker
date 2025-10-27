import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProcessedHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/expenses/processed');
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching processed history:', err);
    }
  };

  return (
    <div className="processed-history">
      <table>
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Employee ID</th>
            <th>Title</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Date Submitted</th>
            <th>Status</th>
            <th>Manager</th>
            <th>Manager Comment</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.expenseId}>
              <td>{item.employeeName}</td>
              <td>{item.employeeID}</td>
              <td>{item.title}</td>
              <td>₹{item.amount}</td>
              <td>{item.category}</td>
              <td>{new Date(item.dateSubmitted).toLocaleDateString()}</td>
              <td>{item.status}</td>
              <td>{item.manager}</td>
              <td>{item.managerComment || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProcessedHistory;