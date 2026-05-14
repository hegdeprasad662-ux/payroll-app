import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@payroll.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export const DEFAULT_SETTINGS = {
  basicPercent: 0.40,
  hraPercent: 0.40,
  conveyance: 1600,
  pfRate: 0.12,
  pfBasicCap: 15000,
  esiRate: 0.0075,
  esiGrossThreshold: 21000,
  ptState: 'KARNATAKA',
  ptThreshold: 15000,
  ptAmount: 200,
  defaultMonthDays: 30,
  sundayRate: 0.30,
  festivalRate: 0.50,
  // Income Tax — FY 2025-26 New Regime (Finance Act 2025)
  autoTds: 1,
  taxRegime: 'NEW_2025',
  stdDeduction: 75000,
  rebate87AThreshold: 1200000,
  rebate87AMax: 60000,
  cessRate: 0.04,
};

// FY 2025-26 New Regime tax slabs: [upperLimit, rate]
export const TAX_SLABS_2025 = [
  [400000,  0.00],
  [800000,  0.05],
  [1200000, 0.10],
  [1600000, 0.15],
  [2000000, 0.20],
  [2400000, 0.25],
  [Infinity, 0.30],
];
