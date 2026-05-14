import { useState } from 'react';
import api from '../lib/api.js';
import { Card } from '../components/Card.jsx';
import { Button } from '../components/Button.jsx';
import { Input } from '../components/Input.jsx';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('period', period);
      const { data } = await api.post('/upload/inputs', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Upload Inputs</h2>
      <p className="text-sm text-slate-500 max-w-xl">
        Upload your monthly inputs workbook. Sheets auto-detected:
        New Joinees, Relieved, LOP, SALARY INCREMENT, ARREARS, Employee Referral Bonus, Incentives, OTHERS.
      </p>

      <Card>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Period (YYYY-MM)</label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2025-04" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Excel file</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-brand file:text-white"
              />
            </div>
          </div>
          <Button type="submit" disabled={!file || busy}>{busy ? 'Uploading…' : 'Upload + Parse'}</Button>
        </form>
      </Card>

      {error && <Card><div className="text-sm text-red-600">{error}</div></Card>}

      {result && (
        <Card title="Result">
          <div className="text-sm">
            <div className="mb-3">Sheets detected: <strong>{result.sheetsDetected.join(', ') || 'none'}</strong></div>
            <table className="w-full">
              <thead className="text-slate-500"><tr><th className="text-left">Type</th><th className="text-left">Source sheet</th><th className="text-right">Created</th><th className="text-right">Skipped</th></tr></thead>
              <tbody>
                {Object.entries(result.summary).map(([type, s]) => (
                  <tr key={type} className="border-t border-slate-100">
                    <td className="py-1">{type}</td>
                    <td className="py-1 text-slate-500">{s.sheet}</td>
                    <td className="py-1 text-right tabular-nums text-emerald-700">{s.created}</td>
                    <td className="py-1 text-right tabular-nums text-slate-500">{s.skipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.errors?.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-rose-700 font-medium mb-1">{result.errors.length} row error(s):</div>
                <ul className="text-xs text-rose-700 max-h-40 overflow-auto list-disc list-inside">
                  {result.errors.map((er, i) => <li key={i}>[{er.sheet}] {String(er.row)} — {er.error}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
