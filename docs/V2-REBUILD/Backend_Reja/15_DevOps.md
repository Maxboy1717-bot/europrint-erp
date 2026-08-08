# 15 — DEVOPS: CI/CD · DOCKER · MUHIT · BACKUP

> Deploy jarayoni, muhit o'zgaruvchilari, CI/CD pipeline, backup strategiya.
> Maqsad: har commit avtomatik tekshirilsin, deploy bir buyruq bilan.

---

## 15.1 Docker Compose tuzilmasi

```yaml
# docker-compose.yml (ishlab chiqarish uchun muhim farqlar)
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}   # env dan olinadi, hardcoded emas
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3030/health"]  # ✅ 127.0.0.1
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}   # env dan, hardcoded emas
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s

volumes:
  pgdata:
```

⚠️ `localhost` o'rniga `127.0.0.1` — healthcheck uchun kritik (SEC-8 sababi).
⚠️ Parollar hech qachon `docker-compose.yml` da to'g'ridan — faqat `${ENV_VAR}`.

---

## 15.2 GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [chore/schema-convergence, main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: europrint_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile

      # 1. TypeCheck:
      - name: TypeCheck BE
        run: npx tsc -p apps/api/tsconfig.json --noEmit
      - name: TypeCheck FE
        run: npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit

      # 2. Tests:
      - name: Unit tests
        run: pnpm test:unit --coverage
        env:
          TEST_DATABASE_URL: postgresql://test:test@localhost:5432/europrint_test

      # 3. Pre-commit checks:
      - name: Design tokens
        run: node scripts/check-design-tokens.mjs
      - name: Schema dups
        run: node scripts/check-schema-dups.js
      - name: i18n
        run: node scripts/i18n-status.mjs

      # 4. Build:
      - name: BE build
        run: cd apps/api && pnpm build
      - name: FE build
        run: cd artifacts/erp-dashboard && pnpm build
```

---

## 15.3 Muhit o'zgaruvchilari (majburiy ro'yxat)

```env
# apps/api/.env (NAMUNA — haqiqiy qiymatlar .env.local da)

# Asosiy:
NODE_ENV=production
PORT=3030

# Database:
DATABASE_URL=postgresql://europrint:STRONG_PASSWORD@localhost:5432/europrint

# JWT (alohida secret lar):
JWT_SECRET=<min-64-char-random>
JWT_REFRESH_SECRET=<min-64-char-different-random>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin seed (parol fallback emas):
ADMIN_SEED_PASSWORD=<strong-password>
ADMIN_SEED_EMAIL=admin@europrint.uz

# AI/IoT (ixtiyoriy):
CLAUDE_API_KEY=<anthropic-key>
YANDEX_TRANSLATE_KEY=<yandex-key>
IOT_GATEWAY_SECRET=<for-mTLS>

# Monitoring (ixtiyoriy):
SENTRY_DSN=<only-in-production>
```

⚠️ `.env` → `.gitignore` da. Hech qachon `git add .env`.
⚠️ `JWT_SECRET` ≠ `JWT_REFRESH_SECRET` — ikki alohida kalit (SEC-5).

---

## 15.4 Deployment Checklist

Har deploy oldidan:

```bash
# 1. TypeCheck:
npx tsc -p apps/api/tsconfig.json --noEmit
npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit

# 2. Testlar:
pnpm test:unit

# 3. Pre-commit:
node scripts/check-design-tokens.mjs
node scripts/check-schema-dups.js

# 4. Build:
cd apps/api && pnpm build
cd artifacts/erp-dashboard && pnpm build

# 5. Migration (agar bor bo'lsa):
# -- APPROVED: owner (sana) belgisi bor migration lar
psql $DATABASE_URL -f docs/migration/[migration].sql

# 6. Deploy:
docker compose up --build -d

# 7. Health check:
curl http://127.0.0.1:3030/health  # {"status":"ok"} bo'lishi kerak

# 8. Smoke test:
curl -X POST http://127.0.0.1:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@europrint.uz","password":"..."}'
```

---

## 15.5 Backup Strategiya

```bash
# Kunlik backup (PostgreSQL):
# Har kecha 02:00 da cron:
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/europrint_$(date +\%Y\%m\%d).sql.gz

# 30 kundan eski backup lar o'chir:
0 3 * * * find /backups -name "europrint_*.sql.gz" -mtime +30 -delete

# Recovery:
gunzip -c /backups/europrint_20260618.sql.gz | psql $DATABASE_URL
```

---

## 15.6 Log boshqaruvi

```ts
// apps/api/src/main.ts — log konfiguratsiya:
const app = await NestFactory.create(AppModule, {
  logger: process.env.NODE_ENV === 'production'
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'],
});

// Log fayllari (docker volumeda):
// backend.log, backend.log.1, ... — hech qachon git da
// .gitignore: backend.log* *.log.*
```

---

## 15.7 Acceptance kriterlari

```
☐ docker compose up --build → 200 OK /health (127.0.0.1)
☐ CI pipeline PASS (tsc + test + build)
☐ Muhit o'zgaruvchilari .env da, git da emas
☐ Migration idempotent (ikki marta ishlatsa xato yo'q)
☐ Kunlik backup cron ishlaydi
☐ Log fayllar .gitignore da (backend.log* + *.log.*)
☐ JWT_SECRET ≠ JWT_REFRESH_SECRET (ikki alohida)
```
