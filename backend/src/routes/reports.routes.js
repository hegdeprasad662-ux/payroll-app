import { Router } from 'express';
import {
  dashboard, salaryRegister, bankTransfer, compliance, payslip, auditLogs,
} from '../controllers/reports.controller.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.use(authRequired);
r.get('/dashboard', dashboard);
r.get('/runs/:runId/salary-register.xlsx', salaryRegister);
r.get('/runs/:runId/bank-transfer.xlsx', bankTransfer);
r.get('/runs/:runId/compliance.xlsx', compliance);
r.get('/lines/:lineId/payslip.pdf', payslip);
r.get('/audit', auditLogs);
export default r;
