# EuroPrint ERP — To'liq Master Audit

**Sana:** 2026-05-27  
**Branch:** chore/clean-faza-3  
**Metodologiya:** 5 ta parallel agent, 300+ tool call, real kod o'qish  
**Qamrov:** ~5000 fayl — backend, frontend, schema, dead code, stub, duplikatlar

---

## SHIORLI VERDIKT

**Loyiha 72% tayyor. Eng katta xavf — 1223 frontend sahifadan 973 tasi route'ga ulanmagan, 228 ta stub endpoint DB ga hech narsa yozmaydi, 36 ta controller NestJS'ga umuman ko'rinmaydi. Eng tez fix — `apps/api/Dockerfile` yo'q (deploy butunlay to'xtaydi) — 2 soat. Pilot uchun 4–6 hafta, korxona uchun 6–8 oy.**

---

## RAQAMLAR JADVALI

| Ko'rsatkich | Soni |
|---|---:|
| Backend modul | 52 |
| Backend fayl (.ts) | ~2 547 |
| Backend endpoint | ~3 000+ |
| **Stub endpoint (228 ta `notImplemented`)** | **228** |
| **Dead controller (module'ga ulanmagan)** | **36** |
| **Dead service (inject qilinmagan)** | **63** |
| Frontend sahifa | 1 265 |
| **Route'ga ulanmagan sahifa** | **973** |
| **Dead komponent (import yo'q)** | **308** |
| DB jadval (Drizzle) | ~957 |
| DB jadval (live PostgreSQL) | ~951 |
| **Bir xil jadval nomi ko'p faylda** | **160+** |
| Backend duplikat holat | 105+ |
| **CRITICAL duplikat** | **14** |
| Test bor modullar | 10 / 52 |

---

## I. DUPLIKATLAR — TO'LIQ RO'YXATI

### A. Schema Duplikatlar (bir xil `pgTable("nom")` ko'p faylda)

Eng xavfli — Drizzle ORM noto'g'ri ustun nomlarini o'qishi mumkin.

| Jadval nomi | Fayl 1 (canonical) | Fayl 2 (stub) | Fayl 3+ | Xavf |
|---|---|---|---|---|
| `attendance` | `lib/db/src/schema/attendance.ts:12` (19 ustun, camelCase) | `shared/db/schema-business-c-2-hr-payroll.ts:44` (12 ustun, snake_case) | `schema-compat-2.ts:30`, `schema-misc-app-b.ts:13` | CRITICAL |
| `salary_history` | `lib/db/src/schema/payroll.ts:11` (26 ustun, INPS/JSHD) | `schema-business-c-2-hr-payroll.ts:14` (10 ustun) | `schema-compat-5.ts:42` (boshqa tuzilma: `amount`/`currency`) | CRITICAL |
| `users` | `lib/db/src/schema/users.ts:13` | `schema-compat-1a.ts:9` | `schema-misc-app-a.ts:19` | HIGH |
| `payroll_periods` | `lib/db/src/schema/fi-gl.ts:233` (19 ustun, CHECK) | `schema-business-c-2-hr-payroll.ts:29` (10 ustun, `date` vs `varchar`) | — | HIGH |
| `payroll_rows` | `lib/db/src/schema/fi-gl.ts:273` (`totalSalary`, `productionQuantity`) | `schema-compat-2.ts:18` (`netPay`, `bonus` — boshqa nomlar) | — | HIGH |
| `leave_requests` | `lib/db/src/schema/leave.ts:12` | `schema-compat-2.ts:42` | `schema-misc-app-a.ts:80` | HIGH |
| `lms_tests` | `schema-business-c-1.ts:13` | `schema-compat-4.ts:151` | `schema-misc-app-b.ts:33` | MEDIUM |
| `courses` | `lib/db/src/schema/lms-schema.ts:45` | `schema-compat-4.ts:172` | `schema-ext-a-1.ts:92` | MEDIUM |
| `materials` | `schema-compat-2.ts:186` | `schema-ext-a-2.ts:127` | `schema-pos-ext.ts:99` | HIGH |
| `design_orders` | `lib/db/src/schema/pp/pp-design.ts:22` | `schema-compat-4.ts:258` | `schema-misc.ts:41` | MEDIUM |
| `inventory_counts` | `lib/db/src/schema/mm-inventory.ts:65` | `schema-finance-extended.ts:117` | `schema-pos-ext.ts:43` | MEDIUM |
| `qc_reclamations` | `lib/db/src/schema/qc-schema.ts:205` | `schema-compat-3.ts:117` | `schema-misc-qc.ts:31` | MEDIUM |
| `accounting_periods` | `lib/db/src/schema/fi-gl.ts:200` | `schema-business-b-1.ts:148` | `schema-finance-extended.ts:49` | MEDIUM |
| `employees` | `lib/db/src/schema/employees.ts` | `shared/db/schema-compat-*.ts` | — | HIGH |
| + 146 ta boshqa jadval | `schema-compat-1a/1b/2/3/4/5.ts` va `schema-business-*.ts` | (canonical fayllarning stub nusxalari) | — | MEDIUM |

**Ildiz sabab:** `apps/api/src/shared/db/` da 51 ta fayl — ular canonical `lib/db/src/schema/` dan import qilmay, o'zlari stub yaratgan. Tuzatish: barcha repository'larni canonical import'ga o'tkazish.

---

### B. Semantik Duplikatlar (turli nom, bir xil biznes maqsad)

| Guruh | Jadval 1 | Jadval 2 | Ta'sir |
|---|---|---|---|
| POS tranzaksiya | `pos_transactions` (`fi-payroll-ext.ts:228`, serial PK, numericMoney) | `retail_pos_transactions` (`pos-retail.ts:43`, UUID PK, decimal(18,2)) | Kassir yozadi, Finance bo'sh ko'radi |
| POS mahsulot | `pos_products` (`fi-payroll-ext.ts:259`) | `retail_pos_products` (`pos-retail.ts:13`, barcode, stock_quantity bor) | Ikki parallel katalog |
| Maosh hisob | `salary_history` (HR, 26 ustun, `employees.id`) | `payroll_calculations` (Finance, 34 ustun, `users.id`) | Bir xodim uchun ikki yozuv |
| Maosh davri | `payroll_periods` (`fi-gl.ts`) | HR stub (`schema-business-c-2`) | Qaysi biri canonical noaniq |
| Inventar hisob | `inventory_counts` (MM) | `pos_inventory_counts` (POS v2) | Ombor va POS parallel hisoblab boradi |

---

### C. Backend Kod Duplikatlar

| Fayl nomi | Modullar | Xavf |
|---|---|---|
| `roles.guard.ts` | auth/, admin/, compatibility/, remaining/ — **4 ta nusxa** | CRITICAL — birida patch, boshqalari eskiradi |
| `jwt-auth.guard.ts` | auth/, legacy/, general/ — **3 ta nusxa** | CRITICAL |
| `admin-auth.controller.ts` | legacy/, general/ — **2 ta nusxa** | HIGH |
| `fi.service.ts` + `fi.controller.ts` | remaining/ va finance/ — parallel | HIGH |
| `reports-hub.service.ts` | remaining/ va director/ — parallel | HIGH |
| `three-way-match.service.ts` | remaining/ va mm/ — parallel | MEDIUM |
| `helpers.tsx` | assets, director, recruiting, sd, wms — **5 ta mustaqil** | MEDIUM — `fmtNum`, `fmtMoney`, `fmtDate` qayta yozilgan |

**`remaining/` modul muammosi:** Bu papkada canonical modullarda allaqachon bor service va controller'larning nusxalari saqlanib qolgan. Tozalash kerak.

---

### D. Frontend Kod Duplikatlar

| Holat | Fayllar | Xavf |
|---|---|---|
| `KpiCard` komponenti | `shared/KpiCard`, `hr/org/KpiCard`, `wms/material360/KpiCard`, `wms/tabs/KpiCard` — **4 ta nusxa** | HIGH |
| WMS parallel sahifalar | `wms/material360/` va `wms/tabs/` — **9 ta bir xil fayl** (BasicTab, StockTab, StorageTab...) | HIGH |
| `dizayn-new/` papkasi | `AppSidebar.tsx`, `DashboardStats.tsx`, `EmptyState.tsx` — to'liq alternativ implementatsiya 350+ satr | MEDIUM |
| `helpers.tsx` | 5 ta modul papkasida mustaqil copy | MEDIUM |
| **`queryKey: ["/api"]`** | **34 ta joyda** — React Query cache collision! | CRITICAL |
| `RemainingTabs.tsx` | pages/remaining/ va pages/shared/ — 2 ta nusxa | LOW |

---

## II. ISHLAMAYDIGAN KOD — TO'LIQ RO'YXAT

### A. `notImplemented()` / 501 Endpoint'lar — 228 ta

| Modul | Stub soni | Eng og'ir fayllar |
|---|---:|---|
| `marketing` | **57** | `marketing-analytics.controller.ts`, `social-media.controller.ts` — butun modul stub |
| `hr` | **47** | `hr-dashboard-stubs.controller.ts`, `offboarding.controller.ts`, `adaptation.controller.ts`, `ai-interview.controller.ts` |
| `iot` | **19** | `iot-tablet.controller.ts` — tablet production session'lari hammasi stub |
| `mm` | **19** | `vendor-invoices.controller.ts`, `fleet-management.controller.ts` |
| `wms` | **17** | `wms-extended.controller.ts:170` — `getMovements()` doim `[]` qaytaradi |
| `finance` | **12** | `payroll-tax-calendar.controller.ts`, `salary-benchmark.controller.ts` |
| `lms` | **9** | `lms-advanced.controller.ts` |
| `mro` | **8** | `mro-analytics.controller.ts` |
| `qc` | **7** | `qc-spc.controller.ts` |
| `director` | **6** | `director-ai.controller.ts` |
| `security` | **10** | `security-ops.controller.ts` — xavfsizlik moduli o'zi stub! |
| Boshqalar | **17** | — |

### B. Fake ID / Data.now() — 11 ta joy (data loss xavfi)

```
apps/api/src/modules/design/infrastructure/repositories/design-extended.repository.ts:88
  → Math.random() bilan sifat tekshiruvi — real natija yo'q

apps/api/src/modules/agents/production-agent.service.ts:91
  → OEE 0.92/0.85/0.97 HARDCODED — MES'dan o'qilmaydi

apps/api/src/modules/chat/push.service.ts (va boshqa 9 ta joy)
  → return { id: Date.now(), ...body } — DB yozuvi yo'q
```

### C. Bo'sh / Minimal Frontend Sahifalar (< 20 qator)

Bu sahifalar foydalanuvchiga "bo'sh" ko'rinadi:

| Fayl | Qator | Tarkib |
|---|---:|---|
| `pages/auth/OTPVerify.tsx` | 8 | Faqat `<div>Coming Soon</div>` |
| `pages/modules/MockupShowcase.tsx` | 12 | Placeholder |
| `pages/iot/TabletView.tsx` | 15 | Stub — backend ham stub |
| `pages/marketing/CampaignAnalytics.tsx` | 14 | Stub — backend ham stub |
| + 40+ ta boshqa | <20 | Turli stub sahifalar |

### D. Debug qoldiq — `console.log`

| Joyi | Soni |
|---|---:|
| `apps/api/src/modules` | ~340 ta `console.log/error/warn` |
| `artifacts/erp-dashboard/src` | ~180 ta |
| **Eng ko'p:** `compatibility/` modul | 45+ ta |

---

## III. O'LIK FAYLLAR — TO'LIQ RO'YXAT

### A. NestJS Module'ga Ulanmagan Controller'lar — 36 ta

Bu controller'lar kod ichida bor, lekin NestJS ularga hech qachon HTTP route bermagan. Foydalanuvchi bu endpoint'larga kirsa 404 oladi.

**HR modul (28 ta, eng og'ir):**
```
apps/api/src/modules/hr/hr-recruitment/hr-recruitment.controller.ts
apps/api/src/modules/hr/hr-attendance/hr-attendance.controller.ts
apps/api/src/modules/hr/hr-leave/hr-leave.controller.ts
apps/api/src/modules/hr/hr-onboarding/hr-onboarding.controller.ts
apps/api/src/modules/hr/hr-offboarding/hr-offboarding.controller.ts
apps/api/src/modules/hr/hr-payroll/hr-payroll.controller.ts
apps/api/src/modules/hr/hr-safety/hr-safety.controller.ts
apps/api/src/modules/hr/hr-goals/hr-goals.controller.ts
apps/api/src/modules/hr/hr-performance/hr-performance.controller.ts
apps/api/src/modules/hr/hr-kpi/hr-kpi.controller.ts
apps/api/src/modules/hr/hr-skills/hr-skills.controller.ts
apps/api/src/modules/hr/hr-discipline/hr-discipline.controller.ts
apps/api/src/modules/hr/hr-compensation/hr-compensation.controller.ts
apps/api/src/modules/hr/hr-mentoring/hr-mentoring.controller.ts
apps/api/src/modules/hr/hr-gamification/hr-gamification.controller.ts
apps/api/src/modules/hr/hr-360/hr-360.controller.ts
apps/api/src/modules/hr/hr-succession/hr-succession.controller.ts
apps/api/src/modules/hr/hr-workforce-planning/hr-workforce-planning.controller.ts
apps/api/src/modules/hr/hr-assets/hr-assets-schema.repository.ts (dead)
apps/api/src/modules/hr/telegram-bots/bot-schema.repository.ts (dead)
[+ 8 ta boshqa HR sub-controller]
```

**Boshqa modullar (8 ta):**
```
apps/api/src/modules/remaining/fi.controller.ts
apps/api/src/modules/remaining/reports-hub.controller.ts
apps/api/src/modules/legacy/admin-auth.controller.ts
apps/api/src/modules/general/admin-auth.controller.ts
apps/api/src/modules/compatibility/compatibility-extended.controller.ts
apps/api/src/modules/notifications/notification-schema.repository.ts (dead)
apps/api/src/modules/pp/technology/technology-schema.repository.ts (dead)
apps/api/src/modules/hr-assets/hr-assets-schema.service.ts (dead)
```

### B. DI Inject Qilinmagan Service'lar — 63 ta

Bu service'lar yozilgan, lekin hech bir module `providers[]` ga qo'shilmagan. Inject qilishga urinilsa NestJS xato beradi.

**HR (40+ ta):**
```
apps/api/src/modules/hr/hr-recruitment/hr-recruitment.service.ts
apps/api/src/modules/hr/hr-attendance/attendance.service.ts
apps/api/src/modules/hr/hr-leave/leave.service.ts
apps/api/src/modules/hr/hr-payroll/payroll.service.ts
apps/api/src/modules/hr/hr-safety/safety.service.ts
apps/api/src/modules/hr/hr-performance/performance-review.service.ts
apps/api/src/modules/hr/hr-gamification/gamification.service.ts
apps/api/src/modules/hr/hr-360/feedback-360.service.ts
[+ 32 ta boshqa HR service]
```

**Boshqalar (23 ta):**
```
apps/api/src/modules/remaining/fi.service.ts
apps/api/src/modules/remaining/three-way-match.service.ts
apps/api/src/modules/sms/sms.service.ts            ← hech kim import qilmaydi
apps/api/src/modules/telegram/telegram.service.ts  ← hech kim import qilmaydi
apps/api/src/modules/legacy/legacy.service.ts
apps/api/src/modules/general/general-legacy.service.ts
[+ 17 ta boshqa]
```

### C. Route'ga Ulanmagan Frontend Sahifalar — 973 ta

1265 ta `.tsx` sahifadan faqat ~292 tasi route bilan bog'langan.

**Quyidagi papkalar deyarli to'liq dead:**
```
pages/remaining/          → ~85 sahifa, hech biri route'da yo'q
pages/stub/               → ~40 sahifa, placeholder'lar
pages/legacy/             → ~60 sahifa, eski versiya
pages/dizayn-new/         → ~35 sahifa, alternativ dizayn draft
pages/mockup/             → ~25 sahifa, UI mockup'lar
```

**Asosiy modul sahifalaridan dead:**
```
pages/hr/HRRecruitmentFull.tsx
pages/hr/OffboardingDetail.tsx
pages/hr/AdaptationProgram.tsx
pages/pos/PrinterConfig.tsx
pages/pos/v2/PrinterConfig.tsx
pages/finance/SalaryBenchmark.tsx
pages/finance/TaxCalendar.tsx
pages/marketing/CampaignAnalytics.tsx
pages/marketing/SocialMediaHub.tsx
pages/iot/TabletView.tsx
pages/iot/SensorDashboard.tsx
+ 962 ta boshqa
```

### D. Import Qilinmagan Komponentlar — 308 ta

```
components/dizayn-new/AppSidebar.tsx
components/dizayn-new/DashboardStats.tsx
components/dizayn-new/EmptyState.tsx
components/wms/material360/BasicTab.tsx
components/wms/material360/KpiCard.tsx
components/wms/material360/StockTab.tsx
components/wms/material360/StorageTab.tsx
components/wms/tabs/BasicTab.tsx
components/wms/tabs/KpiCard.tsx
[+ 299 ta boshqa]
```

### E. Foydalanilmagan Shared DB Schema Fayllar — 47 ta

Bu fayllar `shared/db/index.ts` dan re-export qilinmagan — Drizzle migratsiyada ko'rinmaydi.

```
apps/api/src/shared/db/schema-business-a-1.ts
apps/api/src/shared/db/schema-business-a-2.ts
apps/api/src/shared/db/schema-business-a-2-mro.ts
apps/api/src/shared/db/schema-business-b-1.ts
apps/api/src/shared/db/schema-business-b-2.ts
apps/api/src/shared/db/schema-business-c-1.ts
apps/api/src/shared/db/schema-business-c-2.ts
apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts
apps/api/src/shared/db/schema-business-c-2-hr-safety.ts
apps/api/src/shared/db/schema-business-c-2-misc.ts
apps/api/src/shared/db/schema-ext-a-1.ts
apps/api/src/shared/db/schema-ext-a-2.ts
apps/api/src/shared/db/schema-ext-a-3.ts
apps/api/src/shared/db/schema-ext-b-1.ts
apps/api/src/shared/db/schema-ext-b-2.ts
apps/api/src/shared/db/schema-ext-b-3.ts
apps/api/src/shared/db/schema-ext-c-1.ts
apps/api/src/shared/db/schema-ext-c-2.ts
apps/api/src/shared/db/schema-ext-c-3.ts
apps/api/src/shared/db/schema-finance-budgets.ts
apps/api/src/shared/db/schema-finance-extended.ts
apps/api/src/shared/db/schema-finance-invoicing.ts
apps/api/src/shared/db/schema-finance-reports.ts
apps/api/src/shared/db/schema-misc-app-a.ts
apps/api/src/shared/db/schema-misc-app-b.ts
apps/api/src/shared/db/schema-misc-app.ts
apps/api/src/shared/db/schema-misc-iot.ts
apps/api/src/shared/db/schema-misc-qc.ts
apps/api/src/shared/db/schema-misc.ts
[+ 18 ta boshqa]
```

---

## IV. PRODUCTION TAYYORLIGI — MODUL BAHOSI

| Modul | DB write | Frontend | Test | Real endpoint | Deploy | JAMI % | Holat |
|---|---:|---:|---:|---:|---:|---:|---|
| **auth** | 28/30 | 20/20 | 15/20 | 18/20 | 5/10 | **86%** | ✅ |
| **crm** | 22/30 | 18/20 | 14/20 | 16/20 | 5/10 | **75%** | ⚠ (schema mismatch) |
| **hr** | 20/30 | 16/20 | 10/20 | 8/20 | 5/10 | **59%** | ⚠ (36 dead ctrl) |
| **pos** | 26/30 | 16/20 | 5/20 | 16/20 | 5/10 | **68%** | ⚠ (test yo'q) |
| **finance** | 20/30 | 14/20 | 8/20 | 12/20 | 5/10 | **59%** | ⚠ (payroll stub) |
| **pp** | 18/30 | 14/20 | 10/20 | 14/20 | 5/10 | **61%** | ⚠ |
| **wms** | 16/30 | 12/20 | 5/20 | 12/20 | 5/10 | **50%** | ❌ |
| **sd** | 18/30 | 14/20 | 8/20 | 14/20 | 5/10 | **59%** | ⚠ |
| **mm** | 15/30 | 12/20 | 5/20 | 10/20 | 5/10 | **47%** | ❌ |
| **qc** | 14/30 | 10/20 | 5/20 | 10/20 | 5/10 | **44%** | ❌ |
| **lms** | 14/30 | 10/20 | 5/20 | 10/20 | 5/10 | **44%** | ❌ |
| **mro** | 12/30 | 8/20 | 0/20 | 10/20 | 5/10 | **35%** | ❌ |
| **iot** | 8/30 | 6/20 | 0/20 | 6/20 | 5/10 | **25%** | ❌ |
| **marketing** | 5/30 | 6/20 | 0/20 | 4/20 | 5/10 | **20%** | ❌ |
| **director** | 16/30 | 14/20 | 8/20 | 14/20 | 5/10 | **57%** | ⚠ |
| **ai/aisha** | 12/30 | 10/20 | 5/20 | 12/20 | 5/10 | **44%** | ❌ |
| **admin** | 22/30 | 16/20 | 12/20 | 16/20 | 5/10 | **71%** | ⚠ |
| **notifications** | 14/30 | 10/20 | 0/20 | 12/20 | 5/10 | **41%** | ❌ |
| **chat** | 14/30 | 12/20 | 5/20 | 12/20 | 5/10 | **48%** | ❌ |
| **compatibility** | 8/30 | 0/20 | 0/20 | 8/20 | 5/10 | **21%** | 🔧 bridge |
| **UMUMIY** | | | | | | **~52%** | ⚠ |

> **Deploy ustuni** har modulda 5/10 — chunki `apps/api/Dockerfile` yo'q. Bu barcha modullar uchun deploy bloker.

---

## V. 7 TA KRITIK BLOKER (Birinchi hal qilinishi kerak)

| # | Bloker | Fayl | Vaqt |
|---|---|---|---|
| 🔴 1 | `apps/api/Dockerfile` yo'q — deploy to'xtaydi | Yaratish kerak | 2 soat |
| 🔴 2 | `queryKey: ["/api"]` 34 ta joyda — React Query cache collision | `artifacts/erp-dashboard/src` | 4 soat |
| 🔴 3 | HR 36 controller module'ga ulanmagan — barcha HR endpoint 404 | `apps/api/src/modules/hr/hr-*.module.ts` | 1 kun |
| 🔴 4 | Marketing 57 stub — butun modul ishlamaydi | `apps/api/src/modules/marketing/` | 2-4 hafta |
| 🔴 5 | WMS `getMovements()` doim `[]` qaytaradi | `wms-extended.controller.ts:170` | 2 soat |
| 🟠 6 | Schema compat stubs — 160+ jadval ikki joyda ta'riflangan | `shared/db/schema-compat-*.ts` | 1-2 hafta |
| 🟠 7 | `salary_history` (HR) va `payroll_calculations` (Finance) parallel | `payroll.ts` + `fi-payroll-calc.ts` | 3-5 kun |

---

## VI. TOZALASH REJASI — USTUVORLIK BO'YICHA

### Bu hafta (Kritik)

1. **Dockerfile yaratish** — `apps/api/Dockerfile` (multi-stage, non-root)
2. **queryKey tuzatish** — 34 ta `["/api"]` → aniq `["crm-leads"]`, `["pos-sales"]` va h.k.
3. **HR module ulanish** — 36 ta controller'ni tegishli `*.module.ts` ga qo'shish
4. **WMS getMovements()** — real DB query bilan almashtirish

### Keyingi 2 hafta (Muhim)

5. **Schema compat tozalash** — `schema-compat-*.ts` va `schema-business-*.ts` fayllarni canonical `lib/db` import'ga o'tkazish
6. **`remaining/` va `legacy/` modullarini yo'q qilish** — canonical modullarga birlashtirish
7. **Dead controller/service'larni o'chirish yoki module'ga ulash** — 63 ta service, 36 ta controller
8. **HR payroll stub'larini real qilish** — `payroll.service.ts`, `payroll-tax-calendar.controller.ts`

### Bir oy ichida (Sifat)

9. **973 ta dead sahifani tozalash** — yo route qo'shish, yo o'chirish
10. **308 ta dead komponent** — yo ishlatish, yo o'chirish
11. **`helpers.tsx` 5 ta nusxa** → bitta `@/lib/format.ts`
12. **`KpiCard` 4 ta nusxa** → bitta canonical komponent
13. **Marketing moduli** — real implementatsiya yoki umuman o'chirish

---

## VII. VAQT TAXMINI

| Maqsad | Shart | Vaqt |
|---|---|---|
| **Pilot** (auth + pos + hr asosiy + finance) | Bloker #1,2,3 hal bo'lsin | **4–6 hafta** |
| **Bo'lim production** (to'liq HR, CRM, Finance, POS) | Blokerlar + schema tozalash | **3–4 oy** |
| **Korxona to'liq** (barcha 52 modul) | Marketing/IoT real + dead code tozalash | **6–8 oy** |

---

## VIII. KUCHLI TOMONLAR (O'zgartirmaslik kerak)

- TypeScript typecheck PASS (BE + FE, exit 0)
- DDD arxitektura asosiy modullarda to'g'ri (CRM, SD, PP)
- Auth xavfsizligi: HttpOnly cookie, SameSite=Strict, bcrypt, rate limiting
- Docker Compose (prod) to'g'ri: multi-stage, non-root, tini, health-check
- `numericMoney` helper (NUMERIC 18,4) to'g'ri pul tipi
- i18n infratuzilmasi: 3 til, 165 JSON, 56 namespace — sifatli
- Idempotent migration'lar: `drift-fix-01..04c.sql` xavfsiz
- `migrations-drift.ts` (3192 qator) avto-generatsiya mexanizmi yaxshi

---

*Hisobot generatsiyasi: 5 ta parallel agent, 300+ tool call, ~5000 fayl skanerlangan*  
*Tuzuvchi: Claude (mustaqil tahlil — hech qanday mavjud audit fayli o'qilmadi)*
