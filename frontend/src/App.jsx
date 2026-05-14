import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import EmployeeDetail from './pages/EmployeeDetail.jsx';
import MonthlyInputs from './pages/MonthlyInputs.jsx';
import PayrollRuns from './pages/PayrollRuns.jsx';
import SalaryRegister from './pages/SalaryRegister.jsx';
import Settings from './pages/Settings.jsx';
import AuditLogs from './pages/AuditLogs.jsx';

function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function Protected({ children }) {
  const { user, loaded } = useAuth();
  const loc = useLocation();
  if (!loaded) return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  return <Layout><Page>{children}</Page></Layout>;
}

export default function App() {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={loc} key={loc.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/employees" element={<Protected><Employees /></Protected>} />
        <Route path="/employees/:id" element={<Protected><EmployeeDetail /></Protected>} />
        <Route path="/inputs" element={<Protected><MonthlyInputs /></Protected>} />
        <Route path="/payroll" element={<Protected><PayrollRuns /></Protected>} />
        <Route path="/payroll/:id/register" element={<Protected><SalaryRegister /></Protected>} />
        <Route path="/audit" element={<Protected><AuditLogs /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
