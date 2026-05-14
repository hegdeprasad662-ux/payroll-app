import { prisma } from '../utils/prisma.js';
import { getSettings } from '../utils/settings.js';
import { calculatePayrollLine } from '../utils/formulas.js';

/**
 * Process a payroll run. Loads employees, all input records (LOP, arrears,
 * incentives, referrals, other payments) for the period, runs the engine,
 * writes PayrollLine rows.
 */
export async function processPayrollRun(runId) {
  const run = await prisma.payrollRun.findUnique({ where: { id: runId } });
  if (!run) throw Object.assign(new Error('Run not found'), { status: 404 });
  if (run.status === 'LOCKED') {
    throw Object.assign(new Error('Run is locked'), { status: 400 });
  }

  const settings = await getSettings();
  const totalDays = run.totalDays || settings.defaultMonthDays;

  // Pull all input records for the period
  const period = run.period;
  const [employees, lop, arrears, incentives, referrals, others, increments] = await Promise.all([
    prisma.employee.findMany({ where: { status: { not: 'RELIEVED' } } }),
    prisma.lopRecord.findMany({ where: { period } }),
    prisma.arrearRecord.findMany({ where: { period } }),
    prisma.incentiveRecord.findMany({ where: { period } }),
    prisma.referralBonus.findMany({ where: { period } }),
    prisma.otherPayment.findMany({ where: { period } }),
    prisma.incrementRecord.findMany({ where: { period } }),
  ]);

  const lopByEmp = Object.fromEntries(lop.map(l => [l.employeeId, l]));
  const arrByEmp = Object.fromEntries(arrears.map(a => [a.employeeId, a]));
  const incByEmp = Object.fromEntries(incentives.map(i => [i.employeeId, i]));
  const refByEmp = Object.fromEntries(referrals.map(r => [r.employeeId, r]));
  const othByEmp = Object.fromEntries(others.map(o => [o.employeeId, o]));
  const incrByEmp = Object.fromEntries(increments.map(i => [i.employeeId, i]));

  // Apply increments to in-memory employees for this run
  for (const e of employees) {
    if (incrByEmp[e.id]) e.ctcAnnual = incrByEmp[e.id].newCtc;
  }

  // Clear old lines for this run
  await prisma.payrollLine.deleteMany({ where: { runId } });

  const created = [];
  for (const emp of employees) {
    const lopRec = lopByEmp[emp.id];
    // LOP days = deduction only.  Sunday & Festival days = ADDITIVE earnings.
    const inputs = {
      lopDays:      lopRec?.lopDays      || 0,
      sundayDays:   lopRec?.sundayDays   || 0,
      festivalDays: lopRec?.festivalDays || 0,
      arrears:        arrByEmp[emp.id]?.amount || 0,
      salesIncentive: incByEmp[emp.id]?.amount || 0,
      referralBonus:  refByEmp[emp.id]?.amount || 0,
      reimbursements: othByEmp[emp.id]?.amount || 0,
      incomeTax: 0, // engine auto-computes from tdsPercent for consultants; 0 = let engine decide
      paid: 0,
    };

    const calc = calculatePayrollLine({
      employee: emp,
      inputs,
      settings,
      totalDays,
    });

    const line = await prisma.payrollLine.create({
      data: {
        runId,
        employeeId: emp.id,
        empNo: emp.empNo,
        name: emp.name,
        department: emp.department || '',
        doj: emp.doj,
        ctcAnnual: emp.ctcAnnual,
        ...calc,
      },
    });
    created.push(line);
  }

  await prisma.payrollRun.update({
    where: { id: runId },
    data: { status: 'PROCESSED', processedAt: new Date() },
  });

  return { runId, count: created.length };
}

export async function recomputeOneLine(lineId) {
  const line = await prisma.payrollLine.findUnique({ where: { id: lineId } });
  if (!line) throw Object.assign(new Error('Line not found'), { status: 404 });
  const emp = await prisma.employee.findUnique({ where: { id: line.employeeId } });
  const run = await prisma.payrollRun.findUnique({ where: { id: line.runId } });
  if (run.status === 'LOCKED') {
    throw Object.assign(new Error('Run is locked'), { status: 400 });
  }
  const settings = await getSettings();
  // Pull latest LOP record for the period — covers lop / sunday / festival days
  const lopRec = await prisma.lopRecord.findFirst({
    where: { employeeId: emp.id, period: run.period },
  });
  const calc = calculatePayrollLine({
    employee: emp,
    inputs: {
      lopDays:      lopRec?.lopDays      ?? Math.max(0, run.totalDays - line.effectivePaidDays),
      sundayDays:   lopRec?.sundayDays   ?? 0,
      festivalDays: lopRec?.festivalDays ?? 0,
      arrears:        line.arrears,
      salesIncentive: line.salesIncentive,
      referralBonus:  line.referralBonus,
      reimbursements: line.reimbursements,
      incomeTax:      line.incomeTax,
      paid:           line.paid,
      leaveEncashment:line.leaveEncashment,
    },
    settings,
    totalDays: run.totalDays,
  });
  return prisma.payrollLine.update({
    where: { id: lineId },
    data: { ...calc },
  });
}
