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

  // Custom tick renderer: splits long labels into up to two lines
  const renderTick = ({ x, y, payload }) => {
    const label = String(payload.value ?? '');
    const words = label.split(' ');
    let lines = [];

    if (label.length > 18 && words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    } else if (label.length > 18) {
      // fallback: split roughly in half
      const half = Math.ceil(label.length / 2);
      lines = [label.slice(0, half).trim(), label.slice(half).trim()];
    } else {
      lines = [label];
    }

    // place lines stacked, anchored to end so they don't overflow on the right
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
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Company Expense by Category — {month}/{year}</Typography>
      <ResponsiveContainer>
        {/* increased bottom margin and custom tick to avoid labels touching border */}
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 110, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={renderTick} tickMargin={12} interval={0} />
          <YAxis tickFormatter={(v)=>`₹${v}`} />
          <Tooltip formatter={(v)=>`₹${Number(v).toLocaleString('en-IN')}`} />
          <Bar dataKey="value" name="Amount" fill="#64b5f6" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}