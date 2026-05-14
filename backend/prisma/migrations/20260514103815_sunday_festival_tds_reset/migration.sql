-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "designation" TEXT,
    "email" TEXT,
    "doj" DATETIME,
    "dol" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "employmentType" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "tdsPercent" REAL NOT NULL DEFAULT 0,
    "ctcAnnual" REAL NOT NULL DEFAULT 0,
    "basic" REAL,
    "hra" REAL,
    "conveyance" REAL,
    "fixedAllowance" REAL,
    "pan" TEXT,
    "uan" TEXT,
    "esiNumber" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "ifsc" TEXT,
    "pendingSalaryOpening" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employee" ("bankAccount", "bankName", "basic", "conveyance", "createdAt", "ctcAnnual", "department", "designation", "doj", "dol", "email", "empNo", "esiNumber", "fixedAllowance", "hra", "id", "ifsc", "name", "notes", "pan", "pendingSalaryOpening", "status", "uan", "updatedAt") SELECT "bankAccount", "bankName", "basic", "conveyance", "createdAt", "ctcAnnual", "department", "designation", "doj", "dol", "email", "empNo", "esiNumber", "fixedAllowance", "hra", "id", "ifsc", "name", "notes", "pan", "pendingSalaryOpening", "status", "uan", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_empNo_key" ON "Employee"("empNo");
CREATE TABLE "new_PayrollLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "runId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "empNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "doj" DATETIME,
    "ctcAnnual" REAL NOT NULL,
    "effectivePaidDays" REAL NOT NULL,
    "basic" REAL NOT NULL,
    "hra" REAL NOT NULL,
    "conveyance" REAL NOT NULL,
    "fixedAllowance" REAL NOT NULL,
    "leaveEncashment" REAL NOT NULL DEFAULT 0,
    "salesIncentive" REAL NOT NULL DEFAULT 0,
    "reimbursements" REAL NOT NULL DEFAULT 0,
    "arrears" REAL NOT NULL DEFAULT 0,
    "referralBonus" REAL NOT NULL DEFAULT 0,
    "sundayEarnings" REAL NOT NULL DEFAULT 0,
    "festivalEarnings" REAL NOT NULL DEFAULT 0,
    "fixedMonthlyEarnings" REAL NOT NULL,
    "totalEarnings" REAL NOT NULL,
    "epf" REAL NOT NULL,
    "esi" REAL NOT NULL,
    "incomeTax" REAL NOT NULL DEFAULT 0,
    "professionalTax" REAL NOT NULL,
    "totalDeductions" REAL NOT NULL,
    "grossPay" REAL NOT NULL,
    "netPay" REAL NOT NULL,
    "pendingSalary" REAL NOT NULL DEFAULT 0,
    "totalPayable" REAL NOT NULL,
    "paid" REAL NOT NULL DEFAULT 0,
    "pendingClosing" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CALCULATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollLine_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PayrollRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollLine_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PayrollLine" ("arrears", "basic", "conveyance", "createdAt", "ctcAnnual", "department", "doj", "effectivePaidDays", "empNo", "employeeId", "epf", "esi", "fixedAllowance", "fixedMonthlyEarnings", "grossPay", "hra", "id", "incomeTax", "leaveEncashment", "name", "netPay", "paid", "pendingClosing", "pendingSalary", "professionalTax", "referralBonus", "reimbursements", "runId", "salesIncentive", "status", "totalDeductions", "totalEarnings", "totalPayable") SELECT "arrears", "basic", "conveyance", "createdAt", "ctcAnnual", "department", "doj", "effectivePaidDays", "empNo", "employeeId", "epf", "esi", "fixedAllowance", "fixedMonthlyEarnings", "grossPay", "hra", "id", "incomeTax", "leaveEncashment", "name", "netPay", "paid", "pendingClosing", "pendingSalary", "professionalTax", "referralBonus", "reimbursements", "runId", "salesIncentive", "status", "totalDeductions", "totalEarnings", "totalPayable" FROM "PayrollLine";
DROP TABLE "PayrollLine";
ALTER TABLE "new_PayrollLine" RENAME TO "PayrollLine";
CREATE UNIQUE INDEX "PayrollLine_runId_employeeId_key" ON "PayrollLine"("runId", "employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
