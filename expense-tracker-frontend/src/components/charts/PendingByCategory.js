import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Box, Typography } from '@mui/material';

export default function PendingByCategory() {
  const [data, setData] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get('/api/expenses/pending');
        const rows = Array.isArray(res.data) ? res.data : [];
        const map = new Map();
        rows.forEach(r => {
          const key = r.category || r.categoryName || 'Unknown';
          map.set(key, (map.get(key) || 0) + 1);
        });
        const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
        if (alive) setData(arr);
      } catch { setData([]); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Box sx={{ width: '100%', height: 280 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Pending Requests by Category</Typography>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 70, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={12} interval={0} angle={-30} textAnchor="end" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" name="Pending" fill="#ffb74d" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}