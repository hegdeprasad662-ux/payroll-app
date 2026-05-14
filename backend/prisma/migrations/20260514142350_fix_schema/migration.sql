-- Drop all tables if they exist (in correct dependency order)
DROP TABLE IF EXISTS "PayrollLine" CASCADE;
DROP TABLE IF EXISTS "LopRecord" CASCADE;
DROP TABLE IF EXISTS "IncrementRecord" CASCADE;
DROP TABLE IF EXISTS "ArrearRecord" CASCADE;
DROP TABLE IF EXISTS "IncentiveRecord" CASCADE;
DROP TABLE IF EXISTS "ReferralBonus" CASCADE;
DROP TABLE IF EXISTS "OtherPayment" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "PayrollRun" CASCADE;
DROP TABLE IF EXISTS "Employee" CASCADE;
DROP TABLE IF EXISTS "AdminUser" CASCADE;
DROP TABLE IF EXISTS "Setting" CASCADE;

-- CreateTable "AdminUser"
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable "Employee"
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "empNo" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "designation" TEXT,
    "email" TEXT,
    "doj" TIMESTAMP(3),
    "dol" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "employmentType" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "tdsPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctcAnnual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "basic" DOUBLE PRECISION,
    "hra" DOUBLE PRECISION,
    "conveyance" DOUBLE PRECISION,
    "fixedAllowance" DOUBLE PRECISION,
    "pan" TEXT,
    "uan" TEXT,
    "esiNumber" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "ifsc" TEXT,
    "pendingSalaryOpening" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable "PayrollRun"
CREATE TABLE "PayrollRun" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL UNIQUE,
    "periodLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalDays" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3)
);

-- CreateTable "PayrollLine"
CREATE TABLE "PayrollLine" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "runId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "empNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "doj" TIMESTAMP(3),
    "ctcAnnual" DOUBLE PRECISION NOT NULL,
    "effectivePaidDays" DOUBLE PRECISION NOT NULL,
    "basic" DOUBLE PRECISION NOT NULL,
    "hra" DOUBLE PRECISION NOT NULL,
    "conveyance" DOUBLE PRECISION NOT NULL,
    "fixedAllowance" DOUBLE PRECISION NOT NULL,
    "leaveEncashment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salesIncentive" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reimbursements" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "arrears" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referralBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sundayEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "festivalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixedMonthlyEarnings" DOUBLE PRECISION NOT NULL,
    "totalEarnings" DOUBLE PRECISION NOT NULL,
    "epf" DOUBLE PRECISION NOT NULL,
    "esi" DOUBLE PRECISION NOT NULL,
    "incomeTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "professionalTax" DOUBLE PRECISION NOT NULL,
    "totalDeductions" DOUBLE PRECISION NOT NULL,
    "grossPay" DOUBLE PRECISION NOT NULL,
    "netPay" DOUBLE PRECISION NOT NULL,
    "pendingSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPayable" DOUBLE PRECISION NOT NULL,
    "paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingClosing" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CALCULATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollLine_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PayrollRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollLine_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable "LopRecord"
CREATE TABLE "LopRecord" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "lopDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sundayDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "festivalDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LopRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable "IncrementRecord"
CREATE TABLE "IncrementRecord" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "oldCtc" DOUBLE PRECISION NOT NULL,
    "newCtc" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncrementRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable "ArrearRecord"
CREATE TABLE "ArrearRecord" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArrearRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable "IncentiveRecord"
CREATE TABLE "IncentiveRecord" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "ancillary" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncentiveRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable "ReferralBonus"
CREATE TABLE "ReferralBonus" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "referredName" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralBonus_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable "OtherPayment"
CREATE TABLE "OtherPayment" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "employeeId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "description" TEXT,
    "travelling" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ancillary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtherPayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable "AuditLog"
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable "Setting"
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
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
