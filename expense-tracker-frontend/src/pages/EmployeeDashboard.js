// src/pages/EmployeeDashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaBell, FaMoneyBillWave, FaSignOutAlt, FaTrash } from 'react-icons/fa';
import './Dashboard.css';

const categories = [
  { id: 1, name: 'Travel' },
  { id: 2, name: 'Meals' },
  { id: 3, name: 'Supplies' },
  { id: 4, name: 'Lodging' },
  { id: 5, name: 'Software & Subscriptions' }
];

const PAGE = 10;

function EmployeeDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [reimbMap, setReimbMap] = useState({}); // { expenseId: { paidDateUtc, reference } }
  const [notifications, setNotifications] = useState([]);
  const [notifToast, setNotifToast] = useState('');
  const [formData, setFormData] = useState({ title: '', amount: '', categoryId: '', expenseDate: '' });
  const [selectedDate, setSelectedDate] = useState('');
  const [username, setUsername] = useState('');
  const token = localStorage.getItem('token');

  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) setUsername(storedUsername);
    fetchExpenses();
    fetchEmployeeNotifications();
    fetchReimbStatus();
    const notifInterval = setInterval(fetchEmployeeNotifications, 30000);
    return () => clearInterval(notifInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get('http://localhost:5202/api/expenses/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = Array.isArray(res.data) ? res.data : [];
      const sorted = [...list].sort((a, b) => {
        const da = a?.expenseDate ? new Date(a.expenseDate).getTime() : 0;
        const db = b?.expenseDate ? new Date(b.expenseDate).getTime() : 0;
        if (db !== da) return db - da;
        return (b?.expenseId ?? 0) - (a?.expenseId ?? 0);
      });
      setExpenses(sorted);
      setVisible(PAGE);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  const fetchReimbStatus = async () => {
    try {
      const res = await axios.get('http://localhost:5202/api/reimbursements/status/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = Array.isArray(res.data) ? res.data : [];
      const map = {};
      list.forEach((x) => { map[x.expenseId] = { paidDateUtc: x.paidDateUtc, reference: x.reference }; });
      setReimbMap(map);
    } catch (err) {
      console.error('GET /api/reimbursements/status/my failed:', err);
    }
  };

  const fetchEmployeeNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5202/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(list);
    } catch (err) {
      console.error('GET /api/notifications failed:', err);
      setNotifToast('Failed to load notifications.');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.post('http://localhost:5202/api/notifications/clear', null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setNotifToast('Notifications cleared.');
    } catch (err) {
      console.error('POST /api/notifications/clear failed:', err);
      setNotifToast('Failed to clear notifications.');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
      fetchEmployeeNotifications();
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
      case 'Approved': return 'status approved';
      case 'Pending': return 'status pending';
      case 'Rejected': return 'status rejected';
      default: return 'status';
    }
  };

  const showMore = () => setVisible((v) => Math.min(v + PAGE, expenses.length));

  const renderReimb = (exp) => {
    const status = String(exp.status ?? '').toLowerCase();
    const m = reimbMap[exp.expenseId];
    if (m?.paidDateUtc) {
      const dd = new Date(m.paidDateUtc);
      const s = `${String(dd.getDate()).padStart(2, '0')}/${String(dd.getMonth() + 1).padStart(2, '0')}/${dd.getFullYear()}`;
      return <span className="badge badge--ok">Paid&nbsp;({s})</span>;
    }
    if (status === 'approved') return <span className="badge badge--warn">Pending</span>;
    return '—';
  };

  // helper for dd/MM/yyyy HH:mm
  const fmtDateTime = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${hh}:${mi}`;
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <h2>
          Expense Tracker <span>Welcome, {'Employee'}</span>
        </h2>
        <div className="header-actions">
          <div className="notification-bell" title="Notifications">
            <FaBell size={20} />
            {notifications.length > 0 && (
              <span className="notif-count">{notifications.length}</span>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
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
              <input type="text" name="title" placeholder="Expense Title" value={formData.title} onChange={handleChange} required />
              <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} required />
              <select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
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
                  <th>Expense Date</th>
                  <th>Manager Comment</th>
                  <th>Reimbursement</th> {/* NEW */}
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, visible).map((exp, index) => (
                  <tr key={index}>
                    <td>{exp.title}</td>
                    <td>₹{Number(exp.amount ?? 0).toFixed(2)}</td>
                    <td>{categories.find((c) => c.id === exp.categoryId)?.name ?? 'Unknown'}</td>
                    <td><span className={getStatusClass(exp.status)}>{exp.status}</span></td>
                    <td>{new Date(exp.expenseDate).toLocaleDateString()}</td>
                    <td>{exp.managerComment ?? '-'}</td>
                    <td>{renderReimb(exp)}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ color: '#888', padding: 12 }} className="t-center">
                      No expenses yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {visible < expenses.length && (
              <div className="t-center" style={{ marginTop: 8 }}>
                <button className="btn-pill" onClick={() => setVisible((v) => Math.min(v + PAGE, expenses.length))}>
                  See more
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="notifications-section card">
          <div className="notif-header">
            <h3>Notifications</h3>
            <button className="clear-all-btn" onClick={clearAllNotifications} title="Clear all notifications">
              <FaTrash size={14} />
              <span>Clear All</span>
            </button>
          </div>

          {notifToast && <div className="notif-toast">{notifToast}</div>}

          {notifications.length > 0 ? (
            notifications.map((n, index) => {
              const msg = String(n.message ?? '').toLowerCase();
              const statusClass =
                msg.includes('reject') ? 'notification-card rejected'
                : msg.includes('approved') ? 'notification-card approved'
                : 'notification-card';
              return (
                <div key={n.notificationId ?? index} className={statusClass}>
                  {n.message}
                  <div className="muted-time">{fmtDateTime(n.createdAt)}</div>
                </div>
              );
            })
          ) : (
            <p>No new notifications</p>
          )}
        </div>
      </div>
    </div>
  );
}
export default EmployeeDashboard;