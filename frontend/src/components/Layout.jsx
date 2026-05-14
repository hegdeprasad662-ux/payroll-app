import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, ClipboardList, Calculator, Activity,
  Settings as SettingsIcon, LogOut, Moon, Sun, Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const nav = [
  { to: '/',          label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees',      icon: Users },
  { to: '/inputs',    label: 'Monthly Inputs', icon: ClipboardList },
  { to: '/payroll',   label: 'Payroll Runs',   icon: Calculator },
  { to: '/audit',     label: 'Audit Logs',     icon: Activity },
  { to: '/settings',  label: 'Settings',       icon: SettingsIcon },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const loc = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-brand-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md flex flex-col">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-200 dark:border-slate-800">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white shadow-md shadow-brand-500/30"
          >
            <Wallet size={18} />
          </motion.div>
          <div>
            <Link to="/" className="font-semibold text-ink-900 dark:text-slate-50 leading-tight">Payroll Manager</Link>
            <div className="text-[10px] text-ink-500 dark:text-slate-400 uppercase tracking-wider">India · Localhost</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((n) => {
            const isActive = n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
            return (
              <NavLink key={n.to} to={n.to} end={n.end} className="relative block">
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'text-white'
                      : 'text-ink-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-500 to-brand-700 shadow-md shadow-brand-500/25 -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <n.icon size={17} />
                  <span>{n.label}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-ink-800 dark:text-slate-100 truncate">{user?.email}</div>
          <div className="text-[10px] text-ink-500 dark:text-slate-400 mt-0.5">v0.3 · Admin</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="text-sm text-ink-600 dark:text-slate-300">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggle}
              className="p-2 rounded-md text-ink-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 rounded-md text-ink-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300 transition"
              title="Logout"
            >
              <LogOut size={17} />
            </motion.button>
          </div>
        </header>
        <div className="p-6 max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
}
