import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/manager-theme.css';

/**
 * Props:
 * - onCount: function(number) -> updates the bell badge in the top bar
 *
 * Endpoints used:
 * - GET    /api/notifications        -> list notifications for the logged-in user
 * - POST   /api/notifications/clear  -> CLEAR ALL notifications on the backend
 */
const Notifications = ({ onCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    // Listen for "Clear All" event dispatched from ManagerDashboard.jsx
    const clearHandler = async () => {
      await clearAll();
    };
    window.addEventListener('manager-clear-notifications', clearHandler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('manager-clear-notifications', clearHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setToast('');
    try {
      const res = await axios.get('/api/notifications');
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(list);
      if (typeof onCount === 'function') onCount(list.length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setToast('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  // Server-side clear + local reset
  const clearAll = async () => {
    try {
      await axios.post('/api/notifications/clear'); // 🔹 clears in the backend
      setNotifications([]);                         // 🔹 clear local list
      if (typeof onCount === 'function') onCount(0); // 🔹 reset bell badge
      setToast('Notifications cleared.');
    } catch (err) {
      console.error('Error clearing notifications:', err);
      setToast('Failed to clear notifications.');
    }
  };

  // Map to color classes (green/yellow/red)
  const cls = (note) => {
    const s = (note.status || note.type || '').toLowerCase();
    if (s === 'approved') return 'notif notif--approved';
    if (s === 'pending')  return 'notif notif--pending';
    if (s === 'rejected') return 'notif notif--rejected';
    const msg = String(note.message || '').toLowerCase();
    if (msg.includes('approved')) return 'notif notif--approved';
    if (msg.includes('pending'))  return 'notif notif--pending';
    if (msg.includes('reject'))   return 'notif notif--rejected';
    return 'notif';
  };

  // dd/MM/yyyy HH:mm
  const fmt = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2,'0');
    const mm = String(dt.getMonth()+1).padStart(2,'0');
    const yy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2,'0');
    const mi = String(dt.getMinutes()).padStart(2,'0');
    return `${dd}/${mm}/${yy} ${hh}:${mi}`;
  };

  return (
    <div>
      {/* Inline "Clear All" fallback button (optional). You can hide/remove if you only use the header button. */}
      {/* <div className="mb-12">
        <button className="clear-all-btn" onClick={clearAll}>Clear All</button>
      </div> */}

      {toast && <div className="mb-12" style={{ color: '#64748b' }}>{toast}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : notifications.length === 0 ? (
        <ul className="notif-list">
          <li className="notif">No new notifications</li>
        </ul>
      ) : (
        <ul className="notif-list">
          {notifications.map((note) => (
            <li
              key={note.notificationId || note.id || note.timestamp || `${note.createdAt}-${note.message}`}
              className={cls(note)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>
                  {note.title
                    ? (<><strong>{note.title}</strong>{' — '}{note.message}</>)
                    : note.message}
                </span>
                <span className="muted">{fmt(note.createdAt)}</span>
              </div>
              {note.comment ? (
                <div className="muted" style={{ marginTop: 6 }}>{note.comment}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;