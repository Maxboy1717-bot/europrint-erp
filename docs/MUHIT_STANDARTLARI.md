# EUROPRINT ERP — MUHIT STANDARTLARI

> **.env, Docker, portlar, secret boshqaruv — muhit konfiguratsiyasi qoidalari.**
> Noto'g'ri muhit = "menda ishlaydi, serverda yo'q" muammosi.
> Qoida: .env = yagona haqiqat manbasi. Kod ichida hech qanday default secret.
> Bog'liq: [BOSHLASH.md](../BOSHLASH.md) · [XAVFSIZLIK_STANDARTLARI.md](XAVFSIZLIK_STANDARTLARI.md) §7 · [XAVF_REESTRI.md](XAVF_REESTRI.md) R-03

---

## 1. PORT STANDARTLARI

```
Backend API:    3030  (apps/api → localhost:3030)
Frontend:       5173  (artifacts/erp-dashboard → localhost:5173)
PostgreSQL:     5432  (docker: uzbek-language-module-postgres-1)
Redis:          6379  (docker: uzbek-language-module-redis-1)
PgAdmin:        8080  (dev faqat)

euromed-postgres: 5433 → BOSHQA MAHSULOT (EuroPrint emas! Aralash ketmasin)
```

---

## 2. .ENV TUZILMASI (Majburiy o'zgaruvchilar)

```bash
# apps/api/.env (mavjud — .env.example ko'chir va to'ldir)

# ─── DATABASE ──────────────────────────────────────────────────────
DATABASE_URL=postgresql://europrint:PASSWORD@localhost:5432/europrint
DATABASE_URL_TEST=postgresql://europrint:PASSWORD@localhost:5432/europrint_test

# ─── JWT (IKKALA SECRET ALOHIDA!) ──────────────────────────────────
JWT_SECRET=min_32_karakter_cryptorandom_string_shu_yerda
JWT_REFRESH_SECRET=boshqa_alohida_min_32_karakter_string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── APP ───────────────────────────────────────────────────────────
NODE_ENV=development    # development | production | test
PORT=3030
FRONTEND_URL=http://localhost:5173

# ─── EXTERNAL API (agar kerak bo'lsa) ──────────────────────────────
YANDEX_TRANSLATE_API_KEY=...    # i18n uchun
SMS_API_KEY=...                 # OTP uchun (keyinchalik)

# ─── REDIS (session/cache uchun) ───────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── LOGGING ───────────────────────────────────────────────────────
LOG_LEVEL=debug    # development da; production da: info
```

### .env Qoidalari:
```bash
# ✅ .gitignore da bo'lishi shart:
.env
.env.local
.env.production
*.log
backend.log*

# ✅ Faqat .env.example ni commitga qo'shish (haqiqiy qiymatisiz):
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB_NAME
JWT_SECRET=REPLACE_WITH_MIN_32_CHAR_RANDOM_STRING

# ❌ HECH QACHON .env ni commitga qo'shma (secret leak!)
# ❌ Kod ichida hardcode:
const secret = 'hardcoded-secret-123'; // ← TAQIQ
```

---

## 3. DOCKER COMPOSE KONFIGURATSIYA

```yaml
# docker-compose.yml (mavjud)
services:
  postgres:
    image: postgres:16
    container_name: uzbek-language-module-postgres-1
    environment:
      POSTGRES_DB: europrint
      POSTGRES_USER: europrint
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # .env dan!
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U europrint -d europrint"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: uzbek-language-module-redis-1
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

```bash
# Docker qoidalari:
# ✅ prod da: docker-compose -f docker-compose.prod.yml
# ✅ dev da:  docker-compose up -d (faqat DB va Redis)
# ✅ API: node/pnpm dan ishga tushir (docker ichida emas, dev da)
# ❌ TAQIQ: POSTGRES_PASSWORD=mypassword hardcode (env var dan)
```

---

## 4. MUHIT TURLARI

### Development (LOCAL):
```bash
NODE_ENV=development
DATABASE_URL=postgresql://europrint:devpass@localhost:5432/europrint
LOG_LEVEL=debug
# Barcha xatolar ko'rinadi
# Mock data ruxsat etiladi
# Swagger/OpenAPI faol: http://localhost:3030/api/docs
```

### Test:
```bash
NODE_ENV=test
DATABASE_URL_TEST=postgresql://europrint:testpass@localhost:5432/europrint_test
# Har test suite: migrate + seed + test + cleanup
# Test DB dev DB dan ALOHIDA bo'lishi kerak (data aralashmasin)
```

### Production:
```bash
NODE_ENV=production
LOG_LEVEL=info         # debug emas (sekin + ko'p log)
DATABASE_URL=postgresql://...@prod-host:5432/europrint
# Swagger o'chirilgan (prod da API docs emas!)
# Strict CORS (faqat prod domain)
```

---

## 5. SECRET BOSHQARUV QOIDALARI

```
YARATISH:
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  # → 96 karakter hex string (JWT_SECRET uchun)

SAQLASH:
  ✅ .env fayl (server da, git da emas)
  ✅ Cloud secret manager (prod uchun: HashiCorp Vault, AWS Secrets Manager)
  ❌ TAQIQ: git, Slack, email, kod ichida

ROTATION (almashtirish):
  Har 3 oyda yoki shunday holatlarda:
  - Xodim ketdi (secret biladi)
  - Secret gitga tushib qoldi
  - Server buzildi
  Almashtirish tartibi:
  1. Yangi secret yaratish
  2. .env yangilash (prod serverda)
  3. API restart
  4. Eski tokenlar avtomatik eskiradi (15 daqiqadan keyin)

GITHUB PUSH PROTECTION:
  GitHub push protection faol — secret aniqlanса push BLOKLANADI.
  Shunda: key AYLANTIRILSIN (rotate), keyin allow-URL (private repo).
  Hech qachon live key ni allow qilma.
```

---

## 6. KONFIGURATSIYA VALIDATSIYASI (Startup)

```typescript
// apps/api/src/config/env.validation.ts (mavjud yoki kerak)
import { plainToClass } from 'class-transformer';
import { IsString, IsInt, IsUrl, validateSync, MinLength } from 'class-validator';

class EnvironmentVariables {
  @IsUrl({ require_tld: false })
  DATABASE_URL: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET: string;

  @IsString()
  NODE_ENV: string;

  @IsInt()
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated);
  if (errors.length > 0) {
    throw new Error(`Muhit xatosi: ${errors.toString()}`);
    // App start bo'lmaydi — noto'g'ri konfiguratsiya bilan ishlamaydi!
  }
  return validated;
}

// main.ts da:
ConfigModule.forRoot({
  validate,
  isGlobal: true,
}),
```

---

## 7. HEALTH CHECK STANDARTI

```typescript
// GET /health (mavjud — @Public())
{
  "status": "ok",
  "version": "1.0.0",
  "db": "ok",
  "redis": "ok",    // agar redis ishlatilsa
  "uptime": 3600    // sekund
}

// Monitoring tekshiruvi:
curl http://127.0.0.1:3030/health  # 127.0.0.1 (IPv6 emas — BOSHLASH.md §6)
# → {"status":"ok"} bo'lishi kerak
# → {"status":"unhealthy"} → darhol tekshir (XAVF_REESTRI.md R-14)
```

---

## 8. MUHIT O'ZGARUVCHI TEKSHIRUVI (Pre-deploy)

```bash
# Deploy oldidan tekshirish:
# 1. Barcha kerakli env var belgilanganmi?
node -e "
const required = ['DATABASE_URL','JWT_SECRET','JWT_REFRESH_SECRET','NODE_ENV','PORT'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) { console.error('MISSING:', missing); process.exit(1); }
console.log('✅ Barcha env var mavjud');
"

# 2. DB ulanish ishlayaptimi?
pg_isready -d $DATABASE_URL

# 3. JWT secret uzunligi:
node -e "
const s = process.env.JWT_SECRET;
if (s.length < 32) { console.error('JWT_SECRET juda qisqa!'); process.exit(1); }
"
```

---

*EuroPrint ERP · Muhit Standartlari · Versiya: 2026-06-18*
