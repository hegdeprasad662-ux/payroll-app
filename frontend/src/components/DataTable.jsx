import { useMemo, useState } from 'react';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { Input } from './Input.jsx';

export function DataTable({ columns, data, initialSort, rowKey = 'id', onRowClick, dense, height, showSearch = true }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(initialSort || null);

  const filtered = useMemo(() => {
    if (!q) return data;
    const lower = q.toLowerCase();
    return data.filter(r =>
      columns.some(c => String(r[c.key] ?? '').toLowerCase().includes(lower))
    );
  }, [q, data, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    return [...filtered].sort((a, b) => {
      const va = a[key], vb = b[key];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return dir === 'asc' ? va - vb : vb - va;
      return dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [filtered, sort]);

  const toggleSort = (key) => {
    setSort((s) => !s || s.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null);
  };

  return (
    <div>
      {showSearch && (
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="relative w-72">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8" />
          </div>
          <div className="text-xs text-ink-600 dark:text-slate-400">
            Showing <span className="font-medium text-ink-800 dark:text-slate-200">{sorted.length}</span> of {data.length}
          </div>
        </div>
      )}
      <div className={cn('overflow-auto scrollbar-thin border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900', height)}>
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-brand-50 dark:bg-slate-800/80 z-10 backdrop-blur">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => c.sortable !== false && toggleSort(c.key)}
                  className={cn(
                    'text-left px-3 py-2.5 font-semibold text-ink-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 select-none whitespace-nowrap',
                    c.sortable !== false && 'cursor-pointer hover:bg-brand-100 dark:hover:bg-slate-700',
                    c.numeric && 'text-right'
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {sort?.key === c.key && (
                      sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr
                key={row[rowKey] ?? idx}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  'border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition',
                  'hover:bg-brand-50/60 dark:hover:bg-slate-800/50',
                  onRowClick && 'cursor-pointer',
                  dense ? 'h-9' : ''
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-3 py-2 text-ink-800 dark:text-slate-100', c.numeric && 'text-right tabular-nums')}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-ink-500 dark:text-slate-400">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
