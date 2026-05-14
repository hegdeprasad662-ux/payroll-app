import xlsx from 'xlsx';
import { prisma } from '../utils/prisma.js';

/**
 * Auto-detects sheets by fuzzy name and parses each section.
 * Returns { sheetsDetected, summary, errors }
 */

const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

const SHEET_PATTERNS = {
  newJoinees:    /newjoin/,
  relieved:      /reliev|exited|leaver/,
  lop:           /^lop$|losspay/,
  increment:     /increment|hike/,
  arrears:       /arrear/,
  referral:      /refer/,
  incentives:    /incentive/,
  others:        /^others?$/,
};

function detectType(name) {
  const n = norm(name);
  for (const [t, re] of Object.entries(SHEET_PATTERNS)) {
    if (re.test(n)) return t;
  }
  return null;
}

function sheetToRows(ws) {
  return xlsx.utils.sheet_to_json(ws, { defval: null, raw: true, blankrows: false });
}

/** Find header row dynamically — first row containing a sufficient set of expected keys */
function rowsAsObjects(ws, requiredKeys = []) {
  const all = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
  // pick header row
  let headerIdx = 0;
  for (let i = 0; i < Math.min(all.length, 5); i++) {
    const cells = all[i].map((c) => norm(c));
    const matched = requiredKeys.filter((k) => cells.some((c) => c.includes(norm(k))));
    if (matched.length >= Math.min(2, requiredKeys.length)) {
      headerIdx = i;
      break;
    }
  }
  const headers = all[headerIdx].map((c) => (c == null ? '' : String(c).trim()));
  return all.slice(headerIdx + 1).map((arr) => {
    const o = {};
    headers.forEach((h, i) => { if (h) o[h] = arr[i]; });
    return o;
  }).filter((o) => Object.values(o).some((v) => v != null && v !== ''));
}

function findEmpId(row) {
  for (const k of Object.keys(row)) {
    const nk = norm(k);
    if (nk === 'empid' || nk === 'employeeid' || nk === 'employeeno' || nk === 'empno') {
      return row[k];
    }
  }
  return null;
}
function findEmpName(row) {
  for (const k of Object.keys(row)) {
    const nk = norm(k);
    if (nk === 'name' || nk === 'employeename' || nk === 'empname' || nk === 'nameofemployee') {
      return row[k];
    }
  }
  return null;
}
function num(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/,/g, '').trim());
  return isNaN(n) ? 0 : n;
}

async function findEmployee(idOrName) {
  if (!idOrName) return null;
  const s = String(idOrName).trim();
  let emp = await prisma.employee.findFirst({ where: { empNo: s } });
  if (!emp) emp = await prisma.employee.findFirst({ where: { name: { contains: s } } });
  return emp;
}

export async function parseAndImport(buffer, period) {
  const wb = xlsx.read(buffer, { type: 'buffer', cellDates: true });
  const summary = {};
  const errors = [];

  for (const sheetName of wb.SheetNames) {
    const type = detectType(sheetName);
    if (!type) continue;
    const ws = wb.Sheets[sheetName];
    summary[type] = summary[type] || { created: 0, skipped: 0, sheet: sheetName };

    if (type === 'newJoinees') {
      const rows = rowsAsObjects(ws, ['Emp Name', 'CTC']);
      for (const row of rows) {
        const name = findEmpName(row) || row['Emp Name'] || row['Name'];
        if (!name) { summary[type].skipped++; continue; }
        const ctc = num(row['CTC (Annual)'] || row['CTC'] || row['ctc']);
        try {
          await prisma.employee.create({
            data: {
              empNo: String(findEmpId(row) || `NEW-${Date.now()}-${Math.floor(Math.random()*1000)}`),
              name: String(name).trim(),
              designation: row['Designation'] || null,
              email: row['Email Id'] || row['Email'] || null,
              doj: row['DOJ'] ? new Date(row['DOJ']) : null,
              ctcAnnual: ctc,
              bankAccount: row['BANK ACCOUNT NUMBER'] ? String(row['BANK ACCOUNT NUMBER']) : null,
              bankName: row['BANK NAME AND BRANCH'] || null,
              ifsc: row['IFSC CODE'] || null,
              uan: row['PF UAN Number'] ? String(row['PF UAN Number']) : null,
              esiNumber: row['ESI Number'] ? String(row['ESI Number']) : null,
              status: 'NEW_JOINEE',
              notes: row['Remarks'] || null,
            },
          });
          summary[type].created++;
        } catch (e) {
          errors.push({ sheet: sheetName, row: name, error: e.message });
        }
      }
    }

    if (type === 'relieved') {
      const rows = rowsAsObjects(ws, ['Name', 'Relieving Date']);
      for (const row of rows) {
        const name = findEmpName(row) || row['Name'];
        if (!name) { summary[type].skipped++; continue; }
        const emp = await findEmployee(name);
        if (!emp) { errors.push({ sheet: sheetName, row: name, error: 'employee not found' }); continue; }
        await prisma.employee.update({
          where: { id: emp.id },
          data: {
            status: 'RELIEVED',
            dol: row['Relieving Date'] ? new Date(row['Relieving Date']) : new Date(),
            notes: row['Remarks'] || emp.notes,
          },
        });
        summary[type].created++;
      }
    }

    if (type === 'lop') {
      const rows = rowsAsObjects(ws, ['NAME', 'LOP']);
      for (const row of rows) {
        const name = row['NAME'] || row['Name'] || findEmpName(row);
        if (!name) { summary[type].skipped++; continue; }
        const emp = await findEmployee(name);
        if (!emp) { errors.push({ sheet: sheetName, row: name, error: 'employee not found' }); continue; }
        await prisma.lopRecord.upsert({
          where: { employeeId_period: { employeeId: emp.id, period } },
          create: {
            employeeId: emp.id, period,
            lopDays: num(row['Lop Days'] || row['LOP']),
            sundayDays: num(row['Sunday Days']),
            festivalDays: num(row['Festival Days']),
            remarks: row['REMARKS'] || row['Remarks'] || null,
          },
          update: {
            lopDays: num(row['Lop Days'] || row['LOP']),
            sundayDays: num(row['Sunday Days']),
            festivalDays: num(row['Festival Days']),
            remarks: row['REMARKS'] || row['Remarks'] || null,
          },
        });
        summary[type].created++;
      }
    }

    if (type === 'increment') {
      const rows = rowsAsObjects(ws, ['Employee ID', 'INCREMENT']);
      for (const row of rows) {
        const id = findEmpId(row);
        const name = findEmpName(row);
        const emp = await findEmployee(id || name);
        if (!emp) { errors.push({ sheet: sheetName, row: id || name, error: 'employee not found' }); continue; }
        const newCtc = num(row['INCREMENT'] || row['New CTC']);
        if (newCtc <= 0) { summary[type].skipped++; continue; }
        await prisma.incrementRecord.create({
          data: {
            employeeId: emp.id, period,
            oldCtc: emp.ctcAnnual, newCtc,
            effectiveFrom: new Date(),
            remarks: row['Remarks'] || null,
          },
        });
        // also bump the employee CTC for future runs
        await prisma.employee.update({ where: { id: emp.id }, data: { ctcAnnual: newCtc } });
        summary[type].created++;
      }
    }

    if (type === 'arrears') {
      const rows = rowsAsObjects(ws, ['Name']);
      for (const row of rows) {
        const name = findEmpName(row) || row['Name'];
        if (!name) { summary[type].skipped++; continue; }
        const emp = await findEmployee(name);
        if (!emp) { errors.push({ sheet: sheetName, row: name, error: 'employee not found' }); continue; }
        await prisma.arrearRecord.create({
          data: {
            employeeId: emp.id, period,
            days: num(row['No. of Days - Arrears to'] || row['Days']),
            amount: num(row['Amount'] || row['Updated Amount']),
            remarks: row['Updated Remarks'] || row['Remarks'] || null,
          },
        });
        summary[type].created++;
      }
    }

    if (type === 'referral') {
      const rows = rowsAsObjects(ws, ['Employee Name', 'Amount']);
      for (const row of rows) {
        const name = row['Employee Name'] || findEmpName(row);
        if (!name) { summary[type].skipped++; continue; }
        const emp = await findEmployee(name);
        if (!emp) { errors.push({ sheet: sheetName, row: name, error: 'employee not found' }); continue; }
        await prisma.referralBonus.create({
          data: {
            employeeId: emp.id, period,
            referredName: row['Referred'] || null,
            amount: num(row['Amount to be transferred'] || row['Amount']),
          },
        });
        summary[type].created++;
      }
    }

    if (type === 'incentives') {
      const rows = rowsAsObjects(ws, ['Name of employee']);
      for (const row of rows) {
        const name = row['Name of employee'] || findEmpName(row);
        if (!name) { summary[type].skipped++; continue; }
        const emp = await findEmployee(name);
        if (!emp) { errors.push({ sheet: sheetName, row: name, error: 'employee not found' }); continue; }
        const amt = num(row['March Incentive'] || row['Incentive'] || row['Amount']);
        await prisma.incentiveRecord.create({
          data: {
            employeeId: emp.id, period,
            amount: amt,
            ancillary: row['Ancillary'] || null,
          },
        });
        summary[type].created++;
      }
    }

    if (type === 'others') {
      const rows = rowsAsObjects(ws, ['Employee Name']);
      for (const row of rows) {
        const name = row['Employee Name'] || findEmpName(row);
        if (!name) { summary[type].skipped++; continue; }
        const emp = await findEmployee(name);
        if (!emp) { errors.push({ sheet: sheetName, row: name, error: 'employee not found' }); continue; }
        await prisma.otherPayment.create({
          data: {
            employeeId: emp.id, period,
            description: row['Description'] || null,
            travelling: num(row['Travelling']),
            ancillary: num(row['Ancillary']),
            amount: num(String(row['Amount to be paid'] || row['Amount'] || '').replace(/[^0-9.\-]/g, '')),
            remarks: row['Remarks'] || null,
          },
        });
        summary[type].created++;
      }
    }
  }

  return { sheetsDetected: Object.keys(summary), summary, errors };
}
