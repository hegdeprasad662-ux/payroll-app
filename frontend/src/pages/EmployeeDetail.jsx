import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api.js';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { Input, Select, Label } from '../components/Input.jsx';
import { inr } from '../lib/utils.js';

export default function EmployeeDetail() {
  const { id } = useParams();
  const [emp, setEmp] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => api.get(`/employees/${id}`).then(r => { setEmp(r.data); setForm(r.data); });
  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }, [toast]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/employees/${id}`, {
        name: form.name, department: form.department, designation: form.designation,
        email: form.email, ctcAnnual: Number(form.ctcAnnual || 0),
        basic: form.basic ? Number(form.basic) : null,
        hra: form.hra ? Number(form.hra) : null,
        conveyance: form.conveyance ? Number(form.conveyance) : null,
        fixedAllowance: form.fixedAllowance ? Number(form.fixedAllowance) : null,
        pan: form.pan, uan: form.uan, esiNumber: form.esiNumber,
        bankAccount: form.bankAccount, bankName: form.bankName, ifsc: form.ifsc,
        pendingSalaryOpening: Number(form.pendingSalaryOpening || 0),
        status: form.status,
      });
      setToast('Saved'); load();
    } finally { setSaving(false); }
  };

  if (!emp) return <div className="text-sm text-ink-600 dark:text-slate-300">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link to="/employees" className="text-sm text-brand-700 dark:text-brand-300 inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to employees
          </Link>
          <h2 className="text-2xl font-bold text-ink-900 dark:text-slate-50 mt-1">
            {emp.name} <span className="text-ink-500 dark:text-slate-400 text-base font-normal">· {emp.empNo}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {toast && <span className="text-sm text-emerald-700 dark:text-emerald-300">{toast}</span>}
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Profile" subtitle="Basic identity & employment">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><Input value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Department"><Input value={form.department ?? ''} onChange={e => setForm({ ...form, department: e.target.value })} /></Field>
            <Field label="Designation"><Input value={form.designation ?? ''} onChange={e => setForm({ ...form, designation: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email ?? ''} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Status">
              <Select value={form.status ?? 'ACTIVE'} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">Active</option>
                <option value="NEW_JOINEE">New Joinee</option>
                <option value="RELIEVED">Relieved</option>
              </Select>
            </Field>
            <Field label="CTC (annual ₹)"><Input type="number" value={form.ctcAnnual ?? 0} onChange={e => setForm({ ...form, ctcAnnual: e.target.value })} /></Field>
          </div>
        </Card>

        <Card title="Salary structure overrides" subtitle="Leave blank to derive from CTC + Settings">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Basic (₹/mo)"><Input type="number" value={form.basic ?? ''} onChange={e => setForm({ ...form, basic: e.target.value })} /></Field>
            <Field label="HRA (₹/mo)"><Input type="number" value={form.hra ?? ''} onChange={e => setForm({ ...form, hra: e.target.value })} /></Field>
            <Field label="Conveyance (₹/mo)"><Input type="number" value={form.conveyance ?? ''} onChange={e => setForm({ ...form, conveyance: e.target.value })} /></Field>
            <Field label="Fixed Allowance (₹/mo)"><Input type="number" value={form.fixedAllowance ?? ''} onChange={e => setForm({ ...form, fixedAllowance: e.target.value })} /></Field>
            <Field label="Pending Opening (₹)" wide><Input type="number" value={form.pendingSalaryOpening ?? 0} onChange={e => setForm({ ...form, pendingSalaryOpening: e.target.value })} /></Field>
          </div>
        </Card>

        <Card title="Statutory & Bank">
          <div className="grid grid-cols-2 gap-4">
            <Field label="PAN"><Input value={form.pan ?? ''} onChange={e => setForm({ ...form, pan: e.target.value })} /></Field>
            <Field label="UAN"><Input value={form.uan ?? ''} onChange={e => setForm({ ...form, uan: e.target.value })} /></Field>
            <Field label="ESI Number"><Input value={form.esiNumber ?? ''} onChange={e => setForm({ ...form, esiNumber: e.target.value })} /></Field>
            <Field label="Bank Name"><Input value={form.bankName ?? ''} onChange={e => setForm({ ...form, bankName: e.target.value })} /></Field>
            <Field label="Account Number"><Input value={form.bankAccount ?? ''} onChange={e => setForm({ ...form, bankAccount: e.target.value })} /></Field>
            <Field label="IFSC"><Input value={form.ifsc ?? ''} onChange={e => setForm({ ...form, ifsc: e.target.value })} /></Field>
          </div>
        </Card>

        <Card title="Payroll history" subtitle="Last 12 months of processed runs">
          {emp.payrollLines?.length ? (
            <div className="overflow-auto max-h-96 scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="text-ink-700 dark:text-slate-300 text-xs uppercase tracking-wide bg-brand-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold">Period</th>
                    <th className="text-right px-3 font-semibold">Gross</th>
                    <th className="text-right px-3 font-semibold">Deductions</th>
                    <th className="text-right px-3 font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {emp.payrollLines.map(l => (
                    <tr key={l.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 px-3 text-ink-800 dark:text-slate-100">{l.run?.periodLabel || l.run?.period}</td>
                      <td className="text-right tabular-nums px-3 text-ink-800 dark:text-slate-100">{inr(l.grossPay)}</td>
                      <td className="text-right tabular-nums px-3 text-ink-700 dark:text-slate-300">{inr(l.totalDeductions)}</td>
                      <td className="text-right tabular-nums px-3 font-semibold text-brand-700 dark:text-brand-300">{inr(l.netPay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="text-sm text-ink-500 dark:text-slate-400 text-center py-6">No payroll history yet</div>}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
