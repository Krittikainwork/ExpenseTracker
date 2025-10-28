// src/components/admin/AdminNotifications.jsx
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminNotifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ENDPOINT: GET /api/notifications?recipientRole=Admin
  // Each item example: { id, type: 'BudgetSet'|'TopUpAdded'|'CommentOnExpense'|..., message, createdAt }
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { recipientRole: 'Admin' } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      setItems(list || []);
    } catch (e) {
      console.error('Notifications load error:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const clearAll = async () => {
    try {
      await api.post('/notifications/clear', { recipientRole: 'Admin' });
      setItems([]);
    } catch (e) {
      console.error('Clear notifications failed:', e);
    }
  };

  return (
    <div className="notifications">
      <div className="notif-header">
        <button className="btn" onClick={clearAll} title="Clear all">
          Clear All
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="muted">Loading…</div>
      ) : items.length > 0 ? (
        <ul className="notif-list">
          {items.map((n) => (
            <li key={n.id} className={`notif-item notif-${(n.type || '').toLowerCase()}`}>
              <div className="notif-msg">{n.message}</div>
              <div className="notif-time">
                {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN') : '—'}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">No notifications.</div>
      )}
    </div>
  );
};

export default AdminNotifications;
