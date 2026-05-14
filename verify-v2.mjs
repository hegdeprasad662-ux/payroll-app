import { calculatePayrollLine } from './backend/src/utils/formulas.js';

const settings = {
  basicPercent: 0.40, hraPercent: 0.40, conveyance: 1600,
  pfRate: 0.12, pfBasicCap: 15000,
  esiRate: 0.0075, esiGrossThreshold: 21000,
  ptThreshold: 15000, ptAmount: 200,
  defaultMonthDays: 30,
  sundayRate: 0.30,
  festivalRate: 0.50,
};

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

console.log('================= ENGINE TESTS =================\n');

// --- Test 1: Plain employee, no LOP / Sunday / Festival ---
console.log('TEST 1 — Plain employee, no LOP, no Sunday, no Festival');
let r = calculatePayrollLine({
  employee: { ctcAnnual: 360000, employmentType: 'EMPLOYEE' },
  inputs: {}, settings, totalDays: 30,
});
console.log(`  Basic=${r.basic} HRA=${r.hra} Conv=${r.conveyance} FA=${r.fixedAllowance}`);
console.log(`  TotalEarnings=${r.totalEarnings}  Sunday=${r.sundayEarnings}  Festival=${r.festivalEarnings}`);
console.log(`  EPF=${r.epf} ESI=${r.esi} PT=${r.professionalTax} IT=${r.incomeTax}  Net=${r.netPay}`);

// --- Test 2: Employee with 4 Sunday days ---
console.log('\nTEST 2 — Employee CTC 360k, 4 Sundays worked (no LOP, no Festival)');
r = calculatePayrollLine({
  employee: { ctcAnnual: 360000, employmentType: 'EMPLOYEE' },
  inputs: { sundayDays: 4 }, settings, totalDays: 30,
});
const fixed = r.fixedMonthlyEarnings;
const dailyWage = fixed / 30;
const expectedSunday = r2(dailyWage * 4 * 0.30);
console.log(`  Fixed monthly earnings: ${fixed}`);
console.log(`  Daily wage = ${fixed}/30 = ${r2(dailyWage)}`);
console.log(`  Expected Sunday earnings = ${r2(dailyWage)} × 4 × 0.30 = ₹${expectedSunday}`);
console.log(`  Engine Sunday earnings = ₹${r.sundayEarnings}  ${r.sundayEarnings === expectedSunday ? '✓' : '✗ MISMATCH'}`);
console.log(`  Total earnings (incl Sunday) = ₹${r.totalEarnings}  Net = ₹${r.netPay}`);

// --- Test 3: Employee with 2 Festival days ---
console.log('\nTEST 3 — Employee CTC 360k, 2 Festival days worked');
r = calculatePayrollLine({
  employee: { ctcAnnual: 360000, employmentType: 'EMPLOYEE' },
  inputs: { festivalDays: 2 }, settings, totalDays: 30,
});
const fixed3 = r.fixedMonthlyEarnings;
const expectedFestival = r2((fixed3 / 30) * 2 * 0.50);
console.log(`  Fixed monthly earnings: ${fixed3}`);
console.log(`  Expected Festival earnings = (${fixed3}/30) × 2 × 0.50 = ₹${expectedFestival}`);
console.log(`  Engine Festival earnings = ₹${r.festivalEarnings}  ${r.festivalEarnings === expectedFestival ? '✓' : '✗ MISMATCH'}`);

// --- Test 4: Combined LOP + Sunday + Festival ---
console.log('\nTEST 4 — CTC 360k, 1 LOP day, 2 Sundays, 1 Festival day');
r = calculatePayrollLine({
  employee: { ctcAnnual: 360000, employmentType: 'EMPLOYEE' },
  inputs: { lopDays: 1, sundayDays: 2, festivalDays: 1 }, settings, totalDays: 30,
});
console.log(`  Paid days: ${r.effectivePaidDays} (should be 29 = 30 - 1 LOP)`);
console.log(`  Fixed (post-LOP): ₹${r.fixedMonthlyEarnings}`);
console.log(`  Sunday: ₹${r.sundayEarnings}  Festival: ₹${r.festivalEarnings}`);
console.log(`  Total earnings (fixed + sun + fest): ₹${r.totalEarnings}`);
const computedSundayDaily = r.fixedMonthlyEarnings / 30;
const expSun = r2(computedSundayDaily * 2 * 0.30);
const expFest = r2(computedSundayDaily * 1 * 0.50);
console.log(`  Expected Sunday = ${r2(computedSundayDaily)} × 2 × 0.30 = ₹${expSun}  ${r.sundayEarnings === expSun ? '✓' : '✗'}`);
console.log(`  Expected Festival = ${r2(computedSundayDaily)} × 1 × 0.50 = ₹${expFest}  ${r.festivalEarnings === expFest ? '✓' : '✗'}`);

// --- Test 5: Consultant with TDS 10% ---
console.log('\nTEST 5 — Consultant, CTC 600k, TDS 10%, no LOP');
r = calculatePayrollLine({
  employee: { ctcAnnual: 600000, employmentType: 'CONSULTANT', tdsPercent: 0.10 },
  inputs: {}, settings, totalDays: 30,
});
const expectedTds = r2(r.totalEarnings * 0.10);
console.log(`  Monthly gross: ₹${r.totalEarnings}`);
console.log(`  EPF: ₹${r.epf} (should be 0 for consultant)  ${r.epf === 0 ? '✓' : '✗'}`);
console.log(`  ESI: ₹${r.esi} (should be 0)  ${r.esi === 0 ? '✓' : '✗'}`);
console.log(`  PT: ₹${r.professionalTax} (should be 0)  ${r.professionalTax === 0 ? '✓' : '✗'}`);
console.log(`  TDS @ 10%: ₹${r.incomeTax}  expected ₹${expectedTds}  ${r.incomeTax === expectedTds ? '✓' : '✗'}`);
console.log(`  Net: ₹${r.netPay}  (= ${r.totalEarnings} - ${r.incomeTax} = ${r2(r.totalEarnings - r.incomeTax)})`);

// --- Test 6: Consultant with TDS 5% and 2 Sundays worked ---
console.log('\nTEST 6 — Consultant, CTC 480k, TDS 5%, 2 Sundays worked');
r = calculatePayrollLine({
  employee: { ctcAnnual: 480000, employmentType: 'CONSULTANT', tdsPercent: 0.05 },
  inputs: { sundayDays: 2 }, settings, totalDays: 30,
});
console.log(`  Fixed: ₹${r.fixedMonthlyEarnings}  Sunday: ₹${r.sundayEarnings}`);
console.log(`  Total earnings: ₹${r.totalEarnings}  TDS: ₹${r.incomeTax}  Net: ₹${r.netPay}`);
const sun6 = r2((r.fixedMonthlyEarnings / 30) * 2 * 0.30);
console.log(`  Expected Sunday = ₹${sun6}  ${r.sundayEarnings === sun6 ? '✓' : '✗'}`);
const tds6 = r2(r.totalEarnings * 0.05);
console.log(`  Expected TDS @ 5% = ₹${tds6}  ${r.incomeTax === tds6 ? '✓' : '✗'}`);

console.log('\n================= ALL TESTS DONE =================');
