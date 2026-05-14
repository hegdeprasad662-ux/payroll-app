import { cn } from '../lib/utils.js';

const baseField =
  'w-full px-3 py-2 text-sm rounded-md border bg-white text-ink-900 placeholder-ink-500 ' +
  'border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500 ' +
  'dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-700 dark:hover:border-slate-600';

export function Input({ className, ...rest }) {
  return <input className={cn(baseField, className)} {...rest} />;
}

export function Select({ className, children, ...rest }) {
  return (
    <select className={cn(baseField, 'pr-8 cursor-pointer', className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, rows = 3, ...rest }) {
  return <textarea rows={rows} className={cn(baseField, 'resize-none', className)} {...rest} />;
}

export function Label({ children, className }) {
  return <label className={cn('text-xs font-medium text-ink-700 dark:text-slate-300 mb-1 block', className)}>{children}</label>;
}
