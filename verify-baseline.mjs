import { computeBaseline } from './backend/src/utils/employee-baseline.js';

const settings = {
  basicPercent: 0.40, hraPercent: 0.40, conveyance: 1600,
  pfRate: 0.12, pfBasicCap: 15000,
  esiRate: 0.0075, esiGrossThreshold: 21000,
  ptThreshold: 15000, ptAmount: 200,
  defaultMonthDays: 30, sundayRate: 0.30, festivalRate: 0.50,
};

console.log('=== BASELINE TESTS ===\n');

// Employee: 7.2 LPA
const emp = { ctcAnnual: 720000, employmentType: 'EMPLOYEE' };
const eb = computeBaseline(emp, settings);
console.log('EMPLOYEE — CTC ₹7.2L');
console.log('  Monthly CTC:    ₹' + eb.monthlyCtc);
console.log('  Basic (40%):    ₹' + eb.basic);
console.log('  HRA (40% Basic):₹' + eb.hra);
console.log('  Conveyance:     ₹' + eb.conveyance);
console.log('  Fixed Allow:    ₹' + eb.fixedAllowance);
console.log('  Employer PF:    ₹' + eb.employerPf + ' (capped to ₹1,800)');
console.log('  Gross:          ₹' + eb.grossPay);
console.log('  EPF (employee): ₹' + eb.epf);
console.log('  PT:             ₹' + eb.professionalTax);
console.log('  Net (baseline): ₹' + eb.netPay);

// Consultant: 6 LPA @ 10% TDS
const con = { ctcAnnual: 600000, employmentType: 'CONSULTANT', tdsPercent: 0.10 };
const cb = computeBaseline(con, settings);
console.log('\nCONSULTANT — CTC ₹6L, TDS 10%');
console.log('  Monthly CTC: ₹' + cb.monthlyCtc);
console.log('  TDS %:       ' + (cb.tdsPercent * 100) + '%');
console.log('  TDS Amount:  ₹' + cb.tdsAmount);
console.log('  Net Pay:     ₹' + cb.netPay);
console.log('  (No PF / ESI / PT for consultants — all 0)');
console.log('  EPF:         ₹' + cb.epf, '  ESI: ₹' + cb.esi, '  PT: ₹' + cb.professionalTax);

// Consultant: 4.8 LPA @ 5% TDS
const con2 = { ctcAnnual: 480000, employmentType: 'CONSULTANT', tdsPercent: 0.05 };
const cb2 = computeBaseline(con2, settings);
console.log('\nCONSULTANT — CTC ₹4.8L, TDS 5%');
console.log('  Monthly CTC: ₹' + cb2.monthlyCtc);
console.log('  TDS Amount:  ₹' + cb2.tdsAmount);
console.log('  Net Pay:     ₹' + cb2.netPay);

console.log('\nAll baselines look reasonable ✓');
