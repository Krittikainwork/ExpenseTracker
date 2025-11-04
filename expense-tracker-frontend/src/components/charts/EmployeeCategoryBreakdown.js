import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Box, Typography } from '@mui/material';

const COLORS = ['#5B8DF0','#00C49F','#FFBB28','#FF8042','#AB47BC','#8D6E63'];

export default function EmployeeCategoryBreakdown() {
  const [data, setData] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get('/api/expenses/my');
        const rows = Array.isArray(res.data) ? res.data : [];
        const map = new Map();
        rows.forEach(r => {
          const key = r.categoryName || r.category || 'Unknown';
          map.set(key, (map.get(key) || 0) + Number(r.amount || 0));
        });
        const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
        if (alive) setData(arr);
      } catch { setData([]); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Box sx={{ width: '100%', height: 280 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Category-wise Expense Breakdown</Typography>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v)=>`₹${Number(v).toLocaleString('en-IN')}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}