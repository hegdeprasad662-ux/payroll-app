-- CreateTable
CREATE TABLE "AdminUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "designation" TEXT,
    "email" TEXT,
    "doj" DATETIME,
    "dol" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
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

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "period" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalDays" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "lockedAt" DATETIME
);

-- CreateTable
CREATE TABLE "PayrollLine" (
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

-- CreateTable
CREATE TABLE "LopRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "lopDays" REAL NOT NULL DEFAULT 0,
    "sundayDays" REAL NOT NULL DEFAULT 0,
    "festivalDays" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LopRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncrementRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "oldCtc" REAL NOT NULL,
    "newCtc" REAL NOT NULL,
    "effectiveFrom" DATETIME NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncrementRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArrearRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "days" REAL NOT NULL DEFAULT 0,
    "amount" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArrearRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncentiveRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "ancillary" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncentiveRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralBonus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "referredName" TEXT,
    "amount" REAL NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralBonus_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OtherPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "description" TEXT,
    "travelling" REAL NOT NULL DEFAULT 0,
    "ancillary" REAL NOT NULL DEFAULT 0,
    "amount" REAL NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtherPayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_empNo_key" ON "Employee"("empNo");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_period_key" ON "PayrollRun"("period");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollLine_runId_employeeId_key" ON "PayrollLine"("runId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LopRecord_employeeId_period_key" ON "LopRecord"("employeeId", "period");
