import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, X, Briefcase, User } from 'lucide-react';
import api from '../lib/api.js';
import { Card } from '../components/Card.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { Button } from '../components/Button.jsx';
import { Input, Select, Label } from '../components/Input.jsx';
import { inr } from '../lib/utils.js';

const empty = {
  empNo: '', name: '', department: '', designation: '', email: '',
  ctcAnnual: 0, status: 'ACTIVE', employmentType: 'EMPLOYEE', tdsPercent: 0,
};

const statusPill = (s) => {
  const map = {
    ACTIVE:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    NEW_JOINEE:'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200',
    RELIEVED:  'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[s] || 'bg-slate-100 text-slate-700'}`}>{s}</span>;
};

const typePill = (t) => t === 'CONSULTANT'
  ? <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"><Briefcase size={10} /> Consultant</span>
  : <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><User size={10} /> Employee</span>;

const num = (v) => <span className="tabular-nums">{inr(v)}</span>;

export default function Employees() {
  const [list, setList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('EMPLOYEE'); // default tab
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    api.get('/employees', { params }).then(r => setList(r.data || []));
  };
  useEffect(load, [statusFilter]);

  const filtered = useMemo(() => {
    if (!typeFilter) return list;
    return list.filter(e => (e.employmentType || 'EMPLOYEE') === typeFilter);
  }, [list, typeFilter]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, ctcAnnual: Number(form.ctcAnnual) };

      // Consultants: Emp No is optional — auto-generate from name when missing.
      if (form.employmentType === 'CONSULTANT' && !payload.empNo && payload.name) {
        const slug = payload.name.trim().toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 16);
        payload.empNo = `CON-${slug || 'X'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      }
      if (form.employmentType === 'CONSULTANT' && form.tdsPercent) {
        const t = Number(form.tdsPercent);
        payload.tdsPercent = t > 1 ? t / 100 : t;
      }
      await api.post('/employees', payload);
      setCreating(false); setForm(empty); load();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally { setBusy(false); }
  };

  const empCount = list.filter(e => (e.employmentType || 'EMPLOYEE') === 'EMPLOYEE').length;
  const conCount = list.filter(e => e.employmentType === 'CONSULTANT').length;

  // Different column sets
  const employeeColumns = [
    { key: 'empNo',       header: 'Emp No' },
    { key: 'name',        header: 'Name' },
    { key: 'department',  header: 'Dept' },
    { key: 'ctcAnnual',   header: 'CTC (Annual)', numeric: true, render: r => num(r.ctcAnnual) },
    { key: 'monthlyCtc',  header: 'Monthly CTC', numeric: true, render: r => num(r.computed?.monthlyCtc) },
    { key: 'basic',       header: 'Basic', numeric: true, render: r => num(r.computed?.basic) },
    { key: 'hra',         header: 'HRA', numeric: true, render: r => num(r.computed?.hra) },
    { key: 'conveyance',  header: 'Conv', numeric: true, render: r => num(r.computed?.conveyance) },
    { key: 'fixedAllowance', header: 'Fixed Allow', numeric: true, render: r => num(r.computed?.fixedAllowance) },
    { key: 'epf',         header: 'EPF', numeric: true, render: r => num(r.computed?.epf) },
    { key: 'professionalTax', header: 'PT', numeric: true, render: r => num(r.computed?.professionalTax) },
    { key: 'netPay',      header: 'Net (baseline)', numeric: true, render: r => <strong className="text-brand-700 dark:text-brand-300 tabular-nums">{inr(r.computed?.netPay)}</strong> },
    { key: 'status',      header: 'Status', render: r => statusPill(r.status) },
  ];

  const consultantColumns = [
    { key: 'empNo',       header: 'Emp No' },
    { key: 'name',        header: 'Name' },
    { key: 'ctcAnnual',   header: 'CTC (Annual)', numeric: true, render: r => num(r.ctcAnnual) },
    { key: 'monthlyCtc',  header: 'Monthly CTC', numeric: true, render: r => num(r.computed?.monthlyCtc) },
    { key: 'tdsPercent',  header: 'TDS %', numeric: true, render: r => <span className="tabular-nums">{((r.tdsPercent || 0) * 100).toFixed(2)}%</span> },
    { key: 'tdsAmount',   header: 'TDS Amount', numeric: true, render: r => num(r.computed?.tdsAmount) },
    { key: 'netPay',      header: 'Net Pay', numeric: true, render: r => <strong className="text-brand-700 dark:text-brand-300 tabular-nums">{inr(r.computed?.netPay)}</strong> },
    { key: 'email',       header: 'Email' },
    { key: 'status',      header: 'Status', render: r => statusPill(r.status) },
  ];

  // Mixed view (no type filter)
  const mixedColumns = [
    { key: 'empNo',           header: 'Emp No' },
    { key: 'name',            header: 'Name' },
    { key: 'employmentType',  header: 'Type', render: r => typePill(r.employmentType || 'EMPLOYEE') },
    { key: 'department',      header: 'Dept' },
    { key: 'ctcAnnual',       header: 'CTC', numeric: true, render: r => num(r.ctcAnnual) },
    { key: 'monthlyCtc',      header: 'Monthly', numeric: true, render: r => num(r.computed?.monthlyCtc) },
    { key: 'netPay',          header: 'Net Pay', numeric: true, render: r => <strong className="text-brand-700 dark:text-brand-300 tabular-nums">{inr(r.computed?.netPay)}</strong> },
    { key: 'status',          header: 'Status', render: r => statusPill(r.status) },
  ];

  const columns =
    typeFilter === 'EMPLOYEE'   ? employeeColumns :
    typeFilter === 'CONSULTANT' ? consultantColumns :
    mixedColumns;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-ink-900 dark:text-slate-50">Employees</h2>
          <p className="text-sm text-ink-600 dark:text-slate-300 mt-1">
            {empCount} employees · {conCount} consultants · monthly figures are the baseline (no LOP / extras)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-44">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="NEW_JOINEE">New Joinee</option>
            <option value="RELIEVED">Relieved</option>
          </Select>
          <Button onClick={() => setCreating(c => !c)}>
            {creating ? <><X size={14} /> Close</> : <><Plus size={14} /> Add</>}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'EMPLOYEE',   label: `Employees (${empCount})`,    icon: User },
          { id: 'CONSULTANT', label: `Consultants (${conCount})`,  icon: Briefcase },
          { id: '',           label: 'All',                          icon: null },
        ].map(t => {
          const active = typeFilter === t.id;
          return (
            <button
              key={t.id || 'all'}
              onClick={() => setTypeFilter(t.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition inline-flex items-center gap-2 ${
                active ? 'text-brand-700 dark:text-brand-300'
                       : 'text-ink-600 dark:text-slate-300 hover:text-ink-900 dark:hover:text-slate-100'
              }`}
            >
              {t.icon && <t.icon size={14} />}
              {t.label}
              {active && (
                <motion.div
                  layoutId="emp-tab-underline"
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-600 rounded"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {creating && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card title="New employee / consultant" subtitle="Pick the type — engine treats their pay differently">
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Emp No {form.employmentType === 'EMPLOYEE' ? '*' : <span className="text-ink-500 font-normal">(optional)</span>}</Label>
                <Input
                  required={form.employmentType === 'EMPLOYEE'}
                  value={form.empNo}
                  onChange={e => setForm({ ...form, empNo: e.target.value })}
                  placeholder={form.employmentType === 'CONSULTANT' ? 'Auto-generated from name' : ''}
                />
              </div>
              <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="CONSULTANT">Consultant</option>
                </Select>
              </div>
              <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div><Label>Designation</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>CTC (annual ₹)</Label><Input type="number" value={form.ctcAnnual} onChange={e => setForm({ ...form, ctcAnnual: e.target.value })} /></div>
              {form.employmentType === 'CONSULTANT' && (
                <div>
                  <Label>TDS % (e.g. 10)</Label>
                  <Input type="number" value={form.tdsPercent} onChange={e => setForm({ ...form, tdsPercent: e.target.value })} />
                </div>
              )}
              <div className="md:col-span-3 flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setCreating(false); setForm(empty); }}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      <Card>
        <DataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          onRowClick={(r) => navigate(`/employees/${r.id}`)}
          height="max-h-[calc(100vh-320px)]"
          dense
        />
      </Card>
    </div>
  );
}
