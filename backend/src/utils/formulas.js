/**
 * Pure payroll formulas. No DB, no side effects.
 * All amounts are in INR. Rounded to 2 decimals on output.
 */
import { TAX_SLABS_2025 } from '../config/index.js';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Salary structure from CTC.
 *   monthlyCtc       = CTC / 12
 *   employerPf       = pfRate * min(Basic, pfBasicCap)
 *   monthlyGross     = monthlyCtc - employerPf
 *   Basic            = basicPercent * monthlyCtc
 *   HRA              = hraPercent * Basic
 *   Conveyance       = fixed
 *   FixedAllowance   = monthlyGross - Basic - HRA - Conveyance
 */
export function deriveStructure(ctcAnnual, settings, overrides) {
  overrides = overrides || {};
  const monthlyCtc = (ctcAnnual || 0) / 12;
  const basic = overrides.basic != null ? overrides.basic : r2(monthlyCtc * settings.basicPercent);
  const hra = overrides.hra != null ? overrides.hra : r2(basic * settings.hraPercent);
  const conveyance = overrides.conveyance != null ? overrides.conveyance : settings.conveyance;
  const employerPf = r2(Math.min(basic, settings.pfBasicCap) * settings.pfRate);
  const monthlyGross = r2(monthlyCtc - employerPf);
  const fixedAllowance = overrides.fixedAllowance != null
    ? overrides.fixedAllowance
    : r2(monthlyGross - basic - hra - conveyance);
  return {
    monthlyCtc: r2(monthlyCtc),
    monthlyGross, basic, hra, conveyance, fixedAllowance, employerPf,
  };
}

export function computeEpf(basic, settings) {
  return r2(Math.min(basic, settings.pfBasicCap) * settings.pfRate);
}
export function computeEsi(grossEarnings, settings) {
  return grossEarnings <= settings.esiGrossThreshold ? r2(grossEarnings * settings.esiRate) : 0;
}
export function computePt(grossEarnings, settings) {
  return grossEarnings > settings.ptThreshold ? settings.ptAmount : 0;
}

/** Annual income tax per FY 2025-26 New Regime slabs */
export function computeAnnualTaxSlab(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax = 0, prev = 0;
  for (const [upper, rate] of TAX_SLABS_2025) {
    if (taxableIncome <= upper) { tax += (taxableIncome - prev) * rate; break; }
    tax += (upper - prev) * rate;
    prev = upper;
  }
  return tax;
}

/**
 * Monthly TDS for an employee.
 * 1. Annualised gross = monthly fixed gross × 12 (extras like Sunday/Festival/incentives ignored — too volatile to project)
 * 2. Subtract standard deduction
 * 3. Tax per slabs
 * 4. 87A rebate if taxable ≤ rebate threshold (full rebate up to ₹60,000)
 * 5. Add cess (4 %)
 * 6. Divide by 12
 */
export function computeMonthlyTds(annualGross, settings) {
  const stdDed = settings.stdDeduction ?? 75000;
  const rebateThreshold = settings.rebate87AThreshold ?? 1200000;
  const rebateMax = settings.rebate87AMax ?? 60000;
  const cessRate = settings.cessRate ?? 0.04;

  const taxable = Math.max(0, annualGross - stdDed);
  let tax = computeAnnualTaxSlab(taxable);
  if (taxable <= rebateThreshold) tax = Math.max(0, tax - Math.min(rebateMax, tax));
  const total = tax * (1 + cessRate);
  return r2(total / 12);
}

export function computeLopDeduction(monthlyGross, lopDays, totalDays) {
  if (!lopDays || lopDays <= 0) return 0;
  return r2((monthlyGross / totalDays) * lopDays);
}
export function computeSundayEarnings(fixedEarnings, sundayDays, totalDays, settings) {
  if (!sundayDays || sundayDays <= 0) return 0;
  return r2((fixedEarnings / totalDays) * sundayDays * (settings.sundayRate || 0.30));
}
export function computeFestivalEarnings(fixedEarnings, festivalDays, totalDays, settings) {
  if (!festivalDays || festivalDays <= 0) return 0;
  return r2((fixedEarnings / totalDays) * festivalDays * (settings.festivalRate || 0.50));
}
export function effectivePaidDays(totalDays, lopDays) {
  return r2(Math.max(0, totalDays - (lopDays || 0)));
}

export function calculatePayrollLine(args) {
  const employee = args.employee;
  const inputs = args.inputs || {};
  const settings = args.settings;
  const totalDays = args.totalDays;
  const isConsultant = employee.employmentType === 'CONSULTANT';

  const overrides = {
    basic: employee.basic != null ? employee.basic : undefined,
    hra: employee.hra != null ? employee.hra : undefined,
    conveyance: employee.conveyance != null ? employee.conveyance : undefined,
    fixedAllowance: employee.fixedAllowance != null ? employee.fixedAllowance : undefined,
  };
  const structure = deriveStructure(employee.ctcAnnual, settings, overrides);

  const lopDays = inputs.lopDays || 0;
  const paidDays = effectivePaidDays(totalDays, lopDays);
  const lopDeduction = computeLopDeduction(structure.monthlyGross, lopDays, totalDays);
  const fixedMonthlyEarnings = r2(structure.monthlyGross - lopDeduction);

  const sundayDays = inputs.sundayDays || 0;
  const festivalDays = inputs.festivalDays || 0;
  const sundayEarnings = computeSundayEarnings(fixedMonthlyEarnings, sundayDays, totalDays, settings);
  const festivalEarnings = computeFestivalEarnings(fixedMonthlyEarnings, festivalDays, totalDays, settings);

  const leaveEncashment = inputs.leaveEncashment || 0;
  const salesIncentive = inputs.salesIncentive || 0;
  const reimbursements = inputs.reimbursements || 0;
  const arrears = inputs.arrears || 0;
  const referralBonus = inputs.referralBonus || 0;

  const totalEarnings = r2(
    fixedMonthlyEarnings + sundayEarnings + festivalEarnings +
    leaveEncashment + salesIncentive + reimbursements + arrears + referralBonus
  );

  // Statutory deductions
  let epf = 0, esi = 0, professionalTax = 0;
  if (!isConsultant) {
    const basicAfterLop = r2(structure.basic * (paidDays / totalDays));
    epf = computeEpf(basicAfterLop, settings);
    esi = computeEsi(totalEarnings, settings);
    professionalTax = computePt(totalEarnings, settings);
  }

  // Income Tax
  let incomeTax = inputs.incomeTax;
  if (incomeTax == null || incomeTax === 0) {
    if (isConsultant && employee.tdsPercent) {
      // Consultant: flat % of monthly earnings
      incomeTax = r2(totalEarnings * employee.tdsPercent);
    } else if (!isConsultant && (settings.autoTds == 1 || settings.autoTds === true)) {
      // Employee: monthly slab-based TDS on annualized fixed gross (post-LOP)
      const annualGross = r2(structure.monthlyGross * 12);
      incomeTax = computeMonthlyTds(annualGross, settings);
    } else {
      incomeTax = 0;
    }
  }

  const totalDeductions = r2(epf + esi + professionalTax + incomeTax);
  const grossPay = totalEarnings;
  const netPay = r2(grossPay - totalDeductions);

  const pendingSalary = employee.pendingSalaryOpening || 0;
  const totalPayable = r2(netPay + pendingSalary);
  const paid = inputs.paid || 0;
  const pendingClosing = r2(totalPayable - paid);

  return {
    effectivePaidDays: paidDays,
    basic: structure.basic, hra: structure.hra,
    conveyance: structure.conveyance, fixedAllowance: structure.fixedAllowance,
    leaveEncashment, salesIncentive, reimbursements, arrears, referralBonus,
    sundayEarnings, festivalEarnings,
    fixedMonthlyEarnings, totalEarnings,
    epf, esi, professionalTax, incomeTax,
    totalDeductions, grossPay, netPay,
    pendingSalary, totalPayable, paid, pendingClosing,
  };
}
