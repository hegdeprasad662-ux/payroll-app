import clsx from 'clsx';
export const cn = (...args) => clsx(...args);

export const inr = (n) => {
  const x = Number(n) || 0;
  return '₹' + x.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const downloadBlob = async (url, filename) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
};
