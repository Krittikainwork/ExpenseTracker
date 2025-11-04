import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Box, Typography } from '@mui/material';

const COLORS = ['#2e7d32', '#ed6c02'];

export default function ReimbursementStatusPie({ month, year }) {
  const [processed, setProcessed] = useState([]);
  const [map, setMap] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res1 = await axios.get('/api/expenses/processed');
        const res2 = await axios.get('/api/reimbursements/map', { params: { month, year } });
        if (!alive) return;
        setProcessed(Array.isArray(res1.data) ? res1.data : []);
        setMap(Array.isArray(res2.data) ? res2.data : []);
      } catch {
        setProcessed([]); setMap([]);
      }
    })();
    return () => { alive = false; };
  }, [month, year]);

  const data = useMemo(() => {
    const byId = {};
    map.forEach(m => { byId[m.expenseId] = true; });
    let paid = 0, pending = 0;
    processed.forEach(e => {
      const s = String(e.status || '').toLowerCase();
      if (s !== 'approved') return;
      const d = e.expenseDate || e.dateSubmitted;
      if (!d) return;
      const m = dayjs(d).month() + 1, y = dayjs(d).year();
      if (m === Number(month) && y === Number(year)) {
        if (byId[e.expenseId]) paid++; else pending++;
      }
    });
    return [
      { name: 'Paid', value: paid },
      { name: 'Pending', value: pending },
    ];
  }, [processed, map, month, year]);

  return (
    <Box sx={{ width: '100%', height: 280 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Reimbursement Status — {month}/{year}</Typography>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}