// src/components/BudgetForm.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BudgetForm = ({ month, year, onBudgetSet }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

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
    e.preventDefault();
    setMessage('');
    if (!selectedCategory || !amount) {
      setMessage('Please select a category and enter an amount.');
      return;
    }
    try {
      await axios.post('/api/budget/set', {
        categoryId: parseInt(selectedCategory, 10),
        initialAmount: parseFloat(amount),
        month,
        year,
      });
      setMessage('Budget set successfully!');
      setAmount('');
      setSelectedCategory('');
      onBudgetSet && onBudgetSet(); // let parent refresh overview
    } catch (err) {
      console.error('Error setting budget:', err);
      setMessage('Failed to set budget. Please try again.');
    }
  };

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
      <input
        type="number"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <button type="submit">Add Budget</button>

      {message && <div style={{ marginTop: 6, color: '#0a7' }}>{message}</div>}
    </form>
  );
};

export default BudgetForm;