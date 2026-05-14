# ---------- 1. Build frontend ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- 2. Install backend prod deps + Prisma client ----------
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate

# ---------- 3. Final runtime ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Backend
COPY --from=backend-build /app/backend ./backend
# Frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
EXPOSE 4000

# Run migrations + start on every container boot
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
