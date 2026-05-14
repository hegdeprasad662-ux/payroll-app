import { cn } from '../lib/utils.js';
export function KpiTile({ label, value, sub, accent, icon: Icon, trend }) {
  return (
    <div className={cn(
      'group relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
      'shadow-card hover:shadow-cardHover transition-all duration-200 p-4'
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-500 dark:text-slate-400">{label}</div>
          <div className={cn('mt-1.5 text-2xl font-semibold tabular-nums', accent || 'text-ink-900 dark:text-slate-50')}>
            {value}
          </div>
          {sub && <div className="mt-1 text-xs text-ink-600 dark:text-slate-300">{sub}</div>}
        </div>
        {Icon && (
          <div className="h-9 w-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 grid place-items-center shrink-0">
            <Icon size={18} />
          </div>
        )}
      </div>
      {trend != null && (
        <div className={`mt-2 text-xs font-medium inline-flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
      {/* subtle accent strip */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-400 to-brand-600 opacity-0 group-hover:opacity-100 transition" />
    </div>
  );
}
