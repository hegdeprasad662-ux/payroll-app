import { prisma } from '../utils/prisma.js';
import { getSettings } from '../utils/settings.js';
import { computeBaseline } from '../utils/employee-baseline.js';
import { calculatePayrollLine } from '../utils/formulas.js';
import { logAudit } from '../middleware/auditLog.js';

/**
 * Returns one consolidated payload for a given period.
 * `computed` per employee is *period-adjusted* — applies LOP/Sunday/Festival/
 * Incentive/Arrears/Referral/Other if any are present, otherwise returns the
 * static baseline.
 */
export async function getPeriodInputs(req, res) {
  const period = req.params.period;
  const [employees, settings, lop, incentives, arrears, referrals, others, increments] = await Promise.all([
    prisma.employee.findMany({ orderBy: { empNo: 'asc' } }),
    getSettings(),
    prisma.lopRecord.findMany({ where: { period } }),
    prisma.incentiveRecord.findMany({ where: { period } }),
    prisma.arrearRecord.findMany({ where: { period } }),
    prisma.referralBonus.findMany({ where: { period } }),
    prisma.otherPayment.findMany({ where: { period } }),
    prisma.incrementRecord.findMany({ where: { period } }),
  ]);

  const lopMap = keyBy(lop, 'employeeId');
  const incMap = keyBy(incentives, 'employeeId');
  const arrMap = keyBy(arrears, 'employeeId');
  const refMap = keyBy(referrals, 'employeeId');
  const othMap = keyBy(others, 'employeeId');

  const totalDays = settings.defaultMonthDays || 30;

  const enrichedEmployees = employees.map((e) => {
    const lopRec = lopMap[e.id];
    const inputs = {
      lopDays:      lopRec?.lopDays      || 0,
      sundayDays:   lopRec?.sundayDays   || 0,
      festivalDays: lopRec?.festivalDays || 0,
      arrears:        arrMap[e.id]?.amount || 0,
      salesIncentive: incMap[e.id]?.amount || 0,
      referralBonus:  refMap[e.id]?.amount || 0,
      reimbursements: othMap[e.id]?.amount || 0,
    };
    const hasInputs =
      inputs.lopDays || inputs.sundayDays || inputs.festivalDays ||
      inputs.arrears || inputs.salesIncentive || inputs.referralBonus || inputs.reimbursements;

    if (!hasInputs) {
      return { ...e, computed: computeBaseline(e, settings) };
    }

    const line = calculatePayrollLine({ employee: e, inputs, settings, totalDays });
    return {
      ...e,
      computed: {
        monthlyCtc: (e.ctcAnnual || 0) / 12,
        basic: line.basic,
        hra: line.hra,
        conveyance: line.conveyance,
        fixedAllowance: line.fixedAllowance,
        employerPf: 0,
        epf: line.epf,
        esi: line.esi,
        professionalTax: line.professionalTax,
        tdsPercent: e.tdsPercent || 0,
        tdsAmount: line.incomeTax,
        fixedMonthlyEarnings: line.fixedMonthlyEarnings,
        sundayEarnings: line.sundayEarnings,
        festivalEarnings: line.festivalEarnings,
        effectivePaidDays: line.effectivePaidDays,
        grossPay: line.grossPay,
        totalDeductions: line.totalDeductions,
        netPay: line.netPay,
        periodAdjusted: true,
      },
    };
  });

  res.json({
    employees: enrichedEmployees,
    lop: lopMap,
    incentives: incMap,
    arrears: arrMap,
    referrals: refMap,
    others: othMap,
    increments: keyBy(increments, 'employeeId'),
  });
}

function keyBy(arr, k) {
  const o = {};
  for (const r of arr) o[r[k]] = r;
  return o;
}

/** Upsert LOP for one employee/period */
export async function upsertLop(req, res) {
  const { period, employeeId } = req.params;
  const { lopDays = 0, sundayDays = 0, festivalDays = 0, remarks } = req.body || {};
  const eid = parseInt(employeeId);
  const row = await prisma.lopRecord.upsert({
    where: { employeeId_period: { employeeId: eid, period } },
    create: { employeeId: eid, period, lopDays: +lopDays, sundayDays: +sundayDays, festivalDays: +festivalDays, remarks },
    update: { lopDays: +lopDays, sundayDays: +sundayDays, festivalDays: +festivalDays, remarks },
  });
  await logAudit(req.user?.email, 'UPSERT_LOP', 'LopRecord', row.id, { period, employeeId: eid });
  res.json(row);
}

async function upsertSingle(model, where, create, update) {
  const existing = await prisma[model].findFirst({ where });
  if (existing) return prisma[model].update({ where: { id: existing.id }, data: update });
  return prisma[model].create({ data: create });
}

export async function upsertIncentive(req, res) {
  const { period, employeeId } = req.params;
  const eid = parseInt(employeeId);
  const { amount = 0, ancillary, remarks } = req.body || {};
  const row = await upsertSingle('incentiveRecord',
    { employeeId: eid, period },
    { employeeId: eid, period, amount: +amount, ancillary, remarks },
    { amount: +amount, ancillary, remarks });
  res.json(row);
}

export async function upsertArrear(req, res) {
  const { period, employeeId } = req.params;
  const eid = parseInt(employeeId);
  const { amount = 0, days = 0, remarks } = req.body || {};
  const row = await upsertSingle('arrearRecord',
    { employeeId: eid, period },
    { employeeId: eid, period, amount: +amount, days: +days, remarks },
    { amount: +amount, days: +days, remarks });
  res.json(row);
}

export async function upsertReferral(req, res) {
  const { period, employeeId } = req.params;
  const eid = parseInt(employeeId);
  const { amount = 0, referredName, remarks } = req.body || {};
  const row = await upsertSingle('referralBonus',
    { employeeId: eid, period },
    { employeeId: eid, period, amount: +amount, referredName, remarks },
    { amount: +amount, referredName, remarks });
  res.json(row);
}

export async function upsertOther(req, res) {
  const { period, employeeId } = req.params;
  const eid = parseInt(employeeId);
  const { amount = 0, travelling = 0, ancillary = 0, description, remarks } = req.body || {};
  const row = await upsertSingle('otherPayment',
    { employeeId: eid, period },
    { employeeId: eid, period, amount: +amount, travelling: +travelling, ancillary: +ancillary, description, remarks },
    { amount: +amount, travelling: +travelling, ancillary: +ancillary, description, remarks });
  res.json(row);
}

export async function removeInput(req, res) {
  const { type, period, employeeId } = req.params;
  const eid = parseInt(employeeId);
  const model = {
    lop: 'lopRecord',
    incentive: 'incentiveRecord',
    arrear: 'arrearRecord',
    referral: 'referralBonus',
    other: 'otherPayment',
  }[type];
  if (!model) return res.status(400).json({ error: 'Unknown input type' });
  const existing = await prisma[model].findFirst({ where: { employeeId: eid, period } });
  if (existing) await prisma[model].delete({ where: { id: existing.id } });
  res.json({ ok: true });
}
