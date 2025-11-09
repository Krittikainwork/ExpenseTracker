import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Box, Typography } from '@mui/material';

export default function ExpenseVolumeTrend({ month, year }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get('/api/expenses/processed');
        const rows = Array.isArray(res.data) ? res.data : [];
        const map = new Map();
        rows.forEach(r => {
          const d = r.expenseDate || r.dateSubmitted;
          if (!d) return;
          const dj = dayjs(d);
          if ((dj.month() + 1) === Number(month) && dj.year() === Number(year)) {
            const key = dj.format('DD/MM');
            map.set(key, (map.get(key) || 0) + 1);
          }
        });
        const arr = Array.from(map.entries())
          .sort((a,b) => dayjs(a[0], 'DD/MM').toDate() - dayjs(b[0], 'DD/MM').toDate())
          .map(([day, count]) => ({ day, count }));
        if (alive) setData(arr);
      } catch { setData([]); }
    })();
    return () => { alive = false; };
  }, [month, year]);

  return (
    <Box sx={{ width: '100%', height: 280 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Expense Volume Trend — {month}/{year}</Typography>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 20, bottom: 70, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            tickMargin={10}
            interval={0}
            angle={-45}
            textAnchor="end"
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}