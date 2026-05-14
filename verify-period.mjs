import { calculatePayrollLine } from './backend/src/utils/formulas.js';
import { computeBaseline } from './backend/src/utils/employee-baseline.js';

const settings = {
  basicPercent: 0.40, hraPercent: 0.40, conveyance: 1600,
  pfRate: 0.12, pfBasicCap: 15000,
  esiRate: 0.0075, esiGrossThreshold: 21000,
  ptThreshold: 15000, ptAmount: 200,
  defaultMonthDays: 30, sundayRate: 0.30, festivalRate: 0.50,
};

console.log('=== EMPLOYEE @ ₹7.2 LPA ===');
const emp = { ctcAnnual: 720000, employmentType: 'EMPLOYEE' };

const baseline = computeBaseline(emp, settings);
console.log('BASELINE (no inputs): Net pay ₹' + baseline.netPay);

console.log('\nWITH inputs: 2 LOP, 3 Sundays, 1 Festival, ₹5k arrears, ₹3k incentive');
const adjusted = calculatePayrollLine({
  employee: emp,
  inputs: { lopDays: 2, sundayDays: 3, festivalDays: 1, arrears: 5000, salesIncentive: 3000 },
  settings, totalDays: 30,
});
console.log('  Paid days:        ' + adjusted.effectivePaidDays);
console.log('  Fixed (post-LOP): ₹' + adjusted.fixedMonthlyEarnings);
console.log('  Sunday +:         ₹' + adjusted.sundayEarnings);
console.log('  Festival +:       ₹' + adjusted.festivalEarnings);
console.log('  Arrears +:        ₹' + adjusted.arrears);
console.log('  Incentive +:      ₹' + adjusted.salesIncentive);
console.log('  Gross:            ₹' + adjusted.grossPay);
console.log('  EPF -:            ₹' + adjusted.epf);
console.log('  PT -:             ₹' + adjusted.professionalTax);
console.log('  NET PAY:          ₹' + adjusted.netPay);
console.log('  Delta vs baseline: ₹' + (adjusted.netPay - baseline.netPay).toFixed(2));
