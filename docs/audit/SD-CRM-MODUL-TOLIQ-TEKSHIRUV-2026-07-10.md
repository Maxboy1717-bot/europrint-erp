# SD / CRM Moduli — To'liq Sog'liq Tekshiruvi

> **Sana:** 2026-07-10 · **Rol:** 🔵 Tahlilchi (Qoida 23 — read-only)
> Hech bir kod, sxema yoki ma'lumot o'zgartirilmadi. Jonli bazaga faqat `SELECT` va `BEGIN…ROLLBACK` sinovlari yuborildi.
> **Metod:** marshrut + 298 BE endpoint + 671 FE chaqiruv inventari dasturiy yig'ildi → 6 mustaqil agent chuqur o'qidi → **har bir P0/P1 da'vo shaxsan qayta tekshirildi** (Q-29). Agentlarning bir nechta da'vosi rad etildi — §7.

---

## 1. Sahifalar bo'yicha jadval (15 sahifa)

Ustunlar: **sahifa | ochiladimi? | API holati | fake-save | green-lie | RBAC | boshqa topilma**

### MIJOZLAR

| Sahifa | Ochiladimi? | API holati | Fake-save | Green-lie | RBAC | Boshqa |
|---|---|---|---|---|---|---|
| **SD Dashboard** `/sd/dashboard` | ✅ `CRMRoutes.tsx:64`, sidebar `:124` | 7/7 endpoint jonli | — (o'qish-only) | yo'q | ⚠️ scope yo'q — har kim butun tashkilot raqamlarini ko'radi | **D9:** `/sd/dashboard/overview` (`SDOverviewDashboard`) hali route'da (`CRMRoutes.tsx:81`), sidebar'da yo'q, **bir xil endpoint** — orphan dublikat |
| **Mijozlar** `/sd/customers` | ✅ `CRMRoutes.tsx:65` | 6/6 jonli | 🔴 **CREATE 5 maydon yo'qotadi**: `customerType`, `industry`, `source`, `creditLimit`, `paymentTermsDays` (`drizzle-sd-customers.repo.ts:192-213`). `creditLimit` doim 0 ko'rinadi. UPDATE toza | yo'q (`return {}` = DELETE javob shakli, real soft-delete bajariladi) | ⚠️ ro'yxat scope'siz; controller'da class-`@Roles` **yo'q** | `status` enum nomuvofiqligi: FE `blacklist`, DTO `blacklisted` |
| **Lidlar** `/crm-workspace` | ✅ `CRMRoutes.tsx:52` | 16/16 jonli | 🔴 **QuickCreateModal'ning 4 yaratishidan 3 tasi doim 400**: deal (`companyId`+`leadId`+`totalAmount`+`expectedClosureDate`+`assignedTo` talab), kontakt (`first_name` kutadi, `name` keladi), kompaniya (`name` kutadi, `title` keladi). Lead ishlaydi, lekin `opportunity`/`currencyId` tushib qoladi | yo'q | ✅ `/crm/leads` va `/crm/deals` **scope'langan** (Batch-1 saqlangan). Kontakt/kompaniya/aktivlik — scope yo'q | Yaratilgan deal `assigned_to` NULL → egasi o'z ro'yxatida ko'rmaydi |

### SOTISH

| Sahifa | Ochiladimi? | API holati | Fake-save | Green-lie | RBAC | Boshqa |
|---|---|---|---|---|---|---|
| **Sotish Paneli** `/sales` | ✅ sidebar → `/sales` → **redirect** → `/erp/sales` (`AppRouter.tsx:155`) | 6/6 jonli | 🔴🔴 **Deyarli butunlay soxta**: repo `body['totalAmount']` o'qiydi, FE bu nomni **umuman yubormaydi** → `net_value`/`total_value` **doim 0**. Yana ~19 maydon tushadi (`sap.repository.ts:50-66`). UPDATE faqat `status`+`notes` yozadi | yo'q (real qator qaytaradi, lekin iqtisodiy jihatdan bo'sh) | scope yo'q | **D4 tasdiqlandi va yomonroq:** bu dublikat **sidebar orqali ochiladi**. Ro'yxat `sap_sales_orders` dan o'qiydi, yozuv `sales_orders` ga tushadi |
| **AI CRM** `/ai/crm` | ✅ `CRMRoutes.tsx:50` | 7/7 jonli | — | ⚠️ AI natijalari hech qayerda saqlanmaydi (faqat FE state). `CrmAiService` ichki mantiqi **tekshirilmagan** | AI POST'lar rol-gated | "lead scoring" tabi endpoint'ga `dealId` uzatadi (`AiCrmPage.tsx:54`) — semantik nomuvofiqlik |
| **Taklifnomalar** `/sd/sales-quotes` | ✅ `CRMRoutes.tsx:68` | 8/8 jonli | 🔴 **CREATE doim 400** — Zod `items[].product_id` majburiy (`sd-quotations.dto.ts:15`), FE `calcForm` da bunday maydon **yo'q**. Ustiga `vatRate`, jami summa (→0) va item o'lchamlari tushadi. UPDATE `payment_terms` ni tashlaydi (`sd-quotations.service.ts:199`) | yo'q — `send`/`approve`/`convert` real ish qiladi | scope yo'q; `@Roles` bor | `approve` yangi `sales_orders` + `sd_contracts` yaratadi, lekin `total_price` hech qachon yozilmagani uchun order summasi 0 |
| **Buyurtmalar** `/sd/sales-orders` | ✅ `CRMRoutes.tsx:69` | 9/9 jonli | ✅ CREATE toza (DTO↔repo mos). `currency` tushadi; `designFlag`/`sampleFlag` majburan `false` | 🔴 **`tech-checkpoint` green-lie** (quyida P0-2) | scope yo'q; `sd-orders.controller.ts` da class-`@Roles` yo'q | FE `customerId` yubormaydi → `customer_id` NULL |
| **Papka Buyurtmalari** `/papka-orders` | ✅ `ProductionRoutes.tsx:101` | 3/3 jonli | ✅ oddiy forma toza; `deadline`/`order_id` tushadi | yo'q | ⚠️ `GeneralLegacyAController` da **na `@Roles`, na `@UseGuards`** → har qanday autentifikatsiyalangan foydalanuvchi yarata/o'chira oladi | — |
| **Shartnomalar** `/sd/contracts` | ✅ `CRMRoutes.tsx:78` | 4/4 jonli | 🔴 **CREATE 3 maydon yo'qotadi**: `start_date`, `total_amount`, `payment_terms` (`sd-quotations.repository.ts:99-106`). Ro'yxat esa aynan shu maydonlarni ko'rsatmoqchi bo'ladi | `sign` real (`UPDATE … status='signed'`) | scope yo'q; `@Roles` bor | Yaratish `SdQuotationsController` da, ro'yxat `SdContractsController` da |
| **Buyurtma Yaratish** `/order-create` | ✅ `ProductionRoutes.tsx:102` | 7/7 jonli | 🔴 **Sehrgar 9 maydonni yo'qotadi**: `vidZakaza`, `zakazFormy`, `krasok` (bo'yoq soni), `formatC`, `tayyorBolishVaqti`, `schetNo`, `menedzherZakaza`, `texnolog`, `primZakaza` | yo'q | `@Roles` yo'q (yuqoridagi kabi) | `papka_orders` ga yozadi — `sales_orders` ga **emas** |

### QO'SHIMCHA · TO'LOV · SOZLAMALAR

| Sahifa | Ochiladimi? | API holati | Fake-save | Green-lie | RBAC | Boshqa |
|---|---|---|---|---|---|---|
| **Ombor Ijara** `/sd/warehouse-rental` | ✅ `CRMRoutes.tsx:84` → `SDExtended` "rental" tabi | 1/1 jonli (`/api/sd/active-rentals`) | — (butunlay o'qish-only) | yo'q | scope yo'q | Oylik summa klientda: `areaM2 × dailyRate × 30` |
| **Yo'qotilgan/Reklamatsiya** `/sd/lost-orders` | ✅ `CRMRoutes.tsx:88` | 5/5 jonli | ✅ **toza** — DTO camelCase, FE camelCase, mos keladi | yo'q | scope yo'q; `@Roles` bor | Modul bo'yicha eng toza sahifa |
| **To'lovlar** `/sd/sales-payments` | ✅ `CRMRoutes.tsx:71` | 6/7 jonli | 🔴🔴 **P0 — pul ma'lumoti yo'qoladi** (quyida P0-3) | yo'q (mark-paid real, GL `entries` ga yozadi) | scope yo'q — har qanday SD roli **barcha mijozlarning** to'lovlarini ko'radi | `GET /api/sd/payments/export` — **BE'da yo'q** → CSV tugmasi 404. "Avans" tugmasi `sales_manager` uchun 403 (endpoint FINANCE/DIRECTOR talab qiladi) |
| **70% Avans Nazorat** `/sd/advance-control` | ✅ `CRMRoutes.tsx:85` → `SDExtended` "advance" tabi | `/api/papka-orders` o'qiydi | — | 🟠 **"Kritik muddati o'tgan" = literal `0`**, **"Bajarilgan avanslar" = literal `0`** (`SDExtendedSections2.tsx:147,158`) | scope yo'q | ⚠️ Sahifa `sales_orders.advance_*` ni **umuman o'qimaydi**. Hech qanday 70% hisoblanmaydi, hech qanday amal yo'q |
| **KPI** `/sd/kpi` | ✅ `CRMRoutes.tsx:77` | 4/4 jonli | 🟠 KPI maqsadini yangilashda `orderCountTarget` va `newCustomerTarget` tushadi | yo'q | scope yo'q | — |
| **Sozlamalar** `/sd/settings` | ✅ `CRMRoutes.tsx:79` | 2/2 jonli | ✅ toza — real UPSERT | yo'q | — | QQS 12%, markup, ombor kunlari — **master-data, hardcode emas** ✅ |
| **Voronka Sozlamalari** `/crm/funnel-settings` | ✅ `CRMRoutes.tsx:58` | 6/6 jonli | ✅ toza | yo'q | — | — |

---

## 2. ⭐ P0 — Ma'lumot yo'qolishi / pul noto'g'ri / darvoza buzuq

Hammasi shaxsan `file:line` yoki jonli DB so'rovi bilan tasdiqlangan.

### P0-1 — Oltin zanjir uzilgan: avans darvozasi hech qachon ochilmaydi

`sales_orders` da avans uchun **ikki juft raqobatchi ustun** bor:

| Yozuv yo'li yozadi | Darvoza o'qiydi |
|---|---|
| `advance_required` (integer), `advance_paid`, **`total_amount`** | `advance_percent` (numeric), `advance_paid_amount`, **`total_value`** |

`queries-sd.ts:85` (asosiy SD yaratish, `sd_sales_orders` VIEW orqali) birinchi juftga yozadi.
`tech-three-checkpoint.listener.ts:118` (Trigger 6) ikkinchisini o'qiydi.

**Jonli DB isboti** — 13 ta `sales_orders` qatori:

| total | total_value to'ldirilgan | advance_percent | advance_required | advance_paid_amount |
|---|---|---|---|---|
| 13 | **0** | **0** | **0** | 1 |

`totalValue = Number(null ?? 0) = 0` → `advancePaidPct = 0` → `advanceOk = 0 + 0.001 >= 70` → **`false`**. `markReadyForPlanning()` hech qachon chaqirilmaydi; buyurtma `pending_technology` da qotib qoladi.

Ibratli: shu faylning `:113` izohi 2026-07-04 da aynan shu `SELECT` ni bir marta tuzatgan (`advance_required_percent` → `advance_percent`), lekin `total_value` ga **hech kim yozmasligini** payqamagan. Ustiga, `total_value` ga yozadigan yagona ikki yo'l (`sap.repository.ts:63`, `drizzle-quotation.repo.ts:101`) uni **0** qilib yozadi (P0-4).

### P0-2 — `tech-checkpoint` green-lie: uch tekshiruv nuqtasi hech qachon saqlanmaydi

`PATCH /sd/orders/:id/tech-checkpoint` 200 qaytaradi. Agregat `tech_bom_approved`/`tech_routing_approved`/`tech_card_approved` ni o'rnatadi, lekin yagona UPDATE helperi (`queries-sd.ts:162-164`) faqat shuni yozadi:

```
.set({ status, advance_status, updated_at })
```

Butun backend bo'ylab `tech_bom_approved` ga **yozuvchi 0 ta** (ustunlar jonli DB'da mavjud). Trigger 6 esa `row['tech_bom_approved'] === true` ni talab qiladi (`listener:69`). Ya'ni zanjir ikki tomondan bir vaqtda uzilgan.

### P0-3 — To'lov yaratish: buyurtma va mijoz bog'lanishi yo'qoladi

FE `{ orderId, customerId, amount, type, dueDate, notes }` (camelCase) yuboradi (`SDSalesPayments.tsx:91,277`).
DTO `SdCreatePaymentSchema` (`sd.dto.ts:80-92`) **`.passthrough()`** va barcha maydon `optional` → validatsiya o'tadi, 400 bermaydi.
Repo esa snake_case o'qiydi (`sd-payments.repository.ts:163`):

```
VALUES (${body['customer_id'] ?? null}, ${orderId}, ..., ${body['due_date'] ?? now()}, ..., ${body['created_by'] ?? null})
```

`orderId` ham `body['order_id']` dan olinadi (`:83`). Natija: **200 OK**, lekin `order_id` NULL, `customer_id` NULL, `due_date` = hozir, `created_by` NULL.

Debitor qarzdorlik hisoboti aynan `customer_id` bo'yicha guruhlaydi → qo'lda kiritilgan to'lov hech qaysi mijozga tegishli bo'lmaydi.

### P0-4 — SAP buyurtma yaratish: summa doim 0

`sap.repository.ts:54` → `parseFloat(String(body['totalAmount'] ?? '0'))`.
FE (`SalesOrders.tsx`) `totalAmount` nomini **hech qachon yubormaydi** (grep: 0 marta) — u `netValue`/`taxAmount`/`totalValue` yuboradi.

Natija: `net_value = total_value = 0`, va yana ~19 maydon (`documentType`, `paymentTerms`, `quotationId`, `crmDealId`, sanalar…) tushib qoladi. Faqat `customer_id` saqlanadi. Bu sahifa **sidebar'dan "Sotish Paneli" orqali ochiladi**.

### P0-5 — Lid → buyurtma konvertatsiyasi summani 0 qiladi

`sd-leads.service.ts:59` → `(lead as Record<string, unknown>).expected_amount`
`getLeadForConvert` esa `SELECT * FROM crm_leads` qiladi (`sd-leads.repository.ts:135`), va **jonli `crm_leads` da `expected_amount` ustuni yo'q** — faqat `opportunity_amount` bor (DB so'rovi bilan tasdiqlangan).

`undefined` → repo'da `expected_amount ?? 0` → yangi `sales_orders.total_amount = 0`.

### P0-6 — `advance-bypass` majburiy sababni tashlaydi

`POST /sd/orders/:id/advance-bypass` `advance_status='bypassed'` qiladi, lekin `advance_bypass_reason` va `advance_bypass_by` **yozilmaydi** (yagona UPDATE helperi ularni bilmaydi). Ustunlar jonli DB'da mavjud; butun kodda `advance_bypass_reason` ga yozuvchi 0 ta.

Pul-nazorat chetlab o'tilishi **kim tomonidan va nima sababdan** qilingani hech qayerda qolmaydi.

---

## 3. P1 — Jimgina maydon tushishi / amal ish qilmaydi

| # | Topilma | Isbot |
|---|---|---|
| 1 | Taklifnoma **CREATE doim 400** — `items[].product_id` majburiy, FE yubormaydi | `sd-quotations.dto.ts:15` ↔ `SDSalesQuotesTypes.ts:49-61` |
| 2 | QuickCreateModal: deal/kontakt/kompaniya **yaratish doim 400** | `create-deal.dto.ts:9-16`; `crm-contacts.controller.ts:76`; `crm-companies.controller.ts:128` |
| 3 | Mijoz CREATE 5 maydon tashlaydi (`creditLimit` doim 0 ko'rinadi) | `drizzle-sd-customers.repo.ts:192-213` |
| 4 | Shartnoma CREATE `start_date`/`total_amount`/`payment_terms` tashlaydi | `sd-quotations.repository.ts:99-106` |
| 5 | Kompaniya CREATE/UPDATE `phone`+`email` tashlaydi (ustun yo'q) | `crm-companies.repository.ts:90-113` |
| 6 | Kompaniya-kontakt yaratish `name` ni e'tiborsiz qoldiradi → hamma `'Unknown'` | `crm-companies.repository.ts:176` |
| 7 | Aktivlik CREATE/UPDATE `title`/`description`/`scheduled_at`/`duration` tashlaydi | `crm-activities.repository.ts:111-138` |
| 8 | CRM lead PATCH `firstName`/`lastName` tashlaydi → nomni tahrirlash ishlamaydi | `crm-leads-ops.repository.ts:27-30` |
| 9 | Deal PATCH `description`/`expectedClosureDate` tashlaydi | `drizzle-crm-deals.repo.ts:98-133` |
| 10 | Yaratilgan deal `assigned_to` NULL → **egasi o'z ro'yxatida ko'rmaydi** | `drizzle-deal.repo.ts:35` ↔ filtr `drizzle-crm-deals.repo.ts:30` |
| 11 | `PATCH /api/crm/deals/close` — BE'da yo'q. So'rov `@Patch(':id')` ga `id='close'` bilan tushadi, hech narsa qilmaydi, FE muvaffaqiyat toast'i ko'rsatadi | `CrmFunnelAnalytics.tsx:215` ↔ `crm-deals.controller.ts:203` |
| 12 | Lead scoring-v2 / ai-analysis ballni **hech qachon saqlamaydi** (no-op yozuvchi) | `crm-ai.repository.ts:41-42,63-64` |
| 13 | Compat `crm/ai/create-task`, `crm/auto-tasks`, `crm/ai/churn` — soxta muvaffaqiyat / hardcoded natija | `crm-extended.service.ts:155-169` |
| 14 | KPI maqsadi: `orderCountTarget`+`newCustomerTarget` tushadi | `sd-quotations.service.ts:217-223` |
| 15 | To'lov dedup gardi **noto'g'ri jadvalni** so'raydi (`payments`, INSERT esa `sd_payments`) → dublikat to'lov mumkin | `sd-payments.repository.ts:114,127` ↔ `:163` |
| 16 | Sehrgar (`/order-create`) 9 maydon tashlaydi (texnolog, menejer, bo'yoq soni…) | `legacy-warehouse.helpers.ts:64-78` |

---

## 4. P2 — Kosmetik / o'lik

- `GET /api/sd/payments/export` — BE'da yo'q → CSV tugmasi 404 (`SDSalesPayments.tsx:207`)
- `GET /api/orders-registry/:id` — BE'da faqat ro'yxat va POST bor → 404
- `lib/api/ai.ts:80` `churn/analyze` ni POST bilan chaqiradi, BE `@Get` — o'lik helper (haqiqiy panel GET ishlatadi, ishlaydi)
- `SDOverviewDashboard` — orphan dublikat (D9)
- `SDEuroprint` (`/sd/crm`) — butun SD klasterining orphan takrori (D3), faqat `CRMRoutes.tsx:63` import qiladi
- `AiCrmPage` "lead scoring" tabi endpoint'ga `dealId` uzatadi
- `sales_manager` "Avans" tugmasini ko'radi, lekin bosganda 403

---

## 5. Uch "Lidlar" jadvali — haqiqiy holat

Bu bo'lim boshlang'ich taxminni **o'zgartiradi**.

| Obyekt | Turi | Qator | Holat |
|---|---|---|---|
| `crm_leads` | BASE TABLE | 16 | ⭐ **Haqiqiy markaz** |
| `marketing_leads` | BASE TABLE | 14 | Alohida silo |
| `deals` | BASE TABLE | 5 | Quyi oqim |
| `crm_deals` | **VIEW** → `deals` | 5 | — |
| `leads` | BASE TABLE | **0** | O'lik yetim |
| `sd_leads` | **UMUMAN YO'Q** | — | Drizzle sxemasi bor, jadval yo'q |

**Xulosa:** uchta silo emas. `/sd/leads` API'si aslida **`crm_leads` ni o'qiydi** (`sd-leads.repository.ts:23,55,74`). Veb-sayt intake ham (`website-lead.repository.ts:91,162`) `crm_leads` ga yozadi (`source='website'`, jonli bazada 4 qator) — ya'ni sotuvchilar `/crm-workspace` da ularni **ko'radi**. Listener izohlari hali "Maqsad: `sd_leads`" deydi — eskirgan.

`marketing_leads` → `crm_leads` faqat **nusxa** ko'chiriladi (`marketing-analytics-stubs.controller.ts:297`), `crm_lead_id` yumshoq ustun orqali, **FK yo'q**, dedup yo'q.
`crm_leads` → `deals` bog'lanishi faqat `deals.metadata->>'lead_id'` jsonb orqali; haqiqiy `deals.lead_id` ustuni **5/5 NULL**.

Butun zanjirdagi yagona haqiqiy FK: `sales_orders.crm_lead_id → crm_leads`.

⚠️ **Xavf:** telefon/email bo'yicha unique indeks yo'q. Bir odam `marketing_leads` + konvertatsiya qilingan `crm_leads` + sayt intake `crm_leads` = 3 qator bo'lishi mumkin, o'zaro bog'liqsiz.

---

## 6. Pul to'g'riligi

| Savol | Javob |
|---|---|
| 70% qayerdan keladi? | **Uch joydan.** `business.constants.ts:43` `DEFAULT_ADVANCE_PERCENT = 70`; `tech-three-checkpoint.listener.ts:39` o'zining `ADVANCE_PERCENT_DEFAULT = 70`; `settings.advance_percent` DB-kaliti (**jonli bazada bu qator yo'q**). Ayrim `advance_percent` (`check-advance.handler.ts:35`) — bu **xodim oylik avansi**, SD buyurtma avansi emas; nom chalkash |
| Summalar jonli hisoblanadimi? | Haqiqiy dvigatelda — **ha** (`sales-order.aggregate.ts:197`, ortiqcha-to'lov gardi, idempotentlik, optimistik lock). Lekin **"70% Avans Nazorat" sahifasining o'zi hech narsa hisoblamaydi** — ikki KPI kartasi literal `0` |
| Sehrli raqamlar? | Pul-yozuv yo'lida yo'q. Faqat ko'rsatish uchun: ijara `× 30` kun, `/1_000_000` format, `DEFAULT_MANAGER_QUOTA = 50_000_000` |
| Float/yaxlitlash xavfi? | ✅ Yo'q — barcha pul ustuni Postgres `numeric`. Bitta g'alizlik: `advance_required` = `integer`, `advance_percent` = `numeric` |

---

## 7. Rad etilgan da'volar

Tekshirmasdan qabul qilinsa, noto'g'ri ish paketlari tug'ilardi.

| Da'vo | Haqiqat |
|---|---|
| «`SdDashboardController`/`CrmFollowupCompat` da `@Roles` bor, lekin `RolesGuard` yo'q → rollar amal qilmaydi» | **Rad etildi.** `RolesGuard` **global** (`app.module.ts:197`, `APP_GUARD`). Class-darajasida `@UseGuards` shart emas. Haqiqiy muammo teskarisi — quyidagi qatorga qarang |
| «`return { ok: true }` = green-lie» (32 ta topilma) | **Rad etildi.** Bular Result pattern'ning `Ok()` konstruktori (`drizzle-sales-order.repo.ts:50` va h.k.), soxta javob emas |
| «`return {}` = green-lie» | **Rad etildi.** 8 tasi ham DELETE handler'lari; real soft-delete bajariladi, faqat javob tanasi bo'sh |
| «`sd_leads` — uchinchi lid jadvali» | **Rad etildi.** Jonli bazada bunday jadval **yo'q**; `/sd/leads` API `crm_leads` ni o'qiydi |
| «`/erp/sales` orphan» (mening oldingi hisobotim) | **O'zim rad etdim.** Sidebar "Sotish Paneli" → `/sales` → redirect → `/erp/sales`. Dublikat **foydalanuvchiga ochiq** |
| «`POST /api/wms/inventory-counts` `count_number` NOT NULL sababli yiqiladi» (oldingi audit) | Aniqlashtirildi: asosiy sabab `count_date varchar(10)` ga `NOW()` yozilishi |
| «`crm/ai/extended/churn/analyze` verb drift → sahifa buzuq» | Qisman: **o'lik helper** buzuq (`ai.ts:80` POST), haqiqiy panel GET ishlatadi va ishlaydi |

**Haqiqiy RBAC muammosi** (agent noto'g'ri ifodalagan, lekin muammo bor): `RolesGuard` `@Roles` metadatasi **umuman yo'q** bo'lsa `true` qaytaradi (`roles.guard.ts:65-67`). SD/CRM da class-`@Roles` yo'q 12 controller bor: `/sd/customers`, `/sd/leads`, `/sd/orders`, `/sd/invoices`, `/crm/contacts`, `/crm/companies`, `/crm/deals`, `/crm/activities`, `/crm/settings`, `/crm/custom-fields`, `/crm/analytics`, `/papka-orders`. Ularning `@Roles` siz metodlari **har qanday autentifikatsiyalangan foydalanuvchiga** ochiq — jumladan operator, haydovchi, omborchi.

---

## 8. RBAC / satr-scoping holati

**Batch-1 saqlangan va to'g'ri ishlaydi** — lekin faqat **ikkita** entity uchun.

Mexanizm: `modules/crm/common/crm-row-scope.ts` — `crmSeesAllRows()` (`super_admin`/`admin`/`director` hammasini ko'radi), `crmOwnerScope()` fail-closed `-1` qaytaradi.

| Entity | Ro'yxat scope | Detal scope |
|---|---|---|
| lead (`/crm/leads`) | ✅ | ✅ |
| deal (`/crm/deals`) | ✅ | ✅ |
| lead (`/sd/leads`) | ❌ | ❌ |
| mijoz, kontakt, kompaniya, aktivlik | ❌ | ❌ |
| taklifnoma, buyurtma, shartnoma, to'lov | ❌ | ❌ |
| SAP shim | ❌ | ❌ |

⚠️ **Batch-1 himoyasi chetlab o'tiladi:** `/sd/leads` va `/sd/leads/:id` **aynan shu `crm_leads` jadvalini** owner-filtrsiz va `@Roles` siz o'qiydi. Ya'ni `/crm/leads` dagi scope'ni `/sd/leads/:id` orqali butunlay aylanib o'tish mumkin.

⚠️ **Yozuv yo'llari scope'lanmagan:** deal `won`/`lost`/`stage`/`delete` CommandBus handler'lari egalikni tekshirmaydi — `sales_manager` boshqa menejerning bitimini yuta/yo'qota/o'chira oladi (o'qiy olmasa ham).

⚠️ **Pul:** `POST /sd/payments` va `PUT /sd/payments/:id` (summa!) oddiy `sales_manager` uchun ochiq. Buyurtma avansi (`advance-payment`, `advance-bypass`) esa to'g'ri cheklangan (FINANCE/DIRECTOR).

---

## 9. Oldingi topilmalarning hozirgi holati

| Topilma | Holat |
|---|---|
| **D3** — `SDEuroprint` (`/sd/crm`) butun modul dublikati | ✅ **Hali kuchda.** Route `CRMRoutes.tsx:63`, sidebar'da yo'q, faqat `CRMRoutes.tsx` import qiladi |
| **D4** — `/sd/sales-orders` vs `/erp/sales` | ✅ **Tasdiqlandi va yomonroq.** Ikkalasi `sales_orders` ga yozadi, turli ustun to'plami bilan. `/erp/sales` **sidebar orqali ochiladi** ("Sotish Paneli"), va uning create'i summani 0 qiladi (P0-4). Ro'yxat `sap_sales_orders` dan o'qiladi → yozganingiz ko'rinmasligi mumkin |
| **D9** — `SDDashboard` vs `SDOverviewDashboard` | ✅ **Tasdiqlandi.** Bir xil endpoint, ikkinchisi orphan |
| **Ikki "Lidlar"** yozuvi | ✅ Tasdiqlandi (`constants.ts:126` → `crm-workspace`, `:156` → `marketing/leads`), lekin ostidagi model boshqacha — §5 |
| **Batch-1 CRM egalik scoping** | ✅ **Buzilmagan**, lekin faqat `/crm/leads` + `/crm/deals` **o'qish** yo'llarida; `/sd/leads` orqali chetlab o'tiladi |

---

## 10. Ishonch darajasi

**Yuqori** (shaxsan `file:line` yoki DB so'rovi bilan): P0-1…P0-6 hammasi, D3/D4/D9, uch lid jadvali (DB), 70% uchta manba, `RolesGuard` global ekani, QuickCreateModal 3 buzuq create, taklifnoma 400, to'lov maydon-tushishi, `/sd/leads` bypass.

**O'rta** (agent hisobotidan, tanlab tekshirdim): P1 ro'yxatining ko'pchiligi, green-lie jadvali.

**Tekshirilmagan:**
- `CrmAiService` ichki mantiqi — AI natijasi haqiqiy LLM chaqiruvimi yoki evristikami
- `crm-bitrix/*` ro'yxatlarining scope holati
- Runtime 403/404 javoblari (statik tahlil; server haydab ko'rilmadi)
- `deals.opportunity`/`amount` NOT NULL cheklovlari — izohlardan olingan, DDL bilan tasdiqlanmagan
- MM/Logistics qo'shni sahifalari (bu tekshiruv qamrovidan tashqarida)

---

## 11. Egasi qarori kerak bo'lgan nuqtalar

Tuzatish ishi boshlanishidan **oldin** javob kerak. Qoida 23: tavsiya ≠ ruxsat.

### A. Ma'lumot modeli (eng muhim)

1. **`sales_orders` avans ustunlari:** `advance_required`(int) + `advance_paid` vs `advance_percent`(numeric) + `advance_paid_amount` — **qaysi juft kanonik?** Ikkinchisi o'chirilsinmi yoki migratsiya bilan birlashtirilsinmi? (Q-35: yangi migratsiya = egasi ruxsati)
2. **`total_amount` vs `total_value`** — buyurtma summasi uchun kanonik ustun qaysi? Hozir 5 ta INSERT yo'li ikki xil ustunga yozadi.
3. **70% manbai:** kod konstantasi (`business.constants.ts:43`) qolsinmi, yoki `settings.advance_percent` DB-kaliti kanonik bo'lsinmi? Agar DB — jonli bazada bu qator yo'q, seed kerak.
4. **`advance_percent` nomi ikki domenda:** SD buyurtma avansi va xodim oylik avansi. Qayta nomlansinmi?

### B. Dublikat sahifalar

5. **`/erp/sales` (Sotish Paneli)** — o'chirilsinmi? U SAP-shim, summani 0 yozadi, va sidebar'dan ochiladi. Agar o'chirilsa, "Sotish Paneli" yozuvi `/sd/sales-orders` ga yo'naltirilsinmi?
6. **`sap_sales_orders`** jadvali — nima uchun kerak? Ro'yxat undan o'qiladi, yozuv `sales_orders` ga tushadi.
7. **`SDEuroprint` (`/sd/crm`)** — o'chirilsinmi? (D3, butun modul takrori)
8. **`SDOverviewDashboard`** — o'chirilsinmi? (D9)

### C. RBAC siyosati

9. **Satr-scoping qamrovi:** Batch-1 faqat lead+deal uchun. Uni **qaysi entitylarga** kengaytiramiz — taklifnoma, buyurtma, shartnoma, to'lov, mijoz? Yoki SD ataylab "hamma hammani ko'radi" modelidami?
10. **`/sd/leads` bypass:** o'chirilsinmi (chunki `crm_leads` ni takrorlaydi), yoki scope qo'shilsinmi?
11. **`@Roles` siz 12 controller** — har biriga rol ro'yxati kerakmi? (Ayniqsa `/papka-orders`, `/sd/orders`, `/sd/customers`)
12. **`sales_manager` to'lov summasini o'zgartira olsinmi** (`PUT /sd/payments/:id`)? Hozir ha.

### D. Yo'qolgan maydonlar

13. Har bir fake-save uchun: **maydon kerakmi** (→ ustun qo'shish, migratsiya = egasi ruxsati) yoki **formadan olib tashlansinmi**? Ro'yxat: mijoz(5), shartnoma(3), sehrgar(9), aktivlik(4), kompaniya(2), KPI(2), deal(2), lead(2).
14. **`70% Avans Nazorat` sahifasi** — u haqiqatan `sales_orders.advance_*` ni ko'rsatishi kerakmi? Hozir `papka_orders` ro'yxatini va ikki `0` kartani ko'rsatadi.

### E. Lid modeli

15. **`marketing_leads`** alohida qolsinmi yoki `crm_leads` ga birlashtirilsinmi? Hozir nusxa ko'chiriladi, FK yo'q, dedup yo'q.
16. **Telefon/email bo'yicha unique indeks** kerakmi (dublikat lidlarni oldini olish uchun)?
17. **`deals.lead_id`** (5/5 NULL) — to'ldirilsinmi (haqiqiy FK) yoki o'chirilsinmi? Hozir bog'lanish `metadata->>'lead_id'` jsonb orqali.
18. **O'lik `leads` jadvali** (0 qator) va `sd_leads` Drizzle sxemasi — o'chirilsinmi?

---

*Hisobot 2026-07-10 da 🔵 Tahlilchi rolida tuzildi. Kod, sxema, ma'lumot o'zgartirilmadi. Barcha P0 topilmalar `file:line` yoki jonli DB so'rovi bilan qo'llab-quvvatlangan; 7 ta agent da'vosi tekshiruvda rad etildi (§7); tekshirilmagan joylar §10 da belgilangan.*

---

## Ilova — Inventarlar

### A1. SD/CRM backend endpointlari (298) — controller bo'yicha


#### `SdCustomersController` — 28 route  
`modules/sd/presentation/sd-customers.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/customers/abc/preview` | 118 |
| POST | `/sd/customers/abc/recompute` | 126 |
| GET | `/sd/customers` | 134 |
| GET | `/sd/customers/export` | 148 |
| GET | `/sd/customers/:id` | 165 |
| GET | `/sd/customers/:id/360` | 202 |
| GET | `/sd/customers/:id/credit-check` | 212 |
| POST | `/sd/customers` | 220 |
| PUT | `/sd/customers/:id` | 234 |
| DELETE | `/sd/customers/:id` | 253 |
| GET | `/sd/customers/:id/contacts` | 264 |
| POST | `/sd/customers/:id/contacts` | 273 |
| PUT | `/sd/customers/:id/contacts/:cid` | 289 |
| DELETE | `/sd/customers/:id/contacts/:cid` | 310 |
| GET | `/sd/customers/:id/interactions` | 321 |
| POST | `/sd/customers/:id/interactions` | 330 |
| GET | `/sd/customers/:id/documents` | 340 |
| POST | `/sd/customers/:id/documents` | 349 |
| DELETE | `/sd/customers/:id/documents/:did` | 360 |
| GET | `/sd/customers/:id/competitors` | 371 |
| POST | `/sd/customers/:id/competitors` | 380 |
| DELETE | `/sd/customers/:id/competitors/:coid` | 392 |
| GET | `/sd/customers/:id/nps` | 404 |
| POST | `/sd/customers/:id/nps` | 413 |
| PATCH | `/sd/customers/:id/internal` | 425 |
| GET | `/sd/customers/:id/complaints` | 435 |
| POST | `/sd/customers/:id/complaints` | 444 |
| POST | `/sd/customers/:id/complaints/:cid/resolve` | 464 |

#### `SdQuotationsController` — 23 route  
`modules/sd/presentation/sd-quotations.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/quotations` | 70 |
| POST | `/sd/quotations` | 86 |
| POST | `/sd/contracts` | 94 |
| GET | `/sd/price-formulas` | 99 |
| POST | `/sd/calculate-price` | 107 |
| GET | `/sd/kpi/team` | 127 |
| GET | `/sd/kpi-targets` | 142 |
| GET | `/sd/reports/funnel` | 149 |
| POST | `/sd/quotations/:id/convert-to-order` | 156 |
| POST | `/sd/quotations/:id/convert` | 163 |
| POST | `/sd/quotations/:id/send` | 172 |
| PUT | `/sd/quotations/:id/send` | 179 |
| PATCH | `/sd/quotations/:id/approve` | 186 |
| PUT | `/sd/quotations/:id/approve` | 193 |
| PATCH | `/sd/quotations/:id` | 200 |
| DELETE | `/sd/quotations/:id` | 207 |
| PATCH | `/sd/kpi-targets/:id` | 216 |
| PATCH | `/sd/orders/:id/cancel` | 223 |
| POST | `/sd/orders/:id/cancel` | 230 |
| PATCH | `/sd/payments/:id/mark-paid` | 237 |
| PUT | `/sd/payments/:id/mark-paid` | 244 |
| PUT | `/sd/contracts/:id/sign` | 251 |
| PUT | `/sd/price-formulas` | 257 |

#### `CrmCompaniesController` — 17 route  
`modules/crm/presentation/crm-companies.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/companies` | 54 |
| GET | `/crm/companies/:id` | 62 |
| GET | `/crm/companies/:companyId/contacts/:contactId` | 74 |
| GET | `/crm/companies/:id/contacts` | 86 |
| GET | `/crm/companies/:id/deals` | 94 |
| GET | `/crm/companies/:id/credit` | 102 |
| POST | `/crm/companies/check-duplicates` | 114 |
| POST | `/crm/companies` | 123 |
| PATCH | `/crm/companies/:id` | 136 |
| DELETE | `/crm/companies/:id` | 152 |
| PATCH | `/crm/companies/:id/credit-limit` | 164 |
| GET | `/crm/lead-stages` | 178 |
| GET | `/crm/lead-stages/:id` | 186 |
| POST | `/crm/lead-stages` | 198 |
| PATCH | `/crm/lead-stages/:id` | 211 |
| POST | `/crm/companies/:id/contacts` | 227 |
| DELETE | `/crm/companies/:id/contacts/:contactId` | 239 |

#### `CrmAiExtendedController` — 16 route  
`modules/crm/presentation/crm-ai-extended.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/ai/autofill/:entityType/:id` | 88 |
| GET | `/crm/ai/churn-rescue/:entityType/:id` | 95 |
| GET | `/crm/ai/extended/auto-tasks/suggest` | 102 |
| POST | `/crm/ai/extended/auto-tasks/suggest` | 110 |
| POST | `/crm/ai/extended/auto-tasks/create` | 119 |
| GET | `/crm/ai/leads` | 131 |
| GET | `/crm/ai/nba` | 138 |
| GET | `/crm/ai/extended/churn/analyze` | 145 |
| POST | `/crm/ai/nba/create-task` | 153 |
| POST | `/crm/ai/nba/:entityType/:entityId` | 168 |
| POST | `/crm/ai/churn-rescue/:entityType/:id` | 192 |
| GET | `/crm/ai/quick-score/:entityType/:id` | 200 |
| POST | `/crm/ai/autofill/:entityId` | 207 |
| POST | `/crm/ai/extended/voice/analyze-call` | 223 |
| POST | `/crm/ai/extended/chat/respond` | 231 |
| POST | `/crm/ai/leads/:entityId/scoring-v2` | 241 |

#### `CrmBitrixCompatController` — 14 route  
`modules/crm/presentation/crm-bitrix-compat.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm-bitrix/proposals` | 51 |
| GET | `/crm-bitrix/invoices` | 58 |
| GET | `/crm-bitrix/robots` | 65 |
| GET | `/crm-bitrix/robots/:id` | 72 |
| POST | `/crm-bitrix/robots` | 77 |
| PUT | `/crm-bitrix/robots/:id` | 84 |
| PATCH | `/crm-bitrix/robots/:id/toggle` | 91 |
| DELETE | `/crm-bitrix/robots/:id` | 97 |
| PATCH | `/crm-bitrix/robots/:id` | 103 |
| POST | `/crm-bitrix/robots/:id/toggle` | 110 |
| PATCH | `/crm-bitrix/proposals/:id/stage` | 116 |
| PATCH | `/crm-bitrix/invoices/:id/stage` | 123 |
| DELETE | `/crm-bitrix/proposals/:id` | 131 |
| DELETE | `/crm-bitrix/invoices/:id` | 137 |

#### `SdLeadsController` — 12 route  
`modules/sd/presentation/sd-leads.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/leads` | 46 |
| GET | `/sd/leads/stats` | 57 |
| GET | `/sd/leads/export` | 64 |
| POST | `/sd/leads/import` | 74 |
| GET | `/sd/leads/:id` | 94 |
| POST | `/sd/leads` | 106 |
| PATCH | `/sd/leads/:id` | 117 |
| PUT | `/sd/leads/:id/status` | 132 |
| DELETE | `/sd/leads/:id` | 147 |
| POST | `/sd/leads/:id/convert` | 158 |
| POST | `/sd/leads/:id/activities` | 169 |
| GET | `/sd/leads/:id/activities` | 179 |

#### `SdOrdersController` — 12 route  
`modules/sd/presentation/sd-orders.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/orders/export` | 54 |
| GET | `/sd/orders` | 82 |
| GET | `/sd/orders/pending-advance` | 98 |
| GET | `/sd/orders/:id` | 113 |
| GET | `/sd/orders/:id/items` | 124 |
| POST | `/sd/orders` | 136 |
| POST | `/sd/orders/atp-check` | 163 |
| PATCH | `/sd/orders/:id/status` | 177 |
| POST | `/sd/orders/:id/advance-bypass` | 194 |
| PATCH | `/sd/orders/:id/tech-checkpoint` | 209 |
| POST | `/sd/orders/:id/advance-payment` | 224 |
| PUT | `/sd/orders/:id/status` | 237 |

#### `CrmExtendedCompatController` — 11 route  
`modules/compatibility/crm-extended.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/invoices` | 28 |
| GET | `/crm/ai/dashboard-analysis` | 33 |
| GET | `/crm/supervisor/dashboard` | 38 |
| GET | `/crm/ai/supervisor-dashboard` | 43 |
| GET | `/crm/ai/nba/:entityType/:entityId` | 48 |
| GET | `/crm/ai/extended/insights` | 55 |
| POST | `/crm/ai/create-task` | 62 |
| POST | `/crm/chat` | 68 |
| POST | `/crm/auto-tasks` | 74 |
| POST | `/crm/ai/churn` | 80 |
| POST | `/crm/ai/voice` | 86 |

#### `CrmAutoLeadController` — 10 route  
`modules/crm/presentation/crm-auto-lead.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/quick-score/:entityType/:id` | 47 |
| GET | `/crm/supervisor-dashboard` | 58 |
| POST | `/crm/churn-rescue/:entityType/:id` | 68 |
| GET | `/crm/auto-lead/sources` | 76 |
| POST | `/crm/auto-lead/call` | 94 |
| POST | `/crm/auto-lead/form` | 107 |
| POST | `/crm/auto-lead/telegram` | 120 |
| POST | `/crm/auto-lead/website` | 133 |
| POST | `/crm/auto-lead/whatsapp` | 148 |
| POST | `/crm/auto-lead/sms` | 161 |

#### `CrmExtrasController` — 10 route  
`modules/crm/presentation/crm-extras.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/comments` | 46 |
| POST | `/crm/comments` | 63 |
| GET | `/crm/history` | 79 |
| GET | `/crm/dashboard` | 95 |
| GET | `/crm/pipeline` | 102 |
| GET | `/crm/tasks` | 109 |
| POST | `/crm/tasks` | 126 |
| GET | `/crm/proposals` | 135 |
| GET | `/crm/nba` | 152 |
| GET | `/crm` | 159 |

#### `CrmLeadsController` — 10 route  
`modules/crm/presentation/crm-leads.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/leads` | 106 |
| GET | `/crm/leads/quick` | 122 |
| GET | `/crm/leads/:id` | 131 |
| GET | `/crm/leads/:id/emails` | 143 |
| POST | `/crm/leads` | 157 |
| PATCH | `/crm/leads/:id/stage` | 170 |
| PATCH | `/crm/leads/:id/qualify` | 185 |
| PATCH | `/crm/leads/:id/assign` | 195 |
| POST | `/crm/leads/:id/emails` | 210 |
| POST | `/crm/leads/quick` | 223 |

#### `CrmDealsController` — 9 route  
`modules/crm/presentation/crm-deals.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/deals` | 98 |
| GET | `/crm/deals/:id` | 114 |
| POST | `/crm/deals` | 128 |
| PATCH | `/crm/deals/:id/won` | 153 |
| PATCH | `/crm/deals/:id/lost` | 169 |
| PATCH | `/crm/deals/:id/stage` | 187 |
| PATCH | `/crm/deals/:id` | 203 |
| DELETE | `/crm/deals/:id` | 219 |
| POST | `/crm/deals/quick` | 229 |

#### `SalesController` — 9 route  
`modules/sd/sales/sales.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sales/invoices` | 49 |
| GET | `/sales/analytics/monthly-trend` | 65 |
| GET | `/sales/analytics/velocity` | 72 |
| GET | `/sales/commission/calculations` | 79 |
| GET | `/sales/forecast/accuracy` | 93 |
| GET | `/sales/forecast/generate` | 100 |
| POST | `/sales/forecast/generate` | 113 |
| GET | `/sales/forecast/history` | 127 |
| GET | `/sales/targets/leaderboard` | 139 |

#### `SdOrderDepartmentsController` — 8 route  
`modules/sd/presentation/sd-order-departments.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/orders/:id/departments` | 30 |
| PATCH | `/sd/orders/:id/departments` | 39 |
| GET | `/sd/orders/:id/saga` | 49 |
| PATCH | `/sd/orders/:id/molds/:moldId/status` | 58 |
| PATCH | `/sd/orders/:id/tech-cards/:tcId/status` | 68 |
| PATCH | `/sd/orders/:id/cliches/:clicheId/status` | 78 |
| PATCH | `/sd/orders/:id/shipping/status` | 88 |
| PATCH | `/sd/orders/:id/materials/:reqId/status` | 98 |

#### `CrmActivitiesController` — 7 route  
`modules/crm/presentation/crm-activities.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/activities` | 43 |
| GET | `/crm/activities/today` | 61 |
| GET | `/crm/activities/:id` | 69 |
| POST | `/crm/activities` | 81 |
| PATCH | `/crm/activities/:id/complete` | 95 |
| PATCH | `/crm/activities/:id` | 111 |
| DELETE | `/crm/activities/:id` | 127 |

#### `MarketingAnalyticsController` — 7 route  
`modules/marketing/presentation/marketing-analytics.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/marketing/leads` | 89 |
| POST | `/marketing/leads` | 95 |
| GET | `/marketing/leads/loss-analysis` | 104 |
| GET | `/marketing/leads/:id` | 114 |
| PUT | `/marketing/leads/:id` | 122 |
| PATCH | `/marketing/leads/:id/status` | 130 |
| PATCH | `/marketing/leads/:id` | 138 |

#### `SdPaymentsController` — 7 route  
`modules/sd/presentation/sd-payments.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/payments` | 51 |
| POST | `/sd/payments` | 68 |
| GET | `/sd/payments/debitors` | 76 |
| GET | `/sd/payments/overdue` | 83 |
| GET | `/sd/debitors` | 90 |
| GET | `/sd/active-rentals` | 97 |
| PUT | `/sd/payments/:id` | 104 |

#### `CrmAiController` — 6 route  
`modules/crm/presentation/crm-ai.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/crm/leads/:id/ai-analysis` | 45 |
| POST | `/crm/leads/:id/scoring-v2` | 59 |
| POST | `/crm/deals/:id/ai-forecast` | 73 |
| GET | `/crm/dashboard-analysis` | 85 |
| POST | `/crm/nba/:entityType/:entityId` | 94 |
| POST | `/crm/suggest-action` | 103 |

#### `CrmAnalyticsController` — 6 route  
`modules/crm/presentation/crm-analytics.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/funnel` | 75 |
| GET | `/crm/cohort` | 83 |
| POST | `/crm/rfm/cluster` | 91 |
| POST | `/crm/churn/predict` | 100 |
| POST | `/crm/churn/retrain` | 109 |
| GET | `/crm/analytics/loss-reasons` | 118 |

#### `CrmContactsController` — 6 route  
`modules/crm/presentation/crm-contacts.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/contacts` | 42 |
| GET | `/crm/contacts/:id` | 50 |
| POST | `/crm/contacts/check-duplicates` | 62 |
| POST | `/crm/contacts` | 71 |
| PATCH | `/crm/contacts/:id` | 84 |
| DELETE | `/crm/contacts/:id` | 100 |

#### `CrmCustomFieldsController` — 6 route  
`modules/crm/presentation/crm-custom-fields.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/custom-fields` | 38 |
| GET | `/crm/custom-fields/:entityType` | 45 |
| POST | `/crm/custom-fields` | 53 |
| PATCH | `/crm/custom-fields/:id` | 70 |
| POST | `/crm/custom-fields/reorder` | 85 |
| DELETE | `/crm/custom-fields/:id` | 104 |

#### `CrmSettingsController` — 6 route  
`modules/crm/settings/crm-settings.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/settings/loss-reasons` | 70 |
| POST | `/crm/settings/loss-reasons` | 80 |
| PATCH | `/crm/settings/loss-reasons/:id` | 91 |
| GET | `/crm/settings/stages` | 103 |
| POST | `/crm/settings/stages` | 113 |
| PATCH | `/crm/settings/stages/:id` | 124 |

#### `SapController` — 6 route  
`modules/integration/sap/sap.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sap/sales-orders` | 49 |
| GET | `/sap/sales-orders/:id` | 65 |
| PUT | `/sap/sales-orders/:id` | 78 |
| POST | `/sap/sales-orders` | 87 |
| PATCH | `/sap/sales-orders/:id` | 98 |
| DELETE | `/sap/sales-orders/:id` | 107 |

#### `SdLostOrdersReclamationsController` — 6 route  
`modules/sd/presentation/sd-lost-orders-reclamations.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/lost-orders` | 60 |
| POST | `/sd/lost-orders` | 70 |
| GET | `/sd/reclamations` | 80 |
| GET | `/sd/reclamations/:id` | 91 |
| POST | `/sd/reclamations` | 100 |
| PATCH | `/sd/reclamations/:id/resolve` | 110 |

#### `AiCrmController` — 5 route  
`modules/ai/presentation/ai-crm.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/ai/crm/score-lead/:leadId` | 32 |
| POST | `/ai/crm/deal-probability/:dealId` | 40 |
| POST | `/ai/crm/churn-risk/:contactId` | 48 |
| POST | `/ai/crm/email-template` | 61 |
| POST | `/ai/crm/next-best-action/:dealId` | 73 |

#### `CrmFollowupCompatController` — 5 route  
`modules/crm/presentation/crm-followup-compat.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/crm/followup-activities` | 56 |
| GET | `/crm/followup-activities/today` | 66 |
| POST | `/crm/followup-activities` | 74 |
| PATCH | `/crm/followup-activities/:id` | 85 |
| DELETE | `/crm/followup-activities/:id` | 95 |

#### `SdInvoicesController` — 5 route  
`modules/sd/presentation/sd-invoices.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/invoices` | 62 |
| GET | `/sd/invoices/:id` | 86 |
| GET | `/sd/invoices/:id/pdf` | 101 |
| GET | `/sd/invoices/:id/export-pdf` | 138 |
| POST | `/sd/invoices` | 202 |

#### `CrmCommsController` — 4 route  
`modules/crm/presentation/crm-comms.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| POST | `/crm/email/send` | 52 |
| POST | `/crm/meetings/schedule` | 63 |
| POST | `/crm/sms/send` | 81 |
| POST | `/crm/whatsapp/send` | 92 |

#### `CrmLeadsOpsController` — 4 route  
`modules/crm/presentation/crm-leads-ops.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| PATCH | `/crm/leads/:id` | 55 |
| PATCH | `/crm/leads/:id/pipeline-stage` | 68 |
| POST | `/crm/leads/:id/convert` | 82 |
| DELETE | `/crm/leads/:id` | 105 |

#### `GeneralLegacyAController` — 4 route  
`modules/general/controllers/general-legacy-a.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/papka-orders` | 91 |
| POST | `/papka-orders` | 99 |
| DELETE | `/papka-orders/:id` | 127 |
| PATCH | `/papka-orders/:id` | 135 |

#### `MarketingAnalyticsStubsController` — 4 route  
`modules/marketing/presentation/marketing-analytics-stubs.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/marketing/leads/sources/summary` | 251 |
| GET | `/marketing/leads/automation/overdue-leads` | 257 |
| POST | `/marketing/leads/recalculate-scores` | 263 |
| POST | `/marketing/leads/:id/convert-to-crm` | 286 |

#### `SdDashboardController` — 4 route  
`modules/sd/presentation/sd-dashboard.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/dashboard/overview` | 38 |
| GET | `/sd/dashboard/manager-actions` | 45 |
| GET | `/sd/dashboard/quota` | 52 |
| GET | `/sd/dashboard/leaderboard` | 59 |

#### `SdDeliveriesController` — 4 route  
`modules/sd/presentation/sd-deliveries.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/deliveries` | 45 |
| POST | `/sd/deliveries` | 54 |
| GET | `/sd/deliveries/:id` | 70 |
| PATCH | `/sd/deliveries/:id/status` | 79 |

#### `MarketingGroup2Controller` — 3 route  
`modules/marketing/presentation/marketing-group2.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/marketing/leads/:id/contacts` | 279 |
| POST | `/marketing/leads/:id/contacts` | 287 |
| DELETE | `/marketing/leads/:id` | 297 |

#### `OrdersRegistryCompatController` — 2 route  
`modules/compatibility/saas.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/orders-registry` | 144 |
| POST | `/orders-registry` | 150 |

#### `SdContractsController` — 2 route  
`modules/sd/presentation/sd-contracts.controller.ts`

| Metod | Route | Qator |
|---|---|---|
| GET | `/sd/contracts` | 35 |
| PATCH | `/sd/contracts/:id/sign` | 79 |

### A2. SD/CRM frontend chaqiruvlari — fayl bo'yicha (671 chaqiruv)

| Fayl | Soni | Endpointlar |
|---|---|---|
| `lib/api/ai.ts` | 33 | `/api/ai/call` `/api/ai/automation/run-all-pending` `/api/ai/crm/score-lead/${leadId}` `/api/ai/crm/deal-probability/${dealId}` `/api/ai/crm/churn-risk/${contactId}` `/api/ai/crm/email-template` … |
| `lib/api/sd.ts` | 28 | `/api/sd/orders` `/api/sd/orders/${id}/status` `/api/sd/orders/${id}/advance-bypass` `/api/sd/orders/${id}/tech-checkpoint` `/api/sd/invoices` `/api/sd/invoices/${id}/pdf` … |
| `components/crm/workspace/useCRMWorkspace.ts` | 22 | `/api/crm-bitrix/${entity}` `/api/crm/${entity}` `/api/crm/leads` `/api/crm/deals` `/api/crm/contacts` `/api/crm/companies` … |
| `pages/MarketingLeads.tsx` | 21 | `/api/marketing/leads` `/api/marketing/leads/automation/overdue-leads` `/api/marketing/funnel` `/api/marketing/leads/${contactLeadId}/contacts` `/api/marketing/leads/loss-analysis` `/api/marketing/dashboard/stats` … |
| `pages/SDSalesOrders.tsx` | 19 | `/api/sd/orders` `/api/sd/orders/${selected` `/api/sd/orders/${repeatSourceId}` `/api/sd/orders/${repeatSourceId}/items` `/api/sd/customers` `/api/sd/orders/${id}/status` … |
| `hooks/use-sd.ts` | 17 | `/api/sd/dashboard/overview` `/api/sd/orders` `/api/sd/customers` `/api/sd/quotations` `/api/sd/dashboard/quota` `/api/sd/deliveries` … |
| `pages/SDLeads.tsx` | 17 | `/api/sd/leads` `/api/sd/leads/stats` `/api/sd/customers` `/api/sd/leads/${id}` `/api/sd/leads/import` `/api/sd/leads/${id}/convert` … |
| `pages/SDSalesQuotes.tsx` | 16 | `/api/sd/quotations` `/api/sd/customers` `/api/sd/calculate-price` `/api/sd/quotations/${id}/send` `/api/sd/quotations/${id}/approve` `/api/sd/orders` … |
| `pages/MarketingCampaigns.tsx` | 15 | `/api/marketing/campaigns` `/api/marketing/campaigns/${campaignId}/stats` `/api/marketing/dashboard/stats` `/api/marketing/campaigns/${id}` `/api/marketing/campaigns/${id}/launch` … |
| `pages/MarketingExhibitions.tsx` | 14 | `/api/marketing/exhibitions` `/api/marketing/exhibitions/${selectedExh}/leads` `/api/marketing/exhibitions/${id}` `/api/marketing/exhibitions/${id}/qr` … |
| `pages/MarketingSocialInbox.tsx` | 14 | `/api/marketing/inbox/stats` `/api/marketing/inbox/conversations` `/api/marketing/inbox/conversations/${selectedId}/messages` `/api/marketing/inbox/conversations/${selectedId}/reply` `/api/marketing/inbox/ai-reply/${selectedId}` `/api/marketing/inbox/conversations/${selectedId}/status` … |
| `pages/SDDashboard.tsx` | 14 | `/api/sd/dashboard/overview` `/api/sd/reports/funnel` `/api/sales/analytics/monthly-trend` `/api/sd/orders` `/api/sd/dashboard/manager-actions` `/api/sd/dashboard/quota` … |
| `pages/crm/DetailSheet.tsx` | 13 | `/api/crm/history` `/api/crm/followup-activities` `/api/crm/proposals` `/api/crm/invoices` `/api/sd/orders` `/api/crm/leads/${entityId}/convert` … |
| `pages/SDSalesPayments.tsx` | 13 | `/api/sd/payments` `/api/sd/payments/debitors` `/api/sd/orders` `/api/sd/payments/${id}/mark-paid` `/api/sd/orders/${orderId}/advance-payment` `/api/sd/payments/export` … |
| `pages/SDCustomers.tsx` | 12 | `/api/sd/customers` `/api/sd/customers/${view360Dialog.customerId}/360` `/api/sd/customers/${id}` `/api/sd/customers/abc/recompute` … |
| `components/sd/europrint/PaymentsTab.tsx` | 11 | `/api/sd/payments` `/api/sd/payments/overdue` `/api/sd/payments/debitors` `/api/sd/orders` `/api/sd/payments/${id}` … |
| `components/sd/europrint/QuotationsTab.tsx` | 11 | `/api/sd/quotations` `/api/sd/customers` `/api/sd/calculate-price` `/api/sd/quotations/${id}/send` `/api/sd/quotations/${id}/approve` `/api/sd/orders` … |
| `pages/CRMSettings.tsx` | 10 | `/api/crm/custom-fields` `/api/crm/custom-fields/${entityType}` `/api/crm/custom-fields/${id}` `/api/crm/custom-fields/reorder` … |
| `pages/MarketingContent.tsx` | 10 | `/api/marketing/content/posts` `/api/marketing/content/posts/${id}` `/api/marketing/content/posts/${id}/publish` `/api/marketing/content/ai-generate` … |
| `pages/MarketingSettings.tsx` | 10 | `/api/marketing/settings` `/api/marketing/settings/social-api` `/api/marketing/settings/${id}` `/api/marketing/settings/social-api/${id}` … |
| `pages/MarketingWebsiteCMS.tsx` | 10 | `/api/marketing/website/blog` `/api/marketing/website/blog/${id}` `/api/marketing/website/blog/${id}/publish` `/api/marketing/website/blog/ai-generate` … |
| `pages/SDLostOrders.tsx` | 10 | `/api/sd/lost-orders` `/api/sd/reclamations` `/api/sd/reclamations/${id}/resolve` … |
| `pages/CRMActivities.tsx` | 9 | `/api/crm/activities` `/api/crm/deals` `/api/crm/contacts` `/api/crm/activities/${id}` … |
| `pages/MarketingDashboard.tsx` | 9 | `/api/marketing/segments` `/api/marketing/ai/hot-leads` `/api/marketing/leads/sources/summary` `/api/marketing/dashboard/stats` `/api/marketing/campaigns` `/api/marketing/inbox/stats` … |
| `pages/SalesOrders.tsx` | 9 | `/api/sap/sales-orders` `/api/sd/customers` `/api/crm/deals` `/api/sap/sales-orders/${editingOrder.id}` `/api/sap/sales-orders/${id}` … |
| `pages/__tests__/MarketingDashboard.test.tsx` | 9 | `/api/marketing/segments` `/api/marketing/ai/hot-leads` `/api/marketing/leads/sources/summary` `/api/marketing/dashboard/stats` `/api/marketing/campaigns` `/api/marketing/inbox/stats` … |
| `pages/crm/AIAnalysisPanel.tsx` | 8 | `/api/crm/ai/leads/${entityId}/scoring-v2` `/api/crm/ai/nba/${entityTypeParam}/${entityId}` `/api/crm/ai/nba/create-task` `/api/crm/ai/autofill/${entityId}` `/api/crm/leads/${entityId}` `/api/crm/leads` … |
| `pages/crm/RobotsView.tsx` | 8 | `/api/crm-bitrix/robots/${robotId}/toggle` `/api/crm-bitrix/robots` `/api/crm-bitrix/robots/${id}` `/api/crm-bitrix/robots/${robotId}` … |
| `pages/MarketingCalendar.tsx` | 8 | `/api/marketing/calendar` `/api/marketing/calendar/${id}` `/api/marketing/calendar/${editId}` … |
| `pages/SDContracts.tsx` | 8 | `/api/sd/contracts` `/api/sd/customers` `/api/sd/contracts/${id}/sign` … |
| `components/sd/europrint/LeadsTab.tsx` | 7 | `/api/sd/leads` `/api/sd/leads/stats` `/api/sd/leads/${id}/status` … |
| `components/sd/europrint/OrdersTab.tsx` | 7 | `/api/sd/orders` `/api/sd/orders/${selected` `/api/sd/orders/${id}/status` … |
| `pages/crm/DetailSheetTypes.ts` | 7 | `/api/crm/leads` `/api/crm/deals` `/api/crm/contacts` `/api/crm/companies` `/api/crm-bitrix/proposals` `/api/crm-bitrix/invoices` … |
| `pages/MarketingPR.tsx` | 7 | `/api/marketing/pr` `/api/marketing/pr/${id}` … |
| `pages/PapkaOrders.tsx` | 7 | `/api/papka-orders` `/api/papka-orders/${id}` … |
| `pages/SDKpi.tsx` | 7 | `/api/sd/kpi/team` `/api/sd/reports/funnel` `/api/sd/kpi-targets` `/api/sd/kpi-targets/${id}` … |
| `pages/__tests__/CRMWorkspace.test.tsx` | 7 | `/api/crm/leads` `/api/crm/deals` `/api/crm/contacts` `/api/crm/companies` `/api/crm/stages` `/api/crm/activities` … |
| `components/sd/europrint/CustomersTab.tsx` | 6 | `/api/sd/customers` `/api/sd/customers/${selected` |
| `pages/ai-planning/RushOrderPage.tsx` | 6 | `/api/ai/rush-orders` `/api/ai/rush-orders/${orderId}/approve` `/api/ai/rush-orders/${orderId}/reject` |
| `pages/AIProviderConfig.tsx` | 6 | `/api/ai/provider-configs` `/api/ai/provider-configs/${provider}` |
| `pages/crm/ExtendedAIPanel.tsx` | 6 | `/api/crm/ai/extended/voice/analyze-call` `/api/crm/ai/extended/chat/respond` `/api/crm/ai/extended/churn/analyze` `/api/crm/ai/extended/auto-tasks/suggest` `/api/crm/ai/extended/auto-tasks/create` `/api/crm/ai/supervisor-dashboard` |
| `pages/SDDeliveries.tsx` | 6 | `/api/sd/deliveries` `/api/sd/deliveries/${id}/status` |
| `pages/SDExtended.tsx` | 6 | `/api/sd/kpi/team` `/api/sd/dashboard/quota` `/api/papka-orders` `/api/sd/active-rentals` |
| `pages/SDOrderDetail.tsx` | 6 | `/api/sd/orders` `/api/sd/orders/${id}` `/api/sd/orders/${id}/departments` `/api/sd/orders/${id}/saga` |
| `pages/SDSalesManagement.tsx` | 6 | `/api/sd/invoices` `/api/sd/kpi/team` `/api/sales/forecast/generate` `/api/sales/forecast` |
| `pages/crm/QuickCreateModal.tsx` | 5 | `/api/crm/leads` `/api/crm/deals` `/api/crm/contacts` `/api/crm/companies` `/api/crm/${entityType}` |
| `pages/MarketingBudget.tsx` | 5 | `/api/marketing/budget` `/api/marketing/budget/${id}` |
| `pages/MarketingDashboardDialogs.tsx` | 5 | `/api/crm/companies` `/api/marketing/nps` `/api/marketing/nps/stats` `/api/marketing/churn-risk` `/api/marketing/churn-risk/ai-signal` |
| `pages/MarketingExtended.tsx` | 5 | `/api/marketing/campaigns` `/api/marketing/nps/monthly` `/api/marketing/ab-tests` `/api/marketing/competitors` `/api/marketing/churn-risk` |
| `pages/MarketingExtendedSections.tsx` | 5 | `/api/marketing/ab-tests` `/api/marketing/nps` `/api/marketing/nps/monthly` `/api/marketing/churn-risk` |
| `pages/TechApproval.tsx` | 5 | `/api/papka-orders` |
| `components/crm/BitrixActivityPanel.tsx` | 4 | `/api/crm/activities` `/api/crm/comments` |
| `components/orders/useWizardState.ts` | 4 | `/api/sd/customers` `/api/papka-orders` |
| `components/sd/CommunicationsTab.tsx` | 4 | `/api/sd/customers/${customerId}/interactions` `/api/sd/customers` `/api/sd/customers/${customerId}/nps` |
| `components/sd/CompetitorsTab.tsx` | 4 | `/api/sd/customers/${customerId}/competitors` `/api/sd/customers` `/api/sd/customers/${customerId}/competitors/${coid}` |
| `components/sd/ComplaintsTab.tsx` | 4 | `/api/sd/customers/${customerId}/complaints` `/api/sd/customers` `/api/sd/customers/${customerId}/complaints/${cid}/resolve` |
| `components/sd/ContractsTab.tsx` | 4 | `/api/sd/customers/${customerId}/documents` `/api/sd/customers` `/api/sd/customers/${customerId}/documents/${did}` |
| `components/sd/Customer360View.tsx` | 4 | `/api/sd/customers/${customerId}/internal` `/api/sd/customers` `/api/sd/customers/${customerId}/360` |
| `lib/api/wms.ts` | 4 | `/api/ai/wms/reorder-point` `/api/ai/wms/optimize-stock` `/api/ai/wms/delivery-predict` `/api/ai/wms/route-optimize` |
| `pages/AiAutomationPage.tsx` | 4 | `/api/ai/automation/status` `/api/ai/automation/run-all-pending` |
| `pages/DesignApproval.tsx` | 4 | `/api/papka-orders` |
| `pages/FinanceApproval.tsx` | 4 | `/api/papka-orders` |
| `pages/__tests__/SDDashboard.test.tsx` | 4 | `/api/crm/ai/dashboard-analysis` `/api/crm/leads` `/api/crm/deals` `/api/crm/invoices` |
| `components/hr/orgnode/FitTab.tsx` | 3 | `/api/ai/fit/scores` `/api/ai/fit/evaluate` |
| `components/sd/europrint/KPITab.tsx` | 3 | `/api/sd/kpi/team` `/api/sd/reports/funnel` |
| `pages/AIFitScores.tsx` | 3 | `/api/ai/fit/scores` `/api/ai/fit/report` `/api/ai/fit/evaluate` |
| `pages/CrmFunnelAnalytics.tsx` | 3 | `/api/crm/funnel` `/api/crm/deals/${stageForm.dealId}/stage` `/api/crm/deals/close` |
| `pages/QCFinalInspection.tsx` | 3 | `/api/papka-orders` |
| `pages/SDOverviewDashboard.tsx` | 3 | `/api/sd/dashboard/overview` `/api/sd/dashboard/manager-actions` `/api/crm/followup-activities/today` |
| `pages/SDSettings.tsx` | 3 | `/api/sd/price-formulas` |
| `pages/__tests__/SDSalesOrders.test.tsx` | 3 | `/api/sd/sales-orders` |
| `components/crm/activity/ActivityFeed.tsx` | 2 | `/api/crm/activities/${activityId}/complete` `/api/crm/activities` |
| `components/crm/activity/CallForm.tsx` | 2 | `/api/crm/activities` |
| `components/crm/activity/CommentForm.tsx` | 2 | `/api/crm/comments` |
| `components/crm/activity/EmailForm.tsx` | 2 | `/api/crm/email/send` `/api/crm/activities` |
| `components/crm/activity/SlotsForm.tsx` | 2 | `/api/crm/meetings/schedule` `/api/crm/activities` |
| `components/crm/activity/SmsForm.tsx` | 2 | `/api/crm/sms/send` `/api/crm/activities` |
| `components/crm/activity/TaskForm.tsx` | 2 | `/api/crm/tasks` `/api/crm/activities` |
| `components/crm/activity/WhatsAppForm.tsx` | 2 | `/api/crm/whatsapp/send` `/api/crm/activities` |
| `components/sd/BasicTab.tsx` | 2 | `/api/sd/customers/${customerId}/contacts` `/api/sd/customers` |
| `lib/cache-invalidation.ts` | 2 | `/api/sd/orders` `/api/sd/dashboard` |
| `pages/ai-planning/AIShiftManagementPage.tsx` | 2 | `/api/ai/shift/recommendations` |
| `pages/ai-planning/BottleneckAnalysisPage.tsx` | 2 | `/api/ai/bottleneck/analysis` |
| `pages/ai-planning/DemandForecastingPage.tsx` | 2 | `/api/ai/forecast/demand` |
| `pages/AiCrmPage.tsx` | 2 | `/api/crm/deals` `/api/crm/contacts` |
| `pages/AIFinancePageSections.tsx` | 2 | `/api/ai/finance/anomalies` `/api/ai/finance/cashflow-forecast` |
| `pages/AIFinancePageSections2.tsx` | 2 | `/api/ai/finance/budget-variance` `/api/ai/finance/classify-invoice` |
| `pages/CRMFunnelSettings.tsx` | 2 | `/api/crm/settings/loss-reasons` `/api/crm/settings/stages` |
| `pages/ForecastAnalytics.tsx` | 2 | `/api/sales/forecast/generate` `/api/sales/forecast` |
| `pages/OrdersRegistry.tsx` | 2 | `/api/orders-registry` |
| `pages/OrdersRegistryDialogs.tsx` | 2 | `/api/orders-registry` `/api/orders-registry/${orderId}` |
| `pages/PPDashboard.tsx` | 2 | `/api/papka-orders` |
| `pages/QCModule.tsx` | 2 | `/api/papka-orders` |
| `pages/SDDebitors.tsx` | 2 | `/api/sd/debitors` |
| `pages/TechCards.tsx` | 2 | `/api/papka-orders` |
| `pages/__tests__/SDCustomers.test.tsx` | 2 | `/api/sd/customers` |
| `components/sd/europrint/OverviewDashboard.tsx` | 1 | `/api/sd/dashboard/overview` |
| `hooks/use-sd.test.ts` | 1 | `/api/sd/orders` |
| `pages/AIFinanceFraudTab.tsx` | 1 | `/api/ai/finance/fraud-risk` |
| `pages/crm/EntityCard.tsx` | 1 | `/api/crm/ai/quick-score/${param}/${entity.id}` |
| `pages/CrmCohortAnalysis.tsx` | 1 | `/api/crm/cohort` |
| `pages/CrmRfmClusters.tsx` | 1 | `/api/crm/rfm/cluster` |
| `pages/DailyKPIDashboard.tsx` | 1 | `/api/ai/finance/insights` |
| `pages/kanban/TaskDetailSheet.tsx` | 1 | `/api/crm/deals` |
| `pages/MarketingDashboardPanels.tsx` | 1 | `/api/marketing/ai-assistant` |
| `pages/MarketingSettingsSections.tsx` | 1 | `/api/marketing/settings/setup-telegram-webhook` |
| `pages/PlanningBoard.tsx` | 1 | `/api/papka-orders` |
| `pages/SDQuotaDashboard.tsx` | 1 | `/api/sd/dashboard/quota` |
| `pages/__tests__/PlanningBoard.test.tsx` | 1 | `/api/papka-orders` |
| `pages/__tests__/PPDashboard.test.tsx` | 1 | `/api/papka-orders` |