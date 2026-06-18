# EUROPRINT ERP — BOSHLASH QO'LLANMASI

> Yangi muhitda loyihani ishga tushirish uchun qadam-ba-qadam ko'rsatma.
> Dev muhandis, Muslimbek, yoki yangi agent bu fayldan boshlasin.

---

## Talablar (Prerequisites)

```
Node.js       >= 20.0.0    → node --version
pnpm          >= 8.0.0     → pnpm --version  (npm install -g pnpm)
Docker        >= 24.0      → docker --version
Docker Compose >= 2.20     → docker compose version
PostgreSQL    16            → Docker orqali (quyida)
Git           >= 2.40      → git --version
```

---

## 1. O'rnatish (First-time setup)

```bash
# 1. Repo clone:
git clone https://github.com/[org]/europrint-erp.git
cd europrint-erp/Uzbek-Language-Module

# 2. Branch tekshir (asosiy branch):
git checkout chore/schema-convergence
git status

# 3. Paket o'rnatish:
pnpm install

# 4. TypeCheck (xatosiz bo'lishi kerak):
npx tsc -p apps/api/tsconfig.json --noEmit
npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit
```

---

## 2. Muhit O'zgaruvchilari (.env)

```bash
# BE uchun .env:
cp apps/api/.env.example apps/api/.env

# Majburiy qiymatlarni to'ldiring:
# apps/api/.env:
NODE_ENV=development
PORT=3030
DATABASE_URL=postgresql://europrint:europrint_dev@localhost:5432/europrint

# JWT (kamida 64 ta tasodifiy belgi):
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin (parol o'zingiz belgilang):
ADMIN_SEED_EMAIL=admin@europrint.uz
ADMIN_SEED_PASSWORD=YourStrongPassword123!

# FE uchun:
cp artifacts/erp-dashboard/.env.example artifacts/erp-dashboard/.env.local
# VITE_API_URL=http://localhost:3030
```

---

## 3. Ma'lumotlar Bazasi

```bash
# Option A: Docker orqali (tavsiya)
docker compose up -d postgres

# Tekshirish:
docker exec -it europrint-postgres psql -U europrint -d europrint -c "\dt" | head -20

# Option B: Mahalliy PostgreSQL
createdb europrint
psql europrint -c "CREATE USER europrint WITH PASSWORD 'europrint_dev';"
psql europrint -c "GRANT ALL PRIVILEGES ON DATABASE europrint TO europrint;"
```

---

## 4. Migratsiyalarni Ishga Tushirish

```bash
# Mavjud migration fayllar (docs/migration/ da):
ls docs/migration/

# Tartib bilan ishga tushirish (har fayl idempotent):
for f in docs/migration/*.sql; do
  echo "→ $f"
  psql $DATABASE_URL -f "$f"
done

# Yoki alohida:
psql $DATABASE_URL -f docs/migration/d1-technology-cards-alter.sql
psql $DATABASE_URL -f docs/migration/d2-org-functions-columns.sql
# ...
```

---

## 5. Seed Ma'lumotlar

```bash
# Asosiy lookup jadvallari (roles, razryad, units, accounts):
# docs/migration/seed/ papkasida (agar mavjud bo'lsa):
for f in docs/migration/seed/*.sql; do
  echo "→ Seed: $f"
  psql $DATABASE_URL -f "$f"
done

# Admin foydalanuvchi yaratish (birinchi marta):
cd apps/api
NODE_ENV=development npx ts-node src/seeds/admin.seed.ts
```

---

## 6. Ishga Tushirish

```bash
# Backend (terminal 1):
pnpm --filter @europrint/api run dev:unsafe
# → http://localhost:3030
# → "Application is running on: http://[::1]:3030" ko'rinadi

# Frontend (terminal 2):
pnpm --filter erp-dashboard run dev
# → http://localhost:5173

# Docker bilan (ikkalasi birga):
docker compose up --build
```

---

## 7. Tekshirish (Smoke Test)

```bash
# 1. Health check:
curl http://127.0.0.1:3030/health
# → {"status":"ok"}

# 2. Login:
curl -X POST http://127.0.0.1:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@europrint.uz","password":"YourStrongPassword123!"}'
# → {"accessToken":"...","user":{...}}

# 3. Himoyalangan endpoint (token bilan):
TOKEN="<yuqoridagi accessToken>"
curl http://127.0.0.1:3030/api/hr/employees \
  -H "Authorization: Bearer $TOKEN"
# → {"data":[...],"meta":{...}}

# 4. FE:
# http://localhost:5173 → login sahifasi ko'rinadi

# 5. Oltin zanjir:
node scripts/golden-thread-chain-proof.cjs
# → PASS bo'lishi kerak
```

---

## 8. Har Sessiya Boshida (Muslimbek uchun)

```bash
# 1. Eng so'nggi kodni ol:
git pull origin chore/schema-convergence

# 2. Paketlar yangilangan bo'lsa:
pnpm install

# 3. TypeCheck:
npx tsc -p apps/api/tsconfig.json --noEmit

# 4. Server ishlamasdan oldin migration bor-yo'q:
ls docs/migration/*.sql | tail -5  # oxirgi migration lar

# 5. Yangi migration bo'lsa ishga tushir:
psql $DATABASE_URL -f docs/migration/[yangi-fayl].sql

# 6. Backend qayta boshlash:
# Ctrl+C → pnpm --filter @europrint/api run dev:unsafe
```

---

## 9. Pre-commit Tekshiruvlar

Har commit oldidan:

```bash
# Avtomatik (barcha tekshiruvlar):
npx tsc -p apps/api/tsconfig.json --noEmit && \
npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit && \
node scripts/check-design-tokens.mjs && \
node scripts/check-schema-dups.js && \
node scripts/golden-thread-chain-proof.cjs

# Commit:
git add <aniq-fayl-nomi>  # HECH QACHON git add -A
git commit -m "feat(hr): xodim razryad avtomatik hisoblash"
```

---

## 10. Umumiy Muammolar va Hal Yo'llari

**Muammo: `relation "table_name" does not exist`**
```bash
# Jadval DB da yo'q — migration kerak:
node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_name='table_name'"
# → bo'sh = migration ishga tushirilmagan
psql $DATABASE_URL -f docs/migration/[migration].sql
```

**Muammo: `localhost` healthcheck "unhealthy"**
```bash
# IPv6 muammo — 127.0.0.1 ishlatilsin:
curl http://127.0.0.1:3030/health  # IPv4 to'g'ridan
# docker-compose.yml da healthcheck: ["CMD","wget","-qO-","http://127.0.0.1:3030/health"]
```

**Muammo: `TypeScript error` tsc da**
```bash
# Xatoni to'liq ko'rish:
npx tsc -p apps/api/tsconfig.json --noEmit 2>&1 | head -30
# Yechim: xato fayl va satrni toping, tuzating
```

**Muammo: FE "502 Bad Gateway" yoki "Network Error"**
```bash
# BE ishlaymimi tekshiring:
curl http://127.0.0.1:3030/health
# .env.local da VITE_API_URL=http://localhost:3030 to'g'rimi?
```

**Muammo: `git add -A` pre-commit bloki**
```bash
# XATO: git add -A
# TO'G'RI: git add apps/api/src/modules/hr/employees/hr-employees.service.ts
# Faqat o'zingiz o'zgartirgan fayllarni stage qiling
```

**Muammo: `pg_isready` PostgreSQL ga ulanmaydi**
```bash
docker compose ps  # postgres running?
docker compose restart postgres
# DATABASE_URL to'g'ri format: postgresql://user:pass@host:port/dbname
```

---

## Foydali Buyruqlar

```bash
# DB ga to'g'ridan ulanish:
node _audit/q.cjs "SELECT COUNT(*) FROM hr_employees"

# Barcha jadvallar ro'yxati:
node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1"

# Docker loglar:
docker compose logs -f api
docker compose logs -f postgres

# Barcha testlar:
pnpm test:unit

# Faqat bir modul test:
pnpm test --testPathPattern="apps/api/src/modules/hr"

# Schema dups tekshiruvi:
node scripts/check-schema-dups.js

# Oltin zanjir:
node scripts/golden-thread-chain-proof.cjs
```

---

*EuroPrint ERP · Boshlash Qo'llanmasi · Versiya: 2026-06-18*
