import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaBell, FaMoneyBillWave, FaSignOutAlt } from 'react-icons/fa';
import './Dashboard.css';

const categories = [
  { id: 1, name: 'Travel' },
  { id: 2, name: 'Meals' },
  { id: 3, name: 'Supplies' },
  { id: 4, name: 'Lodging' },
  { id: 5, name: 'Software & Subscriptions' }
];

function EmployeeDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    categoryId: '',
    expenseDate: ''
  });
  const [selectedDate, setSelectedDate] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchExpenses();
  }, []);
  const [username, setUsername] = useState('');

useEffect(() => {
  const storedUsername = localStorage.getItem('username');
  if (storedUsername) setUsername(storedUsername);
  fetchExpenses();
}, []);


  const fetchExpenses = async () => {
    try {
      const res = await axios.get('http://localhost:5202/api/expenses/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(res.data);
      const notifs = res.data
        .filter(e => e.status !== 'Pending')
        .map(e => ({
          message: `${e.title} - ${e.status}: ${e.managerComment || 'No comment'}`,
          status: e.status
        }));
      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedDate = new Date(selectedDate).toISOString();
    const payload = { ...formData, expenseDate: formattedDate };

    try {
      await axios.post('http://localhost:5202/api/expenses/submit', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Expense submitted successfully');
      setFormData({ title: '', amount: '', categoryId: '', expenseDate: '' });
      setSelectedDate('');
      fetchExpenses();
    } catch (err) {
      alert('Failed to submit expense');
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'status approved';
      case 'Pending':
        return 'status pending';
      case 'Rejected':
        return 'status rejected';
      default:
        return 'status';
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <h2>
  Expense Tracker <span>Welcome, {'Employee'}</span>
</h2>


        <div className="header-actions">
          <div className="notification-bell">
            <FaBell size={20} />
            {notifications.length > 0 && (
              <span className="notif-count">{notifications.length}</span>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt size={16} />
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="main-section">
          {/* Expense Submission Card */}
          <div className="card expense-card">
            <h3><FaMoneyBillWave /> Submit New Expense</h3>
            <p>Fill out the form below to submit an expense for approval</p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="title"
                placeholder="Expense Title"
                value={formData.title}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleChange}
                required
              />
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
              <button type="submit">Submit Expense</button>
            </form>
          </div>

          {/* My Expenses Table */}
          <div className="card expenses-section">
            <h3>My Expenses</h3>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date Submitted</th>
                  <th>Manager Comment</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, index) => (
                  <tr key={index}>
                    <td>{exp.title}</td>
                    <td>₹{exp.amount.toFixed(2)}</td>
                    <td>{categories.find(c => c.id === exp.categoryId)?.name || 'Unknown'}</td>
                    <td><span className={getStatusClass(exp.status)}>{exp.status}</span></td>
                    <td>{new Date(exp.expenseDate).toLocaleDateString()}</td>
                    <td>{exp.managerComment || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications */}
        <div className="notifications-section card">
          <h3>Notifications</h3>
          {notifications.length > 0 ? (
            notifications.map((note, index) => (
              <div
                key={index}
                className={`notification-card ${
                  note.status === 'Approved'
                    ? 'approved'
                    : note.status === 'Rejected'
                    ? 'rejected'
                    : ''
                }`}
              >
                {note.message}
              </div>
            ))
          ) : (
            <p>No new notifications</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
