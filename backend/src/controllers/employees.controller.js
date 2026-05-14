import { prisma } from '../utils/prisma.js';
import { logAudit } from '../middleware/auditLog.js';
import { getSettings } from '../utils/settings.js';
import { computeBaseline } from '../utils/employee-baseline.js';

export async function list(req, res) {
  const { q, status, department, employmentType } = req.query;
  const where = {};
  if (q) where.OR = [
    { empNo: { contains: q } },
    { name: { contains: q } },
  ];
  if (status) where.status = status;
  if (department) where.department = department;
  if (employmentType) where.employmentType = employmentType;

  const [employees, settings] = await Promise.all([
    prisma.employee.findMany({ where, orderBy: { empNo: 'asc' } }),
    getSettings(),
  ]);
  const enriched = employees.map(e => ({ ...e, computed: computeBaseline(e, settings) }));
  res.json(enriched);
}

export async function getOne(req, res) {
  const emp = await prisma.employee.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      payrollLines: { include: { run: true }, orderBy: { id: 'desc' }, take: 12 },
    },
  });
  if (!emp) return res.status(404).json({ error: 'Not found' });
  const settings = await getSettings();
  emp.computed = computeBaseline(emp, settings);
  res.json(emp);
}

export async function create(req, res) {
  const data = req.body;
  if (data.doj) data.doj = new Date(data.doj);
  if (data.dol) data.dol = new Date(data.dol);
  if (data.tdsPercent != null) {
    const t = Number(data.tdsPercent);
    data.tdsPercent = t > 1 ? t / 100 : t;
  }
  const emp = await prisma.employee.create({ data });
  await logAudit(req.user?.email, 'CREATE_EMPLOYEE', 'Employee', emp.id, { empNo: emp.empNo });
  res.status(201).json(emp);
}

export async function update(req, res) {
  const id = parseInt(req.params.id);
  const data = { ...req.body };
  delete data.id;
  if (data.doj) data.doj = new Date(data.doj);
  if (data.dol) data.dol = new Date(data.dol);
  if (data.tdsPercent != null) {
    const t = Number(data.tdsPercent);
    data.tdsPercent = t > 1 ? t / 100 : t;
  }
  const emp = await prisma.employee.update({ where: { id }, data });
  await logAudit(req.user?.email, 'UPDATE_EMPLOYEE', 'Employee', id, data);
  res.json(emp);
}

export async function remove(req, res) {
  const id = parseInt(req.params.id);
  await prisma.employee.delete({ where: { id } });
  await logAudit(req.user?.email, 'DELETE_EMPLOYEE', 'Employee', id);
  res.json({ ok: true });
}
