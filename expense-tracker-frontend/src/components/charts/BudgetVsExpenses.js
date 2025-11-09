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

  // Custom tick renderer to wrap long category names (prevents cutting off last letters)
  const renderTick = ({ x, y, payload }) => {
    const label = String(payload.value ?? '');
    const words = label.split(' ');
    let lines = [];

    if (label.length > 18 && words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    } else if (label.length > 18) {
      const half = Math.ceil(label.length / 2);
      lines = [label.slice(0, half).trim(), label.slice(half).trim()];
    } else {
      lines = [label];
    }

    return (
      <g transform={`translate(${x},${y + 4})`}>
        {lines.map((ln, i) => (
          <text key={i} x={0} y={i * 12} dy={0} textAnchor="end" fontSize={12} fill="#444">
            {ln}
          </text>
        ))}
      </g>
    );
  };

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Budget vs Actual Expenses — {month}/{year}</Typography>
      <ResponsiveContainer>
        {/* increased bottom margin and custom tick to prevent clipping */}
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 110, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" tick={renderTick} tickMargin={12} interval={0} />
          <YAxis tickFormatter={(v)=>`₹${v}`} />
          <Tooltip formatter={(v)=>`₹${Number(v).toLocaleString('en-IN')}`} />
          <Legend verticalAlign="top" />
          <Bar dataKey="initial" name="Initial Budget" fill="#90caf9" />
          <Bar dataKey="spent" name="Expenses Deducted" fill="#f48fb1" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}