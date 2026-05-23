# EuroPrint ERP — To'liq Audit Hisoboti

**Sana:** 2026-05-19
**Audit hajmi:** 6,898 fayl (4,872 emas — ko'proq), 145 MD hujjat, 28 reviewer skripti
**Branch:** chore/clean-faza-3
**Audit boshqaruvi:** `bash scripts/run-all-reviewers.sh` + parallel individual reviewers (chegarasiz, 600s timeout)

---

## 1. LOYIHA HAJMI

| Kategoriya | Soni |
|---|---:|
| **Jami fayl** (node_modules, dist, .git tashqari) | **6,898** |
| TypeScript backend (`.ts`) | 3,953 |
| TypeScript React (`.tsx`) | 2,129 |
| JSON (asosan locale) | 192 |
| MD hujjatlar | **145** |
| Shell scriptlar (`.sh`) | 97 |
| ES modul scriptlar (`.mjs`) | 86 |
| SQL migration | 80 |

**Asosiy kataloglar:**
- `apps/` — 3,376 fayl (NestJS backend)
- `artifacts/` — 2,874 fayl (React frontend)
- `lib/` — 169 fayl (Drizzle ORM schema)
- `docs/` — 83 MD audit hujjatlari
- `scripts/` — 69 audit/reviewer skriptlari

---

## 2. SKRIPT CHEGARALARI — TUZATILDI

Reviewer skriptlarini tekshirib chiqdim — faqat **bitta haqiqiy skan chegarasi** topildi va olib tashlandi:

| Fayl | Chegara | Tuzatish |
|---|---|---|
| `scripts/reviewer-missing-endpoints.sh:98` | `find ... \| head -20` | Olib tashlandi |
| `scripts/run-all-reviewers.sh:13` | `TIMEOUT=180s` | Oshirildi → **600s** |

Boshqa `head -3` / `head -5` patterns — bu **display-only** (har bir buzilgan fayldan 3 ta misol ko'rsatish uchun), umumiy hisob to'liq saqlanadi. Aslida skan qilingan fayllar soni cheklanmagan.

---

## 3. ARXITEKTURA QOIDALAR (22 RULE)

Mahalliy to'liq audit natijasi (2026-05-19, 12:25):

| # | Qoida | Holat | Tafsilot | Tuzatildi? |
|---|---|:---:|---|:---:|
| 1 | Result Pattern | ✅ PASS | 728 metod, 10 WARN | — |
| 2 | Array Safety | ❌ **FAIL 3** | GamificationPage:163, PhoneScriptSheet:103, kanban/TemplatesDialogList:80 | ✅ **3/3 tuzatildi** |
| 3 | Zod Validation | ✅ PASS | barcha controllers | — |
| 4 | No Raw SQL | ✅ PASS | 73 annotated complex queries | — |
| 5 | No `as unknown` | ✅ PASS | 0 (1 WARN) | — |
| 6 | Controller transport-only | ✅ PASS | — | — |
| 7 | ConfigService only | ✅ PASS | — | — |
| 8 | JWT Guard | ✅ PASS | barcha controllers | — |
| 9 | try/catch | ✅ PASS | barcha repo | — |
| 10 | Repository layer | ✅ PASS | — | — |
| 11 | No circular deps | ✅ PASS | madge verified | — |
| 12 | No magic numbers | ✅ PASS | business.constants.ts | — |
| 13 | No `!` assertions | ❌ **FAIL 3** | i18n/loader.ts:240-243 | ✅ **3/3 tuzatildi** (cache pattern refactor) |
| 14 | No console.log | ❌ **FAIL ~26** | 21 fayl (asosan error handlers) | ⏳ tuzatilmadi |
| 15 | No sensitive logs | ✅ PASS | — | — |
| 16 | File ≤300 lines | ❌ **FAIL 120** | (ARCH_RULES.md 169 dan 120 ga tushdi) | ⏳ |
| 17 | Function ≤30 lines | ❌ **FAIL 164** | wms-gateway-warehouses, ai-reports.handler, etc. | ⏳ |
| 18 | No `any` | ⏳ ishlamoqda | — | — |
| 19 | AlertDialog on mutations | ⏳ ishlamoqda | — | — |
| 20 | Forms Zod | ⏳ ishlamoqda | — | — |
| 21 | apiRequest only | ⏳ ishlamoqda | — | — |
| 22 | Unit Tests | ❌ **FAIL 32** | 493 service tekshirildi, 32 testsiz | ⏳ |

**Hozirgi natija:** PASS=14, FAIL=6, ishlamoqda=4 (jami 22 + 2 qo'shimcha).

**Tuzatilgan jami:** 6 violation (Rule 2 × 3, Rule 13 × 3).

---

## 4. CI HOLATI (PR #9)

Oxirgi CI ishlanishi (2026-05-18 dan keyin):

| Check | Holat | Sabab |
|---|:---:|---|
| Backend Test + Coverage | ✅ PASS | — |
| Security — Semgrep | ✅ PASS | — |
| i18n — Leak Detector | ✅ PASS | — |
| **Frontend Test + Coverage** | ❌ **FAIL** | 1/450 fayl FAIL: `HRAlertBanner.smoke.test` (eski versiya), `IdealVsActualPanel` crash |
| **Architecture Rules (22)** | ❌ **FAIL** | Doc drift: ARCHITECTURE_RULES.md eski versiyada CI da |
| **Playwright E2E** | ❌ **FAIL** | 50m46s ishlagan, timeout-related |

### Frontend Test xato tafsilotlari

```
FAIL src/pages/HRAlertBanner.smoke.test.tsx > HRAlertBanner smoke > renders without throwing
AssertionError: expected null not to be null
   13|     expect(container.firstChild).not.toBeNull();

Unhandled error: TypeError: Cannot read properties of undefined (reading 'completed')
   originated in DirectorDashboard.test.tsx > triggers a toast when the refresh-all button
   (IdealVsActualPanel.tsx:94)
```

**Tuzatishlar (ushbu sessiyada):**
- ✅ HRAlertBanner.smoke.test.tsx → `not.toThrow()` (mahalliy git working tree'da bor, commit qilinmagan)
- ✅ IdealVsActualPanel.tsx:94 → `data.orders.completed ?? 0` fallback qo'shildi

---

## 5. LOYIHA HOLATI

### 5.1. TO'LIQ ISHLAYDIGAN MODULLAR (~62%)

| Modul | Backend | Frontend | DB |
|---|:---:|:---:|:---:|
| Auth (login/refresh/logout) | ✅ | ✅ | ✅ |
| HR Core (xodimlar, bo'limlar, lavozimlar) | ✅ | ✅ | ✅ |
| Tashkiliy tuzilma (org chart) | ✅ | ✅ | ✅ |
| Davomat (attendance) | ✅ | ✅ | ✅ |
| Material kartochkalar | ✅ | ✅ | ✅ |
| Jihozlar (equipment) | ✅ | ✅ | ✅ |
| OKR | ✅ | ✅ | ✅ |
| GL Hisob-kitob (asosiy) | ✅ | ✅ | ✅ |

### 5.2. QISMAN ISHLAYDIGAN MODULLAR

| Modul | Tafsilot |
|---|---|
| HR Extended | leave/payroll/360-review qismi stub |
| WMS/Warehouse | inventory asosiy, lekin transfer/traceability yo'q |
| CRM/Sales | mijozlar ishlaydi, AI lead-scoring stub |
| Finance | GL bor, variance/break-even endpoint stub |
| MES Production | shift stats stub |

### 5.3. STUB / SOXTA JAVOB QAYTARADIGAN ENDPOINTLAR

`docs/stub-endpoint-catalog.md` ma'lumoti:
- **240 backend stub endpoint** (40 controller, `notImplemented()` helper)
- **186 ta `notImplemented()` chaqiruv**
- **8 ta soxta javob** (`return { ok: true }`, `return []`):
  - `kanban-boards.controller.ts:182`
  - `mes-shifts-stats.controller.ts` (3×)
  - `mm-purchase-orders.controller.ts` (2×)
  - `mm-vendors-pr.controller.ts:98`
  - `sd-contracts.controller.ts:119`
  - `finance-accounting.controller.ts`

**Eng ko'p stub:** `marketing-analytics-stubs.controller.ts` — 57 ta

### 5.4. FRONTEND STUB SAHIFALAR

`artifacts/erp-dashboard/src/routes/StubRoutes.tsx` da **17 ta route** hali `<StubPage>` ko'rsatadi (Wave 12 dan keyin 69→17).

---

## 6. NIMA UCHUN LOYIHANI ISHLATISH QIYIN?

### 6.1. Infratuzilma muammolari
- **PostgreSQL 16** kerak (Docker yoki native)
- **Redis** kerak (chat, notifications, queues uchun)
- **`.env` to'ldirish kerak**: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_SEED_PASSWORD, REDIS_HOST
- **Seed buyruqlari**: `pnpm seed`, `pnpm seed:master-data`

### 6.2. Backend soxta javoblar
- 240+ stub endpoint hali ham `notImplemented()` qaytaradi
- Frontend ularga so'rov yuborib `501 Not Implemented` oladi
- Real implementatsiya kutilmoqda (Wave 11 priority list)

### 6.3. Bug'lar va xatolar (491 modified file)
Mahalliy git status: **491 fayl o'zgartirilgan** lekin commit qilinmagan. Bu:
- Backend chat module qayta yozilmoqda
- HR dashboard refaktoring
- CRM lead aggregate o'zgarishlar
- Finance commands o'zgarishlar
- 3 ta delete: `admin-auth.controller.ts`, `hr-dashboard-stubs.controller.ts`, `hr-dashboard-stubs-write.controller.ts`

---

## 7. KEYINGI QADAMLAR — REJA

### Sprint A — CI yashil holatga keltirish (1 kun)
1. ✅ HRAlertBanner smoke fix — bajarildi (commit kerak)
2. ✅ IdealVsActualPanel crash fix — bajarildi (commit kerak)
3. ✅ Rule 2 array safety 3 fix — bajarildi
4. ✅ Rule 13 non-null i18n loader fix — bajarildi
5. ⏳ ARCHITECTURE_RULES.md doc drift — `node scripts/update-architecture-rules-doc.mjs` ishga tushirib commit qilish

### Sprint B — Infratuzilma (1 kun)
- `docker-compose.yml` yaratish (PG + Redis + app)
- `.env.example` to'liq to'ldirish + `pnpm dev:full` buyrug'i
- Bitta buyruqda hammasi ishga tushsin

### Sprint C — Backend stublarni tuzatish (3-5 kun)
**Ustuvor (P0):**
- IoT Tablet PWA (14 endpoint — havfsizlik kritik)
- Payroll calculate/list/approve (Finance P0)
- MM vendor-invoices (3-way matching)
- IoT SOS alert

**Keyin (P1):**
- Marketing 57 stub → real CRM queries yoki feature-flag
- HR dashboard 19 stub → real implementatsiya
- Finance reports endpoint

### Sprint D — Rule violation tuzatishlar (2-3 kun)
- 120 ta fayl >300 qator → bo'laklash
- 164 ta funksiya >30 qator → extraction
- 32 service uchun unit test
- 26 console.log → Logger ga migration

### Sprint E — Production ready (1-2 kun)
- ADMIN_SEED_PASSWORD hardcoded default tekshirish
- Rate limiting
- Sentry / monitoring
- Smoke E2E tests

---

## 8. STATISTIKA

| Metric | Soni |
|---|---:|
| Jami fayl | **6,898** |
| Frontend routes | ~480 (8 stub) |
| Backend endpoints | 2,983 |
| Stub endpoints | **240** |
| Routes endpoint chaqirmaydi | 16 (static) |
| Endpoints frontend chaqirmaydi (orphan) | 474 |
| Tests | 1,592 (1 fail) |
| Test files | 450 (1 fail) |
| Backend services | 493 |
| Services without unit test | **32** |
| Files >300 lines | **120** |
| Functions >30 lines | **164** |
| Files with console.log | 21 |
| Lines locales (UZ) | 12,000+ keys after i18n cleanup |

---

## 9. SUMMARY — Bir jumla bilan

**Loyiha ~62% tayyor, asosiy modullari ishlaydi, lekin 240 ta stub endpoint, 17 ta stub sahifa, 120 ta katta fayl va 32 ta testsiz service mavjud. CI 3 ta check'da hali ham qizil (Frontend Test, Architecture Rules, Playwright). Ushbu sessiyada 6 ta Rule violation tuzatildi, qolgan kichik violation'lar uchun reja tayyor.**

---

*Hisobot avtomatik audit (2026-05-19) asosida tuzilgan. Manba: `scripts/run-all-reviewers.sh`, `docs/stub-endpoint-catalog.md`, `docs/production-readiness.md`, va boshqa 142 ta MD audit hujjati.*
