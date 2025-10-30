import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/manager-theme.css';
import '../styles/dashboard-theme.css';

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

const Notifications = ({ onCount }) => {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState('');

  const load = async () => {
    try {
      const res = await axios.get('/api/notifications');
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
      onCount && onCount(list.length);
    } catch (err) {
      console.error('GET /api/notifications failed:', err);
      setToast('Failed to load notifications.');
    }
  };

  const clearAll = async () => {
    try {
      await axios.post('/api/notifications/clear');
      setItems([]);
      onCount && onCount(0);
      setToast('Notifications cleared.');
    } catch (err) {
      console.error('POST /api/notifications/clear failed:', err);
      setToast('Failed to clear notifications.');
    }
  };

  useEffect(() => {
    load();
    // listen for manager-clear-notifications event fired from ManagerDashboard
    const handler = () => clearAll();
    window.addEventListener('manager-clear-notifications', handler);
    return () => window.removeEventListener('manager-clear-notifications', handler);
  }, []);

  return (
    <div className="notif-card">
      {toast && <div className="mb-8 text-info">{toast}</div>}

      {items.length === 0 ? (
        <p className="muted">No new notifications</p>
      ) : (
        <div className="notif-list">
          {items.map((n) => {
            const msg = String(n.message || '').toLowerCase();
            const rowClass =
              msg.includes('rejected') ? 'notification-card rejected' :
              msg.includes('approved') ? 'notification-card approved' :
              'notification-card';
            return (
              <div key={n.notificationId} className={rowClass}>
                <div>{n.message}</div>
                <div className="muted-time">{fmtDateTime(n.createdAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
