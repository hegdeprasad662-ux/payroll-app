import xlsx from 'xlsx';

export function buildSalaryRegisterXlsx(periodLabel, lines) {
  const rows = lines.map((l) => ({
    'Period': periodLabel,
    'Employee No': l.empNo,
    'Employee Name': l.name,
    'Department': l.department,
    'Date of Joining': l.doj ? new Date(l.doj).toISOString().slice(0, 10) : '',
    'CTC Amount': l.ctcAnnual,
    'Effective Paid Days': l.effectivePaidDays,
    'Basic': l.basic,
    'House Rent Allowance': l.hra,
    'Conveyance Allowance': l.conveyance,
    'Fixed Allowance': l.fixedAllowance,
    'Leave Encashment': l.leaveEncashment,
    'Sales Incentive': l.salesIncentive,
    'Reimbursements': l.reimbursements,
    'Arrears': l.arrears,
    'Referral Bonus': l.referralBonus,
    'Fixed Monthly Earnings': l.fixedMonthlyEarnings,
    'Total Earnings': l.totalEarnings,
    'EPF': l.epf,
    'ESI': l.esi,
    'Income Tax': l.incomeTax,
    'Professional Tax': l.professionalTax,
    'Total Deductions': l.totalDeductions,
    'Gross Pay': l.grossPay,
    'Net Pay': l.netPay,
    'Pending Salary': l.pendingSalary,
    'Total Payable': l.totalPayable,
    'Paid': l.paid,
    'Pending Closing': l.pendingClosing,
  }));
  const ws = xlsx.utils.json_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Salary Register');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function buildBankTransferXlsx(periodLabel, lines, employees) {
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const rows = lines.map((l) => {
    const e = empMap[l.employeeId] || {};
    return {
      'Employee No': l.empNo,
      'Name': l.name,
      'Bank Name': e.bankName || '',
      'Account Number': e.bankAccount || '',
      'IFSC': e.ifsc || '',
      'Amount': l.netPay,
      'Period': periodLabel,
    };
  });
  const ws = xlsx.utils.json_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Bank Transfer');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function buildComplianceXlsx(periodLabel, lines) {
  const pfTotal = lines.reduce((s, l) => s + l.epf, 0);
  const esiTotal = lines.reduce((s, l) => s + l.esi, 0);
  const ptTotal = lines.reduce((s, l) => s + l.professionalTax, 0);
  const tdsTotal = lines.reduce((s, l) => s + l.incomeTax, 0);

  const wb = xlsx.utils.book_new();
  const sum = xlsx.utils.json_to_sheet([
    { Liability: 'EPF', Amount: pfTotal },
    { Liability: 'ESI', Amount: esiTotal },
    { Liability: 'Professional Tax', Amount: ptTotal },
    { Liability: 'TDS', Amount: tdsTotal },
  ]);
  xlsx.utils.book_append_sheet(wb, sum, 'Summary');

  const detail = xlsx.utils.json_to_sheet(lines.map((l) => ({
    'Employee No': l.empNo,
    'Name': l.name,
    'EPF': l.epf,
    'ESI': l.esi,
    'PT': l.professionalTax,
    'TDS': l.incomeTax,
    'Gross': l.grossPay,
  })));
  xlsx.utils.book_append_sheet(wb, detail, 'Detail');

  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
