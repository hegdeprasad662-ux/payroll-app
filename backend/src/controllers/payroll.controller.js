import { prisma } from '../utils/prisma.js';
import { processPayrollRun, recomputeOneLine } from '../services/payroll-engine.js';
import { logAudit } from '../middleware/auditLog.js';

export async function listRuns(req, res) {
  const runs = await prisma.payrollRun.findMany({
    orderBy: { period: 'desc' },
    include: { _count: { select: { lines: true } } },
  });
  res.json(runs);
}

export async function createRun(req, res) {
  const { period, periodLabel, totalDays } = req.body || {};
  if (!period) return res.status(400).json({ error: 'period required (YYYY-MM)' });
  try {
    const run = await prisma.payrollRun.create({
      data: { period, periodLabel: periodLabel || period, totalDays: totalDays || 30 },
    });
    await logAudit(req.user?.email, 'CREATE_RUN', 'PayrollRun', run.id, { period });
    res.status(201).json(run);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Run for this period already exists' });
    throw e;
  }
}

export async function processRun(req, res) {
  const id = parseInt(req.params.id);
  const result = await processPayrollRun(id);
  await logAudit(req.user?.email, 'PROCESS_RUN', 'PayrollRun', id, result);
  res.json(result);
}

export async function getRun(req, res) {
  const id = parseInt(req.params.id);
  const run = await prisma.payrollRun.findUnique({
    where: { id },
    include: { lines: { orderBy: { empNo: 'asc' } } },
  });
  if (!run) return res.status(404).json({ error: 'Not found' });
  res.json(run);
}

export async function lockRun(req, res) {
  const id = parseInt(req.params.id);
  const run = await prisma.payrollRun.update({
    where: { id },
    data: { status: 'LOCKED', lockedAt: new Date() },
  });
  await logAudit(req.user?.email, 'LOCK_RUN', 'PayrollRun', id);
  res.json(run);
}

export async function updateLine(req, res) {
  const id = parseInt(req.params.lineId);
  const data = { ...req.body };
  delete data.id;
  delete data.runId;
  delete data.employeeId;
  const line = await prisma.payrollLine.update({ where: { id }, data });
  await logAudit(req.user?.email, 'UPDATE_LINE', 'PayrollLine', id, data);
  // Optionally recompute
  if (req.query.recompute === 'true') {
    const recomputed = await recomputeOneLine(id);
    return res.json(recomputed);
  }
  res.json(line);
}
