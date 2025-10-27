import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BudgetOverview = ({ month, year }) => {
  const [overview, setOverview] = useState([]);

  useEffect(() => {
    fetchOverview();
  }, [month, year]);

  const fetchOverview = async () => {
    try {
      const res = await axios.get(`/api/budget/overview?month=${month}&year=${year}`);
      setOverview(res.data);
    } catch (err) {
      console.error('Error fetching budget overview:', err);
    }
  };

  return (
    <div className="budget-overview">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Initial Budget</th>
            <th>Remaining Budget</th>
            <th>Expenses Deducted</th>
            <th>Usage</th>
            <th>Budget Set By</th>
          </tr>
        </thead>
        <tbody>
          {overview.map((item) => (
            <tr key={item.categoryId}>
              <td>{item.categoryName}</td>
              <td>₹{item.initialMonthlyBudget}</td>
              <td>₹{item.remainingBudget}</td>
              <td>₹{item.expensesDeducted}</td>
              <td>
                <div className="usage-bar">
                  <div
                    className="usage-fill"
                    style={{ width: `${item.budgetUsagePercent}%` }}
                  ></div>
                  <span>{item.budgetUsagePercent}%</span>
                </div>
              </td>
              <td>{item.budgetSetBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BudgetOverview;
