import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, FileText, RefreshCw, Play } from 'lucide-react';
import api from '../lib/api.js';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { inr, downloadBlob } from '../lib/utils.js';

function EditableCell({ value, onSave, savingId, lineId, field, disabled }) {
  const [v, setV] = useState(value ?? 0);
  useEffect(() => { setV(value ?? 0); }, [value]);
  const saving = savingId === `${lineId}-${field}`;
  const dirty = Number(v) !== Number(value);

  if (disabled) return <span className="tabular-nums text-ink-800 dark:text-slate-100">{inr(value)}</span>;

  return (
    <input
      type="number"
      step="0.01"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (dirty) onSave(Number(v) || 0); }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
      disabled={saving}
      className={`w-24 text-right tabular-nums px-2 py-1 rounded text-ink-900 dark:text-slate-100 bg-transparent transition ${
        saving ? 'border border-amber-400 animate-pulse'
        : dirty ? 'border border-amber-400 bg-amber-50 dark:bg-amber-900/30'
        : 'border border-transparent hover:border-brand-300 focus:border-brand-500 focus:bg-brand-50/40 dark:hover:border-slate-600 dark:focus:bg-slate-800/50'
      } focus:outline-none focus:ring-2 focus:ring-brand-500/30`}
    />
  );
}

export default function SalaryRegister() {
  const { id } = useParams();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/payroll/runs/${id}`);
      setRun({ ...data, lines: Array.isArray(data.lines) ? data.lines : [] });
    } catch (e) { setError(e.response?.data?.error || e.message); setRun(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { setRun(null); load(); /* eslint-disable-next-line */ }, [id]);

  const processNow = async () => {
    setProcessing(true);
    try { await api.post(`/payroll/runs/${id}/process`); await load(); }
    catch (e) { setError('Process failed: ' + (e.response?.data?.error || e.message)); }
    finally { setProcessing(false); }
  };

  const updateField = async (line, field, value) => {
    setSavingId(`${line.id}-${field}`);
    try {
      const { data } = await api.put(`/payroll/lines/${line.id}?recompute=true`, { [field]: value });
      setRun(r => ({ ...r, lines: r.lines.map(l => l.id === line.id ? data : l) }));
    } catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setSavingId(null); }
  };

  const totals = useMemo(() => {
    const lines = (run && run.lines) || [];
    return lines.reduce((a, l) => ({
      gross: a.gross + (l.grossPay || 0),
      net:   a.net   + (l.netPay   || 0),
      pf:    a.pf    + (l.epf      || 0),
      esi:   a.esi   + (l.esi      || 0),
      pt:    a.pt    + (l.professionalTax || 0),
    }), { gross: 0, net: 0, pf: 0, esi: 0, pt: 0 });
  }, [run]);

  if (loading) return <div className="p-2 text-sm text-ink-600 dark:text-slate-300">Loading run…</div>;
  if (error && !run) {
    return (
      <div className="space-y-3">
        <Link to="/payroll" className="text-sm text-brand-700 dark:text-brand-300 inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Back to runs
        </Link>
        <div className="text-sm text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/40 p-3 rounded-md">{error}</div>
      </div>
    );
  }
  if (!run) return null;

  const lines = run.lines || [];
  const isEmpty = lines.length === 0;
  const isDraft = run.status === 'DRAFT';
  const locked = run.status === 'LOCKED';

  const statusPill = (s) => {
    const map = {
      DRAFT:     'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      PROCESSED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
      LOCKED:    'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
    };
    return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[s] || ''}`}>{s}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link to="/payroll" className="text-sm text-brand-700 dark:text-brand-300 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to runs
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-slate-50">Salary Register — {run.periodLabel}</h2>
            {statusPill(run.status)}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isEmpty && (
            <>
              <Button variant="outline" onClick={() => downloadBlob(`/api/reports/runs/${run.id}/salary-register.xlsx`, `SalaryRegister-${run.period}.xlsx`)}>
                <Download size={14} /> Salary Register
              </Button>
              <Button variant="outline" onClick={() => downloadBlob(`/api/reports/runs/${run.id}/bank-transfer.xlsx`, `BankTransfer-${run.period}.xlsx`)}>
                <Download size={14} /> Bank Transfer
              </Button>
              <Button variant="outline" onClick={() => downloadBlob(`/api/reports/runs/${run.id}/compliance.xlsx`, `Compliance-${run.period}.xlsx`)}>
                <Download size={14} /> Compliance
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={load}><RefreshCw size={14} /> Refresh</Button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/40 p-2 rounded-md"
          >{error}</motion.div>
        )}
      </AnimatePresence>

      {isEmpty && (
        <Card>
          <div className="py-12 text-center space-y-4">
            <div className="text-base text-ink-800 dark:text-slate-100">
              {isDraft ? 'This run has not been processed yet.' : 'This run has no lines.'}
            </div>
            <div className="text-sm text-ink-600 dark:text-slate-300">
              Click below to compute payroll for all active employees & new joinees.
            </div>
            {!locked && (
              <Button onClick={processNow} disabled={processing} size="lg">
                <Play size={14} /> {processing ? 'Processing… (5–10 s)' : 'Process payroll now'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {!isEmpty && (
        <>
          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-2 md:grid-cols-5 gap-3"
          >
            {[
              { label: 'GROSS', value: totals.gross, color: 'text-ink-900 dark:text-slate-50' },
              { label: 'NET',   value: totals.net,   color: 'text-brand-700 dark:text-brand-300' },
              { label: 'PF',    value: totals.pf,    color: 'text-ink-800 dark:text-slate-100' },
              { label: 'ESI',   value: totals.esi,   color: 'text-ink-800 dark:text-slate-100' },
              { label: 'PT',    value: totals.pt,    color: 'text-ink-800 dark:text-slate-100' },
            ].map(t => (
              <motion.div
                key={t.label}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card p-4"
              >
                <div className="text-[11px] font-semibold tracking-wider text-ink-500 dark:text-slate-400">{t.label}</div>
                <div className={`text-xl font-semibold tabular-nums mt-1 ${t.color}`}>{inr(t.value)}</div>
              </motion.div>
            ))}
          </motion.div>

          <Card>
            <div className="text-xs text-ink-700 dark:text-slate-300 mb-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700/40 px-3 py-2 rounded-md">
              <span className="font-medium text-brand-800 dark:text-brand-200">Tip:</span> Click any
              <span className="font-medium"> Income Tax</span> or
              <span className="font-medium"> Paid</span> cell to edit. Values auto-save and recompute on blur or Enter.
            </div>
            <div className="overflow-auto scrollbar-thin border border-slate-200 dark:border-slate-800 rounded-lg max-h-[calc(100vh-380px)] bg-white dark:bg-slate-900">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 bg-brand-50 dark:bg-slate-800/80 backdrop-blur">
                  <tr className="text-ink-800 dark:text-slate-100">
                    {['Emp No','Name','Dept','Paid Days','Basic','HRA','Fixed Allow','Earnings','EPF','PT','Income Tax','Net','Total Payable','Paid','Pending','PDF'].map((h, i) => (
                      <th key={h} className={`px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, idx) => (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, delay: Math.min(idx * 0.005, 0.3) }}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-brand-50/40 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-3 py-1.5 tabular-nums font-medium text-ink-700 dark:text-slate-300">{l.empNo}</td>
                      <td className="px-3 py-1.5 font-medium text-ink-900 dark:text-slate-50">{l.name}</td>
                      <td className="px-3 py-1.5 text-ink-600 dark:text-slate-300">{l.department}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-800 dark:text-slate-100">{l.effectivePaidDays}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-800 dark:text-slate-100">{inr(l.basic)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-800 dark:text-slate-100">{inr(l.hra)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-800 dark:text-slate-100">{inr(l.fixedAllowance)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-800 dark:text-slate-100">{inr(l.totalEarnings)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-800 dark:text-slate-100">{inr(l.epf)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-800 dark:text-slate-100">{inr(l.professionalTax)}</td>
                      <td className="px-3 py-1 text-right">
                        <EditableCell value={l.incomeTax} lineId={l.id} field="incomeTax" savingId={savingId}
                          onSave={(v) => updateField(l, 'incomeTax', v)} disabled={locked} />
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-brand-700 dark:text-brand-300">{inr(l.netPay)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-800 dark:text-slate-100">{inr(l.totalPayable)}</td>
                      <td className="px-3 py-1 text-right">
                        <EditableCell value={l.paid} lineId={l.id} field="paid" savingId={savingId}
                          onSave={(v) => updateField(l, 'paid', v)} disabled={locked} />
                      </td>
                      <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${l.pendingClosing > 0.01 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {inr(l.pendingClosing)}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          onClick={() => downloadBlob(`/api/reports/lines/${l.id}/payslip.pdf`, `Payslip-${l.empNo}.pdf`)}
                          className="inline-flex items-center gap-1 text-xs text-brand-700 dark:text-brand-300 hover:underline"
                        >
                          <FileText size={12} /> PDF
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
