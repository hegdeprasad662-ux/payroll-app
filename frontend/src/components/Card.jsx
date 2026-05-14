import { cn } from '../lib/utils.js';
export function Card({ className, children, title, subtitle, action }) {
  return (
    <div className={cn(
      'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card',
      className
    )}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            {title && <h3 className="text-sm font-semibold text-ink-900 dark:text-slate-50">{title}</h3>}
            {subtitle && <p className="text-xs text-ink-600 dark:text-slate-300 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
