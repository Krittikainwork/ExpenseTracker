// src/components/admin/EmployeesTable.jsx
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const EmployeesTable = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // ENDPOINT: GET /api/employees -> [{ employeeId, fullName, email }]
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees');
      const list = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      setRows(list || []);
    } catch (e) {
      console.error('Employees load error:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <table className="data-table data-table--striped data-table--hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Employee ID</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((r) => (
                <tr key={r.employeeId}>
                  <td>{r.fullName ?? r.name ?? '—'}</td>
                  <td>{r.employeeId ?? r.employeeID ?? '—'}</td>
                  <td>{r.email ?? '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="t-center empty-state">
                  No registered employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EmployeesTable;