import { cn } from '../lib/utils.js';
export function Button({ children, variant = 'primary', size = 'md', className, ...rest }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition rounded-md ' +
               'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 ' +
               'focus:ring-brand-500/60 focus:ring-offset-white dark:focus:ring-offset-slate-900';
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-4 py-2.5 text-sm',
  };
  const variants = {
    primary:   'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
    secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 ' +
               'dark:bg-brand-900/30 dark:text-brand-200 dark:hover:bg-brand-900/50',
    ghost:     'text-ink-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
    outline:   'border border-slate-300 text-ink-800 bg-white hover:bg-slate-50 ' +
               'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
    danger:    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}
