import xlsx from 'xlsx';
import { prisma } from '../utils/prisma.js';
import { logAudit } from '../middleware/auditLog.js';

const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

const FIELD_ALIASES = {
  empNo:     ['empid', 'employeeid', 'empno', 'employeeno', 'empcode', 'employeecode'],
  name:      ['name', 'employeename', 'empname', 'fullname', 'nameofemployee'],
  ctcAnnual: ['ctc', 'ctcannual', 'ctcannually', 'annualctc', 'ctcamount', 'annualcost'],
  department:['department', 'dept'],
  designation:['designation', 'role', 'title'],
  email:     ['email', 'emailid', 'mail'],
  doj:       ['doj', 'dateofjoining', 'joiningdate'],
  lopDays:      ['lopdays', 'lop', 'losspayday'],
  sundayDays:   ['sundaydays', 'sundays', 'sunday'],
  festivalDays: ['festivaldays', 'festival', 'holiday', 'holidays'],
  remarks:   ['remarks', 'remark', 'note', 'notes', 'comments'],
  tdsPercent:['tds', 'tdspercent', 'tdspct', 'tdsrate', 'tdspercentage'],
};

function mapRow(row) {
  const out = {};
  const keys = Object.keys(row);
  for (const [target, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const k of keys) {
      if (aliases.includes(norm(k))) { out[target] = row[k]; break; }
    }
  }
  return out;
}

function num(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

function parseSheetRows(buffer) {
  const wb = xlsx.read(buffer, { type: 'buffer', cellDates: true });
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows = xlsx.utils.sheet_to_json(ws, { defval: null, raw: true, blankrows: false });
    if (rows.length > 0) return { sheetName: name, rows };
  }
  return { sheetName: null, rows: [] };
}

/* ---------- Employee/Consultant master upload ---------- */
async function uploadMaster(req, res, employmentType) {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const { sheetName, rows } = parseSheetRows(req.file.buffer);
  const summary = { sheet: sheetName, created: 0, updated: 0, skipped: 0 };
  const errors = [];

  for (const raw of rows) {
    try {
      const r = mapRow(raw);
      if (!r.empNo && !r.name) { summary.skipped++; continue; }

      let empNo = r.empNo ? String(r.empNo).trim() : '';
      if (!empNo) {
        if (employmentType === 'CONSULTANT' && r.name) {
          const slug = String(r.name).trim().toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 16);
          empNo = `CON-${slug || 'X'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
        } else {
          errors.push({ row: r.name, error: 'Missing Emp ID (required for employees)' });
          summary.skipped++; continue;
        }
      }
      const name = r.name ? String(r.name).trim() : empNo;
      const ctc = num(r.ctcAnnual);

      let tdsPercent = 0;
      if (r.tdsPercent != null) {
        const t = num(r.tdsPercent);
        tdsPercent = t > 1 ? t / 100 : t;
      }

      const existing = await prisma.employee.findUnique({ where: { empNo } });
      if (existing) {
        await prisma.employee.update({
          where: { empNo },
          data: {
            name,
            ctcAnnual: ctc || existing.ctcAnnual,
            employmentType,
            tdsPercent: r.tdsPercent != null ? tdsPercent : existing.tdsPercent,
            department: r.department || existing.department,
            designation: r.designation || existing.designation,
            email: r.email || existing.email,
            doj: r.doj ? new Date(r.doj) : existing.doj,
          },
        });
        summary.updated++;
      } else {
        await prisma.employee.create({
          data: {
            empNo, name, ctcAnnual: ctc,
            employmentType, tdsPercent,
            department: r.department || null,
            designation: r.designation || (employmentType === 'CONSULTANT' ? 'Consultant' : null),
            email: r.email || null,
            doj: r.doj ? new Date(r.doj) : null,
            status: 'ACTIVE',
          },
        });
        summary.created++;
      }
    } catch (e) {
      errors.push({ row: raw, error: e.message });
    }
  }

  await logAudit(
    req.user?.email,
    employmentType === 'CONSULTANT' ? 'UPLOAD_CONSULTANTS' : 'UPLOAD_EMPLOYEES',
    'Employee', null, { ...summary, errorCount: errors.length }
  );
  res.json({ ...summary, errors: errors.slice(0, 50) });
}

export const uploadEmployees   = (req, res) => uploadMaster(req, res, 'EMPLOYEE');
export const uploadConsultants = (req, res) => uploadMaster(req, res, 'CONSULTANT');

/* ---------- LOP bulk upload ---------- */
export async function uploadLop(req, res) {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const period = req.body.period;
  if (!period) return res.status(400).json({ error: 'period required (YYYY-MM)' });

  const { sheetName, rows } = parseSheetRows(req.file.buffer);
  const summary = { sheet: sheetName, created: 0, updated: 0, skipped: 0 };
  const errors = [];

  for (const raw of rows) {
    try {
      const r = mapRow(raw);
      let emp = null;
      if (r.empNo) emp = await prisma.employee.findUnique({ where: { empNo: String(r.empNo).trim() } });
      if (!emp && r.name) {
        emp = await prisma.employee.findFirst({ where: { name: { contains: String(r.name).trim() } } });
      }
      if (!emp) {
        errors.push({ row: r.empNo || r.name, error: 'employee not found' });
        summary.skipped++; continue;
      }

      const data = {
        lopDays: num(r.lopDays),
        sundayDays: num(r.sundayDays),
        festivalDays: num(r.festivalDays),
        remarks: r.remarks ? String(r.remarks) : null,
      };
      const existing = await prisma.lopRecord.findFirst({ where: { employeeId: emp.id, period } });
      if (existing) {
        await prisma.lopRecord.update({ where: { id: existing.id }, data });
        summary.updated++;
      } else {
        await prisma.lopRecord.create({ data: { ...data, employeeId: emp.id, period } });
        summary.created++;
      }
    } catch (e) {
      errors.push({ row: raw, error: e.message });
    }
  }

  await logAudit(req.user?.email, 'UPLOAD_LOP', 'LopRecord', null, { period, ...summary, errorCount: errors.length });
  res.json({ ...summary, errors: errors.slice(0, 50) });
}

/* ---------- Template downloads ---------- */
export function templateEmployees(req, res) {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet([
    { 'Emp ID': 'EMP-0001', 'Name': 'Sample Employee', 'CTC Annual': 720000, 'Department': 'Engineering', 'Designation': 'Engineer', 'Email': 'sample@company.com', 'DOJ': '2024-01-15' },
  ]);
  xlsx.utils.book_append_sheet(wb, ws, 'Employees');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="employees-template.xlsx"');
  res.send(buf);
}

export function templateConsultants(req, res) {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet([
    { 'Emp ID': '', 'Name': 'Sample Consultant 1', 'CTC Annual': 600000, 'TDS %': 10, 'Email': 'consultant1@example.com' },
    { 'Emp ID': 'CON-0002', 'Name': 'Sample Consultant 2', 'CTC Annual': 480000, 'TDS %': 5, 'Email': 'consultant2@example.com' },
  ]);
  xlsx.utils.book_append_sheet(wb, ws, 'Consultants');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="consultants-template.xlsx"');
  res.send(buf);
}

export function templateLop(req, res) {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet([
    { 'Emp ID': 'EMP-0001', 'Name': 'Sample Employee', 'LOP Days': 0, 'Sunday Days': 0, 'Festival Days': 0, 'Remarks': '' },
  ]);
  xlsx.utils.book_append_sheet(wb, ws, 'LOP');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="lop-template.xlsx"');
  res.send(buf);
}
