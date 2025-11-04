import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Box, Typography } from '@mui/material';

export default function CompanyExpenseByCategory({ month, year }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get('/api/expenses/processed');
        const rows = Array.isArray(res.data) ? res.data : [];
        const arr = rows.filter(r => {
          const d = r.expenseDate || r.dateSubmitted;
          if (!d) return false;
          const m = dayjs(d).month() + 1;
          const y = dayjs(d).year();
          return m === Number(month) && y === Number(year);
        });
        const map = new Map();
        arr.forEach(r => {
          const key = r.category || r.categoryName || 'Unknown';
          map.set(key, (map.get(key) || 0) + Number(r.amount || 0));
        });
        const out = Array.from(map.entries()).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
        if (alive) setData(out);
      } catch { setData([]); }
    })();
    return () => { alive = false; };
  }, [month, year]);

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Company Expense by Category — {month}/{year}</Typography>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v)=>`₹${v}`} />
          <Tooltip formatter={(v)=>`₹${Number(v).toLocaleString('en-IN')}`} />
          <Bar dataKey="value" name="Amount" fill="#64b5f6" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
