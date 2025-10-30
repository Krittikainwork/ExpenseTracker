import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BudgetForm = ({ month, year, onBudgetSet, roles = ['Manager', 'Admin'] }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [setByRole, setSetByRole] = useState(roles[0] || 'Manager');
  const [message, setMessage] = useState('');

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { setSetByRole(roles[0] || 'Manager'); }, [roles]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setMessage('Failed to load categories.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage('');
    if (!selectedCategory || !amount) {
      setMessage('Please select a category and enter an amount.');
      return;
    }
    if (!setByRole || !['Manager', 'Admin'].includes(setByRole)) {
      setMessage('Please select role as Manager or Admin.');
      return;
    }
    try {
      await axios.post('/api/budget/set', {
        categoryId: parseInt(selectedCategory, 10),
        initialAmount: parseFloat(amount),
        month, year,
        setByRole,
      });
      setMessage('Budget set successfully!');
      setAmount(''); setSelectedCategory(''); setSetByRole(roles[0] || 'Manager');
      onBudgetSet && onBudgetSet();
    } catch (err) {
      console.error('Error setting budget:', err);
      setMessage('Failed to set budget. Please try again.');
    }
  };

  const singleRole = roles.length === 1;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
      <label>Category:</label>
      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} required>
        <option value="">Select Category</option>
        {categories.map((category) => (
          <option key={category.categoryId || category.id} value={category.categoryId || category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <label>Amount (₹):</label>
      <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />

      <label>Set by:</label>
      {singleRole ? (
        <div className="pill">{roles[0]}</div>
      ) : (
        <select value={setByRole} onChange={(e) => setSetByRole(e.target.value)} required>
          {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
        </select>
      )}

      <button type="submit">Add Budget</button>
      {message && <div style={{ marginTop: 6, color: '#0a7' }}>{message}</div>}
    </form>
  );
};

export default BudgetForm;