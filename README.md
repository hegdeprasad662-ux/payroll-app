# Payroll Management App

Localhost-first payroll system. Indian payroll rules (PF / ESI / PT / TDS).
Built with: React + Vite + Tailwind (frontend), Node + Express + Prisma + SQLite (backend).

## One-command setup

```bash
# 1. install everything
npm run install:all

# 2. migrate DB + seed real employees (from your sample file)
npm run setup

# 3. run both servers
npm run dev
```

Backend runs on `http://localhost:4000`.
Frontend runs on `http://localhost:5173`.

## Default admin login

- email: `admin@payroll.local`
- password: `admin123`

(Set in `backend/.env`. Change before any non-local use.)

## Project layout

```
payroll-app/
  backend/                 Express + Prisma + SQLite
    prisma/schema.prisma   DB schema
    prisma/seed.js         Seeds 65 real employees from your sheet
    src/services/          payroll-engine, excel-parser, payslip-pdf, compliance
    src/routes/            REST API
  frontend/                React + Vite + Tailwind
    src/pages/             Login, Dashboard, Employees, Upload, Payroll, Register
    src/components/        Reusable UI (Card, Button, DataTable, KpiTile)
```

## Payroll rules baked in

- Basic = 40% of monthly gross (configurable in Settings)
- HRA = 40% of Basic
- Conveyance = ₹1,600 fixed
- Fixed Allowance = monthly gross − Basic − HRA − Conveyance
- EPF = 12% of Basic, capped at ₹15,000 basic → max ₹1,800
- ESI = 0.75% of gross when gross ≤ ₹21,000, else 0
- Karnataka PT = ₹200 when gross > ₹15,000, else 0
- Income Tax = entered manually per employee (TDS placeholder)
- LOP = (monthly gross / total days in month) × LOP days
- Net Pay = Total Earnings − Total Deductions
- Total Payable = Net Pay + Pending Salary (opening)
- Pending (new) = Total Payable − Paid

## Switching to PostgreSQL later

Change `provider` in `backend/prisma/schema.prisma` from `sqlite` to `postgresql`,
update `DATABASE_URL` in `.env`, run `npx prisma migrate dev`.
