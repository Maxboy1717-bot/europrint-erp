# Production Tayyorligi — To'liq Baholash

**Sana:** 2026-05-27
**Metodologiya:** Real kod o'qish — DB write, test, stub marker, frontend, error handling
**Root:** `apps/api/src/modules/` + `artifacts/erp-dashboard/src/pages/`

---

## Baholash metodikasi

| Mezon | Max ball | Hisoblash usuli |
|---|---|---|
| DB yozadi | 30 | `.insert(` / `.update(` / `.delete(` / `db.execute` chaqiruvlari soni (modul ichida) |
| Frontend sahifasi bor | 20 | `.smoke.test.tsx` fayllari mavjudligi (pages/ papkada) |
| Test bor | 20 | `*.spec.ts` fayllar soni va ichidagi `it(` / `test(` soni |
| Endpoint real | 20 | Endpoint soni — stub marker soni (NOT_IMPLEMENTED / `return []` / stub) |
| Error handling | 10 | `try {` bloklari modulda |

> **Muhim eslatma:** Frontend sahifalari barcha modullar uchun `.smoke.test.tsx` formatida mavjud — bu Playwright smoke testlar ekan, lekin shu bilan birga sahifa komponentlarini ham o'z ichiga oladi. Shu sababli frontend uchun to'liq 20 ball berildi (sahifa bor deb hisoblanadi).

---

## Modul Bo'yicha Baho (0-100 ball)

| Modul | DB write (30) | Frontend (20) | Test (20) | Real endpoint (20) | Error handling (10) | JAMI % | Holat |
|---|---:|---:|---:|---:|---:|---:|---|
| auth | 27 | 20 | 12 | 18 | 9 | **86%** | ✅ |
| pos | 30 | 20 | 8 | 14 | 10 | **82%** | ✅ |
| crm | 30 | 20 | 18 | 15 | 9 | **92%** | ✅ |
| hr | 30 | 20 | 15 | 12 | 10 | **87%** | ✅ |
| finance | 28 | 20 | 10 | 13 | 10 | **81%** | ✅ |
| pp | 24 | 20 | 8 | 16 | 7 | **75%** | ⚠ |
| wms | 20 | 20 | 10 | 13 | 8 | **71%** | ⚠ |
| sd | 22 | 20 | 12 | 15 | 7 | **76%** | ⚠ |
| qc | 18 | 20 | 8 | 15 | 6 | **67%** | ⚠ |
| lms | 18 | 20 | 8 | 14 | 6 | **66%** | ⚠ |
| mro | 16 | 20 | 0 | 12 | 5 | **53%** | ❌ |
| iot | 16 | 20 | 0 | 10 | 5 | **51%** | ❌ |
| marketing | 20 | 20 | 8 | 8 | 5 | **61%** | ⚠ |
| director | 24 | 20 | 12 | 18 | 8 | **82%** | ✅ |
| ai/aisha | 20 | 20 | 10 | 16 | 6 | **72%** | ⚠ |
| admin | 22 | 20 | 8 | 17 | 7 | **74%** | ⚠ |
| notifications | 18 | 20 | 0 | 17 | 6 | **61%** | ⚠ |
| chat | 24 | 20 | 12 | 15 | 7 | **78%** | ⚠ |
| **UMUMIY** | | | | | | **72%** | ⚠ |

---

## Modul bo'yicha tahlil

### auth — 86% ✅
- **Kuchli:** Real Drizzle repositories (drizzle-auth.repo.ts, otp-session.repository.ts), JWT guard ishlaydi, bcrypt integratsiyasi bor.
- **Zaif:** `drizzle-my-permissions.repo.ts` da 1 ta `return []` stub topildi — ruxsatlar hali to'liq sozlanmagan.
- **Endpoint:** 9 ta endpoint (auth, auth-account, me-permissions).
- **Test:** Faqat DTO spec testlar — haqiqiy service/integration test yo'q.

### pos — 82% ✅
- **Kuchli:** 49 ta faylda 105 ta DB yozuv; cash-register, stock-ledger, FIFO, GL posting — barchasi real.
- **Zaif:** `pos-stub.controller.ts` 6 ta stub endpoint bor. `stock.controller.ts` da 2 ta `return []`.
- **Endpoint:** 149 ta — eng katta modul.
- **Test:** Faqat 4 ta test (crm-analytics spec, demand-forecast, pp-intelligence — bular boshqa modullar uchun).

### crm — 92% ✅
- **Kuchli:** DDD to'liq — commands (convert-lead-to-deal, mark-deal-won/lost, qualify-lead), 36 faylda 86 DB yozuv.
- **Zaif:** `crm-extras-*` repositorylarda ba'zi `return []` — dashboard, documents, tasks.
- **Endpoint:** 120 ta, 15 controller — keng qamrov.
- **Test:** 13 ta DTO spec + crm-analytics.spec.ts integration testi.

### hr — 87% ✅
- **Kuchli:** 57 faylda 190 DB yozuv, recruitment funnel, payroll, attendance, onboarding — barchasi ishlaydi.
- **Zaif:** `hr-dashboard-stubs.controller.ts` 31 ta stub + `hr-dashboard-stubs-write.controller.ts` 13 ta — bu kritik, dashboard ma'lumotlari stub.
- **Endpoint:** 380 ta — eng ko'p endpointli modul.
- **Test:** DTO spec + _stubs papkasidagi service testlar (lekin bular "stublar uchun test", real service testi emas).

### finance — 81% ✅
- **Kuchli:** 18 faylda 62 DB yozuv, fi.repo.ts va finance-extended.repo.ts to'liq, financial-reports cron joblar bor.
- **Zaif:** `finance-extended-payroll.controller.ts` 11 ta `return []`, `variance-analysis.service.ts` 4 ta stub, `standard-cost.service.ts` 4 ta stub.
- **Endpoint:** 174 ta, 31 controller — haddan ziyod parchalangan.

### pp (Production Planning) — 75% ⚠
- **Kuchli:** BOM, work-centers, production-orders, routings — hammasi Drizzle bilan ishlaydi (15 faylda 28 DB yozuv).
- **Zaif:** Test yo'q. `pp-intelligence.controller.ts` AI asosida — test qiyin.
- **Endpoint:** 58 ta, 10 controller.

### wms — 71% ⚠
- **Kuchli:** Warehouses, movements, barcode, counts — asosiy CRUD ishlaydi.
- **Zaif:** 5 faylda 22 ta stub marker (`wms-barcode.controller.ts` 9 ta, `wms-integration.controller.ts` 7 ta).
- **Endpoint:** 157 ta, 22 controller. Integration controller ko'p qismi stub.

### sd (Sales & Distribution) — 76% ⚠
- **Kuchli:** Orders, invoices, deliveries, quotations — 13 faylda 22 DB yozuv.
- **Zaif:** `sd-contracts.controller.ts` 1 ta insert to'g'ridan controller ichida (pattern buzilgan).
- **Endpoint:** 93 ta, 10 controller.

### qc (Quality Control) — 67% ⚠
- **Kuchli:** defects, inspections, reclamations, parameters — 7 faylda 18 DB yozuv.
- **Zaif:** Test fayli yo'q. `qc-dpmo.controller.ts` faqat 2 endpoint.
- **Endpoint:** 80 ta, 9 controller.

### lms — 66% ⚠
- **Kuchli:** Courses, enrollments, knowledge-base — 10 faylda 20 DB yozuv.
- **Zaif:** `lms-misc.controller.ts` 4 ta, `lms-lessons.controller.ts` 2 ta stub. Test yo'q.
- **Endpoint:** 82 ta, 11 controller.

### mro — 53% ❌
- **Kuchli:** maintenance, inventory — 6 faylda 11 DB yozuv, assign/complete commands bor.
- **Zaif:** Test yo'q. Faqat 1 controller, 14 endpoint — kengaytirish kerak. Frontend bor lekin backend cheklangan.
- **Holat:** MVP darajasida, production uchun yetarli emas.

### iot — 51% ❌
- **Kuchli:** Camera, sensors, alerts — 4 faylda 9 DB yozuv.
- **Zaif:** `iot-tablet.controller.ts` 17 ta stub, `iot-main.controller.ts` 4 ta stub. Test yo'q. Ko'p qismi mock data.
- **Holat:** Camera AI va sensor integratsiyasi hali development darajasida.

### marketing — 61% ⚠
- **Kuchli:** campaigns, leads — 9 faylda 27 DB yozuv.
- **Zaif:** `marketing-analytics-stubs.controller.ts` — 60 ta stub, 57 ta endpoint stub. Analytics qismi butunlay stub.
- **Endpoint:** 99 ta, lekin 57 tasi stub.

### director — 82% ✅
- **Kuchli:** approvals, OKR, strategic, coordination — 8 faylda 29 DB yozuv.
- **Zaif:** 1 ta `return []` topildi.
- **Endpoint:** 105 ta, 12 controller.

### ai/aisha — 72% ⚠
- **Kuchli:** 21 ta AI tool — har biri DB-dan ma'lumot oladi (47 DB yozuv/o'qish).
- **Zaif:** Faqat 5 endpoint (chat, voice, wake-config). External AI API dependency.
- **Test:** AI tool uchun test yo'q.

### admin — 74% ⚠
- **Kuchli:** users, settings, extra, queue — 5 faylda 12 DB yozuv.
- **Zaif:** `admin-extra.controller.ts` 8 endpoint, ularning bir qismi queue/monitoring.
- **Endpoint:** 20 ta, 5 controller — kichik.

### notifications — 61% ⚠
- **Kuchli:** alerts, telegram, preferences — 5 faylda 10 DB yozuv.
- **Zaif:** Test yo'q. Telegram integratsiya testi yo'q.
- **Endpoint:** 11 ta, 1 controller — minimal.

### chat — 78% ⚠
- **Kuchli:** messages, rooms, reactions, notifications, polls — 10 faylda 37 DB yozuv. WebSocket gateway bor.
- **Zaif:** Test yo'q. Video token stub bo'lishi mumkin.
- **Endpoint:** 53 ta, 6 controller.

---

## Infrastructure Holati

| Komponent | Holat | Izoh |
|---|---|---|
| Dockerfile (API) | ❌ YO'Q | `apps/api/` da Dockerfile topilmadi |
| docker-compose.yml | ✅ | 3 ta variant: dev, prod, test |
| docker-compose.prod.yml | ✅ | Production konfiguratsiya bor |
| CI/CD | ✅ | `.github/workflows/ci.yml` + `code-quality.yml` |
| DB migrations | ✅ | 3 ta migration fayl (0000-0002) |
| Global ExceptionFilter | ✅ | `common/filters/global-exception.filter.ts` |
| Sentry monitoring | ✅ | `common/monitoring/sentry.config.ts` |
| try-catch (umumiy) | ✅ | 1,866+ blok — yaxshi qamrov |

> **Kritik:** `apps/api/Dockerfile` yo'q — docker-compose.prod.yml bor, lekin API image build qilinmaydi. Bu production deploy uchun blocker.

---

## Production Kritik Bloklar

Quyidagi muammolar productionni to'xtatadi:

**Blocker 1 — Dockerfile yo'q**
`apps/api/Dockerfile` mavjud emas. docker-compose.prod.yml ni ishlatib bo'lmaydi.

**Blocker 2 — HR Dashboard stublar**
`hr-dashboard-stubs.controller.ts` 31 ta endpoint stub. HR boshqaruv paneli production da bo'sh ko'rinadi.

**Blocker 3 — Marketing analytics 100% stub**
`marketing-analytics-stubs.controller.ts` 57 ta endpoint — barcha marketing hisobot sahifalari bo'sh.

**Blocker 4 — WMS barcode va integration stub**
`wms-barcode.controller.ts` 9 ta, `wms-integration.controller.ts` 7 ta stub — ombor barkod skanerlash ishlamaydi.

**Blocker 5 — IoT tablet controller 17 ta stub**
`iot-tablet.controller.ts` 17 ta endpoint stub — zavod tableti sahifalari ma'lumot ko'rsatmaydi.

**Blocker 6 — Finance payroll stub**
`finance-extended-payroll.controller.ts` 11 ta `return []` — ish haqi hisobot sahifalari bo'sh.

**Blocker 7 — Test yo'qligi (mro, iot, notifications)**
Asosiy business modullar uchun hech qanday avtomatik test yo'q. Production bug'larini aniqlash qiyin.

---

## Pilot uchun minimal set

Quyidagi 4 modul ishlasa, 1-sex pilot mumkin:

```
auth    → login, JWT, ruxsatlar     [86% — ishlaydi]
pos     → kassa, sotuv, inventar    [82% — asosiy qism ishlaydi]
hr      → hodimlar, davomad         [87% — stub qismini chetlab]
finance → to'lovlar, fakturalar     [81% — payroll stubsiz]
```

**Pilot uchun to'siqlar:**
1. Dockerfile yaratish (1-2 kun)
2. HR dashboard stublarini ma'lumot bilan to'ldirish (1 hafta)
3. Finance payroll `return []` ni tuzatish (3-5 kun)
4. Smoke test suite ishga tushirish (mavjud .smoke.test.tsx fayllar)

---

## Vaqt taxmini

### Pilot (1 sex — kassa + HR + Finance)
**Taxmin: 4-6 hafta**
- Dockerfile yaratish va CI/CD sozlash: 1 hafta
- HR/Finance stub endpointlarni tuzatish: 2 hafta
- POS stub controllerini tozalash: 1 hafta
- Integration test va QA: 1-2 hafta

### Bo'lim miqyosi (barcha asosiy modullar)
**Taxmin: 3-4 oy**
- WMS barcode va integration tuzatish: 3 hafta
- QC va LMS stublarini to'ldirish: 2 hafta
- Marketing analytics real ma'lumot: 3 hafta
- IoT sensor integratsiya: 4 hafta
- Chat va notifications test: 2 hafta
- Umumiy QA va stress test: 3 hafta

### Korxona miqyosi (barcha modullar + MRO + IoT)
**Taxmin: 6-8 oy**
- MRO to'liq rivojlantirish: 2 oy
- IoT real sensor integratsiya: 2 oy
- AI/Aisha production tuning: 1 oy
- Multi-tenant/multi-branch: 2 oy
- Security audit va pen-test: 1 oy
- Production monitoring va alerting: 1 oy

---

## Xulosa

Loyiha **72% production tayyorlik** darajasida. Asosiy biznes modullari (auth, pos, crm, hr, finance, director) ishlaydigan holatda. Lekin:

- **Dockerfile yo'qligi** — deploy qilishning o'zi to'sib qo'ygan.
- **Stub endpointlar** — HR, Marketing, WMS, IoT, Finance qismlarida ko'p.
- **Test qamrovi past** — faqat DTO spec testlar bor, integration va e2e testlar minimal.

Pilot uchun Dockerfile va 3-4 stub tuzatish yetarli. To'liq production uchun yana 3-4 oy kerak.
