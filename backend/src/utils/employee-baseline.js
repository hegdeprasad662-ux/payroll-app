import { deriveStructure, computeEpf, computeEsi, computePt, computeMonthlyTds } from './formulas.js';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Baseline monthly slate for one employee — what they would receive in a
 * regular month with no LOP, no Sunday/Festival, no extras.
 * Same return shape for employees and consultants so UI can use it uniformly.
 */
export function computeBaseline(employee, settings) {
  const isConsultant = employee.employmentType === 'CONSULTANT';
  const monthlyCtc = r2((employee.ctcAnnual || 0) / 12);

  if (isConsultant) {
    const tdsAmount = r2(monthlyCtc * (employee.tdsPercent || 0));
    return {
      monthlyCtc,
      basic: 0, hra: 0, conveyance: 0, fixedAllowance: 0,
      employerPf: 0,
      epf: 0, esi: 0, professionalTax: 0,
      tdsPercent: employee.tdsPercent || 0,
      tdsAmount,
      incomeTax: tdsAmount,
      grossPay: monthlyCtc,
      netPay: r2(monthlyCtc - tdsAmount),
    };
  }

  const s = deriveStructure(employee.ctcAnnual, settings, {
    basic: employee.basic != null ? employee.basic : undefined,
    hra: employee.hra != null ? employee.hra : undefined,
    conveyance: employee.conveyance != null ? employee.conveyance : undefined,
    fixedAllowance: employee.fixedAllowance != null ? employee.fixedAllowance : undefined,
  });
  const epf = computeEpf(s.basic, settings);
  const esi = computeEsi(s.monthlyGross, settings);
  const pt  = computePt(s.monthlyGross, settings);
  let incomeTax = 0;
  if (settings.autoTds == 1 || settings.autoTds === true) {
    incomeTax = computeMonthlyTds(s.monthlyGross * 12, settings);
  }
  return {
    monthlyCtc: s.monthlyCtc,
    basic: s.basic,
    hra: s.hra,
    conveyance: s.conveyance,
    fixedAllowance: s.fixedAllowance,
    employerPf: s.employerPf,
    epf, esi, professionalTax: pt,
    tdsPercent: 0,
    tdsAmount: incomeTax,
    incomeTax,
    grossPay: s.monthlyGross,
    netPay: r2(s.monthlyGross - epf - esi - pt - incomeTax),
  };
}
