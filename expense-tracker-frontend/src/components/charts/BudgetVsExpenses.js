import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Box, Typography } from '@mui/material';

export default function BudgetVsExpenses({ month, year }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get(`/api/budget/overview?month=${month}&year=${year}`);
        const rows = Array.isArray(res.data) ? res.data : [];
        const arr = rows.map(r => ({
          category: r.categoryName,
          initial: Number(r.initialMonthlyBudget || 0),
          spent: Number(r.expensesDeducted || 0),
        }));
        if (alive) setData(arr);
      } catch { setData([]); }
    })();
    return () => { alive = false; };
  }, [month, year]);

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Budget vs Actual Expenses — {month}/{year}</Typography>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis tickFormatter={(v)=>`₹${v}`} />
          <Tooltip formatter={(v)=>`₹${Number(v).toLocaleString('en-IN')}`} />
          <Legend />
          <Bar dataKey="initial" name="Initial Budget" fill="#90caf9" />
          <Bar dataKey="spent" name="Expenses Deducted" fill="#f48fb1" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}