# EuroPrint ERP — Test Qoplami Auditi
Sana: 2026-06-02  
Auditor: Claude Sonnet 4.6 (read-only, hech qanday fayl o'zgartirilmadi)

---

## 1. JAMI STATISTIKA

| Ko'rsatkich | Qiymat |
|---|---|
| **Backend test fayllari (jami)** | **706** |
| — `test/` ichidagi spec fayllar | 680 |
| — `src/modules/` ichidagi spec fayllar | 26 |
| Backend describe/it/test bloklar (taxminan) | ~7 585 (grep natija) |
| E2E spec fayllari (`*.e2e-spec.ts`) | 17 |
| DTO spec fayllari (`test:dto` skript) | 26 (src darajasida) |
| Skipped/todo testlar | 7 (juda kam) |
| **Frontend test fayllari (Vitest)** | **401** |
| Frontend test bloklar | taxminan 2 000+ |

### Backend test tarkibi (tur bo'yicha)
| Tur | Fayl soni |
|---|---|
| Handler testlari | 161 |
| Service testlari | 124 |
| Repository testlari | 31 |
| Aggregate testlari | 27 |
| DTO testlari | 26 |
| Controller testlari | 6 |
| Guard testlari | 5 |
| Stub/contract testlar | 149 |
| Boshqa (exhaustive, e2e-stil, arx) | ~177 |

---

## 2. MODUL BO'YICHA TEST HOLATI

### Backend (test/ papka)

| Modul | Test fayllar | Servislar soni | Xavf | Holat |
|---|---|---|---|---|
| **hr** | 53 + 5 root = 58 | 63 | Yuqori | ⚠️ Servis/test nisbat = 0.9x |
| **finance** | 38 + 3 root = 41 | 32 | Kritik | ✅ GL/payroll yaxshi qoplangan |
| **crm** | 34 + 2 root = 36 | 27 | O'rta | ✅ Asosan yaxshi |
| **pp** (ishlab chiqarish) | 29 | 21 | Yuqori | ✅ BOM/routing/MRP qoplangan |
| **sd** (savdo) | 20 | 10 | Yuqori | ✅ Buyurtma/invoice qoplangan |
| **qc** | 18 | 13 | Yuqori | ✅ SPC/FMEA bor |
| **mm** | 18 | 7 | O'rta | ✅ |
| **lms** | 14 | 11 | Past | ✅ |
| **iot** | 14 | — | O'rta | ✅ |
| **director** | 14 | — | O'rta | ✅ |
| **wms** | 16 | 22 | Kritik | ⚠️ 16 test/22 servis; ABC/FIFO bor |
| **auth** | 12 | 7 | Kritik | ✅ JWT guard, OTP, login qoplangan |
| **mes** | 11 | 6 | Yuqori | ✅ |
| **marketing** | 10 | — | Past | ⚠️ Ko'p stubs |
| **notifications** | 9 | — | O'rta | ⚠️ |
| **logistics** | 8 | — | O'rta | ✅ |
| **kanban** | 8 | — | Past | ✅ |
| **order-workflow** | 6 | — | Yuqori | ⚠️ Fan-out chain uchun kam |
| **mro** | 6 | 2 | Past | ✅ |
| **design** | 6 | — | Past | ✅ |
| **admin** | 6 | — | O'rta | ✅ |
| **pos** | 3 + 7 root = 10 | 55 | **KRITIK** | ❌ 55 servis, 10 test = 18% |
| **org-structure** | 0 | — | Yuqori | ❌ 0 test |

### Frontend (Vitest, erp-dashboard/src)

| Maydon | Test fayllar |
|---|---|
| pages/ | 296 |
| components/ | 43 |
| hooks/ | 33 |
| lib/ | 26 |
| routes/ | 1 |
| test/ | 2 |
| **Jami** | **401** |

FE coverage chegarasi: lines 15%, functions 15%, branches 10% (juda past — "ratchet plan" mavjud).

---

## 3. KRITIK BIZNES MANTIQ TEST HOLATI

| Qism | Test bor? | Sifat | Muammo |
|---|---|---|---|
| **GL posting (pul yozuvi)** | ✅ | ✅ Yaxshi | `gl-posting.service.spec.ts` — debit=kredit invariant, 4 stsenariy, real import |
| **GL journal validation** | ✅ | ✅ Yaxshi | `finance-exhaustive.spec.ts` — 8 ta edge case matritsa testi |
| **Payroll hisoblash (INPS/JSHD)** | ✅ | ⚠️ O'rtacha | `drizzle-finance-payroll.repo.spec.ts` + `calculate-payroll.handler.spec.ts`; ammo INPS 8%/JSHD 12% formula to'g'riligi exhaustive test ichida inline (real servisga ulanmagan) |
| **Inventory balance (FIFO/FEFO)** | ✅ | ✅ Yaxshi | `pos-fifo.service.spec.ts` (real import) + `fefo-stock.handler.spec.ts` (real WMS aggregate) |
| **Guard / Auth** | ✅ | ✅ Yaxshi | `jwt-auth.guard.spec.ts` — Public, Bearer yo'q, token buzuq; `roles-guard.spec.ts`; `auth-exhaustive.spec.ts` real importlar bilan |
| **Event chain (order→dept fan-out)** | ⚠️ | ⚠️ Sust | `order-workflow/` da 6 test bor, ammo `AdvanceApprovedFanoutListener` va `SdOrderDepartmentSagaService` uchun to'g'ridan test yo'q |
| **POS GL auto-posting** | ⚠️ | ⚠️ Sust | `pos-gl-auto.service.spec.ts` bor (root), ammo `auto-gl-posting.service.ts` uchun alohida test aniqlanmadi |
| **POS cash register** | ❌ | ❌ | `cash-register.service.ts` uchun test yo'q |
| **OTP / session blacklist** | ✅ | ✅ | `otp-session.repository.spec.ts` + `verify-otp.handler.spec.ts` |
| **AR/AP aging** | ✅ | ✅ | `ar-aging.handler.spec.ts` bor |
| **Budget variance** | ✅ | ✅ | `budget.aggregate.spec.ts` + `approve-budget.handler.spec.ts` |
| **Depreciation** | ✅ | ✅ | `depreciation.service.spec.ts` bor |
| **WMS EOQ / ROP / safety stock** | ✅ | ✅ | 3 alohida spec fayl — real import |
| **MRP report** | ✅ | ✅ | `get-mrp-report.handler.spec.ts` |
| **Break-even** | ✅ | ✅ | `break-even.spec.ts` |

---

## 4. TEST SIFATI TAHLILI

### 4.1 KUCHLI TOMONLAR

1. **Result<T> pattern to'g'ri ishlatiladi** — deyarli barcha testlar `r.ok === true` tekshiradi va `Err` holatlari ham qoplanadi.

2. **Mock strategiyasi izchil** — `makeDbMock()` / `jest.fn()` / repo stub pattern keng qo'llaniladi. Jami 2 665 mock/stub qo'llanishi.

3. **E2E testlar NestJS TestingModule bilan** — `test/e2e/` da 17 fayl, haqiqiy HTTP inject qilinadi, guard mocklar bilan 403/200/400 stsenariylari sinovdan o'tadi (garchi CI'da ishlamasa ham, quyida).

4. **Architecture rules test** — `test/architecture/rules.spec.ts` 22 ta qoida tekshiradi, reviewer scriptlar mavjudligini va pattern aniqlashini tasdiqlaydi.

5. **Stryker mutation testing sozlangan** — `stryker.config.json` finance/hr/sd modullarini qoplaydi, CI ga qo'shilmagan lekin `pnpm test:mutation` orqali ishlaydi.

6. **Coverage threshold mavjud** — BE: lines 25%, branches 20% (jest.config.js); FE: lines 15%, branches 10% (vitest.config.ts).

### 4.2 MUAMMOLAR

#### P0 — Jiddiy sifat muammolari

**1. Stub testlar (149 fayl) — haqiqiy kodni tekshirmaydi**
- `test/_stubs/*.spec.ts` faylarining barchasi (149 ta) bir xil 3 ta test qiladi: modul importlanadi, ikki marta import bir xil, eksport `function` tipida.
- Bu testlar "Rule 22: every service needs a unit test" ni rasmiy bajaradi, ammo servisning hech qanday mantiqini tekshirmaydi.
- Misol: `AdminExtraService.spec.ts` — 3 test, 0 behavioural assertion.

**2. "Exhaustive" testlarning aksariyati real kodni import qilmaydi**
- 15 ta `*-exhaustive.spec.ts` faylidan faqat `auth-exhaustive.spec.ts` `src/` dan import qiladi (5 import).
- Qolgan 14 tasi (finance, hr, pos, security, connectivity, sales, production...) — ichki `function` ta'riflaydi va shu funksiyalarni sinovdan o'tkazadi.
- Bu "coverage inflyatsiyasi": testlar o'tadi lekin haqiqiy servis kodini tekshirmaydi.

**3. E2E testlar CI'da ishlamaydi**
- `test/e2e/` da 17 fayl bor.
- `jest.config.js` `testRegex: 'test/.*\\.spec\\.ts$'` — bu regex `*.e2e-spec.ts` fayllarni TUTMAYDI (`-spec.ts` ≠ `.spec.ts`).
- CI `pnpm test` skriptida ham e2e uchun alohida config yo'q.
- Natija: 17 e2e test hech qachon avtomatik ishlamaydi.

**4. POS moduli kritik qoplanmagan**
- 55 servis faylga qarshi 10 real test (18%).
- `cash-register.service.ts`, `pos-auth.service.ts`, `lifecycle-block.service.ts`, `employee-ledger.service.ts` va boshqa ko'plab kritik servislar uchun test yo'q.

#### P1 — Muhim muammolar

**5. order-workflow / fan-out chain uchun test sust**
- Phase 4 (order→dept fan-out) asosiy biznes logikasi: `AdvanceApprovedFanoutListener`, `SdOrderDepartmentSagaService` — test yo'q.
- Faqat `order-workflow/` da 6 ta umumiy test bor.

**6. org-structure moduli — 0 test**
- `OrgStructureService` (employees.user_id backfill, dept hierarchy) uchun hech qanday test yo'q.

**7. FE coverage chegarasi juda past (5→15%)**
- Frontend threshold 15% — bu amalda "coverage majburiy emas" degan ma'noni anglatadi.
- 401 FE test fayli bor lekin ular asosan pages/ darajasida (296/401).

**8. Compatibility testlari bir xil pattern takrorlaydi**
- `test/compatibility/` da 34 fayl — ko'pchiligida ikki qatlamli test: servis va controller. Yaxshi, ammo edge case kam.

---

## 5. QOPLANMAGAN (0 TEST) MODULLAR

| Modul | Xavf darajasi | Asosiy xizmat |
|---|---|---|
| `org-structure` | Yuqori | OrgStructureService — employees backfill, manager hierarchy |
| `pos/cash-register` | Kritik | Kassa operatsiyalari |
| `pos/lifecycle-block` | Yuqori | Material hayot sikli blokirovkasi |
| `pos/employee-ledger` | Yuqori | Xodim hisobi |
| `pos/pos-auth` | Kritik | POS autentifikatsiya |
| `order-workflow/fanout` | Kritik | Buyurtma→bo'lim fan-out saga |
| `sd/order-department` | Kritik | Buyurtma-bo'lim bog'liqlik xizmati |
| `notifications` (ba'zilari) | O'rta | Bildirishnoma yetkazish |

---

## 6. CI VA AVTOMAT TEST HOLATI

| Komponent | Holat | Izoh |
|---|---|---|
| GitHub Actions (CI) | ✅ Mavjud | `.github/workflows/ci.yml` — typecheck + unit test + FE test |
| BE unit test (Jest) | ✅ CI'da | `pnpm --filter @europrint/api run test` |
| FE test (Vitest) | ✅ CI'da | `pnpm --filter @workspace/erp-dashboard run test:coverage` |
| **E2E test (17 fayl)** | ❌ CI'dan tashqarida | `*.e2e-spec.ts` jest regex bilan tanlanmaydi |
| **DTO test** | ⚠️ Alohida skript | `pnpm test:dto` — CI'da yo'q |
| Pre-commit hook | ✅ Kuchli | 20+ guard: ESLint, typecheck, dup-route scan, sidebar regress, i18n |
| Pre-commit test ishlatish | ❌ Yo'q | Hook faqat lint/typecheck — testlar commit paytida ishlamaydi |
| Mutation testing (Stryker) | ✅ Mavjud | `pnpm test:mutation` — finance/hr/sd qoplaydi, CI'da yo'q |
| Coverage threshold (BE) | ✅ | lines 25%, functions 25%, branches 20% |
| Coverage threshold (FE) | ⚠️ Past | lines 15%, branches 10% — haddan past |

---

## 7. TAVSIYA (P0 → P3)

### P0 — Darhol (kritik xavfsizlik/pul)

1. **E2E testlarni jest.config.js'ga qo'shish** — `testRegex` ni `(spec|e2e-spec)\.ts$` ga o'zgartirish yoki alohida `jest.e2e.config.js` yaratib CI'ga qo'shish. 17 ta e2e test yozilgan lekin hech qachon ishlamaydi.

2. **POS cash-register va pos-auth uchun real unit test yozish** — Kassa operatsiyalari, POS login mantiqini tekshiruvchi kamida 5-10 ta behavioural test.

3. **Order-workflow fan-out uchun test** — `AdvanceApprovedFanoutListener` va `SdOrderDepartmentSagaService` uchun unit test: event keladi → 5 bo'lim uchun job yaratiladi → har biri "done" bo'ladi.

### P1 — Muhim (1-2 hafta)

4. **Exhaustive testlarni real import bilan almashtirilishi** — `finance-exhaustive.spec.ts`, `hr-exhaustive.spec.ts` kabi fayllar ichki `function` o'rniga real `FinanceExtendedPayrollService`, `GlPostingService` ni import qilishi kerak.

5. **_stubs testlarini kamida 1 ta behavioural assertion bilan kengaytirish** — 149 stub testdan eng muhim 30 tasiga (finance, pos, hr) `canActivate`, `calculate`, `findAll` kabi haqiqiy metod chaqiruvi qo'shilsin.

6. **org-structure uchun test yozish** — `OrgStructureService.backfillEmployeeUserId()` va `getSubtree()` metodlari uchun unit test (bu metodlar haqiqiy prod'da ishlaydigan).

7. **Pre-commit hook'ga minimal smoke test qo'shish** — `pnpm test --testPathPattern=test/(auth|finance)/.*guard|payroll` yoki tegishli filtr bilan kritik testlarni commit paytida ishlatish.

### P2 — Yaxshilash (1 oy)

8. **FE coverage threshold oshirish** — 15% → 25% → 40% qadamma-qadam (vitest.config.ts'dagi "ratchet plan" amalga oshirilsin).

9. **Stryker CI'ga qo'shish** — `test:mutation` ni haftalik CI workflow'ga qo'shish (alohida scheduled job).

10. **WMS moduli uchun to'liq qoplam** — 16 test/22 servis; `wms-analytics.service`, `wms-eoq.service` real Drizzle mock bilan.

### P3 — Kelajak

11. **DTO testlarni CI'ga qo'shish** — `pnpm test:dto` hozir faqat manual.

12. **Coverage thresholdni 50% gacha oshirish** — Ikkinchi yarim yilga maqsad.

---

## 8. XULOSA

EuroPrint ERP test bazasi hajm jihatdan katta (706 BE + 401 FE = 1107 fayl), lekin sifat jihatdan ikki qavatli:

- **Yuqori sifat**: GL posting, FIFO/FEFO, payroll repo, JWT guard, AR aging, budget, WMS EOQ — bular haqiqiy kodni test qiladi, edge case'lar qoplangan, mock pattern to'g'ri.
- **Past sifat**: 149 stub test faqat `typeof exported === 'function'` tekshiradi; 14 "exhaustive" test haqiqiy kodni import qilmaydi; 17 e2e test hech qachon ishlamaydi.

**Eng katta xavf**: POS moduli (55 servis, 10 test) va order-workflow fan-out (P0 biznes mantiq, 0 unit test).
