import PDFDocument from 'pdfkit';

const inr = (n) => '₹ ' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

/** Generates a single payslip PDF stream */
export function buildPayslipPdf(line, periodLabel, companyName = 'Your Company Pvt Ltd') {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  // Header
  doc.fontSize(16).fillColor('#111').text(companyName, { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor('#555').text(`Payslip — ${periodLabel}`, { align: 'center' });
  doc.moveDown();

  // Employee block
  doc.fontSize(10).fillColor('#000');
  const t = doc.y;
  doc.text(`Employee No: ${line.empNo}`, 40, t);
  doc.text(`Name: ${line.name}`, 300, t);
  doc.moveDown(0.2);
  doc.text(`Department: ${line.department || '-'}`, 40, doc.y);
  doc.text(`DOJ: ${line.doj ? new Date(line.doj).toLocaleDateString('en-IN') : '-'}`, 300, doc.y);
  doc.moveDown(0.2);
  doc.text(`Effective Paid Days: ${line.effectivePaidDays}`, 40);
  doc.moveDown();

  // Earnings table
  const drawRow = (label, amount, x = 40) => {
    doc.text(label, x, doc.y);
    doc.text(amount == null ? '' : inr(amount), x + 200, doc.y - 12, { width: 100, align: 'right' });
    doc.moveDown(0.4);
  };

  doc.fontSize(12).fillColor('#222').text('Earnings', 40);
  doc.moveTo(40, doc.y).lineTo(340, doc.y).stroke();
  doc.moveDown(0.2);
  doc.fontSize(10);
  drawRow('Basic', line.basic);
  drawRow('HRA', line.hra);
  drawRow('Conveyance', line.conveyance);
  drawRow('Fixed Allowance', line.fixedAllowance);
  drawRow('Leave Encashment', line.leaveEncashment);
  drawRow('Sales Incentive', line.salesIncentive);
  drawRow('Reimbursements', line.reimbursements);
  drawRow('Arrears', line.arrears);
  drawRow('Referral Bonus', line.referralBonus);
  doc.font('Helvetica-Bold');
  drawRow('Total Earnings', line.totalEarnings);
  doc.font('Helvetica');

  // Deductions
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#222').text('Deductions', 40);
  doc.moveTo(40, doc.y).lineTo(340, doc.y).stroke();
  doc.moveDown(0.2);
  doc.fontSize(10);
  drawRow('EPF', line.epf);
  drawRow('ESI', line.esi);
  drawRow('Professional Tax', line.professionalTax);
  drawRow('Income Tax (TDS)', line.incomeTax);
  doc.font('Helvetica-Bold');
  drawRow('Total Deductions', line.totalDeductions);
  doc.font('Helvetica');

  // Net pay
  doc.moveDown();
  doc.fontSize(12).fillColor('#0a7').text(`Net Pay: ${inr(line.netPay)}`, 40);
  if (line.pendingSalary) {
    doc.fillColor('#555').fontSize(10).text(`Pending Salary (carried forward): ${inr(line.pendingSalary)}`);
  }
  doc.fillColor('#222').fontSize(12).text(`Total Payable: ${inr(line.totalPayable)}`);
  if (line.paid) doc.fontSize(10).fillColor('#555').text(`Paid: ${inr(line.paid)}`);
  if (line.pendingClosing) doc.fontSize(10).fillColor('#a55').text(`Pending Closing: ${inr(line.pendingClosing)}`);

  doc.moveDown(2);
  doc.fontSize(8).fillColor('#888').text('System-generated. Signature not required.', { align: 'center' });
  return doc;
}
