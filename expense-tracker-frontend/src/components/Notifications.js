import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  return (
    <div className="notifications">
      <h3>Notifications</h3>
      <ul>
        {notifications.length === 0 ? (
          <li>No new notifications</li>
        ) : (
          notifications.map((note) => (
            <li key={note.id  || note.timestamp}>
             {note.message} <span className="timestamp">({new Date(note.createdAt).toLocaleString()})</span>
             
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Notifications;