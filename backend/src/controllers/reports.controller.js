import { prisma } from '../utils/prisma.js';
import { buildPayslipPdf } from '../services/payslip-pdf.js';
import { buildSalaryRegisterXlsx, buildBankTransferXlsx, buildComplianceXlsx } from '../services/exports.js';

export async function dashboard(req, res) {
  const { period } = req.query;
  const employeesAll = await prisma.employee.findMany();
  const total = employeesAll.length;
  const active = employeesAll.filter(e => e.status === 'ACTIVE').length;
  const newJoinees = employeesAll.filter(e => e.status === 'NEW_JOINEE').length;
  const relieved = employeesAll.filter(e => e.status === 'RELIEVED').length;

  let kpis = {
    totalEmployees: total,
    activeEmployees: active,
    newJoinees,
    relieved,
    grossPayroll: 0,
    netPayroll: 0,
    pendingSalary: 0,
    pfLiability: 0,
    esiLiability: 0,
    ptLiability: 0,
    incrementCount: 0,
    departmentCost: [],
  };

  let lines = [];
  let run = null;
  if (period) {
    run = await prisma.payrollRun.findUnique({ where: { period } });
    if (run) {
      lines = await prisma.payrollLine.findMany({ where: { runId: run.id } });
    }
  } else {
    // latest processed run
    run = await prisma.payrollRun.findFirst({
      where: { status: { in: ['PROCESSED', 'LOCKED'] } },
      orderBy: { period: 'desc' },
    });
    if (run) lines = await prisma.payrollLine.findMany({ where: { runId: run.id } });
  }

  if (lines.length) {
    kpis.grossPayroll = lines.reduce((s, l) => s + l.grossPay, 0);
    kpis.netPayroll = lines.reduce((s, l) => s + l.netPay, 0);
    kpis.pendingSalary = lines.reduce((s, l) => s + l.pendingClosing, 0);
    kpis.pfLiability = lines.reduce((s, l) => s + l.epf, 0);
    kpis.esiLiability = lines.reduce((s, l) => s + l.esi, 0);
    kpis.ptLiability = lines.reduce((s, l) => s + l.professionalTax, 0);
    const dept = {};
    lines.forEach(l => {
      dept[l.department || 'Unassigned'] = (dept[l.department || 'Unassigned'] || 0) + l.grossPay;
    });
    kpis.departmentCost = Object.entries(dept).map(([name, value]) => ({ name, value }));
  }

  kpis.incrementCount = await prisma.incrementRecord.count(
    period ? { where: { period } } : {}
  );

  res.json({ kpis, period: run?.period || null, periodLabel: run?.periodLabel || null });
}

export async function salaryRegister(req, res) {
  const runId = parseInt(req.params.runId);
  const run = await prisma.payrollRun.findUnique({ where: { id: runId }, include: { lines: { orderBy: { empNo: 'asc' } } } });
  if (!run) return res.status(404).json({ error: 'Not found' });
  const buf = buildSalaryRegisterXlsx(run.periodLabel, run.lines);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="SalaryRegister-${run.period}.xlsx"`);
  res.send(buf);
}

export async function bankTransfer(req, res) {
  const runId = parseInt(req.params.runId);
  const run = await prisma.payrollRun.findUnique({ where: { id: runId }, include: { lines: true } });
  if (!run) return res.status(404).json({ error: 'Not found' });
  const employees = await prisma.employee.findMany();
  const buf = buildBankTransferXlsx(run.periodLabel, run.lines, employees);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="BankTransfer-${run.period}.xlsx"`);
  res.send(buf);
}

export async function compliance(req, res) {
  const runId = parseInt(req.params.runId);
  const run = await prisma.payrollRun.findUnique({ where: { id: runId }, include: { lines: true } });
  if (!run) return res.status(404).json({ error: 'Not found' });
  const buf = buildComplianceXlsx(run.periodLabel, run.lines);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Compliance-${run.period}.xlsx"`);
  res.send(buf);
}

export async function payslip(req, res) {
  const lineId = parseInt(req.params.lineId);
  const line = await prisma.payrollLine.findUnique({ where: { id: lineId }, include: { run: true } });
  if (!line) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Payslip-${line.empNo}-${line.run.period}.pdf"`);
  const doc = buildPayslipPdf(line, line.run.periodLabel);
  doc.pipe(res);
  doc.end();
}

export async function auditLogs(req, res) {
  const logs = await prisma.auditLog.findMany({ orderBy: { id: 'desc' }, take: 200 });
  res.json(logs);
}
