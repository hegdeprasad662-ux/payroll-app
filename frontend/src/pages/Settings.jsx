import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Upload, Download, FileSpreadsheet, Users, Briefcase, CalendarX, AlertTriangle, Trash2, UserPlus, KeyRound, X } from 'lucide-react';
import api from '../lib/api.js';
import { Card } from '../components/Card.jsx';
import { Input, Label } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';
import { inr, downloadBlob } from '../lib/utils.js';

/* ===== Numeric / formula settings ===== */
const formulaLabels = {
  basicPercent:       ['Basic % of monthly CTC', '0.40 = 40% of CTC/12 becomes Basic'],
  hraPercent:         ['HRA % of Basic', '0.40 = HRA is 40% of Basic'],
  conveyance:         ['Conveyance (₹/month)', 'Fixed monthly amount, default ₹1,600'],
  pfRate:             ['PF rate (decimal)', '0.12 = 12% standard EPF rate'],
  pfBasicCap:         ['PF Basic cap (₹)', 'PF capped at this Basic value (default ₹15,000)'],
  esiRate:            ['ESI rate (decimal)', '0.0075 = 0.75% employee contribution'],
  esiGrossThreshold:  ['ESI gross eligibility (₹)', 'ESI applied when gross ≤ this'],
  ptThreshold:        ['Karnataka PT gross threshold (₹)', '> threshold → PT applies'],
  ptAmount:           ['Karnataka PT amount (₹)', 'Default ₹200'],
  defaultMonthDays:   ['Default days in month', 'Used for LOP / Sunday / Festival pro-rating'],
  sundayRate:         ['Sunday wage rate (decimal)', '0.30 = Sunday pay is 30% of daily fixed earnings'],
  festivalRate:       ['Festival wage rate (decimal)', '0.50 = Festival pay is 50% of daily fixed earnings'],
  ptState:            ['PT state code', 'For UI/labels only'],
  // Income Tax — Finance Act 2025
  autoTds:            ['Auto-deduct monthly TDS', '1 = on, 0 = off. Employees only. Computed using FY 2025-26 New Regime slabs.'],
  taxRegime:          ['Tax regime', 'NEW_2025 = Finance Act 2025 / FY 2025-26 New Regime (default)'],
  stdDeduction:       ['Standard deduction (₹)', '₹75,000 in the new regime'],
  rebate87AThreshold: ['87A rebate threshold (₹)', 'Taxable income ≤ this gets full rebate'],
  rebate87AMax:       ['Max 87A rebate (₹)', '₹60,000 — wipes out tax up to ~₹12L taxable'],
  cessRate:           ['Health & Education cess (decimal)', '0.04 = 4% on (tax + surcharge)'],
};

export default function Settings() {
  const [s, setS] = useState({});
  const [saving, setSaving] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { api.get('/settings').then(r => setS(r.data)); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  const save = async (key) => {
    setSaving(key);
    try { await api.post('/settings', { key, value: s[key] }); setToast({ type: 'ok', msg: `${key} saved` }); }
    finally { setSaving(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink-900 dark:text-slate-50">Settings</h2>
        <p className="text-sm text-ink-600 dark:text-slate-300 mt-1">Payroll formulas, bulk uploads, and templates.</p>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={
              'fixed top-20 right-6 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg font-medium ' +
              (toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')
            }
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- BULK UPLOADS ---------------- */}
      <Card title="Bulk uploads" subtitle="Upsert employee master & monthly LOP data from Excel">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UploadTile
            title="Employees master"
            description="Excel with columns: Emp ID, Name, CTC Annual, optional Department/Designation/Email/DOJ. Upserts by Emp ID."
            icon={Users}
            uploadPath="/bulk-uploads/employees"
            templatePath="/api/bulk-uploads/template/employees"
            templateName="employees-template.xlsx"
            setToast={setToast}
            color="text-brand-700"
          />
          <UploadTile
            title="Consultants master"
            description="Excel with columns: Name, CTC Annual, TDS % (e.g. 10 = 10%). Emp ID is OPTIONAL — auto-generated from name when blank. No PF/ESI/PT; TDS auto-deducted."
            icon={Briefcase}
            uploadPath="/bulk-uploads/consultants"
            templatePath="/api/bulk-uploads/template/consultants"
            templateName="consultants-template.xlsx"
            setToast={setToast}
            color="text-violet-700"
          />
          <UploadTile
            title="LOP for a period"
            description="Excel with columns: Emp ID, Name, LOP Days, Sunday Days, Festival Days. Asks for the period."
            icon={CalendarX}
            uploadPath="/bulk-uploads/lop"
            templatePath="/api/bulk-uploads/template/lop"
            templateName="lop-template.xlsx"
            requiresPeriod
            setToast={setToast}
            color="text-amber-700"
          />
        </div>
        <div className="mt-4 text-xs text-ink-600 dark:text-slate-300 bg-brand-50/60 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700/40 rounded-md p-3">
          <strong className="text-brand-800 dark:text-brand-200">Note:</strong> After uploading, the next payroll run automatically includes
          all <strong>Active</strong> &amp; <strong>New Joinee</strong> rows — both Employees and Consultants. The engine derives
          monthly Basic / HRA / Conveyance / Fixed Allowance from <code className="text-[11px] bg-white dark:bg-slate-800 px-1 rounded">CTC ÷ 12</code> using
          the formulas configured below.
        </div>
      </Card>

      {/* ---------------- ADMIN USERS ---------------- */}
      <AdminUsersCard setToast={setToast} />

      {/* ---------------- DANGER ZONE / RESET ---------------- */}
      <ResetCard setToast={setToast} />

      {/* ---------------- FORMULAS ---------------- */}
      <Card title="Payroll formulas" subtitle="All calculations read from these · save each row individually">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Object.entries(formulaLabels).map(([k, [lbl, hint]]) => (
            <div key={k} className="grid grid-cols-12 gap-4 items-center py-3 first:pt-0 last:pb-0">
              <div className="col-span-12 md:col-span-5">
                <div className="text-sm font-medium text-ink-900 dark:text-slate-100">{lbl}</div>
                <div className="text-xs text-ink-600 dark:text-slate-400 mt-0.5">{hint}</div>
              </div>
              <div className="col-span-8 md:col-span-5">
                <Input value={s[k] ?? ''} onChange={e => setS({ ...s, [k]: e.target.value })} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <Button variant="outline" className="w-full" onClick={() => save(k)} disabled={saving === k}>
                  <Save size={12} /> {saving === k ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Upload tile component ---------------- */

function UploadTile({ title, description, icon: Icon, uploadPath, templatePath, templateName, requiresPeriod, setToast, color }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const upload = async () => {
    if (!file) { setToast({ type: 'error', msg: 'Pick a file first' }); return; }
    if (requiresPeriod && !period) { setToast({ type: 'error', msg: 'Period required (YYYY-MM)' }); return; }
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (requiresPeriod) fd.append('period', period);
      const { data } = await api.post(uploadPath, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      const total = (data.created || 0) + (data.updated || 0);
      setToast({ type: 'ok', msg: `${title}: ${total} rows processed` });
    } catch (e) {
      setToast({ type: 'error', msg: e.response?.data?.error || e.message });
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className={`h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 grid place-items-center ${color || 'text-brand-700'} dark:!text-brand-300`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink-900 dark:text-slate-50">{title}</div>
          <p className="text-xs text-ink-600 dark:text-slate-300 mt-0.5 leading-snug">{description}</p>
        </div>
      </div>

      {requiresPeriod && (
        <div className="mb-2">
          <Label>Period</Label>
          <Input value={period} onChange={e => setPeriod(e.target.value)} placeholder="2025-04" />
        </div>
      )}

      <div className="mb-3">
        <Label>Excel file (.xlsx / .xls / .csv)</Label>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
          className="cursor-pointer border border-dashed border-slate-300 dark:border-slate-700 rounded-md px-3 py-3 text-xs text-ink-600 dark:text-slate-300 hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition flex items-center gap-2"
        >
          <FileSpreadsheet size={14} className="text-brand-600 shrink-0" />
          <span className="truncate">
            {file ? <span className="text-ink-900 dark:text-slate-100 font-medium">{file.name}</span> : 'Click or drop a file here'}
          </span>
        </div>
        <input
          ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
      </div>

      <div className="flex gap-2 mt-auto">
        <Button onClick={upload} disabled={!file || busy} className="flex-1">
          <Upload size={13} /> {busy ? 'Uploading…' : 'Upload'}
        </Button>
        <Button variant="outline" onClick={() => downloadBlob(templatePath, templateName)}>
          <Download size={13} />
        </Button>
      </div>

      {result && (
        <div className="mt-3 text-xs space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="grid grid-cols-3 gap-1">
            <Pill label="Created" value={result.created || 0} tone="emerald" />
            <Pill label="Updated" value={result.updated || 0} tone="brand" />
            <Pill label="Skipped" value={result.skipped || 0} tone="slate" />
          </div>
          {result.errors?.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-rose-700 dark:text-rose-300">{result.errors.length} row error(s)</summary>
              <ul className="mt-1 max-h-32 overflow-auto list-disc list-inside text-rose-700 dark:text-rose-300">
                {result.errors.slice(0, 20).map((er, i) => (
                  <li key={i}>{(er.row && (er.row.empNo || er.row.name)) || String(er.row || '?')} — {er.error}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Admin Users card ---------------- */

function AdminUsersCard({ setToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [resetForId, setResetForId] = useState(null);
  const [resetPwd, setResetPwd] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/admin/users'); setUsers(data || []); }
    catch (e) { setToast({ type: 'error', msg: 'Load failed: ' + (e.response?.data?.error || e.message) }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/admin/users', form);
      setForm({ email: '', name: '', password: '' });
      setCreating(false);
      setToast({ type: 'ok', msg: `Admin user ${form.email} created` });
      await load();
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || err.message });
    } finally { setBusy(false); }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put(`/admin/users/${resetForId}/password`, { password: resetPwd });
      setResetForId(null); setResetPwd('');
      setToast({ type: 'ok', msg: 'Password reset' });
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || err.message });
    } finally { setBusy(false); }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete admin user ${u.email}? They will lose access immediately.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      setToast({ type: 'ok', msg: `Deleted ${u.email}` });
      await load();
    } catch (err) {
      setToast({ type: 'error', msg: err.response?.data?.error || err.message });
    }
  };

  return (
    <Card
      title="Admin users"
      subtitle="Anyone you add here can log into this payroll system. Use strong passwords."
      action={
        <Button onClick={() => setCreating(c => !c)}>
          {creating ? <><X size={14} /> Close</> : <><UserPlus size={14} /> Add admin</>}
        </Button>
      }
    >
      {creating && (
        <motion.form
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={submit}
          className="mb-4 p-4 rounded-lg border border-brand-200 dark:border-brand-700/40 bg-brand-50/50 dark:bg-brand-900/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>Email *</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@company.com" /></div>
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></div>
            <div><Label>Password * (min 8)</Label><Input type="password" required minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setCreating(false); setForm({ email: '', name: '', password: '' }); }}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create admin'}</Button>
          </div>
        </motion.form>
      )}

      {resetForId && (
        <motion.form
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={submitReset}
          className="mb-4 p-4 rounded-lg border border-amber-200 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-900/20"
        >
          <div className="text-sm text-amber-900 dark:text-amber-100 font-medium mb-2">Reset password</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2"><Label>New password (min 8)</Label><Input type="password" required minLength={8} value={resetPwd} onChange={e => setResetPwd(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => { setResetForId(null); setResetPwd(''); }}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Reset'}</Button>
            </div>
          </div>
        </motion.form>
      )}

      <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 dark:bg-slate-800/80 text-ink-800 dark:text-slate-100">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Email</th>
              <th className="text-left px-3 py-2 font-semibold">Name</th>
              <th className="text-left px-3 py-2 font-semibold">Created</th>
              <th className="text-right px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-3 py-6 text-center text-ink-500">Loading…</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-ink-500">No admin users — shouldn't happen.</td></tr>}
            {users.map(u => (
              <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2 text-ink-900 dark:text-slate-100 font-medium">{u.email}</td>
                <td className="px-3 py-2 text-ink-700 dark:text-slate-300">{u.name || <span className="text-ink-500">—</span>}</td>
                <td className="px-3 py-2 text-ink-600 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => { setResetForId(u.id); setResetPwd(''); }}
                          className="inline-flex items-center gap-1 text-xs text-brand-700 dark:text-brand-300 hover:underline mr-3">
                    <KeyRound size={12} /> Reset password
                  </button>
                  <button onClick={() => remove(u)}
                          className="inline-flex items-center gap-1 text-xs text-rose-700 dark:text-rose-300 hover:underline">
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------------- Reset card (danger zone) ---------------- */

function ResetCard({ setToast }) {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const expected = 'RESET';

  const reset = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/admin/reset-employees');
      setLastResult(data.deleted);
      setConfirmText('');
      setToast({ type: 'ok', msg: 'Employee data wiped. Upload fresh files from above.' });
    } catch (e) {
      setToast({ type: 'error', msg: e.response?.data?.error || e.message });
    } finally { setBusy(false); }
  };

  return (
    <Card title="Reset employee data" subtitle="Wipe all employees, consultants, LOP, incentives, arrears, referrals, others & payroll runs. Settings and admin user are kept.">
      <div className="border border-rose-200 dark:border-rose-700/40 bg-rose-50 dark:bg-rose-900/20 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-rose-600 dark:text-rose-300 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800 dark:text-rose-200">
            This is irreversible. Use it before uploading your real employee + consultant master files.
            After reset you'll need to re-upload everything.
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1">
            <Label>Type <code className="text-rose-700 dark:text-rose-300">{expected}</code> to confirm</Label>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={expected}
              className="border-rose-300 focus:ring-rose-500 dark:border-rose-700"
            />
          </div>
          <Button variant="danger" disabled={confirmText !== expected || busy} onClick={reset}>
            <Trash2 size={14} /> {busy ? 'Wiping…' : 'Reset all employee data'}
          </Button>
        </div>
        {lastResult && (
          <div className="text-xs text-rose-800 dark:text-rose-200 bg-white/60 dark:bg-slate-900/40 rounded-md p-2 border border-rose-200 dark:border-rose-700/40">
            Deleted: {Object.entries(lastResult).map(([k, v]) => `${k}=${v}`).join(' · ')}
          </div>
        )}
      </div>
    </Card>
  );
}

function Pill({ label, value, tone }) {
  const map = {
    emerald: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    brand:   'bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-200',
    slate:   'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  };
  return (
    <div className={`rounded-md text-center py-1 px-2 font-medium ${map[tone]}`}>
      <div className="text-[10px] uppercase opacity-80">{label}</div>
      <div className="text-sm tabular-nums">{value}</div>
    </div>
  );
}
