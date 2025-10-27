import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BudgetForm = ({ month, year }) => {
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await axios.post('/api/budget/set', {
        categoryId: parseInt(selectedCategory),
        initialAmount: parseFloat(amount),
        month,
        year,
      });
      setMessage('Budget set successfully!');
      setAmount('');
      setSelectedCategory('');
    } catch (err) {
      console.error('Error setting budget:', err);
      setMessage('Failed to set budget. Please try again.');
    }
  };

  return (
    <div className="budget-form">
      <form onSubmit={handleSubmit}>
        <label>Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          required
        >
          <option value="">Select Category</option>
          
  {categories.map(category => (
    <option key={category.id} value={category.id}>
      {category.name}
    </option>
  ))}
</select>

        <label>Amount:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <button type="submit">Add Budget</button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default BudgetForm;
