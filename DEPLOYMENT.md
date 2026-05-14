# Free Deployment guide — Render (web) + Neon (Postgres)

**Total cost: ₹0/month.** Suitable for 2 users with non-concurrent access.

Trade-off you accept: first request after 15 minutes of silence takes ~30 s
to wake the server. Then it's fast. Database is always live (no sleep).

---

## Step 0 — Prereqs

- A GitHub account
- A Render.com account (free, github sign-in works)
- A Neon.tech account (free, github sign-in works)

## Step 1 — Switch Prisma to PostgreSQL

Edit `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Delete the old SQLite migrations (they're SQLite-specific):

```
rm -rf backend/prisma/migrations
rm -f  backend/prisma/dev.db backend/prisma/dev.db-journal
```

Commit and push.

## Step 2 — Create a free Postgres on Neon

1. Go to https://console.neon.tech/signup → sign in
2. New Project → Region: pick the one closest to you (e.g. AWS Mumbai)
3. Project name: `payroll`, database name: `payroll`
4. Copy the **Connection string** shown (looks like `postgresql://user:pwd@ep-xxx.aws.neon.tech/payroll?sslmode=require`)
5. Keep this tab open — you'll paste it into Render in Step 4

## Step 3 — Push the repo to GitHub

```
cd "C:\Users\PrasadHegde\Desktop\Claude salary app\payroll-app"
git init
git add .
git commit -m "Initial commit"
```

Create an empty private repo on github.com, then:

```
git remote add origin https://github.com/<your-username>/payroll-app.git
git branch -M main
git push -u origin main
```

## Step 4 — Deploy to Render (free)

1. https://dashboard.render.com → **New** → **Blueprint**
2. Connect your GitHub, pick the `payroll-app` repo
3. Render reads `render.yaml` and shows a Web Service plan: `free`
4. Set these two env vars when prompted:
   - `ADMIN_PASSWORD` — anything strong (becomes your first admin password)
   - `DATABASE_URL` — paste the Neon connection string from Step 2
5. Click **Apply**

Build takes ~5–8 minutes. The deploy log shows:
- Frontend `npm run build`
- Backend `npm ci` + `prisma generate`
- `prisma migrate deploy` (creates all tables in Neon)
- `prisma/seed.js` (creates admin + default settings)
- Server starts on `0.0.0.0:4000`

When it's live you'll get a URL: `https://payroll-app-xxx.onrender.com`

## Step 5 — Add the second user

1. Log in with `admin@payroll.local` and the `ADMIN_PASSWORD` you set
2. **Settings → Admin users → Add admin**
3. Enter the second person's email, name, and a temporary password
4. Send them the URL + credentials
5. They log in, use **Reset password** on their own row to change it

## Cold start behaviour

- If neither of you has used it in 15 minutes, the next page load takes ~30 s.
- Once awake, the service stays warm for another 15 minutes.
- Workaround if it bothers you: a free uptime monitor (e.g. UptimeRobot) hitting
  `/api/health` every 10 minutes will keep it warm 24/7. That uses your 750
  free hours/month but it's enough.

## Updating the app later

```
# edit code locally
git add .
git commit -m "..."
git push
```

Render auto-deploys on every push to `main`. Build + redeploy takes ~3 min.
The database stays intact across deploys (migrations are additive).

## What's running where

| Component | Service | Free tier limit |
|---|---|---|
| Frontend bundle | Served by Express | n/a |
| Backend API | Render web | 750 hrs/mo (sleeps after 15 min) |
| Database | Neon Postgres | 3 GB storage, 191 compute hrs/mo |
| HTTPS | Render | Automatic |
| Custom domain | Both support | Free |

## If you outgrow free

- **Render Starter $7/mo** — removes sleep, faster CPU
- **Neon paid plans start $19/mo** — only if you exceed 3 GB or compute hours (very unlikely for 2 users)

## Local development still works

Nothing changes for local dev. Keep using SQLite locally if you prefer — just
maintain two Prisma schemas, or use Docker to run Postgres locally:

```
docker run -d --name pg -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16
# then in backend/.env:
DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres"
```
