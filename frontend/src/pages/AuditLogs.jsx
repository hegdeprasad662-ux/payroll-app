import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { Card } from '../components/Card.jsx';
import { DataTable } from '../components/DataTable.jsx';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api.get('/reports/audit').then(r => setLogs(r.data)); }, []);

  const columns = [
    { key: 'createdAt', header: 'When', render: r => (
      <span className="text-ink-700 dark:text-slate-200 whitespace-nowrap">
        {new Date(r.createdAt).toLocaleString('en-IN')}
      </span>
    )},
    { key: 'actor', header: 'Actor', render: r => <span className="text-ink-800 dark:text-slate-100">{r.actor}</span> },
    { key: 'action', header: 'Action', render: r => (
      <span className="inline-block text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
        {r.action}
      </span>
    )},
    { key: 'entity', header: 'Entity' },
    { key: 'entityId', header: 'ID' },
    { key: 'details', header: 'Details', render: r => (
      <code className="text-xs text-ink-600 dark:text-slate-300 max-w-md truncate inline-block">{r.details || ''}</code>
    )},
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-ink-900 dark:text-slate-50">Audit Logs</h2>
        <p className="text-sm text-ink-600 dark:text-slate-300 mt-1">Most recent 200 events</p>
      </div>
      <Card>
        <DataTable columns={columns} data={logs} rowKey="id" height="max-h-[calc(100vh-220px)]" dense />
      </Card>
    </div>
  );
}
