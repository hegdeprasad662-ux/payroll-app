import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Lock, FileText } from 'lucide-react';
import api from '../lib/api.js';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { Input, Label } from '../components/Input.jsx';
import { DataTable } from '../components/DataTable.jsx';

const statusPill = (s) => {
  const map = {
    DRAFT:     'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    PROCESSED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    LOCKED:    'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[s] || ''}`}>{s}</span>;
};

export default function PayrollRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try { const r = await api.get('/payroll/runs'); setRuns(r.data || []); }
    catch (e) { setToast({ type: 'error', msg: 'Failed to load: ' + (e.response?.data?.error || e.message) }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!period) return;
    const [y, m] = period.split('-');
    if (!y || !m) return;
    const d = new Date(Number(y), Number(m) - 1, 1);
    setLabel(d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }));
  }, [period]);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  const create = async () => {
    setBusy(true);
    try {
      await api.post('/payroll/runs', { period, periodLabel: label, totalDays: 30 });
      await load();
      setToast({ type: 'ok', msg: `Run created for ${label}` });
    } catch (e) {
      setToast({ type: 'error', msg: e.response?.data?.error || e.message });
    } finally { setBusy(false); }
  };

  const process = async (id) => {
    setProcessingId(id);
    try {
      const { data } = await api.post(`/payroll/runs/${id}/process`);
      await load();
      setToast({ type: 'ok', msg: `Processed ${data.count} employees · opening register…` });
      setTimeout(() => navigate(`/payroll/${id}/register`), 600);
    } catch (e) {
      setToast({ type: 'error', msg: 'Process failed: ' + (e.response?.data?.error || e.message) });
    } finally { setProcessingId(null); }
  };

  const lock = async (id) => {
    if (!window.confirm('Lock this run? Lines can no longer be re-processed.')) return;
    try { await api.post(`/payroll/runs/${id}/lock`); await load(); setToast({ type: 'ok', msg: 'Run locked' }); }
    catch (e) { setToast({ type: 'error', msg: e.response?.data?.error || e.message }); }
  };

  const columns = [
    { key: 'period', header: 'Period' },
    { key: 'periodLabel', header: 'Label' },
    { key: 'status', header: 'Status', render: r => statusPill(r.status) },
    { key: 'count', header: 'Lines', numeric: true, render: r => (r._count && r._count.lines) || 0 },
    { key: 'actions', header: '', sortable: false, render: r => {
      const isProcessing = processingId === r.id;
      return (
        <div className="flex gap-1.5 justify-end items-center">
          {r.status !== 'DRAFT' && (
            <Link to={`/payroll/${r.id}/register`}
              className="inline-flex items-center gap-1 text-xs text-brand-700 dark:text-brand-300 hover:underline">
              <FileText size={12} /> Register
            </Link>
          )}
          {r.status !== 'LOCKED' && (
            <button onClick={() => process(r.id)} disabled={isProcessing}
              className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 hover:underline disabled:opacity-50 disabled:no-underline">
              <Play size={12} /> {isProcessing ? 'Processing…' : 'Process'}
            </button>
          )}
          {r.status === 'PROCESSED' && (
            <button onClick={() => lock(r.id)}
              className="inline-flex items-center gap-1 text-xs text-rose-700 dark:text-rose-300 hover:underline">
              <Lock size={12} /> Lock
            </button>
          )}
        </div>
      );
    }},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-ink-900 dark:text-slate-50">Payroll Runs</h2>
          <p className="text-sm text-ink-600 dark:text-slate-300 mt-1">One run per month · process, lock, export</p>
        </div>
        {processingId && (
          <div className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 px-3 py-1.5 rounded-md">
            Processing run #{processingId}… this can take 5–10 seconds
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={
              'text-sm px-3 py-2 rounded-md border ' +
              (toast.type === 'ok'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/40'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/40')
            }
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

      <Card title="Create new payroll run">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="w-40">
            <Label>Period (YYYY-MM)</Label>
            <Input value={period} onChange={e => setPeriod(e.target.value)} placeholder="2025-04" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <Label>Display label</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} />
          </div>
          <Button onClick={create} disabled={busy || !period}>
            {busy ? 'Creating…' : 'Create run'}
          </Button>
        </div>
      </Card>

      <Card>
        {loading
          ? <div className="py-8 text-center text-sm text-ink-500 dark:text-slate-400">Loading runs…</div>
          : <DataTable columns={columns} data={runs} rowKey="id" />}
      </Card>
    </div>
  );
}
