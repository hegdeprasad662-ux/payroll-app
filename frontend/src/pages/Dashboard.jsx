import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, UserMinus, TrendingUp, Wallet, Banknote,
  Hourglass, Receipt,
} from 'lucide-react';
import api from '../lib/api.js';
import { Card } from '../components/Card.jsx';
import { KpiTile } from '../components/KpiTile.jsx';
import { inr } from '../lib/utils.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

const COLORS = ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#075985', '#0c4a6e'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-40 rounded bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const k = data.kpis;
  const complianceTotal = k.pfLiability + k.esiLiability + k.ptLiability;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-ink-900 dark:text-slate-50">Dashboard</h2>
          <p className="text-sm text-ink-600 dark:text-slate-300 mt-1">
            {data.periodLabel
              ? <>Latest payroll cycle: <span className="font-medium text-brand-700 dark:text-brand-300">{data.periodLabel}</span></>
              : 'No payroll processed yet — create a run to see metrics.'}
          </p>
        </div>
      </div>

      <motion.div
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'Total Employees', value: k.totalEmployees,           sub: `${k.activeEmployees} active`,  icon: Users },
          { label: 'New Joinees',     value: k.newJoinees,               icon: UserPlus,    accent: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Relieved',        value: k.relieved,                 icon: UserMinus,   accent: 'text-rose-600 dark:text-rose-400' },
          { label: 'Increments',      value: k.incrementCount,           icon: TrendingUp,  accent: 'text-brand-700 dark:text-brand-300' },
          { label: 'Gross Payroll',   value: inr(k.grossPayroll),        icon: Banknote },
          { label: 'Net Payroll',     value: inr(k.netPayroll),          icon: Wallet,     accent: 'text-brand-700 dark:text-brand-300' },
          { label: 'Pending Salary',  value: inr(k.pendingSalary),       icon: Hourglass,  accent: 'text-amber-600 dark:text-amber-400' },
          { label: 'Compliance Out',  value: inr(complianceTotal),       icon: Receipt,
            sub: `PF ${inr(k.pfLiability)} · ESI ${inr(k.esiLiability)} · PT ${inr(k.ptLiability)}` },
        ].map((t) => (
          <motion.div
            key={t.label}
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
          >
            <KpiTile {...t} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Department-wise gross cost" subtitle="Sum of gross pay per department" className="lg:col-span-2">
          {k.departmentCost?.length ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={k.departmentCost} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip
                    formatter={(v) => inr(v)}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart>No payroll data yet</EmptyChart>}
        </Card>

        <Card title="Compliance split" subtitle="PF / ESI / PT liability">
          {complianceTotal > 0 ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'PF',  value: k.pfLiability },
                      { name: 'ESI', value: k.esiLiability },
                      { name: 'PT',  value: k.ptLiability },
                    ]}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {[0, 1, 2].map(i => <Cell key={i} fill={COLORS[i]} stroke="white" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart>No compliance data</EmptyChart>}
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ children }) {
  return (
    <div className="h-[280px] grid place-items-center text-sm text-ink-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-md">
      {children}
    </div>
  );
}
