import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

/**
 * Seed only the admin account + settings.
 * Employees / Consultants are uploaded by the user from the Settings page.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@payroll.local';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hashed = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, password: hashed, name: 'Admin' },
    update: { password: hashed },
  });
  console.log(`[seed] admin: ${email} / ${password}`);

  const defaults = {
    basicPercent: 0.40, hraPercent: 0.40, conveyance: 1600,
    pfRate: 0.12, pfBasicCap: 15000,
    esiRate: 0.0075, esiGrossThreshold: 21000,
    ptThreshold: 15000, ptAmount: 200, ptState: 'KARNATAKA',
    defaultMonthDays: 30,
    sundayRate: 0.30, festivalRate: 0.50,
    // Income tax — FY 2025-26 New Regime defaults
    autoTds: 1,
    taxRegime: 'NEW_2025',
    stdDeduction: 75000,
    rebate87AThreshold: 1200000,
    rebate87AMax: 60000,
    cessRate: 0.04,
  };
  for (const [k, v] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key: k },
      create: { key: k, value: String(v) },
      update: {},
    });
  }
  console.log('[seed] settings initialised');
  console.log('[seed] no employees seeded — upload your master file from the Settings page');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
