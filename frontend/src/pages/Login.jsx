import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/Button.jsx';
import { Input, Label } from '../components/Input.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@payroll.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); navigate('/'); }
    catch (e) { setError(e.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-500/30 mb-3">
              <Wallet size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-slate-50">Payroll Manager</h1>
            <p className="text-sm text-ink-600 dark:text-slate-300 mt-1">Sign in to your admin account</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-cardHover p-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required />
                </div>
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9" required />
                </div>
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-900/30 px-3 py-2 rounded-md"
                >{error}</motion.div>
              )}
              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </div>

          <p className="text-xs text-center text-ink-600 dark:text-slate-400 mt-4">
            Default: <code className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-800 text-ink-800 dark:text-slate-200">admin@payroll.local</code> / <code className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-800 text-ink-800 dark:text-slate-200">admin123</code>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
