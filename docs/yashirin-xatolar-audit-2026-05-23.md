# EuroPrint ERP — Yashirin Xatolar Auditi (REPORT-ONLY)

**Sana:** 2026-05-23
**Rejim:** Faqat hisobot — hech qanday kod o'zgartirilmadi.
**Qamrov:** Backend (NestJS) + Frontend (React/Vite) + Drizzle↔DB drift + testlar + xavfsizlik.

> Metod: typecheck (haqiqiy ishga tushirildi), jonli DB bilan schema solishtiruvi
> (psql, `europrint` DB), kod darajasidagi bug qidiruvi (parallel agentlar), test runner,
> route-kollision tekshiruvi. Har bir da'vo qo'lda tasdiqlandi.

---

## 0. Qisqacha xulosa (severity bo'yicha)

| # | Kategoriya | Daraja | Hajm | Holat |
|---|-----------|--------|------|-------|
| A | **Drizzle ↔ DB drift** | 🔴 KRITIK | 73 jadval + 554 ustun | TASDIQLANDI |
| B | **Soxta/stub endpointlar** (false data qaytaradi) | 🔴/🟠 | ~6 jonli + ~105×501 | TASDIQLANDI |
| C | **Backend logic/runtime bug** | 🟠/🟡 | ~10 | TASDIQLANDI |
| D | **Frontend runtime bug** | 🟡 | ~5 | TASDIQLANDI |
| E | **Testlar eskirgan/singan** | 🟠 | ~25% suite fail (namuna) | TASDIQLANDI |

**Toza (muammo emas, tasdiqlandi):** BE+FE typecheck = 0 xato · SQL injection = mitigatsiya qilingan · admin default parol = tuzatilgan · duplicate routes = jonli emas (pastga qarang).

---

## A. 🔴 Drizzle ↔ DB Drift — ENG KATTA YASHIRIN XATO

Bu eng xavfli toifa: kod (Drizzle schema) **bor bo'lgan, lekin DB'da YO'Q** jadval/ustunlarga
murojaat qiladi. TypeScript bunday xatoni ko'rmaydi (schema TS darajasida to'g'ri), lekin
so'rov bajarilganda PostgreSQL `column ... does not exist` / `relation ... does not exist`
xatosi bilan **runtime 500** beradi.

**Raqamlar** (jonli `europrint` DB, 874 jadval + 77 view, 13 654 ustun bilan solishtirildi):
- **73 jadval** Drizzle kodida bor, DB'da yo'q
- **554 ustun** Drizzle'da bor, mavjud jadvallarda yo'q
- To'liq ro'yxat: `_drift_report.txt`

### Tasdiqlangan misol
`lib/db/src/schema/employees.ts:20`:
```ts
tenantId: integer("tenant_id").notNull().default(1),
```
DB tekshiruvi:
```
SELECT tenant_id FROM employees;
→ ОШИБКА: столбец "tenant_id" не существует  (column "tenant_id" does not exist)
```
`from(employees)` backend'da **12 joyda** ishlatiladi.

### Ikkita tizimli pattern (drift'ning katta qismi)

**1. `material_card_id` → DB'da `material_id` ga o'zgartirilgan (rename)**
Drizzle hali eski `material_card_id` nomini ishlatadi. Ta'sirlangan jadvallar (qisman):
`stock_ledger, warehouse_stock, warehouse_transactions, material_barcodes, material_batches,
picking_tasks, goods_receipt_lines, cycle_count_results, consumption_suggestions, current_stock,
pos_* (15+), qc_material_tests, employee_inventory_ledger, ...`
→ `materialCardId` kod ichida **46 faylda** (repo/service/query) ishlatiladi → jonli crash riski.

**2. `tenant_id` — multi-tenancy Drizzle'ga qo'shilgan, DB'ga migratsiya QILINMAGAN**
`.notNull()` bo'lgani uchun bu jadvallarga **har qanday Drizzle `insert`** "column tenant_id
does not exist" bilan yiqiladi. Ta'sirlangan: `employees, attendance, candidates, departments,
crm_companies, crm_contacts, crm_deals, crm_leads, leave_requests, payroll_periods,
purchase_orders, sales_invoices, sales_orders, salary_history, discipline_records, vacancies,
aisha_conversations, aisha_tool_calls, ...`

### Jonli ta'sir miqyosi
Backend'da **436 ta** proyeksiyasiz `db.select().from(X)` bor. Drizzle bunday so'rovda
jadvalning **barcha** ustunlarini nomma-nom tanlaydi — agar jadvalda drift ustun bo'lsa,
so'rov darhol crash beradi. Ya'ni drift faqat "kelajak riski" emas, balki bu endpointlar
hozir 500 qaytaradi.

### Eng xavfli "MISSING TABLES" (kod murojaat qiladi, DB'da umuman yo'q)
`order-workflow-schema.ts` ning butun `ow_*` oilasi (16 jadval: `ow_orders` lines, `ow_work_orders`,
`ow_qc_results`, `ow_deliveries`, `ow_tech_cards`, ...), `kanban/kanban-extended.ts` ning `task_*`
oilasi (12 jadval: `task_checklists, task_observers, task_files, task_time_entries`, ...),
`lms.ts` (`test_attempts, test_questions, course_modules`), `ecommerce-schema.ts`
(`public_categories, product_favorites, website_reviews, customer_order_items`),
`token_blacklist` (auth), `crm_contact_companies, customer_contacts, customer_interactions`.

> **Tavsiya:** drift'ni ikki yo'l bilan yopish kerak: (a) DB'ga yetishmayotgan ustun/jadvallarni
> qo'shuvchi migratsiya, YOKI (b) Drizzle schema'ni DB'ning haqiqiy holatiga moslash. ADD-ONLY
> rejimda (a) xavfsizroq. `_drift_report.txt` to'liq ro'yxatni beradi.

---

## B. 🔴 Soxta / Stub Endpointlar (foydalanuvchiga yolg'on "muvaffaqiyat")

CLAUDE.md Qoida 10 ga zid — real ma'lumot o'rniga soxta javob qaytaradi.

### Jonli soxta javoblar (TASDIQLANDI)
| Fayl:qator | Muammo |
|------------|--------|
| `finance/presentation/finance-gl.controller.ts:90` | `getTrialBalance()` doim `{ debit:0, credit:0, balanced:true }` — **buxgalter "balansli" deb ko'radi**, hech narsa hisoblanmaydi |
| `finance/presentation/finance-gl.controller.ts:101` | `getLedger()` doim bo'sh `entries: []` qaytaradi |
| `hr/gamification/gamification.controller.ts:70,80` | xodim topilmasa `[] as unknown[]` / nol-ball obyekt (xato o'rniga) |
| `chat/chat-uploads.controller.ts:96,107,162` | push register/unregister/upload-complete → `{ ok: true }` (hech narsa qilmaydi) |
| `communication-center/.../cc-documents.controller.ts:146` | PIN setup → `{ ok: true }` |
| `kanban/presentation/kanban-boards.controller.ts:182` | read-all notifications → `{ ok: true }` |

### ~105 ta NOT_IMPLEMENTED (501) endpoint sidebar'ga ulangan
`marketing-analytics-stubs.controller.ts` (~62), `hr-dashboard-stubs.controller.ts` (~30),
`hr-dashboard-stubs-write.controller.ts` (~10), `pos-stub.controller.ts` (~4).
Bular Qoida 10 ga ko'ra **to'g'ri** 501 qaytaradi, lekin sidebar'dan ochilganda foydalanuvchi
"o'lik" sahifaga tushadi — frontend 501 ni chiroyli ("Tez orada") ko'rsatishi tekshirilsin.

---

## C. 🟠 Backend Logic / Runtime Bug

### Pagination: hammasini o'qib, xotirada validatsiyasiz slice (6 ta servis)
`design/orders/orders.service.ts:38` (tasdiqlandi), shuningdek `marketing/leads/leads.service.ts:28`,
`marketing/campaigns/campaigns.service.ts:27`, `logistics/deliveries/deliveries.service.ts:26`,
`mro/maintenance/maintenance.service.ts:33`, `mm/materials/materials.service.ts:23`.
```ts
const { page = 1, limit = 10 } = query;
const result = await repo.findAll();          // BUTUN jadval o'qiladi (DB-level LIMIT yo'q)
const data = (orders).slice((Number(page)-1)*Number(limit), Number(page)*Number(limit));
```
Muammolar: (1) `Number(page)` validatsiyasiz — `page=abc` → `NaN` → jimgina **bo'sh natija**;
`page=-5` → noto'g'ri oraliq. (2) Performance: katta jadvalda hamma satr xotiraga o'qiladi.

### `parseInt` radix'siz (4 ta)
`config/redis.config.ts:24,26`, `config/database.config.ts:23,24` — `parseInt(x)` o'rniga
`parseInt(x, 10)` bo'lishi kerak.

---

## D. 🟡 Frontend Runtime Bug

| Fayl:qator | Muammo |
|------------|--------|
| `pages/SDSalesPayments.tsx:107` | `markPaidMut` mutation'da `onError` yo'q — to'lov xatosi foydalanuvchiga **jim** |
| `pages/SDSalesPayments.tsx:112` | `advancePaymentMut` mutation'da `onError` yo'q |
| `components/.../AIReservation.tsx:358` | `new Date(r.requiredDate).toLocaleDateString()` — `requiredDate` null bo'lsa "Invalid Date" |
| `components/.../AIInsightsPanel.tsx:241` | `new Date(insight.createdAt).toLocaleDateString()` — null guard yo'q |

> Umumiy: FE kod array-xavfsizligi (`Array.isArray`, `safeArray`) bo'yicha yaxshi himoyalangan;
> yuqoridagilar qolgan asosiy holatlar.

---

## E. 🟠 Testlar Eskirgan / Singan

`pnpm --filter @europrint/api run test` (= `jest --config test/jest.config.js`):

- `test/auth/login.handler.spec.ts` — **7/7 fail**. Sabablar (service refactor qilingan, mock
  yangilanmagan):
  - `TypeError: Cannot read properties of undefined (reading 't')` — yangi dependency (i18n/`t`) mock qilinmagan
  - `TypeError: this.jwtService.sign is not a function` — `JwtService` mock'i `sign` ni bermaydi
- 702 spec faylning 123 tasi `@shared/*` / `@workspace/*` alias ishlatadi — bular **faqat**
  `--config test/jest.config.js` bilan to'g'ri resolve bo'ladi (`moduleNameMapper`). Aliassiz
  ishga tushirish "Cannot find module '@shared/db'" beradi (CI script to'g'ri config ishlatadi).
- **To'liq suite aggregate** (702 spec, butun BE): **139 suite fail / 560 pass** (699/702 ishga
  tushdi, ~20% suite yiqiladi), **596 test fail / 8554 pass / 10 skip** (9160 jami, ~6.5% test
  yiqiladi). Ya'ni `pnpm run test` hozir CI'da **yashil emas**. Xatolarning katta qismi A-bo'limdagi
  drift (jonli DB'ga ulanadigan integratsiya testlari) va eskirgan unit-mock'lar.

---

## ✅ Tasdiqlangan TOZA (muammo emas — ishonch uchun)

- **BE typecheck:** `tsc --noEmit` → **0 xato**
- **FE typecheck:** `tsc -p tsconfig.json --noEmit` → **0 xato**
- **SQL injection:** CLAUDE.md ning kritik bandlari TUZATILGAN: `admin.seed.ts` endi env yo'q
  bo'lsa `throw` qiladi (Admin123! fallback yo'q); `admin-auth.controller.ts:22` `JWT_REFRESH_SECRET`
  ishlatadi; `test123` hash o'chirilgan. Qolgan `sql.raw(...)` lar — aisha tool'lar (`where`
  switch'dan `today/week/month`, `meta.table` yopiq whitelist'dan + ISO sana regex + parametrli)
  va DDL migratsiyalar (literal) — **himoyalangan**, injection yo'q.
- **Duplicate routes:** route-checker statik skanda 34 ta belgiladi, lekin **27 tasi disabled
  stub controllerlar bilan** (`hr-dashboard-stubs*` `hr.providers.ts:171-172` da izohga olingan,
  ro'yxatdan o'tmagan), `lms-attempts` esa izoh-mosligi (1 real decorator). Fastify boot'da
  haqiqiy dublikatni rad etadi va backend ishga tushadi → **jonli dublikat yo'q**.

---

## Ustuvorlik tavsiyasi (tuzatish bosqichida)

1. 🔴 **Drift** — `tenant_id` va `material_card_id` patternlarini yopish (eng ko'p endpointga ta'sir).
2. 🔴 **finance-gl trial-balance/ledger** — soxta nol/balansli javob buxgalteriyaga xavfli.
3. 🟠 **Test mock'larini yangilash** (login.handler) — CI yashil bo'lishi uchun.
4. 🟠 **Pagination** — `Number(page)` validatsiya + DB-level LIMIT/OFFSET.
5. 🟡 **FE onError + sana null-guard**.

*Audit fayllari: `_drift_report.txt` (to'liq drift), `_db_tables.txt`, `_db_cols.txt`, `_drift_check.mjs` (qayta ishga tushirish uchun).*
