// src/components/admin/AdminCommentModal.jsx
import React, { useState } from 'react';
import api from '../../utils/api';

// When admin submits a comment, backend should create a manager notification:
// "Admin added a comment to <title>"
// ENDPOINT: POST /api/expenses/comment -> { expenseId, comment }
// or PATCH /api/expenses/{id}/comment
const AdminCommentModal = ({ expense, onClose, onSubmitted }) => {
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return alert('Please enter a comment.');
    setSaving(true);
    try {
      await api.post('/expenses/comment', {
        expenseId: expense.expenseId,
        comment: comment.trim(),
      });
      // Optional: toast success
      onSubmitted?.();
    } catch (e) {
      console.error('Add comment failed:', e);
      alert('Could not add comment. Please try again.');
    } finally {
      setSaving(false);
      onClose?.();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h4>Add Comment</h4>
        <p className="muted">
          Expense: <strong>{expense.title ?? '(untitled)'}</strong> — by{' '}
          {expense.employeeName ?? '—'}
        </p>
        <form onSubmit={submit}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your comment for the manager…"
            rows={4}
            className="textarea"
          />
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Submit Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCommentModal;