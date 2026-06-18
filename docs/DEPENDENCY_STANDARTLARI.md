# EUROPRINT ERP — DEPENDENCY STANDARTLARI

> **Yangi paket qanday qo'shiladi. Qaysilari taqiqlangan. Versiya boshqaruvi.**
> Noto'g'ri paket = xavfsizlik zaif joyi, litsenziya muammo yoki bundle kattalashuvi.
> Qoida: har yangi paket uchun 5-savol tekshiruvi majburiy.
> Bog'liq: [XAVFSIZLIK_STANDARTLARI.md](XAVFSIZLIK_STANDARTLARI.md) · [CI_CD_STANDARTLARI.md](CI_CD_STANDARTLARI.md)

---

## 1. YANGI PAKET QO'SHISH TARTIBI

```bash
# 1. Tekshirish (5 savol):
# a) Bu paket kerakmi? (Standart kutubxonada yo'qmi?)
# b) npm-check bilan tavsiya darajasi qanday?
# c) Oxirgi yangilanish qachon? (2 yildan eski → ehtiyot)
# d) Litsenziya: MIT/Apache/BSD ✅, GPL ⚠️ (tekshir), custom ❌
# e) Zaiflik bormi?
pnpm audit

# 2. O'rnatish (to'g'ri workspace):
# Backend paketi:
pnpm --filter @europrint/api add [paket-nomi]

# Frontend paketi:
pnpm --filter erp-dashboard add [paket-nomi]

# Dev dependency:
pnpm --filter @europrint/api add -D [paket-nomi]

# Root-level (monorepo utility):
pnpm add -w [paket-nomi]

# 3. Import va ishlatish tekshiruvi:
npx tsc --noEmit  # type xato yo'qmi?

# 4. Lockfile commit (alohida):
git add pnpm-lock.yaml
git commit -m "chore(deps): add [paket-nomi] for [sabab]"

# 5. Hujjatlash (katta paket uchun):
# ADR yoz: nima uchun bu paket, alternativlar, litsenziya
```

---

## 2. TASDIQLANGAN PAKETLAR (Ishlatish Mumkin)

### Backend (@europrint/api):
```
NestJS ekotizimi:
  @nestjs/*         — framework ✅
  drizzle-orm       — ORM ✅ (kanonik)
  drizzle-kit       — migration ✅
  pg                — PostgreSQL driver ✅
  ioredis           — Redis ✅
  class-validator   — validatsiya ✅
  class-transformer — transform ✅
  bcrypt            — parol hash ✅ (rounds=12)
  jsonwebtoken      — JWT ✅ (HS256 pin)
  @nestjs/jwt       — JWT integration ✅
  eventemitter2     — event emitter ✅ (CQRS emas)
  zod               — schema validatsiya ✅
  dayjs             — sana boshqaruvi ✅ (moment emas!)

Yordamchi:
  lodash            — utility ✅ (faqat keraklisini import)
  winston           — logging ✅ (log rotation bilan)
  @nestjs/throttler — rate limiting ✅
  helmet            — security headers ✅
  sanitize-html     — XSS ✅
```

### Frontend (erp-dashboard):
```
React ekotizimi:
  react, react-dom  — ✅ (v19)
  react-router-dom  — routing ✅
  @tanstack/react-query — data fetching ✅ (kanonik)
  react-hook-form   — forma ✅ (kanonik)
  zod               — validatsiya ✅
  @hookform/resolvers — RHF + Zod ✅

UI:
  tailwindcss       — stil ✅ (kanonik)
  lucide-react      — ikonlar ✅
  @radix-ui/*       — headless UI ✅
  shadcn/ui         — EP asosi ✅

Boshqa:
  i18next           — i18n ✅
  recharts          — grafik ✅
  @tanstack/virtual — virtualizatsiya ✅
```

---

## 3. TAQIQLANGAN PAKETLAR

```
❌ moment.js       → dayjs (yengil, immutable)
❌ axios           → fetch (native) yoki @nestjs/axios (agar kerak)
❌ lodash/lodash-es → faqat kerakli funksiyani import ({isNil} from 'lodash')
❌ sequelize        → drizzle-orm (kanonik)
❌ typeorm          → drizzle-orm (kanonik)
❌ mongoose         → PostgreSQL ishlatiladi (MongoDB emas)
❌ socket.io        → EventEmitter2 (ichki) yoki WebSocket native
❌ redux/redux-toolkit → TanStack Query (kanonik)
❌ styled-components → Tailwind (kanonik)
❌ emotion          → Tailwind (kanonik)
❌ webpack          → Vite (kanonik FE)
❌ jest globals (jasmine, mocha) → jest (kanonik)
❌ express          → Fastify (NestJS adapter sifatida)
❌ node-fetch v2   → native fetch (Node 18+)
❌ uuid            → PostgreSQL gen_random_uuid() yoki ulid
❌ fs-extra        → Node.js fs/promises native
```

---

## 4. VERSIYA STRATEGIYASI

```json
// package.json da:
{
  "dependencies": {
    "@nestjs/common": "^11.0.0",  // ^ = minor yangilanish ruxsat
    "drizzle-orm": "~0.38.0",     // ~ = patch yangilanish faqat
    "pg": "8.11.3"                 // Exact = kritik (DB driver)
  }
}

Qoidalar:
  ^ (caret)  — ko'p paket uchun (minor + patch)
  ~ (tilde)  — muhim paket (faqat patch)
  Exact      — DB driver, JWT kutubxona (xavfsizlik kritik)

Yangilash:
  pnpm update           → barcha (^ limit ichida)
  pnpm update [paket] --latest → explicit yangilash
  → Har yangilashdan keyin: test PASS, tsc PASS
```

---

## 5. PNPM WORKSPACE QOIDASI

```
pnpm-workspace.yaml (mavjud):
  packages:
    - 'apps/*'
    - 'lib/*'
    - 'artifacts/*'

Import qoidasi (workspace paket):
  @europrint/api        → apps/api
  @europrint/schemas    → lib/db/src/schema
  erp-dashboard         → artifacts/erp-dashboard

Paket qo'shish:
  pnpm --filter @europrint/api add zod    ← to'g'ri workspace
  pnpm add zod                             ← root (ehtiyotlik bilan)
  pnpm add -w zod                          ← root explicitly

❌ TAQIQ:
  cd apps/api && npm install zod   ← npm, pnpm emas!
  cd apps/api && pnpm add zod      ← workspace root emas
```

---

## 6. AUDIT QOIDASI

```bash
# Har sprint boshida:
pnpm audit --audit-level=high
# → 0 high/critical → PASS
# → Topilsa → darhol yangilash yoki alternative izlash

# CI da (ci.yml):
pnpm audit --audit-level=critical
# → 0 critical → CI PASS
# → critical topilsa → CI FAIL (pipeline to'xtaydi)

# Litsenziya tekshiruvi (ixtiyoriy, Sprint 10 da):
npx license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC"
```

---

*EuroPrint ERP · Dependency Standartlari · Versiya: 2026-06-18*
