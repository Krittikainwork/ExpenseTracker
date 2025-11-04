import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Box, Typography } from '@mui/material';

export default function EmployeeStatusDistribution() {
  const [data, setData] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get('/api/expenses/my');
        const rows = Array.isArray(res.data) ? res.data : [];
        const counts = { Approved:0, Rejected:0, Pending:0 };
        rows.forEach(r => {
          const s = (r.status || '').toLowerCase();
          if (s === 'approved') counts.Approved++;
          else if (s === 'rejected') counts.Rejected++;
          else counts.Pending++;
        });
        const arr = Object.entries(counts).map(([name, value]) => ({ name, value }));
        if (alive) setData(arr);
      } catch { setData([]); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Box sx={{ width: '100%', height: 280 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Status Distribution</Typography>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#26a69a" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
