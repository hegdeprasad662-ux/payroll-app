import { calculatePayrollLine } from './backend/src/utils/formulas.js';
import { computeBaseline } from './backend/src/utils/employee-baseline.js';

const settings = {
  basicPercent: 0.40, hraPercent: 0.40, conveyance: 1600,
  pfRate: 0.12, pfBasicCap: 15000,
  esiRate: 0.0075, esiGrossThreshold: 21000,
  ptThreshold: 15000, ptAmount: 200,
  defaultMonthDays: 30, sundayRate: 0.30, festivalRate: 0.50,
  autoTds: 1, stdDeduction: 75000,
  rebate87AThreshold: 1200000, rebate87AMax: 60000, cessRate: 0.04,
};

console.log('=== AUTO TDS — FY 2025-26 NEW REGIME ===\n');
const cases = [
  { ctc: 480000,  label: 'CTC 4.8 LPA' },
  { ctc: 720000,  label: 'CTC 7.2 LPA' },
  { ctc: 1200000, label: 'CTC 12 LPA  (87A rebate edge)' },
  { ctc: 1500000, label: 'CTC 15 LPA' },
  { ctc: 2400000, label: 'CTC 24 LPA' },
  { ctc: 3600000, label: 'CTC 36 LPA' },
];
for (const t of cases) {
  const b = computeBaseline({ ctcAnnual: t.ctc, employmentType: 'EMPLOYEE' }, settings);
  console.log(`${t.label}  →  Monthly gross ₹${b.grossPay}  TDS ₹${b.incomeTax}  Net ₹${b.netPay}`);
}

console.log('\n=== TDS STABILITY WITH VARIABLE PAY ===');
const e = { ctcAnnual: 1500000, employmentType: 'EMPLOYEE' };
const a = calculatePayrollLine({ employee: e, inputs: {}, settings, totalDays: 30 });
const b = calculatePayrollLine({ employee: e, inputs: { sundayDays: 4, salesIncentive: 10000 }, settings, totalDays: 30 });
console.log(`No inputs:   Gross ₹${a.grossPay}  TDS ₹${a.incomeTax}  Net ₹${a.netPay}`);
console.log(`With extras: Gross ₹${b.grossPay}  TDS ₹${b.incomeTax}  Net ₹${b.netPay}`);
console.log('TDS comes from annualised FIXED gross — extras land in Net untaxed monthly (settled at year-end).');

console.log('\n=== CONSULTANT (uses tdsPercent) ===');
const c = { ctcAnnual: 600000, employmentType: 'CONSULTANT', tdsPercent: 0.10 };
const cl = calculatePayrollLine({ employee: c, inputs: {}, settings, totalDays: 30 });
console.log(`Consultant 6L @ 10% TDS → Gross ₹${cl.totalEarnings}, TDS ₹${cl.incomeTax}, Net ₹${cl.netPay}`);

console.log('\n=== AUTO-TDS DISABLED ===');
const off = calculatePayrollLine({ employee: e, inputs: {}, settings: { ...settings, autoTds: 0 }, totalDays: 30 });
console.log(`Employee 15L, autoTds=0 → TDS ₹${off.incomeTax} (should be 0), Net ₹${off.netPay}`);
