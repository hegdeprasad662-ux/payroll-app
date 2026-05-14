import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserMinus, Save, Trash2, AlertCircle, ChevronDown, ListChecks } from 'lucide-react';
import api from '../lib/api.js';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { Input, Select, Label } from '../components/Input.jsx';
import { inr } from '../lib/utils.js';

const tabs = [
  { id: 'all',      label: 'All Employees & Inputs', icon: ListChecks },
  { id: 'new',      label: 'Add New Joinee',         icon: UserPlus },
  { id: 'relieved', label: 'Mark Relieved',          icon: UserMinus },
];

const emptyNewJoinee = {
  empNo: '', name: '', department: '', designation: '', email: '',
  doj: '', ctcAnnual: 0,
  bankAccount: '', bankName: '', ifsc: '', pan: '', uan: '', esiNumber: '',
};

const statusPill = (s) => {
  const map = {
    ACTIVE:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    NEW_JOINEE:'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200',
    RELIEVED:  'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${map[s] || ''}`}>{s}</span>;
};

export default function MonthlyInputs() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE_AND_NEW');
  const [savingKey, setSavingKey] = useState(null);
  const [toast, setToast] = useState(null);
  const [expanded, setExpanded] = useState({});

  const [newJoinee, setNewJoinee] = useState(emptyNewJoinee);
  const [relieveTarget, setRelieveTarget] = useState({ employeeId: '', dol: new Date().toISOString().slice(0, 10), remarks: '' });

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/payroll-inputs/${period}`); setData(data); }
    catch (e) { setToast({ type: 'error', msg: 'Load failed: ' + (e.response?.data?.error || e.message) }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [period]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2800); return () => clearTimeout(t); }, [toast]);

  const employees = useMemo(() => {
    if (!data) return [];
    let list = data.employees;
    if (statusFilter === 'ACTIVE_AND_NEW') list = list.filter(e => e.status !== 'RELIEVED');
    else if (statusFilter !== 'ALL') list = list.filter(e => e.status === statusFilter);
    if (filter) {
      const q = filter.toLowerCase();
      list = list.filter(e =>
        (e.empNo || '').toLowerCase().includes(q) ||
        (e.name || '').toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, statusFilter, filter]);

  const save = async (key, fn) => {
    setSavingKey(key);
    try { await fn(); setToast({ type: 'ok', msg: 'Saved' }); await load(); }
    catch (e) { setToast({ type: 'error', msg: 'Save failed: ' + (e.response?.data?.error || e.message) }); }
    finally { setSavingKey(null); }
  };

  const saveLop = (emp, v) => save(`lop-${emp.id}`, () => api.put(`/payroll-inputs/${period}/lop/${emp.id}`, v));
  const saveIncentive = (emp, v) => save(`inc-${emp.id}`, () => api.put(`/payroll-inputs/${period}/incentive/${emp.id}`, v));
  const saveArrear = (emp, v) => save(`arr-${emp.id}`, () => api.put(`/payroll-inputs/${period}/arrear/${emp.id}`, v));
  const saveReferral = (emp, v) => save(`ref-${emp.id}`, () => api.put(`/payroll-inputs/${period}/referral/${emp.id}`, v));
  const saveOther = (emp, v) => save(`oth-${emp.id}`, () => api.put(`/payroll-inputs/${period}/other/${emp.id}`, v));
  const removeInput = (emp, type) => save(`del-${type}-${emp.id}`, () => api.delete(`/payroll-inputs/${period}/${type}/${emp.id}`));

  const addJoinee = async () => {
    if (!newJoinee.empNo || !newJoinee.name || !newJoinee.ctcAnnual) {
      setToast({ type: 'error', msg: 'Emp No, Name and CTC are required' });
      return;
    }
    setSavingKey('add-joinee');
    try {
      await api.post('/employees', {
        ...newJoinee, ctcAnnual: Number(newJoinee.ctcAnnual),
        status: 'NEW_JOINEE', doj: newJoinee.doj || null,
      });
      setToast({ type: 'ok', msg: `Added ${newJoinee.name}` });
      setNewJoinee(emptyNewJoinee);
      await load();
      setTab('all');
    } catch (e) { setToast({ type: 'error', msg: e.response?.data?.error || e.message }); }
    finally { setSavingKey(null); }
  };

  const markRelieved = async () => {
    if (!relieveTarget.employeeId) { setToast({ type: 'error', msg: 'Select an employee' }); return; }
    setSavingKey('relieve');
    try {
      await api.put(`/employees/${relieveTarget.employeeId}`, {
        status: 'RELIEVED', dol: relieveTarget.dol, notes: relieveTarget.remarks,
      });
      setToast({ type: 'ok', msg: 'Employee marked as relieved' });
      setRelieveTarget({ employeeId: '', dol: new Date().toISOString().slice(0, 10), remarks: '' });
      await load();
      setTab('all');
    } catch (e) { setToast({ type: 'error', msg: e.response?.data?.error || e.message }); }
    finally { setSavingKey(null); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }} className="space-y-5"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-ink-900 dark:text-slate-50">Monthly Inputs</h2>
          <p className="text-sm text-ink-600 dark:text-slate-300 mt-1">
            Manually enter LOP, incentives, arrears, referral & other payments per employee for the payroll period.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <Label>Period</Label>
            <Input className="w-36" value={period} onChange={e => setPeriod(e.target.value)} placeholder="2025-04" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition inline-flex items-center gap-2 ${
                active ? 'text-brand-700 dark:text-brand-300' : 'text-ink-600 dark:text-slate-300 hover:text-ink-900 dark:hover:text-slate-100'
              }`}
            >
              <t.icon size={15} />
              {t.label}
              {active && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-600 rounded"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={
              'fixed top-20 right-6 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg font-medium ' +
              (toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')
            }
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'all' && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Input className="w-64" placeholder="Search name, empNo, dept…" value={filter} onChange={e => setFilter(e.target.value)} />
                  <Select className="w-52" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="ACTIVE_AND_NEW">Active + New Joinees</option>
                    <option value="ACTIVE">Active only</option>
                    <option value="NEW_JOINEE">New Joinees only</option>
                    <option value="RELIEVED">Relieved only</option>
                    <option value="ALL">All</option>
                  </Select>
                </div>
                {loading
                  ? <span className="text-xs text-ink-500 dark:text-slate-400">Loading…</span>
                  : <span className="text-xs text-ink-700 dark:text-slate-300"><strong>{employees.length}</strong> employee(s)</span>}
              </div>

              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-auto scrollbar-thin pr-1">
                {employees.map((emp, idx) => (
                  <EmployeeRow
                    key={emp.id}
                    idx={idx}
                    emp={emp}
                    period={period}
                    expanded={!!expanded[emp.id]}
                    onToggle={() => setExpanded(x => ({ ...x, [emp.id]: !x[emp.id] }))}
                    lop={data?.lop?.[emp.id]}
                    incentive={data?.incentives?.[emp.id]}
                    arrear={data?.arrears?.[emp.id]}
                    referral={data?.referrals?.[emp.id]}
                    other={data?.others?.[emp.id]}
                    savingKey={savingKey}
                    onSaveLop={(v) => saveLop(emp, v)}
                    onSaveIncentive={(v) => saveIncentive(emp, v)}
                    onSaveArrear={(v) => saveArrear(emp, v)}
                    onSaveReferral={(v) => saveReferral(emp, v)}
                    onSaveOther={(v) => saveOther(emp, v)}
                    onRemove={(t) => removeInput(emp, t)}
                  />
                ))}
                {!loading && employees.length === 0 && (
                  <div className="py-10 text-center text-sm text-ink-500 dark:text-slate-400">No employees match the filter</div>
                )}
              </div>
            </Card>
          )}

          {tab === 'new' && (
            <Card title="Add new joinee" subtitle="They'll be created with status NEW_JOINEE and included in the next payroll run">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  ['Emp No *', 'empNo'], ['Name *', 'name'], ['Department', 'department'],
                  ['Designation', 'designation'], ['Email', 'email'],
                  ['DOJ (YYYY-MM-DD)', 'doj'], ['CTC Annual *', 'ctcAnnual'],
                  ['PAN', 'pan'], ['UAN', 'uan'], ['ESI Number', 'esiNumber'],
                  ['Bank Name', 'bankName'], ['Account Number', 'bankAccount'], ['IFSC', 'ifsc'],
                ].map(([lbl, k]) => (
                  <div key={k}>
                    <Label>{lbl}</Label>
                    <Input
                      type={k === 'ctcAnnual' ? 'number' : 'text'}
                      value={newJoinee[k] ?? ''}
                      onChange={(e) => setNewJoinee({ ...newJoinee, [k]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setNewJoinee(emptyNewJoinee)}>Clear</Button>
                <Button onClick={addJoinee} disabled={savingKey === 'add-joinee'}>
                  {savingKey === 'add-joinee' ? 'Adding…' : 'Add Joinee'}
                </Button>
              </div>
            </Card>
          )}

          {tab === 'relieved' && (
            <Card title="Mark an employee as relieved" subtitle="Excludes them from future payroll runs starting next period">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Employee</Label>
                  <Select value={relieveTarget.employeeId} onChange={e => setRelieveTarget({ ...relieveTarget, employeeId: e.target.value })}>
                    <option value="">Select…</option>
                    {(data?.employees || []).filter(e => e.status !== 'RELIEVED').map(e => (
                      <option key={e.id} value={e.id}>{e.empNo} — {e.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Date of Leaving</Label>
                  <Input type="date" value={relieveTarget.dol} onChange={e => setRelieveTarget({ ...relieveTarget, dol: e.target.value })} />
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Input value={relieveTarget.remarks} onChange={e => setRelieveTarget({ ...relieveTarget, remarks: e.target.value })} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 px-3 py-2 rounded-md">
                <AlertCircle size={14} />
                Relieved employees are excluded from future payroll runs. Their existing pay history remains intact.
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="danger" onClick={markRelieved} disabled={savingKey === 'relieve'}>
                  {savingKey === 'relieve' ? 'Marking…' : 'Mark as Relieved'}
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------------- Employee row (expandable) ---------------- */

function EmployeeRow({
  emp, idx, expanded, onToggle,
  lop, incentive, arrear, referral, other,
  savingKey,
  onSaveLop, onSaveIncentive, onSaveArrear, onSaveReferral, onSaveOther, onRemove,
}) {
  const monthlyGross = (emp.ctcAnnual || 0) / 12;
  const hasInputs = !!(lop || incentive || arrear || referral || other);

  const [lopForm, setLopForm] = useState({
    lopDays: lop?.lopDays || 0, sundayDays: lop?.sundayDays || 0,
    festivalDays: lop?.festivalDays || 0, remarks: lop?.remarks || '',
  });
  const [incForm, setIncForm] = useState({ amount: incentive?.amount || 0, ancillary: incentive?.ancillary || '', remarks: incentive?.remarks || '' });
  const [arrForm, setArrForm] = useState({ amount: arrear?.amount || 0, days: arrear?.days || 0, remarks: arrear?.remarks || '' });
  const [refForm, setRefForm] = useState({ amount: referral?.amount || 0, referredName: referral?.referredName || '', remarks: referral?.remarks || '' });
  const [othForm, setOthForm] = useState({ amount: other?.amount || 0, travelling: other?.travelling || 0, ancillary: other?.ancillary || 0, description: other?.description || '', remarks: other?.remarks || '' });

  useEffect(() => {
    setLopForm({ lopDays: lop?.lopDays || 0, sundayDays: lop?.sundayDays || 0, festivalDays: lop?.festivalDays || 0, remarks: lop?.remarks || '' });
  }, [lop?.id, lop?.lopDays, lop?.sundayDays, lop?.festivalDays, lop?.remarks]);
  useEffect(() => { setIncForm({ amount: incentive?.amount || 0, ancillary: incentive?.ancillary || '', remarks: incentive?.remarks || '' }); }, [incentive?.id, incentive?.amount]);
  useEffect(() => { setArrForm({ amount: arrear?.amount || 0, days: arrear?.days || 0, remarks: arrear?.remarks || '' }); }, [arrear?.id, arrear?.amount]);
  useEffect(() => { setRefForm({ amount: referral?.amount || 0, referredName: referral?.referredName || '', remarks: referral?.remarks || '' }); }, [referral?.id, referral?.amount]);
  useEffect(() => { setOthForm({ amount: other?.amount || 0, travelling: other?.travelling || 0, ancillary: other?.ancillary || 0, description: other?.description || '', remarks: other?.remarks || '' }); }, [other?.id, other?.amount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(idx * 0.01, 0.2) }}
      className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-card hover:border-brand-300 dark:hover:border-slate-700 transition"
    >
      <div
        onClick={onToggle}
        className="w-full px-4 py-3 cursor-pointer hover:bg-brand-50/40 dark:hover:bg-slate-800/40 transition"
      >
        {/* TOP ROW — identity */}
        <div className="grid grid-cols-12 items-center gap-3 text-sm">
          <div className="col-span-2 tabular-nums font-medium text-ink-700 dark:text-slate-300">{emp.empNo}</div>
          <div className="col-span-4 flex items-center gap-2">
            <span className="font-semibold text-ink-900 dark:text-slate-50">{emp.name}</span>
            {(emp.employmentType === 'CONSULTANT')
              ? <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">CONSULTANT</span>
              : null}
          </div>
          <div className="col-span-2 text-ink-600 dark:text-slate-300">{emp.department || '-'}</div>
          <div className="col-span-2 text-right tabular-nums text-ink-800 dark:text-slate-100">{inr(monthlyGross)} <span className="text-ink-500 dark:text-slate-400">/mo</span></div>
          <div className="col-span-1 flex items-center gap-2 justify-end">
            {statusPill(emp.status)}
            {hasInputs && <span className="h-2 w-2 rounded-full bg-brand-500 shadow-glow" title="Has inputs for this period" />}
          </div>
          <div className="col-span-1 flex justify-end">
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} className="text-ink-500 dark:text-slate-400" />
            </motion.span>
          </div>
        </div>

        {/* SECOND ROW — baseline salary breakdown */}
        <BaselineRow emp={emp} />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="border-t border-slate-200 dark:border-slate-800 bg-brand-50/30 dark:bg-slate-900/60"
          >
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <InputBlock title="LOP / Leave" onSave={() => onSaveLop(lopForm)} onRemove={lop ? () => onRemove('lop') : null}
                saving={savingKey === `lop-${emp.id}` || savingKey === `del-lop-${emp.id}`}>
                <div className="grid grid-cols-3 gap-2">
                  <NumField label="LOP days" value={lopForm.lopDays} onChange={v => setLopForm({ ...lopForm, lopDays: v })} />
                  <NumField label="Sundays" value={lopForm.sundayDays} onChange={v => setLopForm({ ...lopForm, sundayDays: v })} />
                  <NumField label="Festival" value={lopForm.festivalDays} onChange={v => setLopForm({ ...lopForm, festivalDays: v })} />
                </div>
                <TextField label="Remarks" value={lopForm.remarks} onChange={v => setLopForm({ ...lopForm, remarks: v })} />
              </InputBlock>

              <InputBlock title="Incentive" onSave={() => onSaveIncentive(incForm)} onRemove={incentive ? () => onRemove('incentive') : null}
                saving={savingKey === `inc-${emp.id}` || savingKey === `del-incentive-${emp.id}`}>
                <div className="grid grid-cols-2 gap-2">
                  <NumField label="Amount (₹)" value={incForm.amount} onChange={v => setIncForm({ ...incForm, amount: v })} />
                  <TextField label="Ancillary note" value={incForm.ancillary} onChange={v => setIncForm({ ...incForm, ancillary: v })} />
                </div>
                <TextField label="Remarks" value={incForm.remarks} onChange={v => setIncForm({ ...incForm, remarks: v })} />
              </InputBlock>

              <InputBlock title="Arrears" onSave={() => onSaveArrear(arrForm)} onRemove={arrear ? () => onRemove('arrear') : null}
                saving={savingKey === `arr-${emp.id}` || savingKey === `del-arrear-${emp.id}`}>
                <div className="grid grid-cols-2 gap-2">
                  <NumField label="Amount (₹)" value={arrForm.amount} onChange={v => setArrForm({ ...arrForm, amount: v })} />
                  <NumField label="Days" value={arrForm.days} onChange={v => setArrForm({ ...arrForm, days: v })} />
                </div>
                <TextField label="Remarks" value={arrForm.remarks} onChange={v => setArrForm({ ...arrForm, remarks: v })} />
              </InputBlock>

              <InputBlock title="Referral Bonus" onSave={() => onSaveReferral(refForm)} onRemove={referral ? () => onRemove('referral') : null}
                saving={savingKey === `ref-${emp.id}` || savingKey === `del-referral-${emp.id}`}>
                <div className="grid grid-cols-2 gap-2">
                  <NumField label="Amount (₹)" value={refForm.amount} onChange={v => setRefForm({ ...refForm, amount: v })} />
                  <TextField label="Referred name" value={refForm.referredName} onChange={v => setRefForm({ ...refForm, referredName: v })} />
                </div>
                <TextField label="Remarks" value={refForm.remarks} onChange={v => setRefForm({ ...refForm, remarks: v })} />
              </InputBlock>

              <InputBlock title="Other / Reimbursement" onSave={() => onSaveOther(othForm)} onRemove={other ? () => onRemove('other') : null}
                saving={savingKey === `oth-${emp.id}` || savingKey === `del-other-${emp.id}`} wide>
                <div className="grid grid-cols-3 gap-2">
                  <NumField label="Total amount (₹)" value={othForm.amount} onChange={v => setOthForm({ ...othForm, amount: v })} />
                  <NumField label="Travelling" value={othForm.travelling} onChange={v => setOthForm({ ...othForm, travelling: v })} />
                  <NumField label="Ancillary" value={othForm.ancillary} onChange={v => setOthForm({ ...othForm, ancillary: v })} />
                </div>
                <TextField label="Description" value={othForm.description} onChange={v => setOthForm({ ...othForm, description: v })} />
                <TextField label="Remarks" value={othForm.remarks} onChange={v => setOthForm({ ...othForm, remarks: v })} />
              </InputBlock>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------------- Period-adjusted salary breakdown chip-row ---------------- */
function BaselineRow({ emp }) {
  const c = emp.computed || {};
  const isConsultant = emp.employmentType === 'CONSULTANT';
  const adjusted = !!c.periodAdjusted;

  const Chip = ({ label, value, accent, hint }) => (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-ink-500 dark:text-slate-400">{label}</span>
      <span className={`text-xs font-medium tabular-nums ${accent || 'text-ink-800 dark:text-slate-100'}`}>{inr(value)}</span>
      {hint && <span className="text-[9px] text-ink-500 dark:text-slate-400">{hint}</span>}
    </div>
  );

  const Badge = () => adjusted
    ? <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">LIVE FOR PERIOD</span>
    : <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">BASELINE</span>;

  if (isConsultant) {
    return (
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge />
          {adjusted && <span className="text-[10px] text-ink-500 dark:text-slate-400">includes period inputs</span>}
        </div>
        <div className="grid grid-cols-6 md:grid-cols-8 gap-3">
          <Chip label="Monthly CTC" value={c.monthlyCtc} />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-ink-500 dark:text-slate-400">TDS %</span>
            <span className="text-xs font-medium tabular-nums text-ink-800 dark:text-slate-100">{((c.tdsPercent || 0) * 100).toFixed(2)}%</span>
          </div>
          <Chip label="TDS Amount" value={c.tdsAmount} />
          {adjusted && c.sundayEarnings > 0 && <Chip label="Sunday +" value={c.sundayEarnings} accent="text-emerald-700 dark:text-emerald-300" />}
          {adjusted && c.festivalEarnings > 0 && <Chip label="Festival +" value={c.festivalEarnings} accent="text-emerald-700 dark:text-emerald-300" />}
          {adjusted && <Chip label="Gross" value={c.grossPay} />}
          <Chip label="Net Pay" value={c.netPay} accent="text-brand-700 dark:text-brand-300 font-semibold" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-1.5">
        <Badge />
        {adjusted && c.effectivePaidDays != null && (
          <span className="text-[10px] text-ink-600 dark:text-slate-300">
            Paid days: <strong>{c.effectivePaidDays}</strong>
          </span>
        )}
      </div>
      <div className="grid grid-cols-6 md:grid-cols-9 gap-3">
        <Chip label="Basic"        value={c.basic} />
        <Chip label="HRA"          value={c.hra} />
        <Chip label="Conv"         value={c.conveyance} />
        <Chip label="Fixed Allow"  value={c.fixedAllowance} />
        {adjusted && c.sundayEarnings > 0 &&
          <Chip label="Sunday +" value={c.sundayEarnings} accent="text-emerald-700 dark:text-emerald-300" />}
        {adjusted && c.festivalEarnings > 0 &&
          <Chip label="Festival +" value={c.festivalEarnings} accent="text-emerald-700 dark:text-emerald-300" />}
        <Chip label="EPF"          value={c.epf} />
        <Chip label="PT"           value={c.professionalTax} />
        <Chip label="Gross"        value={c.grossPay} />
        <Chip label={adjusted ? 'Net (period)' : 'Net (base)'} value={c.netPay}
          accent="text-brand-700 dark:text-brand-300 font-semibold" />
      </div>
    </div>
  );
}

function InputBlock({ title, children, onSave, onRemove, saving, wide }) {
  return (
    <div className={`rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 ${wide ? 'lg:col-span-2' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold uppercase tracking-wider text-ink-800 dark:text-slate-100">{title}</div>
        <div className="flex gap-1.5">
          {onRemove && (
            <Button variant="ghost" size="sm" onClick={onRemove} disabled={saving}>
              <Trash2 size={11} /> Clear
            </Button>
          )}
          <Button size="sm" onClick={onSave} disabled={saving}>
            <Save size={11} /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" step="0.01" value={value} onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
    </div>
  );
}
function TextField({ label, value, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value ?? ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
