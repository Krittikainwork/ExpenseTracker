import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Box, Typography } from '@mui/material';

export default function EmployeeMonthlyTrend() {
  const [data, setData] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get('/api/expenses/my');
        const rows = Array.isArray(res.data) ? res.data : [];
        const map = new Map();
        rows.forEach(r => {
          const d = r.expenseDate || r.dateSubmitted;
          if (!d) return;
          const key = dayjs(d).format('YYYY-MM');
          map.set(key, (map.get(key) || 0) + Number(r.amount || 0));
        });
        const arr = Array.from(map.entries())
          .sort((a,b) => a[0].localeCompare(b[0]))
          .map(([k, v]) => ({ month: dayjs(k+'-01').format('MMM YYYY'), amount: Number(v.toFixed(2)) }));
        if (alive) setData(arr);
      } catch { setData([]); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Box sx={{ width: '100%', height: 280 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Monthly Expense Trend</Typography>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(v)=>`₹${v}`} />
          <Tooltip formatter={(v)=>`₹${Number(v).toLocaleString('en-IN')}`} />
          <Line type="monotone" dataKey="amount" stroke="#3f51b5" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}