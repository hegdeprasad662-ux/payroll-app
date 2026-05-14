import { prisma } from '../utils/prisma.js';
import { logAudit } from '../middleware/auditLog.js';

/** Hard-reset all employee data and dependent records.
 *  Keeps: AdminUser, Settings, AuditLog.
 *  Wipes: Employee, PayrollRun, PayrollLine, LopRecord, IncrementRecord,
 *          ArrearRecord, IncentiveRecord, ReferralBonus, OtherPayment.
 */
export async function resetEmployees(req, res) {
  // Order matters — child records first to avoid FK violations
  const result = {};
  result.payrollLines     = (await prisma.payrollLine.deleteMany({})).count;
  result.payrollRuns      = (await prisma.payrollRun.deleteMany({})).count;
  result.lopRecords       = (await prisma.lopRecord.deleteMany({})).count;
  result.incrementRecords = (await prisma.incrementRecord.deleteMany({})).count;
  result.arrearRecords    = (await prisma.arrearRecord.deleteMany({})).count;
  result.incentiveRecords = (await prisma.incentiveRecord.deleteMany({})).count;
  result.referralBonuses  = (await prisma.referralBonus.deleteMany({})).count;
  result.otherPayments    = (await prisma.otherPayment.deleteMany({})).count;
  result.employees        = (await prisma.employee.deleteMany({})).count;

  await logAudit(req.user?.email, 'RESET_EMPLOYEE_DATA', null, null, result);
  res.json({ ok: true, deleted: result });
}
