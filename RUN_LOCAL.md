# EuroPrint ERP — Windows Mahalliy Ishlatish

## TL;DR (eng tez yo'l)

```powershell
# 1. Talablar (1 marta)
# - Node.js 20+ (nodejs.org)
# - npm install -g pnpm
# - PostgreSQL (Docker tavsiya etiladi)

# 2. PostgreSQL Docker'da
docker run -d --name europrint-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=europrint -p 5432:5432 postgres:16-alpine

# 3. Ixtiyoriy: Redis
docker run -d --name europrint-redis -p 6379:6379 redis:7-alpine

# 4. Setup (1 marta)
cd C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module
.\setup-local.ps1

# 5. Ishga tushirish (har safar)
.\run-local.ps1

# 6. Brauzerda
# http://localhost:20806/erp-dashboard/
# Login: admin / Admin123!
```

---

## Manual qadamlar (skript ishlamasa)

### 1. Dependencies

```powershell
cd C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module
pnpm install
```

### 2. Database

```powershell
# Drizzle bilan (tavsiya)
cd lib\db
pnpm exec drizzle-kit push

# YOKI qo'lda
psql -U postgres -h localhost -d europrint -f drizzle\0000_nice_kylun.sql
```

### 3. Seed

```powershell
cd apps\api
pnpm seed                # admin / Admin123!
pnpm seed:master-data    # 110+ position, 18 dept
```

### 4. Run

**Terminal 1 — Backend:**
```powershell
cd C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module
pnpm --filter @europrint/api run dev
```

**Terminal 2 — Frontend:**
```powershell
cd C:\Users\AzzA\Downloads\EuroPrint-Clean\Uzbek-Language-Module
pnpm --filter @workspace/erp-dashboard run dev
```

---

## Portlar

| Servis | Port | URL |
|---|---|---|
| Backend (NestJS) | 8080 | http://localhost:8080/health |
| Frontend (Vite) | 20806 | http://localhost:20806/erp-dashboard/ |
| PostgreSQL | 5432 | postgres://postgres:postgres@localhost:5432/europrint |
| Redis (ixtiyoriy) | 6379 | redis://localhost:6379 |

---

## Texnik muammolar va yechim

### Backend `EADDRINUSE: 8080 band`
```powershell
# Kim 8080 ni egallagan?
netstat -ano | findstr :8080
# PID ni topib o'chiring:
taskkill /F /PID <PID>
```

### `psql` topilmadi
PostgreSQL native installer ishlatgan bo'lsangiz PATH'ga qo'shing:
```powershell
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"
```
Yoki Docker variantini ishlating.

### `drizzle-kit push` xato
```powershell
# DATABASE_URL to'g'rimi?
echo $env:DATABASE_URL

# Manual migration:
cd lib\db
psql -U postgres -h localhost -d europrint -f drizzle\0000_nice_kylun.sql
psql -U postgres -h localhost -d europrint -f drizzle\0007_hr_architecture_additions.sql
```

### `pnpm install` xato
```powershell
# Cache tozalash
pnpm store prune
pnpm install --no-frozen-lockfile
```

### Frontend `502 Bad Gateway` proxy
Backend ishlamayapti. Terminal 1 (`pnpm --filter @europrint/api run dev`) ochiqligini tekshiring.

### Redis xato (`ECONNREFUSED 6379`)
Redis ixtiyoriy — yo'q bo'lsa **degraded mode**'da ishlaydi. Faqat warning chiqadi, dastur to'xtamaydi.

### PostgreSQL parol xato
`.env` da `DATABASE_URL` da parolni o'zgartiring:
```
DATABASE_URL=postgresql://postgres:SIZNING_PAROLINGIZ@localhost:5432/europrint
```

---

## Smoke testlar

```powershell
# 1. Backend ishlaydimi?
curl http://localhost:8080/health
# Kutilgan: {"status":"ok"}

# 2. Login
$login = curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"Admin123!\"}'
echo $login

# 3. Position seed tekshiruvi
psql -U postgres -h localhost -d europrint -c "SELECT COUNT(*) FROM positions;"
# Kutilgan: 75+ pos

# 4. Trigger 21 (E-Commerce → CRM Lead)
curl -X POST http://localhost:8080/api/public/orders `
  -H "Content-Type: application/json" `
  -d '{\"customerName\":\"Test\",\"customerPhone\":\"+998901234567\",\"items\":[{\"product_id\":1,\"quantity\":100}],\"totalAmount\":600000}'

psql -U postgres -h localhost -d europrint -c "SELECT id, contact_name, contact_phone, source FROM sd_leads ORDER BY id DESC LIMIT 3;"
```

---

## Production'ga deploy

Mahalliy test PASS bo'lganda serverga deploy qilishingiz mumkin. Asosiy farqlar:

| Sozlama | Local | Production |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `JWT_SECRET` | dev fallback | **kuchli random** (32+ belgi) |
| `DATABASE_URL` | `localhost` | server IP / managed DB |
| `ALLOWED_ORIGINS` | `http://localhost:*` | sizning domeningiz |
| `SWAGGER_SECRET` | bo'lishi mumkin | **majburiy yashirish** |
| Frontend build | `pnpm run dev` | `pnpm run build` → `dist/` |

Deploy buyruqlari:
```powershell
# Frontend build
pnpm --filter @workspace/erp-dashboard run build
# Output: artifacts/erp-dashboard/dist/public/

# Backend build
pnpm --filter @europrint/api run build
# Output: apps/api/dist/

# Production'da
NODE_ENV=production node apps/api/dist/main.js
```

Frontend `dist/public/` ni Nginx/Caddy bilan serve qiling, va `/api/*` ni backend (port 8080) ga proxy qiling.

---

## Buzilsa nima qilish?

**1. DB toza qaytarish:**
```powershell
docker rm -f europrint-pg
docker volume rm europrint-data
# Keyin yangi yaratish: yuqoridagi `docker run` buyrug'i
.\setup-local.ps1
```

**2. node_modules qayta o'rnatish:**
```powershell
Remove-Item -Recurse -Force node_modules, pnpm-lock.yaml
pnpm install
```

**3. Faqat bitta modul restart:**
```powershell
# Terminal 1 da Ctrl+C
pnpm --filter @europrint/api run dev
```
