# SD / CRM — To'liq Yangi Tekshiruv (v3)

> **Sana:** 2026-07-10 · **Rol:** 🔵 Tahlilchi · **READ-ONLY** — hech bir kod, sxema, konfiguratsiya yoki ma'lumot o'zgartirilmadi.
> **Baza:** jonli `europrint`@localhost:5432 — faqat `SELECT` va `BEGIN…ROLLBACK` probe'lari (har biri qaytarib olindi).
>
> **Metodologiya (muhim).** Bu hujjat oldingi audit fayllarini **haqiqat manbai sifatida ishlatmaydi**. `docs/audit/` dagi hujjatlar faqat "qayerga qarash kerak" ko'rsatkichi sifatida ochildi. Har bir da'vo **shu tahlirda** olingan `fayl:qator` yoki `SQL + natija` bilan qo'llab-quvvatlangan. Tekshirilmagan narsalar aniq `unverified` deb belgilangan (Q-40).
>
> **Ish tartibi:** deterministik inventar (marshrut/endpoint/reachability skriptlari) → 7 mustaqil read-only agent → **har bir P0 da'vo shaxsan qayta tekshirildi**. Agentlarning bir nechta da'vosi tuzatildi yoki rad etildi.

⚠️ **Parallel sessiya.** Tekshiruv boshida ish daraxtida bitta commit qilinmagan o'zgarish bor edi: `apps/api/src/modules/compatibility/crm-extended.controller.ts` (`git status: M`, 4+/4−) — massiv-route aliaslar (`ai/extended/*`) olib tashlanmoqda. Bu tahlirning topilmalariga zid emas, lekin Phase-3 commit'laridan oldin qayta tekshirilishi shart (Q-24).

---

## 0. Eng kritik topilma (bir jumlada)

**SD modulining to'rtta asosiy yaratish yo'li — bitim, taklifnoma, sotuv buyurtmasi, shartnoma — UI'dan butunlay ishlamaydi**, va bu `NOT NULL` cheklovlari bilan rollback-probe orqali isbotlandi. Modul o'zining asosiy vazifasini (buyurtma yaratish) bajara olmaydi; jonli bazadagi `quotations = 0`, `sd_contracts = 0`, `payments = 0` qatorlari buni tasdiqlaydi.

Yonidagi ikkinchi P0: **32 foydalanuvchidan 27 tasi (`role='manager'`) SD/CRM ning 257 endpointidan 198 tasida `403` oladi**, chunki BE `sales_manager` rolini talab qiladi va jonli bazada bunday rolga ega **birorta ham foydalanuvchi yo'q**.

---

## 1. SAHIFA INVENTARI (noldan chiqarilgan)

### 1.1 Manba va usul

Sidebar: `artifacts/erp-dashboard/src/components/sidebar/constants.ts:119-147` (guruh `tz01` "Savdo va CRM", `defaultUrl: sd/dashboard`).
Marshrutlar: `routes/CRMRoutes.tsx`, `routes/ProductionRoutes.tsx`, `routes/AdminRoutes.tsx`, `routes/DirectorRoutes.tsx`; redirect'lar `routes/AppRouter.tsx`.

**Reachability ta'rifi:** (a) sidebar `url`/`defaultUrl`, (b) kod ichidagi `setLocation`/`navigate`/`href=`/`<Link to=`, (c) `<Redirect to=>` nishoni, (d) dinamik `:id` detali. Hech biri bo'lmasa → **ORPHAN**.

### 1.2 Raqamlar (shu tahlirda hisoblangan)

| O'lchov | Qiymat |
|---|---|
| SD/CRM prefiksli ro'yxatdan o'tgan marshrut | **41** |
| Sidebar orqali | 16 |
| Redirect nishoni | 2 |
| Dinamik `:id` | 4 (3 unikal komponent) |
| Kod ichidagi nav-havola | 1 (`/sd/orders/:id`) |
| **ORPHAN** | **19** |
| Sidebar SD/CRM yozuvi (separator'siz) | 17 |
| Haqiqatan ochiladigan sahifa | **21** |

> ⚠️ Oldingi hujjatlar "15 sahifa" deydi. Yangi chiqarish **21** ta beradi: `SDOrderDetail` (`/sd/orders/:id`), `Customer360Page` (`/sd/customers/:id`), `SDQuotaDashboard` (`/sd/dashboard/quota`), `SalesOrders` (`/erp/sales`) hisobga olinmagan edi.

### 1.3 Sahifalar (ochiladiganlar)

| # | Yo'l | Komponent | Ochilish yo'li (dalil) | Rol guruhi |
|---|---|---|---|---|
| 1 | `/sd/dashboard` | SDDashboard | sidebar `constants.ts:124` + `defaultUrl:121` | SALES |
| 2 | `/sd/customers` | SDCustomers | sidebar `constants.ts:125` | SALES |
| 3 | `/sd/customers/:id` | Customer360Page | dinamik; `SDCustomers.tsx:376,402` | SALES |
| 4 | `/crm/customer/:id` | Customer360Page | **ikki marta ro'yxatda**: `CRMRoutes.tsx:67` + `DirectorRoutes.tsx:52` | SALES + DIRECTOR |
| 5 | `/crm-workspace` | CRMWorkspace | sidebar `constants.ts:126`; 8 redirect nishoni (`AppRouter.tsx:156-163`) | SALES |
| 6 | `/erp/sales` | SalesOrders | sidebar `constants.ts:128` (`/sales`) → redirect `AppRouter.tsx:155` | SALES |
| 7 | `/ai/crm` | AiCrmPage | sidebar `constants.ts:129` | SALES |
| 8 | `/sd/sales-quotes` | SDSalesQuotes | sidebar `constants.ts:130` | SALES |
| 9 | `/sd/sales-orders` | SDSalesOrders | sidebar `constants.ts:131` | SALES |
| 10 | `/sd/orders/:id` | SDOrderDetail | `<Link href={/sd/orders/${id}}>` `SDSalesOrders.tsx:506` | SALES |
| 11 | `/papka-orders` | PapkaOrders | sidebar `constants.ts:132`; `PPDashboard.tsx:70,78` | PRODUCTION |
| 12 | `/sd/contracts` | SDContracts | sidebar `constants.ts:133` | SALES |
| 13 | `/order-create` | OrderCreationWizard | sidebar `constants.ts:134` | PRODUCTION |
| 14 | `/sd/warehouse-rental` | SDExtended (tab `rental`) | sidebar `constants.ts:138`; tab xaritasi `SDExtendedTypes.ts:75` | SALES |
| 15 | `/sd/lost-orders` | SDLostOrders | sidebar `constants.ts:139` | SALES |
| 16 | `/sd/sales-payments` | SDSalesPayments | sidebar `constants.ts:141` | SALES |
| 17 | `/sd/advance-control` | SDExtended (tab `advance`) | sidebar `constants.ts:142`; `SDExtendedTypes.ts:76` | SALES |
| 18 | `/sd/kpi` | SDKpi | sidebar `constants.ts:144` | SALES |
| 19 | `/sd/settings` | SDSettings | sidebar `constants.ts:145` | SALES |
| 20 | `/crm/funnel-settings` | CRMFunnelSettings | sidebar `constants.ts:146` | SALES |
| 21 | `/sd/dashboard/quota` | SDQuotaDashboard | **faqat redirect** `/sd/quota-dashboard` (`AppRouter.tsx:164`); **navigatsiya havolasi yo'q** | SALES |

### 1.4 Sahifalar: nima qiladi ↔ nima qilyapti ↔ nima buzuq

Quyida har sahifa uchun (2) maqsad, (3) tasdiqlangan FE→BE, (4) buzuq/yetishmayotgan.
Barcha nomlangan controllerlar **ro'yxatda** (`sd.module.ts:123-127`, `crm.module.ts:155-170`, `ai.module.ts:161`, `integration.module.ts:33`, `legacy.module.ts:17`, `erp.module.ts:22`, `mm.module.ts:80`).

---

**1. `/sd/dashboard` — SD Dashboard**
*Maqsad:* savdo bo'limining operatsion boshqaruv paneli — KPI plitkalar, oylik trend, buyurtma statuslari, so'nggi buyurtmalar, menejer kvotasi/reytingi, "e'tibor talab qiladigan" ishlar, voronka, top mijozlar.
*Bugun:* 7/7 GET jonli, hammasi real repo ma'lumoti (`sd-dashboard.controller.ts:38,45,52,59`; `sd-quotations.controller.ts:178`; `sales.controller.ts:65`; `sd-orders.controller.ts:82`). Servis qaytargan kalitlar FE o'qigan kalitlarga aynan mos (`sd-dashboard.service.ts:31,32,54,55,71,93`).
*Buzuq:* faqat `overview` so'rovi uchun `EPErrorState` bor (`SDDashboard.tsx:334`); qolgan 6 so'rov xato bersa vidjetlar jimgina bo'sh ko'rinadi.

**2. `/sd/customers` — Mijozlar**
*Maqsad:* mijoz master-ro'yxati, ABC segmentlari, qarz, qidiruv/filtr, qo'shish/tahrirlash/o'chirish, ABC qayta hisoblash.
*Bugun:* 6/6 endpoint jonli va real (`sd-customers.controller.ts:126,134,165,202,220,234,253`).
*Buzuq (yangi topildi):*
- **"Qarz" ustuni doim 0** — FE `c.openDebt` o'qiydi (`SDCustomers.tsx:370,386`), ro'yxat SELECT'i `openDebt` ni umuman qaytarmaydi (`drizzle-sd-customers.repo.ts:25-28`).
- **"Umumiy qiymat" KPI doim 0** — FE `c.lifetime_value` (`:175`), repo `totalRevenue` qaytaradi.
- **ABC segmenti ko'rsatilmaydi** — repo `segment = mapSegment(status)` (`repo:43`), ya'ni **hisob holati**, ABC emas. "ABC qayta hisoblash" tugmasi real ishlaydi (`customer-abc.service.ts:86` — rollback-probe: `B→C`), lekin natija bu ro'yxatda hech qachon ko'rinmaydi.
- **Tahrirlash 400 beradi** (quyida §2).

**3–4. `/sd/customers/:id` va `/crm/customer/:id` — Mijoz 360°**
*Maqsad:* mijozning to'liq kartasi — 10 tab (asosiy, buyurtmalar, moliya, muloqot, shikoyatlar, ABC, rivojlanish, raqobat, shartnomalar, LTV).
*Bugun:* `GET /sd/customers/:id/360` (`sd-customers.controller.ts:202`) real; `PATCH /:id/internal` (`:425`) mavjud.
*Buzuq:* **`/crm/customer/:id` ikki marta ro'yxatdan o'tgan** (`CRMRoutes.tsx:67` va `DirectorRoutes.tsx:52`) — ikkala `ModuleGroup` ham shu yo'lda faollashadi (`ModuleGroup.tsx:19-24`), shuning uchun sales+director rollarini birga tutgan foydalanuvchi sahifani **ikki marta mount** qiladi (ikki marta 360 so'rovi). Ichki-ma'lumot dialogi ochilganda `internalNotes`/`shareOfWallet` majburan bo'shatiladi (`Customer360View.tsx:299-302`) → saqlangan qiymat hech qachon ko'rinmaydi.

**5. `/crm-workspace` — Lidlar (CRM ish maydoni)**
*Maqsad:* Bitrix uslubidagi CRM taxtasi — lid/bitim/kontakt/kompaniya/taklif/faktura, kanban+ro'yxat+kalendar, bosqichni sudrash, tez-yaratish, faoliyat jurnali.
*Bugun:* 16 endpoint, hammasi jonli va ro'yxatda.
*Buzuq:*
- **Tez-yaratishda bitim doim 400** (§2).
- **Faoliyat yaratish `entity_id=""` bilan yiqiladi** — FE default `entityId: ""` (`useCRMWorkspace.ts:78,144`), repo uni to'g'ridan-to'g'ri uzatadi (`crm-followup-compat.repository.ts:51`). Jonli DB: `crm_activities.entity_id` = `integer`. **Rollback-probe:** `INSERT … entity_id='' → XATO: неверный синтаксис для типа integer: ""`; `NULL` bilan → OK.
- **O'chirish tasdiqsiz** (`useCRMWorkspace.ts:91,177`) — Qoida 14 buzilishi.

**6. `/erp/sales` — Sotish Paneli (sidebar "Sotish Paneli" → `/sales` → redirect)**
*Maqsad:* SAP uslubidagi buyurtma reyestri, to'liq SAP forma bilan.
*Bugun:* 6 endpoint jonli (`sap.controller.ts:49,78,87,107`).
*Buzuq (eng og'ir sahifa):*
- **Yaratish summani doim 0 yozadi** — FE `totalValue`/`netValue` yuboradi (`SalesOrders.tsx:91-93`), repo `body['totalAmount']` o'qiydi (`sap.repository.ts:54`) → `parseFloat('0')`.
- **~19 maydon tashlanadi** — INSERT faqat `document_number, order_date, pricing_date, customer_id, net_value, total_value` (`sap.repository.ts:58-64`); `orderDate`/`pricingDate` ham e'tiborsiz (bugungi sana yoziladi).
- **Tahrirlash faqat `status`+`notes` yozadi** (`sap.repository.ts:43`).
- **Ro'yxat/yaratish ustun drifti** — yaratish `document_number`/`total_value` yozadi, ro'yxat `order_number`/`total_amount` o'qiydi (`sap.repository.ts:25-26`).

**7. `/ai/crm` — AI CRM**
*Maqsad:* bitim/kontakt ustida AI yordamchi — lid skoring, bitim ehtimoli, churn xavfi, email shabloni, keyingi harakat.
*Bugun:* 5 AI endpoint mavjud, guard'langan, Zod-validatsiyali (`ai-crm.controller.ts:32,40,48,61,73`).
*Buzuq:* **uchta AI chaqiruvi BE DTO'siga mos kelmaydi** — `churn-risk` `activityData` talab qiladi (`ai-crm.dto.ts:9`), FE tanasiz yuboradi (`lib/api/ai.ts:19-20`); `email-template` `purpose/contactName/context` talab qiladi (`:14-16`), FE `{dealId,dealTitle,tone,context}` yuboradi (`AiCrmPage.tsx:196-201`); `next-best-action` `lastActivities` talab qiladi (`:21`), FE tanasiz. Natijalar hech qayerda saqlanmaydi (`AiCrmPage.tsx:39`).

**8. `/sd/sales-quotes` — Taklifnomalar**
*Maqsad:* taklifnoma ro'yxati + karton narx-kalkulyatori bilan yaratish; yuborish / tasdiqlash (→ buyurtma + shartnoma) / tahrirlash / o'chirish.
*Bugun:* 8 endpoint jonli. `send`, `approve`, `convert` real ish qiladi.
*Buzuq:* **yaratish doim ishlamaydi** (§2, ikki mustaqil sabab). Tahrirlashda `payment_terms` tashlanadi (`sd-quotations.service.ts:254-263`) va dialog ochilganda majburan bo'shatiladi (`SDSalesQuotes.tsx:206`).

**9. `/sd/sales-orders` — Buyurtmalar**
*Maqsad:* ikki panelli buyurtma boshqaruvi — ro'yxat + 360° detal, status zanjiri, bekor qilish, klonlash, ATP tekshiruvi bilan yaratish.
*Bugun:* 9 endpoint jonli.
*Buzuq:* **yaratish `customer_id` NOT NULL cheklovida yiqiladi** (§2). `tech-checkpoint` — green-lie (§2). FE `customerId` yubormaydi (`SDSalesOrders.tsx:290`).

**10. `/sd/orders/:id` — Buyurtma detali**
*Maqsad:* faqat o'qish uchun 360° ko'rinish — umumiy, bo'limlar, saga jarayoni.
*Bugun:* 3/3 endpoint real (`sd-orders.controller.ts:113`, `sd-order-departments.controller.ts:30,49`). Mutatsiya yo'q.
*Buzuq:* topilmadi.

**11. `/papka-orders` — Papka Buyurtmalari**
*Maqsad:* ofset papka-buyurtmalar reyestri.
*Bugun:* 3/3 real (`general-legacy-a.controller.ts:91,99,135`), `papka_orders` ga yozadi. Forma maydonlari INSERT ustunlariga to'liq mos.
*Buzuq:* controller'da **na `@Roles`, na `@UseGuards`** → har qanday autentifikatsiyalangan foydalanuvchi yarata/o'chira oladi.

**12. `/sd/contracts` — Shartnomalar**
*Maqsad:* shartnoma arxivi, ko'rish, imzolash, yangi shartnoma yaratish.
*Bugun:* ro'yxat va imzo `SdContractsController:35,79`; **yaratish esa `SdQuotationsController:121` da** (bo'lingan miya). Imzo real (rollback-probe: `status='signed'`, `signed_at` o'rnatildi).
*Buzuq:* **yaratish `order_id` NOT NULL cheklovida yiqiladi** (§2). Uch maydon (`start_date`, `total_amount`, `payment_terms`) hech qachon yozilmaydi va ro'yxat ularni `null` deb ko'rsatadi (`sd-contracts.controller.ts:62-65`).

**13. `/order-create` — Buyurtma Yaratish (sehrgar)**
*Maqsad:* 5 bosqichli sehrgar — BOM material hisobi va marshrut vaqti bilan papka-buyurtma yaratish.
*Bugun:* 7 GET real; POST `/api/papka-orders` (11-sahifa bilan **bir xil jadval**).
*Buzuq:* **9 maydon jimgina tashlanadi** — `vidZakaza, zakazFormy, krasok, formatC, tayyorBolishVaqti, schetNo, menedzherZakaza, texnolog, primZakaza` (`useWizardState.ts:184-214` yuboradi; `general-legacy-a.controller.ts:105-124` xaritalamaydi; `legacy-warehouse.helpers.ts:65-75` INSERT'da yo'q).

**14 & 17. `/sd/warehouse-rental` va `/sd/advance-control` — `SDExtended` tab-host**
Tab xaritasi `SDExtendedTypes.ts:72-77`.
*Ijara (rental):* `GET /api/sd/active-rentals` real (`sd-payments.controller.ts:97`). **Buzuq:** `RentalPanel` `areaM2`, `totalAmount`, `billed`, `orderNumber` maydonlarini o'qiydi — jonli `sd_rentals` da bunday **ustunlar yo'q** (faqat `daily_rate`, `start_date`, `end_date`, …). Ma'lumot bo'lsa ham nol ko'rsatardi.
*Avans (advance):* `/api/papka-orders` o'qiydi. **Sahifa `sales_orders.advance_*` ni umuman o'qimaydi**; "Kritik/muddati o'tgan" va "Bajarilgan avanslar" — TSX'da **literal `0`** (`SDExtendedSections2.tsx:147,159`). 70% qoidasi bu sahifada hech qanday hisobda ishlatilmaydi.

**15. `/sd/lost-orders` — Yo'qotilgan/Reklamatsiya**
*Bugun:* 5/5 real; create/resolve rollback-probe bilan tasdiqlandi (`REC-2026-00004` generatsiya, `status='resolved'`).
*Buzuq:* yangi reklamatsiya DB'da `status='draft'` bo'ladi, FE esa faqat `open|investigating|resolved|rejected` yorliqlarini biladi (`SDLostOrders.tsx:49`) → `draft` "ochiq" deb sanalmaydi. **Modulning eng toza sahifasi.**

**16. `/sd/sales-payments` — To'lovlar**
*Bugun:* 6 endpoint jonli; `mark-paid` real (rollback-probe: `status='paid'`).
*Buzuq:*
- **CSV eksport tugmasi 404** — `GET /api/sd/payments/export` butun `apps/api/src` da mavjud emas (`SDSalesPayments.tsx:207`).
- **To'lov yaratish bog'lanishni yo'qotadi** (§2).
- **"Avans" tugmasi `sales_manager` uchun 403** — endpoint `@Roles(FINANCE, FINANCE_MANAGER, DIRECTOR, SUPER_ADMIN)` (`sd-orders.controller.ts:225`), sahifa esa SALES guruhida.
- Pagination `total` yo'q — controller yalang'och massiv qaytaradi (`sd-payments.controller.ts:62`).

**18. `/sd/kpi` — KPI**
*Bugun:* 4/4 real (`sd-quotations.controller.ts:156,171,178,245`).
*Buzuq:* KPI maqsadini tahrirlash camelCase yuboradi; servis xaritalashi **unverified**.

**19. `/sd/settings` — Sozlamalar**
*Bugun:* GET/PUT `/api/sd/price-formulas` real UPSERT (`drizzle-quotation.repo.ts:247,284`). FE kalitlari SELECT aliaslariga aynan mos. Jonli DB'da singleton qator (`id=1`, `vat_rate=12`).
*Buzuq:* topilmadi. **Ikkinchi eng toza sahifa.** (O'qish yo'li `numeric` ni `float8` ga kastlaydi — faqat ko'rsatish uchun.)

**20. `/crm/funnel-settings` — Voronka Sozlamalari**
*Bugun:* 6/6 real (`crm-settings.controller.ts:70-124`), FE/BE maydon nomlari mos.
*Buzuq:* topilmadi. (Servis ichidagi SQL **unverified**.)

**21. `/sd/dashboard/quota` — Kvota paneli**
*Bugun:* 1 endpoint real (`sd-dashboard.controller.ts:52`).
*Buzuq:* **hech qayerdan navigatsiya yo'q** — faqat URL yozib yoki `/sd/quota-dashboard` redirect orqali. Ustiga, sarlavha ostidagi matn shablon-satr sifatida emas, **literal** yozilgan: `subtitle="{kpi?.period} — {kpi?.daysLeft} kun qoldi"` (`SDQuotaDashboard.tsx:56`) — jingalak qavslar ekranda ko'rinadi.
> Yon topilma: `SDExtendedTypes.ts:74` `/sd/quota-dashboard` ni `SDExtended` ning "quota" tabiga xaritalaydi, lekin AppRouter uni `SDQuotaDashboard` ga yo'naltiradi → **`SDExtended` ning "quota" tabi hech qachon ochilmaydi**.

---

## 2. MA'LUMOT YAXLITLIGI (har entity uchun, noldan)

VIEW→base xaritasi (`pg_get_viewdef`, shu tahlirda): `crm_deals`→`deals` · `sd_payments`→`payments` · `sd_quotations`→**`quotations`** · `sd_sales_orders`→`sales_orders` · `sd_invoices`→`invoices`. `sd_customers`, `crm_leads`, `sd_contracts` — BASE. **"Avans" alohida jadval emas** — `sales_orders` ustunlari.

Qator soni (shu tahlirda): `crm_leads` 16 · `deals` 5 · `sd_customers` 16 · `sales_orders` 13 · **`quotations` 0** · **`sd_contracts` 0** · **`payments` 0** · `leads` 0.

### 2.1 ⛔ To'rtta bloklangan CREATE — rollback-probe bilan isbotlangan

Bu bo'lim modulning markaziy nuqsoni.

| Entity | Sabab | Isbot (shu tahlirda, `BEGIN…ROLLBACK`) |
|---|---|---|
| **Sotuv buyurtmasi** | FE faqat `companyId` yuboradi (`SDSalesOrders.tsx:290`), `customer_id` NULL bo'lib qoladi (`queries-sd.ts:79-95`). Jonli: `sales_orders.customer_id` **NOT NULL, default yo'q** | `INSERT … customer_id=NULL` → **XATO: значение NULL в столбце "customer_id" … нарушает**<br>`INSERT … customer_id=1` → OK |
| **Shartnoma** | FE `order_id` yubormaydi (`SDContracts.tsx:117-126`), repo `order_id=null` yozadi (`sd-quotations.repository.ts:100`). Jonli: `sd_contracts.order_id` **NOT NULL** | `INSERT … order_id=NULL` → **XATO: NULL в столбце "order_id"** |
| **Taklifnoma** | (1) Zod `items[].product_id` majburiy (`sd-quotations.dto.ts:15`), FE `calcForm` da bunday maydon yo'q → **400**. (2) Agar o'tsa ham: repo `body.customer_name` (snake) o'qiydi, FE `customerName` (camel) yuboradi → `quotations.customer_name` **NOT NULL** | `INSERT … customer_name=NULL` → **XATO: NULL в столбце "customer_name"** |
| **Bitim (deal)** | `CreateDealDtoSchema` **strict**: `companyId, leadId, totalAmount, currency, expectedClosureDate, assignedTo` majburiy (`create-deal.dto.ts:9-17`). `QuickCreateModal.tsx:50-55` faqat `{title, opportunity, currencyId, comments}` yuboradi → **ZodError 400** | Kod o'qildi; lenient `POST /crm/deals/quick` mavjud, lekin **FE chaqiruvchisi yo'q** |

Bu to'rtta jadvalning uchtasi jonli bazada **0 qator** — mustaqil tasdiq.

### 2.2 Fake-save / jimgina tushib qolgan maydonlar

| Entity | Amal | Tushib qolgan maydon | Dalil |
|---|---|---|---|
| Mijoz | CREATE | `customerType`, `source` | `.passthrough()` o'tkazadi, `drizzle-sd-customers.repo.ts:208` INSERT'da yo'q. Jonli: 16/16 qator `customer_type='legal'` (default) |
| Mijoz | UPDATE | — (lekin **bloklangan**, quyida) | |
| Taklifnoma | UPDATE | `payment_terms` | servis whitelist'i chiqarib tashlaydi (`sd-quotations.service.ts:254-263`) |
| To'lov | CREATE | `orderId`, `customerId`, `dueDate` | FE camelCase (`SDSalesPayments.tsx:277`), repo snake_case (`sd-payments.repository.ts:163`). `apiRequest` transformatsiya qilmaydi (`api-request.ts:116`). **Probe:** qator `payments` ga tushadi, `order_id`/`customer_id` = NULL |
| Avans bypass | ACTION | `advance_bypass_by`, `advance_bypass_reason` | agregat o'rnatadi (`sales-order.aggregate.ts:165-167`), umumiy UPDATE helperi yozmaydi (`queries-sd.ts:162-164`). Ustunlar jonli DB'da **mavjud** |
| Sehrgar | CREATE | 9 maydon | `legacy-warehouse.helpers.ts:65-75` |
| SAP buyurtma | CREATE/UPDATE | ~19 maydon + summa | `sap.repository.ts:43,50-64` |
| Shartnoma | CREATE | `start_date`, `total_amount`, `payment_terms` | `sd-quotations.repository.ts:100-104` |

### 2.3 Bloklangan UPDATE

**Mijoz tahrirlash** — `SdUpdateCustomerSchema.status` enum: `active|inactive|blacklisted` (`dto/sd.dto.ts:25`). FE `<Select>` `blacklist` qiymatini beradi (`SDCustomers.tsx:493`), va `status` har doim qatordan oldindan to'ldiriladi. Jonli bazada `new`/`at_risk` statusli qatorlar bor → ularni **har qanday tahrirlash 400 qaytaradi**.

### 2.4 Green-lie tekshiruvi (rollback-probe yoki yetib bo'lmas yo'l bilan)

| Amal | Verdikt | Dalil |
|---|---|---|
| mijoz `abc/recompute` | **REAL** | probe: `abc_class` `B→C` |
| taklifnoma `send` | **REAL** | probe: `quotations.status='sent'` |
| taklifnoma `approve` | **REAL** | probe: `sales_orders` + `sd_contracts` yaratildi |
| taklifnoma `convert-to-order` | **UNREACHABLE/BROKEN** | probe: `created_by=0` (int) → `column "created_by" is uuid` → 500 |
| shartnoma `sign` | **REAL** | probe: `status='signed'`, `signed_at` |
| to'lov `create` | **PARTIAL** | probe: qator bor, `order_id`/`customer_id` NULL |
| to'lov `mark-paid` | **REAL** (lekin GL legi o'lik — §5) | probe: `status='paid'` |
| buyurtma `status` | **REAL** | probe: `status='on_hold'`, outbox bilan atomik |
| buyurtma `cancel` | **REAL** | `drizzle-quotation.repo.ts:198-203` |
| **buyurtma `tech-checkpoint`** | ⛔ **GREEN-LIE** | 200 qaytaradi; yagona UPDATE helperi faqat `status, advance_status, updated_at` yozadi (`queries-sd.ts:162-164`). Butun BE'da `tech_bom_approved` ga **yozuvchi 0 ta**; jonli: 0/13 |
| buyurtma `advance-payment` | **REAL** | probe: `advance_paid`, `advance_status='approved'`, `version=1` |
| buyurtma `advance-bypass` | **PARTIAL** | status o'zgaradi; kim/nima sababdan yo'qoladi |
| bitim `won` / `lost` | **REAL handler, UI'dan YETIB BO'LMAS** | probe ikkalasi ishlaydi; lekin FE kanban `PATCH /:id/stage` chaqiradi, `/won` ni **hech kim chaqirmaydi** → `DealWonEvent` normal foydalanishda hech qachon chiqmaydi |
| bitim `stage` | **REAL** | probe: `qualification→negotiation` |
| lid `qualify` | **REAL** | probe: `NEW→qualified` |
| lid `convert` | **REAL, lekin darvoza yopiq** | `canBeConverted` `status='qualified'` talab qiladi; `crm_lead_stages` da QUALIFIED bosqichi yo'q → kanban sudrash bilan bu holatga o'tib bo'lmaydi |
| compat `crm/ai/create-task` | ⛔ **GREEN-LIE** | `crm-extended.service.ts:156` → `{id:null, status:'created'}` |
| compat `crm/chat` | ⛔ **GREEN-LIE** | `:160` → `{response:''}` |
| compat `crm/auto-tasks` | ⛔ **GREEN-LIE** | `:164` → `{tasksCreated:0, message:'Auto-tasks queued'}` |
| compat `crm/ai/churn` | ⛔ **GREEN-LIE** | `:168` → `{churnRisk:'low', score:0}` |

> ⚠️ Achchiq detal: yuqoridagi to'rtta soxta endpoint aynan `manager` roliga **ochiq** (§3), ya'ni ko'pchilik foydalanuvchi ishlata oladigan CRM-AI funksiyalari — soxta.

---
## 3. RBAC TO'G'RILIGI (mavjudligi emas — to'g'riligi)

### 3.1 Mo'ljallangan siyosat (koddan chiqarilgan)

Global guard zanjiri: `app.module.ts:195-199` — `FastifyThrottlerGuard → JwtAuthGuard → RolesGuard → SodGuard → PermissionGuard`, hammasi `APP_GUARD`.

`RolesGuard` (`common/guards/roles.guard.ts:61-67`):
```ts
const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [handler, class]);
if (!requiredRoles) { return true; }        // ← @Roles YO'Q → HAR QANDAY autentifikatsiyalangan foydalanuvchi
```
Tizim-rol bypass (`:89-91`): `admin | super_admin | director` doim o'tadi.

Satr-scoping helperi: `modules/crm/common/crm-row-scope.ts:15-30` — `CRM_SEES_ALL_ROLES = ['super_admin','admin','director']`; `crmOwnerScope(user)` privilegiyalilarga `null`, aks holda `user.id`, identifikatsiya bo'lmasa **fail-closed `-1`**.

**Mo'ljal:** oddiy savdo menejeri faqat o'ziniki (`assigned_to = self`) ni ko'radi; `super_admin/admin/director` hammasini ko'radi; identifikatsiyasiz — hech narsa.

> Yon topilma: `common/auth/owner-scope.ts` — bir xil helper, lekin **hech kim import qilmaydi** (o'lik kod).

### 3.2 ⛔ P0 — Rol satri nomuvofiqligi: 27/32 foydalanuvchi 403 oladi

Jonli `users` jadvali (shu tahlirda):

| role | soni |
|---|---|
| `manager` | **27** |
| `super_admin` | 3 |
| `director` | 1 |
| `employee` | 1 |
| **jami** | **32** |

SD controllerlari esa `sales_manager` talab qiladi:
```
sd-payments.controller.ts:35   const SD_ROLES = ['sales_manager','SALES','director','super_admin','accountant'];
sd-contracts.controller.ts:22  const SD_ROLES = ['sales_manager','SALES','director','super_admin','FINANCE_MANAGER','ACCOUNTANT'];
sd-orders.controller.ts:83     @Roles(Role.SALES_MANAGER, Role.DIRECTOR, Role.SUPER_ADMIN, Role.FINANCE)
roles.constants.ts:11          SALES_MANAGER = 'sales_manager'
```
`RolesGuard` da `manager → sales_manager` aliasi **yo'q**.

**DB tekshiruvi:** `SELECT count(*) FROM users WHERE role IN ('sales_manager','SALES','accountant','finance','finance_manager')` → **0**.

**Dasturiy hisob (shu tahlirda):** SD/CRM prefiksli **257 endpoint**dan
- `manager` **kira oladi: 59** (`@Roles` yo'q, yoki ro'yxatda `'manager'` bor)
- `manager` **403 oladi: 198**

FE esa ularni kiritadi: `roleConstants.ts:16` — `SALES_ROLES = ['sales','admin','manager','director']`. Ya'ni 27 foydalanuvchi SD sahifalarini **ochadi**, lekin ko'p endpointda 403 ko'radi.

Amalda bugun butun SD/CRM ni faqat **4 foydalanuvchi** (3 `super_admin` + 1 `director`) bypass orqali ishlata oladi.

Aynan `manager` ga ochiq bo'lgan endpointlar orasida — `SdDashboardController` (`@Roles('admin','manager','supervisor','operator','director')`, `sd-dashboard.controller.ts:24`), `crm-bitrix-compat`, `crm-followup-compat`, va **to'rtta soxta compat AI endpoint** (§2.4).

### 3.3 Uch holat bo'yicha tasnif

| Entity | Ro'yxat endpoint | Holat | Detal endpoint | Holat | Dalil |
|---|---|---|---|---|---|
| CRM lead | `GET /crm/leads` | **(b) inert** | `GET /crm/leads/:id` | **(b) inert** | `leads.service.ts:30` → `drizzle-crm-leads.repo.ts:93` `eq(manager_id, ownerId)`; DB: `crm_leads` 16 qator, `manager_id` 0, `assigned_to` 0 |
| CRM deal | `GET /crm/deals` | **(b) inert** | `GET /crm/deals/:id` | **(b) inert** | `deals.service.ts:31` → `drizzle-crm-deals.repo.ts:30` `AND assigned_to = ${ownerId}`; DB: 5 qator, `assigned_to` 0 |
| CRM deal mutatsiyalari | — | — | `PATCH/DELETE /:id`, `/won`, `/lost`, `/stage` | **(c) scoping yo'q** | handlerlar faqat `id` bo'yicha oladi |
| Kontakt / Kompaniya / Aktivlik | `GET /crm/{contacts,companies,activities}` | **(c) yo'q** | `/:id` | **(c) yo'q** | class-`@Roles` yo'q |
| SD buyurtma | `GET /sd/orders` | **(c) yo'q** | `GET /sd/orders/:id` | **(c) yo'q** | `list-orders.handler.ts:38`, `get-order-by-id.handler.ts:27` |
| SD mijoz | `GET /sd/customers` | **(c) yo'q, rol-gate ham yo'q** | `/:id`, `/:id/360`, `/:id/credit-check` | **(c) har qanday autentifikatsiyalangan** | `sd-customers.controller.ts:103,134,165,202,212` |
| SD lid | `GET /sd/leads` | **(c) filtr klient nazoratida** | `/sd/leads/:id` | **(c) har qanday autentifikatsiyalangan** | `sd-leads.controller.ts:46-50` `assignedTo` **query param** → `sd-leads.repository.ts:27` |
| SD to'lov | `GET /sd/payments` | **(c) yo'q** | `PUT /sd/payments/:id` | **(c) yo'q** | class `@Roles(SD_ROLES)` bor, satr-scoping yo'q |

**(a) "to'g'ri scoping + real ma'lumot bilan ishlaydi" holati — birorta ham yo'q.**

### 3.4 ⭐ (b) holatining ildiz-sababi — ikki qatlamli

**1-qatlam: eski qatorlar backfill qilinmagan.** Yangi yozuv yo'llari egalikni yozadi:
- `drizzle-crm-deals.repo.ts:117` — `INSERT INTO crm_deals (…, assigned_by_id, assigned_to, created_by_id, …)`
- `drizzle-crm-leads.repo.ts:156` — `manager_id: Number(dto.assignedById ?? dto.assignedTo ?? createdBy) || null` (fizik ustun `assigned_to`)

Lekin mavjud 5 deal va 16 lid bu konvergensiyadan **oldin** yaratilgan; backfill migratsiyasi topilmadi.

**2-qatlam: round-robin och qolgan.** `website-lead.repository.ts:37-50`:
```sql
FROM employees e WHERE COALESCE(e.role,'') = 'sales_manager' AND COALESCE(e.is_active,true) = true
```
Jonli DB: `employees` = **31 qator, hammasida `role` NULL** → mos keluvchi **0 ta** → `pickNextSalesManager()` doim `null` qaytaradi → yangi veb-lidlar ham `assigned_to` NULL bilan tug'iladi.

⚠️ Ustiga, rollar `users.role` da yashaydi (27 `manager`), `employees.role` da emas. Ya'ni so'rov **noto'g'ri jadvalga** va **mavjud bo'lmagan rol satriga** qaraydi.

**Natija:** Batch-1 scoping kodda buzilmagan, lekin oddiy menejer uchun **0 lid, 0 bitim** ko'rsatadi. Faqat privilegiyali bypass ma'lumot beradi.

### 3.5 Qo'shimcha: fail-closed regressiya

`leads.service.ts:65,74` va `deals.service.ts:88,109` — `update()`/`remove()` ichida `this.findOne(id)` **`user` argumentisiz** chaqiriladi → `crmSeesAllRows(undefined)=false`, `user?.id ?? -1 = -1` → **har qanday real qator uchun 404**, hatto privilegiyali chaqiruvchi uchun ham. Bu CRM lid/bitim tahrirlash va o'chirishni amalda yopib qo'yadi. (Xavfsizlik teshigi emas — teskarisi, ortiqcha yopiq.)

### 3.6 IDOR ro'yxati (kenglik bo'yicha)

1. **`GET /sd/customers`, `/:id`, `/:id/360`, `/:id/credit-check`, `/:id/contacts`, `/:id/interactions`, `/:id/documents`, `/:id/nps`, `/:id/complaints`** — **har qanday autentifikatsiyalangan foydalanuvchi** (na class, na metod `@Roles`). Ketma-ket integer `:id`. Eng keng ta'sir.
2. **`GET /sd/leads`, `/sd/leads/:id`, `/:id/activities`** — har qanday autentifikatsiyalangan. Yagona "scoping" — klient yuboradigan `assignedTo` query parametri.
3. **`GET /sd/orders/:id`, `/:id/items`** — `sales_manager|director|super_admin|finance`; `sales_orders.id` ketma-ket integer; egalik tekshiruvi yo'q.
4. **Bitim mutatsiyalari** (`PATCH /crm/deals/:id`, `/won`, `/lost`, `/stage`, `DELETE`) — `sales_manager|director|super_admin`; egalik tekshiruvi yo'q. `id` — uuid (sanab chiqish qiyin).
5. **`PUT /sd/payments/:id`** — summa o'zgartiradi; `sales_manager|SALES|accountant` uchun ochiq, egalik tekshiruvi yo'q.

> Ehtiyot: bugungi rol-holatida (§3.2) bu endpointlarning ko'pini faqat 4 foydalanuvchi chaqira oladi. Lekin `@Roles` siz bo'lganlari (1, 2 va `/papka-orders`) — **32 foydalanuvchining hammasiga** ochiq.

### 3.7 Pul endpointlari

| Endpoint | Pul ta'siri | `@Roles` |
|---|---|---|
| `POST /sd/payments` | to'lov yaratish | `sales_manager, SALES, director, super_admin, accountant` (`sd-payments.controller.ts:35,40`) |
| `PUT /sd/payments/:id` | **summa/status o'zgartirish** | shu class `SD_ROLES` (`:104`) |
| `POST /sd/orders/:id/advance-bypass` | avans darvozasini chetlab o'tish | `director, super_admin` (`sd-orders.controller.ts:194`) ✅ tor |
| `POST /sd/orders/:id/advance-payment` | avansni tasdiqlash | `finance, finance_manager, director, super_admin` (`:224`) ✅ tor |
| `PATCH /crm/deals/:id/won` | `actualAmount` bilan yopish | `sales_manager, super_admin, director` |

Eng bo'sh darvoza — `PUT /sd/payments/:id`.

---

## 4. ORPHAN SWEEP (100% ishonch)

### 4.1 Usul

Har orphan komponent uchun butun `artifacts/erp-dashboard/src` bo'ylab: (i) komponent nomiga murojaat (o'z fayllari va `routes/` dan tashqari), (ii) yo'l-satriga murojaat, (iii) boshqa marshrutda ro'yxatdan o'tganmi. Uchalasi ham nol bo'lsa → o'chirish nomzodi.

### 4.2 Alias-marshrutlar (3) — sahifa tirik, faqat ortiqcha yozuv

| Orphan yo'l | Route | Tirik yo'li |
|---|---|---|
| `/ai-crm` | `CRMRoutes.tsx:51` | `/ai/crm` [sidebar] |
| `/sd/quotations` | `CRMRoutes.tsx:62` | `/sd/sales-quotes` [sidebar] |
| `/sd/manager-panel` | `CRMRoutes.tsx:83` | `SDExtended` (`/sd/warehouse-rental`, `/sd/advance-control`) |

### 4.3 To'liq o'lik sahifalar (12 komponent, 16 marshrut)

Barchasida tashqi murojaat **0**, yo'l-satriga tashqi murojaat **0**.

| Komponent | Orphan yo'l(lar) | Fayl | Qator | BE endpointining boshqa iste'molchisi |
|---|---|---|---|---|
| `CrmFunnelAnalytics` | `/crm/funnel` | 1 | 383 | **yo'q** |
| `CrmRfmClusters` | `/crm/rfm` | 1 | 166 | **yo'q** |
| `CrmCohortAnalysis` | `/crm/cohort` | 1 | 200 | **yo'q** |
| `CRMActivities` | `/crm/activities` | 4 | 643 | ✅ bor: `components/crm/activity/*` (7 forma), `BitrixActivityPanel`, offline replay (`erp-offline-db.ts:299`) |
| `CRMSettings` | `/crm/settings` | 5 | 947 | ✅ bor: jonli `CRMFunnelSettings.tsx` |
| `SDEuroprint` | `/sd/crm` | 1 (+8) | 65 (+1221) | — |
| `SDSalesManagement` | `/sd/sales-management`, `/sd/invoices`, `/sd/forecast`, `/sd/analytics`, `/sd/commission` | 3 | 613 | faqat `lib/api/sd.ts` (o'zi ham o'lik) |
| `SDDebitors` | `/sd/debitors` | 2 | 292 | faqat `hooks/use-sd.ts` (o'lik) |
| `SDOverviewDashboard` | `/sd/dashboard/overview` | 2 | 351 | — |
| `SDLeads` | `/sd/leads` | 1 | 752 | `components/sd/europrint/LeadsTab.tsx` (u ham o'lik) |
| `SDDeliveries` | `/sd/deliveries` | 1 | 496 | faqat `lib/api/sd.ts` / `hooks/use-sd.ts` (ikkalasi o'lik) |
| `OrdersRegistry` | `/orders-registry` (`AdminRoutes.tsx:92`) | 4 | 603 | **yagona iste'molchi** — o'chirilsa `OrdersRegistryCompatController` (2 route) ham o'ladi |

### 4.4 ⭐ Yangi: o'lik FE ma'lumot qatlami

Sahifa-darajasidan chuqurroq:

| Fayl | Qator | Holat |
|---|---|---|
| `hooks/use-sd.ts` | 84 | **12 hookning hammasi o'lik** — faqat `hooks/use-sd.test.ts` import qiladi |
| `hooks/use-sd.test.ts` | 123 | yuqoridagini sinaydi |
| `lib/api/sd.ts` | 71 | faqat `SDDebitors.tsx` va `SDSalesManagementSectionsA.tsx` (ikkalasi orphan) import qiladi |

Ya'ni "backend endpointining boshqa iste'molchisi bor" degan xulosa `SDDeliveries`/`SDDebitors` uchun **noto'g'ri** — o'sha "iste'molchi"lar ham o'lik o'ramchilar.

**Jami o'chirilishi mumkin FE kod: ~7010 qator** (5511 sahifa + 1221 `components/sd/europrint/` + 278 o'lik ma'lumot qatlami).

### 4.5 Ehtiyot: qiymatli orphanlar

`CrmFunnelAnalytics` (vizyon M13 #51) va `CrmRfmClusters` (M13 #69) ortidagi **backend servislari real va ishlaydi** (`funnel.service.ts`, `rfm/clv/kmeans.service.ts`). Bular "o'lik kod" emas — **ulanmagan qiymat**. `SDDebitors` (debitor-aging) va `SDDeliveries` (#51 zanjiri) ham shunday. O'chirishdan oldin §8 qarori kerak.

### 4.6 Backend

`modules/sd` (12 controller) + `modules/crm` (17) = **29, hammasi modulda ro'yxatda, birortasi ham o'lik emas.**
`CrmAutoLeadController` (10 route) FE'dan chaqirilmaydi, lekin **o'lik emas** — tashqi webhook intake (`@Public()` + `WebhookSignatureGuard`, `common/guards/webhook-signature.guard.ts:6,18`).

---

## 5. INTEGRATSIYA VA BOG'LIQLIK XARITASI (DB-isbot bilan)

### 5.1 Event inventari

**SD chiqaradi:** `OrderCreatedEvent` (→ Kanban `kanban.module.ts:38`, Logistics `logistics.module.ts:31`, Notifications `notifications.module.ts:47` — **PP yo'q**), `OrderStatusChangedEvent` (→ PP `pp.module.ts:129`, Logistics, Kanban), `AdvanceApprovedEvent` (→ SD fan-out `sd.module.ts:108`, PP `pp.module.ts:130`), `TechThreeCheckpointEvent` (→ Finance `finance.module.ts:173`), `OrderMaterialWaitingEvent` (→ MM `mm.module.ts:69`), `DeliveryGoodsIssuedEvent` (→ WMS `wms.module.ts:167`).

**CRM chiqaradi:** `DealWonEvent` (→ SD `sd.module.ts:106`, Notifications), `LeadConvertedEvent` (→ CRM `crm.module.ts:144` → `sd_customers`), **`DealLostEvent` — tinglovchisi yo'q** (zero-listener event).

### 5.2 Zanjirlar (uchalasi ham uzilgan)

**(a) SD buyurtma → PP.** Ikki yo'l `createPlanFromSalesOrder` (`drizzle-pp.repo.ts:144`) ga boradi.
DB: `sales_orders.master_status` **NULL × 13**; `status` = delivered 8 / in_progress 2 / confirmed 1 / closed 1 / cancelled 1; `ready_for_planning` — **0**. `production_orders` 7 qator, `sales_order_id` bilan **1** (SO 56 = `GT-2026-001`, `status='completed'`, seed). `domain_events` da `sd.order.status_changed` **yo'q**.
→ Zanjir **hech qachon real buyurtmada ishlamagan**.

**(b) SD yetkazish → tayyor mahsulot ombori.** Jadval nomi **`deliveries`** (BASE), qatorlari `delivery_items` (BASE).
- `delivery_items` ga **INSERT qiluvchi kod butun BE'da 0 ta**; jadval 0 qator.
- Listener `wms/…/delivery-goods-issued.listener.ts:54` — `const DELIVERY_51_DISABLED = true;` (**kodda konstanta, env emas**), `handle()` `:74` da qaytadi.
- `warehouse_stock_fg` = 0 qator.
- ⭐ Bonus: `POST /sd/deliveries` jonli bazada **yiqiladi** — Drizzle `deliveries.id` = `uuid` + cuid (`schema-misc.ts:20`), jonli DB = `integer` + `nextval`. **Rollback-probe:** `INSERT … id='cuid_probe'` → `XATO: неверный синтаксис для типа integer`.

**(c) CRM lid → bitim → buyurtma.**
Jadval haqiqati: `crm_leads` BASE 16 · `deals` BASE 5 · `crm_deals` **VIEW** → `deals` · `leads` BASE **0** · `marketing_leads` BASE.
Bog'lanish: `deals.lead_id` uuid, **FK yo'q**; `deals.sales_order_id` → `fk_deals_sales_order` FK bor. Lid→bitim aslida `metadata->>'lead_id'` jsonb orqali.
DB: 5 deal'ning **hammasida** `lead_id` NULL va `sales_order_id` NULL; `won` bo'lgan 1 deal ham bog'lanmagan. `sales_orders.deal_id`/`crm_deal_id`/`crm_lead_id` — 13/13 NULL.
→ `DealWonListener` (`deal-won.listener.ts:55` `CreateOrderCommand`) mavjud, lekin **hech qachon yakunlanmagan**. Sababi §2.4 da: FE `/won` ni chaqirmaydi, kanban `/stage` ga boradi.

**(d) SD to'lov / avans → Finance GL.**
Kanonik ledger = **`entries`** (BASE, 6 qator). `gl_entries` = VIEW. `gl_journal_entries` 0, `gl_lines` 0, `pos_gl_postings` 0.
- **mark-paid GL legi o'lik:** `drizzle-quotation.repo.ts:217` `RETURNING id, status, updated_at` — **`amount` yo'q** → `sd-quotations.service.ts:301` `const amount = Number(r.data['amount'] ?? 0)` = 0 → `:302` `if (amount > 0)` doim false → `postCustomerPayment()` **hech qachon chaqirilmaydi**.
- **avans-tasdiq GL ga umuman tegmaydi** (`confirm-advance-payment.handler.ts` faqat `advance_paid` yozadi).
- `entries` tarkibi: `POS-GL-2`, `PAYROLL-2-…`, va `GL-000000006..9` (`SD_INVOICE/SD_COGS/SD_VAT/SD_DELIVERY_COST`, hammasi `GT-2026-001` seed buyurtmasi). **`CP-` prefiksli (mijoz to'lovi) qator 0 ta.**

**(e) tech-checkpoint bayroqlari.** `tech_bom_approved`/`tech_routing_approved`/`tech_card_approved` — **yozuvchi 0 ta**, o'quvchi 3 ta (`tech-three-checkpoint.listener.ts:69-71`; `drizzle-sales-order.repo.ts:278-280`; `get-order-by-id.handler.ts:44-49`). DB: 0/13.

### 5.3 Bog'liqlik xaritasi

**SD/CRM nimaga tayanadi:** Finance (`GlPostingService`, `AdvanceApprovedEvent`/`TechThreeCheckpointEvent` klasslari), PP (`PpCancelledEvent`), CRM→SD (`DealWonEvent`).
**SD/CRM ga nima tayanadi:** PP, WMS, MM, Kanban, Logistics, Notifications, Finance.
**`sales_orders` ga FK bilan bog'langan 15 jadval** (`pg_constraint`): `production_orders`(7), `sales_order_items`(2), `deliveries`(1), `deals`(5), `sd_order_departments`(0), `ow_material_requirements`(0), `billing_documents`, `papka_orders`, `sd_lost_orders`, `sd_reclamations`, `delivery_request_fulfillment_shadow`, `ow_molds`, `ow_cliches`, `ow_tech_cards`, `ow_shipping_requests`.

### 5.4 Tuzatish → boshqa modullarda nima uyg'onadi (tartib belgilaydi)

| Tuzatish | Uyg'onadigan uxlab yotgan listener | Nima yoziladi | Xavf |
|---|---|---|---|
| **1. `tech_*_approved` ni saqlash** | Finance `TechThreeCheckpointListener` **birinchi marta** | `sales_orders.master_status='ready_for_planning'`, `pp_queued_at`; keyin `AdvanceApprovedEvent` | 🔴 Yuqori — kaskad |
| **2. (1) natijasida `AdvanceApprovedEvent`** | PP `AdvanceApprovedListener` **+** SD `AdvanceApprovedFanoutListener` (bir vaqtda) | `production_orders`; `sd_order_departments`, `ow_material_requirements` (hozir 0) → `OrderMaterialWaitingEvent` → MM `hitl_approvals` | 🔴 Yuqori — PP + MM + SD fan-out birdan jonlanadi |
| **3. `customer_id` ni buyurtma yaratishga qo'shish** | — | Buyurtma yaratish umuman ishlay boshlaydi | 🟠 O'rta |
| **4. FE'ni `/won` ga ulash** | SD `DealWonListener` | `sales_orders` yaratiladi + `deals.sales_order_id` bog'lanadi | 🔴 Yuqori — CRM→SD oltin ip jonlanadi |
| **5. `RETURNING amount`** (+ uuid→`Number()` tuzatish birga) | — | `entries` ga `CP-` qatorlar | 🔴 Yuqori — birga tuzatilmasa hamma to'lov `CP-0` da to'qnashadi |
| **6. `employees.role` / `assigned_to` backfill** | — | Batch-1 scoping ishlay boshlaydi | 🟠 O'rta — menejerlar birdan faqat o'zinikini ko'radi |
| **7. `delivery_items` yozuvchisi + `#51`** | WMS `DeliveryGoodsIssuedListener` | `warehouse_stock_fg` kamayishi | 🔴 Yuqori (ombor) — POS zayavka yo'li bilan **ikki marta kamayish** xavfi |
| **8. Orphan o'chirish** | — | — | 🟢 Past (`OrdersRegistryCompatController` birga o'ladi) |

**Tuzatish tartibi (bog'liqlik bo'yicha):** 3 → 1+2 → 4 → 5 → 6 → 7 → 8.

---

## 6. DIZAYN / UI IZCHILLIGI

### 6.1 Etalon naqshlar (kodda topilgan)

| Element | Kanonik komponent | Ta'rif |
|---|---|---|
| Sahifa sarlavhasi | `EPPageHeader` | `components/ep/EPPageHeader.tsx:97` |
| Sahifa qobig'i | `DedicatedPageShell` (`space-y-6` + EPPageHeader) | `components/DedicatedPageShell.tsx:27,37` |
| Raqobatchi qobiq (**nokanonik**) | `ModulePage` — o'z `<h1>` ini chizadi | `components/ui/module-page.tsx:120,145` |
| Jadval | `EPTable` | `components/ep/EPTable.tsx:69` — **qabul qilinishi: 0 sahifa** |
| Bo'sh holat | `EPEmptyState` | `components/ep/EPEmptyState.tsx:42` |
| Xato holat | `EPErrorState` | `components/ep/EPErrorState.tsx:105` |
| Yuklanish | `EPSkeletonTable/KpiRow/Card` | `components/ep/EPSkeleton.tsx:36,54,73` |
| Birlashgan holat | `PageState` | etalon: `SDContracts.tsx:202` |
| O'chirish tasdiqi | `DeleteConfirmDialog` (AlertDialog) | `components/delete-confirm-dialog.tsx:6-16` |
| Ranglar | `--ep-*` / `--mod-*` | `erp-modern-ui/europrint-mockup-theme.css:17`; `ep-motion-helpers.css:25` |

Auditlanayotgan qoidalar: **CLAUDE.md Qoida 21** (xom rang taqiq), **Qoida 14** (o'chirishga tasdiq), **Qoida 13** (fayl ≤900 qator), **F2** (`useMutation.onError` majburiy), `DIZAYN_QOIDALARI.md` D-1/D-3/D-4/D-7/D-9.

### 6.2 Sahifa matritsasi (qisqartirilgan)

| Sahifa | Header | Yuklanish | Bo'sh holat | Xom rang | Verdikt |
|---|---|---|---|---|---|
| SDDashboard | raw `<h1>` `:322` | EPSkeleton ✓ | raw matn | **51 inline `style`**, parallel token (`--fg2`, `--accent-coral`) | **DIVERGES** |
| SDCustomers | EPPageHeader ✓ | EPSkeleton ✓ | raw matn `:364` | toza | ko'proq mos |
| Customer360Page | yo'q | — | raw Card | token-arb | **DIVERGES** (`p-6 max-w-6xl` ikki karra padding `:30`) |
| CRMWorkspace | custom `<h2>` `:294` | spinner | — | toza | **DIVERGES** (`p-4` ikki karra; **o'chirish tasdiqsiz**) |
| SalesOrders | EPPageHeader ✓ | EPLoader | child | toza | ko'proq mos (`deleteSalesOrder` `onError` yo'q `:127`) |
| AiCrmPage | EPPageHeader ✓ | — | — | toza | mos (AI-sahifa istisnosi) |
| SDSalesQuotes | EPPageHeader ✓ | EPSkeleton ✓ | EPEmptyState ✓ | toza | ko'proq mos (o'chirish `Dialog`, AlertDialog emas) |
| SDSalesOrders | EPPageHeader ✓ | raw matn `:445` | raw `:462` | toza | **DIVERGES** |
| SDOrderDetail | raw `<h1>` `:250` | shadcn Skeleton | EPEmptyState ✓ | toza | **DIVERGES** |
| PapkaOrders | EPPageHeader ✓ | EPLoader | child | toza | ko'proq mos (`update`/`delete` `onError` yo'q) |
| SDContracts | EPPageHeader ✓ | PageState ✓ | PageState ✓ | toza | **FOLLOWS** (etalon) |
| OrderCreationWizard | bespoke Wizard header | EPErrorState | — | toza | ko'proq mos (ataylab wizard) |
| SDExtended(+Sections2) | EPPageHeader ✓ | 1 Skeleton | — | toza | mos (raw `<table>`) |
| SDLostOrders | EPPageHeader ✓ | EPSkeleton ✓ | EPEmptyState ✓ | toza | **FOLLOWS** |
| SDSalesPayments | EPPageHeader ✓ | raw matn `:290` | raw `:379` | toza | **DIVERGES** |
| SDKpi | EPPageHeader ✓ | raw `animate-pulse` `:228` | — | toza | **DIVERGES** |
| SDSettings | EPPageHeader ✓ | raw matn `:129` | — | toza | **DIVERGES** (ikki karra padding) |
| CRMFunnelSettings | `ModulePage` `:96` | shadcn Skeleton `:108` | raw Card `:109` | toza | **DIVERGES** |
| SDQuotaDashboard | EPPageHeader ✓ | raw `animate-pulse` `:34` | — | toza | **DIVERGES** |

**Xom rang bo'yicha bosh xulosa:** 21 sahifaning **birortasida ham** xom hex / `rgba()` / Tailwind `[#hex]` topilmadi — Qoida 21 ning pre-commit gate'i (`scripts/check-design-tokens.mjs`) ushlab turibdi. Yagona chetlanish — `SDDashboard` ning parallel **token** nomlar fazosi va 51 inline `style` obyekti (rang emas, komponent qoidasi buzilishi).

**Fayl hajmi (Qoida 13):** to'plamda 900 qatordan oshgan fayl yo'q; eng kattasi `SDSalesOrders.tsx` = **899**.

### 6.3 Guruhlangan tuzatish ro'yxati

- **A — `EPPageHeader` ga o'tkazish:** `SDDashboard.tsx:322`, `SDOrderDetail.tsx:250`, `CRMWorkspace.tsx:294`, `CRMFunnelSettings.tsx:96` (yoki `ModulePage` ni `EPPageHeader` ga delegat qilish — bir tuzatish barcha chaqiruvchiga foyda).
- **B — `EPSkeleton*` ga o'tkazish:** `SDSalesOrders.tsx:445`, `SDSalesPayments.tsx:290`, `SDSettings.tsx:129`, `SDKpi.tsx:228`, `SDQuotaDashboard.tsx:34`, `SDOrderDetail.tsx:212`, `CRMFunnelSettings.tsx:108`.
- **C — `EPEmptyState` ga o'tkazish:** `SDSalesOrders.tsx:462`, `SDSalesPayments.tsx:379`, `SDCustomers.tsx:364`, `CRMFunnelSettings.tsx:109`.
- **D — ikki karra padding:** `Customer360Page.tsx:30`, `CRMWorkspace.tsx:282`, `SDSettings.tsx:126` → `space-y-6`.
- **E — `SDDashboard` ni EP komponentlariga ko'chirish** (51 inline `style`, eng katta bitta ish).
- **F — o'chirish tasdiqi:** `CRMWorkspace.tsx:91,177` — **tasdiq umuman yo'q** (Qoida 14 buzilishi); `SDCustomers.tsx:517`, `SDSalesQuotes.tsx:417` — `Dialog` o'rniga `DeleteConfirmDialog`.
- **G — `onError` yo'q mutatsiyalar (F2):** `SalesOrders.tsx:127`, `PapkaOrders.tsx:117,129`.

---
## 7. VIZYON TAQQOSLASH

### 7.1 Manba va usul

Master vizyon rejasi `docs/audit/` ichidan qidirish bilan topildi: **`FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md`** (27 640 qator; `docs/audit/` da "item-level"/"master-plan" naqshiga mos yagona fayl).

SD/CRM bo'limlari:
- **`## [Module 06] SD/Sotuv`** — 6871-qator, **157 item**
- **`## [Module 13] CRM`** — 16068-qator, **135 item**
- **Jami 292 item.**

Reja har item uchun `Current status` (Ha / Qisman / Yo'q / STALE-DOC) va evidence saqlaydi; uning bahosi asosan **kod mavjudligiga** tayanadi. Bu tahlil unga **runtime haqiqatini** qo'shadi (Q-40).

`STALE-DOC` = manba vizyon hujjatidagi status eskirgan (masalan `order_cancellation_rules` "Qisman" deb belgilangan, aslida jadval **umuman yo'q**) → tasnifda `MISSING`.

### 7.2 Reja `Ha` bergan 21 itemning shu tahlirdagi qayta tekshiruvi

Yolg'on `Ha` eng xavflisi, shuning uchun **21 tasining hammasini** shaxsan tekshirdim. **11 tasi pasaytirildi.**

| Item | Reja | Yakuniy | Shu tahlirdagi dalil |
|---|---|---|---|
| M06 #94 To'lov tasdiqlangach avto GL | `Ha` | ⛔ **MISSING** | `drizzle-quotation.repo.ts:217` `RETURNING` da `amount` yo'q → `sd-quotations.service.ts:302` `if (amount>0)` doim false; `entries` da `CP-` qator **0** |
| M06 #93 Tasdiqlangan buyurtma → PP | `Ha` | PARTIAL | `master_status` 0/13; `domain_events` da `sd.order.status_changed` yo'q; yagona bog'langan PO — seed |
| M06 #119 Summa/Ostalos avto | `Ha` | PARTIAL | `paid_amount` 13/13, `balance_due_amount` **1/13** |
| M06 #137 Yetkazish fakti qayd | `Ha` | PARTIAL | rollback-probe: Drizzle `uuid` ↔ jonli `integer serial` → `POST /sd/deliveries` yiqiladi; `deliveries`=1 seed |
| M13 #51 Voronka + konversiya | `Ha` | PARTIAL | `funnel.service.ts` real, FE `CrmFunnelAnalytics` — **ORPHAN** |
| M13 #55 Avto biriktirish (round-robin) | `Ha` | PARTIAL | `employees.role='sales_manager'` → **0 nomzod**; `crm_leads.assigned_to` 0/16 |
| M13 #63 AI Next Best Action | `Ha` | PARTIAL | natija faqat FE state'da (`AiCrmPage.tsx:39`); inson-tasdiq yo'q |
| M13 #64 AI churn + qaytarish vazifasi | `Ha` | PARTIAL | `POST /crm/ai/churn` hardcoded `{churnRisk:'low',score:0}` (`crm-extended.service.ts:168`) |
| M13 #66 Oltin ip: bitim → buyurtma | `Ha` | PARTIAL | `deal-won.listener.ts:55` mavjud; `won` deal'da `sales_order_id` NULL, `sales_orders.deal_id` 0/13; FE `/won` ni chaqirmaydi |
| M13 #69 RFM/CLV panel | `Ha` | PARTIAL | servislar bor, FE `CrmRfmClusters` — **ORPHAN** |
| M13 #77 Boshliq CRM dashboard | `Ha` | PARTIAL | FE sahifasi aniqlanmadi — **unverified** |

**Haqiqatan FULLY DELIVERED (10):** M06 #57 (narx formulasi komponentlari), #68 (ABC 80/15/5), #73 (kotirovka→buyurtma tugmasi), #86 (ko'p qatorli buyurtma), #95 (mijoz rekvizitlari) · M13 #53 (ko'p manba), #54 (veb+Telegram avto lid), #61 (hot-lead chegaralari), #65 (Mijoz 360°), #67 (yagona kanonik mijoz bazasi).

### 7.3 Yakuniy tasnif

| Tasnif | SD (157) | CRM (135) | **Jami (292)** | % |
|---|---|---|---|---|
| **FULLY DELIVERED** | 5 | 5 | **10** | **3.4 %** |
| **PARTIALLY DELIVERED** | 70 | 41 | **111** | **38.0 %** |
| **MISSING** | 82 | 89 | **171** | **58.6 %** |

> Reja o'zi `Ha` = 21 (7.2 %) degan. Runtime tekshiruvi uni **10 ga (3.4 %)** tushirdi — "qurilgan" deb belgilangan har ikkinchi item aslida **ishlamaydi**.

Quyida **292 itemning to'liq ro'yxati**; birortasi "mayda" deb tashlanmadi.

### 7.2 Module-06 SD/Sotuv — 157 item

| # | Vizyon itemi | Reja | **Yakuniy** | Fresh dalil / izoh |
|---|---|---|---|---|
| 1 | Har qatorga alohida ishlab chiqarish buyurtmasi (OrderLineConfirmed event) | `Qisman` | **PARTIAL** |  |
| 2 | MaterialRequiredEvent outbox; MM rad/24s→eskalatsiya | `Yo'q` | **MISSING** |  |
| 3 | Uch shart ketma-ket gate (kredit→to'lov→maket), gate_status JSONB | `Yo'q (advance leg alone is` | **MISSING** |  |
| 4 | FIFO partiya narxi tasdiqda muzlatiladi (unit_cost_snapshot) | `Yo'q` | **MISSING** |  |
| 5 | Kotirovka 14-kun muddat, narx avto-yangilanish, +5% menejer tasdiq | `Yo'q` | **MISSING** |  |
| 6 | Davallческое material owner_type='client', kafolat depoziti Moliyada | `Qisman` | **PARTIAL** |  |
| 7 | ±10% og'ish ruxsat, 15%+ menejer tasdiq, hisob-faktura real miqdorga | `Yo'q` | **MISSING** |  |
| 8 | Jarima % order_cancellation_rules (30/70/100%), GL entries | `STALE-DOC` | **MISSING** | Manba vizyon hujjati eskirgan (reja tuzatgan). |
| 9 | debtorControl GSD = menejer ochiq qarzi; 30+ kun 1.5x; haftalik | `Qisman (STALE-DOC on the "` | **PARTIAL** |  |
| 10 | HR EmployeeDeactivated→mijozlar rahbar tanlagan menejerga | `Yo'q` | **MISSING** |  |
| 11 | Avans bank tasdig'ini kutadi, PaymentConfirmedEvent | `Yo'q` | **MISSING** |  |
| 12 | Chegirma faqat 100% avansda (95%=chegirmasiz) | `Yo'q` | **MISSING** |  |
| 13 | Umumiy chegirma poli ≈15% maks, checkDiscountCap() | `Yo'q` | **MISSING** |  |
| 14 | Klishe ≈3 yil saqlash, cron ogohlantirish, hisobdan chiqarish akti | `Yo'q` | **MISSING** |  |
| 15 | Mavsum-oldi 8 hafta cron, AI tavsiya miqdor | `Yo'q` | **MISSING** |  |
| 16 | Qisman blok per_line: bitta qator Ожд.Сырьё, boshqalar davom | `Yo'q` | **MISSING** |  |
| 17 | Har rang alohida: bo'yoq=rang×qoplama%×yuza | `Qisman` | **PARTIAL** |  |
| 18 | Shared forma avto-aniqlash + ogohlantirish (blok yo'q) | `Yo'q` | **MISSING** |  |
| 19 | CRP dan keyingi va'da → delay_risk_days, urgent flag, AI xavf | `Yo'q` | **MISSING** |  |
| 20 | ReclamationOpenedEvent→QC; ResolvedEvent→GL kredit-nota+WMS restock | `Qisman (STALE-DOC on the d` | **PARTIAL** |  |
| 21 | Leaderboard Dush-Yaksh; HR ta'til kuni KPI'dan chiqadi, LeaveApprovedEvent | `Qisman (STALE-DOC on the d` | **PARTIAL** |  |
| 22 | Buyurtma ID=sales_orders.id (int)+order_number; hamma modul int FK | `Qisman` | **PARTIAL** |  |
| 23 | PDF internal/external shablon, margin rolga qarab yashirin | `Yo'q` | **MISSING** |  |
| 24 | Qisman yetkazishga alohida faktura (invoice_type='partial'), GL | `Yo'q` | **MISSING** |  |
| 25 | Bildirishnoma fallback: Telegram→SMS→email→menejer; notification_channel | `Yo'q` | **MISSING** |  |
| 26 | ABC event-based recalc; A→B alert; kredit limit avto (CreditLimitAdjustedEvent) | `Qisman` | **PARTIAL** |  |
| 27 | Nofaol mijoz cron (tunda), crm_inactivity_rules A=90/B=60/C=30 | `Yo'q` | **MISSING** |  |
| 28 | AI Офсет vs Флексо tavsiya (blok emas), 100% yuklamada alternativ | `Yo'q` | **MISSING** |  |
| 29 | Ko'p qatorli buyurtmada per-line muddat, per_line_scheduling=true | `Yo'q` | **MISSING** |  |
| 30 | 1C raqam INN/telefon match, sd-customers-import.service; doimiy saqlash | `Yo'q` | **MISSING** |  |
| 31 | WMS EXTERNAL_OUT mashina/pallet taqqoslash, logistika ogohlantirish | `Yo'q` | **MISSING** |  |
| 32 | Папка № folder_number unique; 1 papka:N buyurtma; papka_orders VIEW | `Qisman (STALE-DOC — better` | **PARTIAL** |  |
| 33 | Eng yuqori revision aktiv, eski immutable; v2>v1 avto-bekor | `Qisman` | **PARTIAL** |  |
| 34 | Faqat menejer SHAXSIY chegirmasi bonusdan tushadi; payroll_calculations | `Yo'q` | **MISSING** |  |
| 35 | Davallческое QC karantin, QC rad→QC_HOLD; menejer hal | `Yo'q` | **MISSING** |  |
| 36 | Mijoz AI'ga qarshi marka (E1): AI xavf, menejer tasdiq, client_override_log JSONB | `Yo'q` | **MISSING** |  |
| 37 | Hisob-faktura raqami DB SEQUENCE (invoices_number_seq) atomic | `Qisman` | **PARTIAL** |  |
| 38 | Maqsad oy o'rtasida rasmiy so'rov→yuqori tasdiq; leaderboard retroaktiv emas | `Qisman (STALE-DOC on the "` | **PARTIAL** |  |
| 39 | INN/telefon dublikat QATTIQ BLOK; qo'lda merge; Coordination vazifa | `Qisman (STALE-DOC — better` | **PARTIAL** |  |
| 40 | Кашировка offset+gofra sinxron: predecessor_order_id, MES hard constraint | `Yo'q` | **MISSING** |  |
| 41 | Nofaol menejer hujjatlari immutable (F5); yangi mas'ul ko'rsatiladi | `Qisman` | **PARTIAL** |  |
| 42 | NDS BE service qatlamida (price_with_vat), tax_rates jadval; FE/PDF BE'dan | `Qisman` | **PARTIAL** |  |
| 43 | Margin @Roles guard; SdOrderProjection::forRole query-darajasida chiqarish | `Yo'q` | **MISSING** |  |
| 44 | отгрузка+N kun hisob, OrderShippedEvent, payment_delay_days; faqat keyingi отгрузка | `Yo'q` | **MISSING** |  |
| 45 | Etiketka руlon birligi; PP rulon→dona unit_conversion_rules; WMS material_type='roll' | `Yo'q` | **MISSING** |  |
| 46 | Prosrochka bo'yicha yangi buyurtmani Daromadlar boshlig'i tasdiqlaydi; razryad RBAC; SLA 24s | `Qisman` | **PARTIAL** |  |
| 47 | PP AI navbat 3 mezon (promised_date/ABC/yuklama); queue_position, estimated_start | `Yo'q` | **MISSING** |  |
| 48 | Muzlatilgan zona ≈3 kun; shoshilinch faqat director/egasi; urgent_order_surcharge | `Qisman` | **PARTIAL** |  |
| 49 | AI haftalik pattern (sifat 3+ hafta) → Director+QC signal, QC CAPA avto (E3/E1) | `Qisman` | **PARTIAL** |  |
| 50 | Distributed transaction outbox; kompensatsiya event; idempotent handler | `Qisman` | **PARTIAL** |  |
| 51 | Buyurtma majburiy maydonlar (tur+o'lcham+tiraj+muddat+mijoz+narx) | `Qisman` | **PARTIAL** |  |
| 52 | Mahsulot turlari qattiq ro'yxati (~15 tur) | `Yo'q` | **MISSING** |  |
| 53 | O'lcham U×K×B → avto yuza (m²) + priklad % | `Qisman (egasi-data)` | **PARTIAL** |  |
| 54 | Tiraj birligi mahsulot turiga qarab (dona/m²/list) | `Qisman` | **PARTIAL** |  |
| 55 | Muddat: mijoz-so'ragan + zavod-va'dasi ikki sana | `Qisman` | **PARTIAL** |  |
| 56 | MOQ + kichik-partiya ustamasi | `Yo'q` | **MISSING** |  |
| 57 | Narx formulasi har komponent ko'rinadi | `Ha` | **FULLY** |  |
| 58 | Qog'oz narxi ombor FIFO/o'rtacha tannarxdan | `Qisman` | **PARTIAL** |  |
| 59 | Bo'yoq (rang×qoplama%×yuza) hisobi | `Qisman` | **PARTIAL** |  |
| 60 | Ish haqi marshrut tariflaridan yig'iladi | `Qisman` | **PARTIAL** |  |
| 61 | Qo'shimcha operatsiyalar alohida qator+tarif | `Qisman` | **PARTIAL** |  |
| 62 | Klishe/shtamp alohida, mijoz to'laydi, takrorda olinmaydi | `Qisman (egasi-data)` | **PARTIAL** |  |
| 63 | Narx pog'onasi (tiraj oshsa dona narx pasayadi) | `Yo'q` | **MISSING** |  |
| 64 | Chegirma turlari ro'yxati, har biri foiz limiti | `Yo'q` | **MISSING** |  |
| 65 | Chegirmalar jamlanish shifti (~15% maks) | `Yo'q` | **MISSING** |  |
| 66 | Chegirmaga pog'onali ruxsat (0-5/5-10/10%+) | `Qisman` | **PARTIAL** |  |
| 67 | Narx floor (tannarxdan past bloklanadi) | `Yo'q` | **MISSING** |  |
| 68 | Mijoz ABC toifasi (80/15/5) avto | `Ha` | **FULLY** |  |
| 69 | Toifaga bog'liq imtiyoz-paket avto | `Yo'q (egasi-data claim in ` | **MISSING** |  |
| 70 | Kotirovka (KP) hujjat, raqam, PDF, convert | `Qisman` | **PARTIAL** |  |
| 71 | Kotirovka amal muddati (14 kun) → muddati o'tgan | `Qisman` | **PARTIAL** |  |
| 72 | Kotirovka status zanjiri + har o'tishda sana | `Qisman` | **PARTIAL** |  |
| 73 | Kotirovka→Buyurtma aylantirish tugmasi | `Ha` | **FULLY** |  |
| 74 | Buyurtma statuslari zavod Rus statuslari | `Yo'q` | **MISSING** |  |
| 75 | IChga o'tkazish sharti (to'lov%+maket+limit OK) | `Qisman` | **PARTIAL** |  |
| 76 | Maket/dizayn tasdig'i majburiy (imzo saqlanadi) | `Qisman` | **PARTIAL** |  |
| 77 | Shartnoma turlari (bir martalik/ramochnyy/spets) | `Qisman` | **PARTIAL** |  |
| 78 | Shartnoma strukturalangan shartlar (to'lov/jarima/penya) | `Yo'q` | **MISSING** |  |
| 79 | To'lov sharti turlari (100%/50-50/N kun/konsignatsiya) | `Qisman` | **PARTIAL** |  |
| 80 | Debitor limiti mijozga (oshsa bloklanadi) | `Qisman` | **PARTIAL** |  |
| 81 | Limit oshganda direktor tasdig'i bilan ochiladi | `Qisman` | **PARTIAL** |  |
| 82 | Prosrochka → yangi buyurtma avto-tasdiqqa | `Qisman` | **PARTIAL** |  |
| 83 | Qayta buyurtma tugmasi (o'lcham/dizayn/shtamp ko'chadi) | `Qisman` | **PARTIAL** |  |
| 84 | Takrorda narx avto-qayta, eski narx yonida | `Qisman` | **PARTIAL** |  |
| 85 | Mijoz kartasida mahsulot/dizayn arxivi | `Qisman` | **PARTIAL** |  |
| 86 | Bir buyurtmada ko'p mahsulot (ko'p qator) | `Ha` | **FULLY** |  |
| 87 | Qisman yetkazish + qisman to'lov | `Qisman` | **PARTIAL** |  |
| 88 | Ortiqcha/kam ICh (+/-N%), faktura real chiqimdan | `Yo'q` | **MISSING** |  |
| 89 | Bekor jarima bosqichga qarab (maket/bosildi/tayyor) | `Qisman` | **PARTIAL** |  |
| 90 | Sotuv KPI (hajm/bitim/o'rtacha/debitor/aging) | `Qisman` | **PARTIAL** |  |
| 91 | Lead voronka (lead→kotirovka→buyurtma) | `Qisman` | **PARTIAL** |  |
| 92 | Sotuvchi biriktiriladi + bonus marjadan | `Qisman` | **PARTIAL** |  |
| 93 | Tasdiqlangan buyurtma avto PP'ga (oltin-ip) | `Ha` | **PARTIAL** | ⭐ Fresh: `master_status` 0/13, `domain_events` da `sd.order.status_changed` yo'q, `production_orders` dagi yagona bog'langan qator seed (SO 56). Kod bor, hech qachon ishlamagan. |
| 94 | To'lov tasdiqlangach avto GL, debitor kamayadi | `Ha` | **MISSING** | ⭐ Fresh: `drizzle-quotation.repo.ts:217` `RETURNING id,status,updated_at` — `amount` yo'q → `sd-quotations.service.ts:302` `if (amount>0)` doim false → `postCustomerPayment()` chaqirilmaydi. `entries` da `CP-` qator 0 ta. |
| 95 | Mijoz kartasi rekvizitlari (INN/bank/toifa/limit) | `Ha` | **FULLY** |  |
| 96 | Mijoz unikalligi (INN/telefon dublikat) | `STALE-DOC` | **MISSING** | Manba vizyon hujjati eskirgan (reja tuzatgan). |
| 97 | Narx/tiraj/muddat o'zgarish jurnali | `STALE-DOC` | **MISSING** | Manba vizyon hujjati eskirgan (reja tuzatgan). |
| 98 | Karta-model RBAC (menejer/rahbar/direktor) | `Qisman` | **PARTIAL** |  |
| 99 | Buyurtma statuslari zavod Rus statuslari | `Yo'q` | **MISSING** |  |
| 100 | Ojd.Syryo → Ta'minotga material signal | `Yo'q` | **MISSING** |  |
| 101 | Bosma yo'nalishi Ofset/Flekso (+AI tavsiya) | `Yo'q` | **MISSING** |  |
| 102 | Mashina formati (72/52SM/KVA) tavsiya+narx | `Yo'q` | **MISSING** |  |
| 103 | Birlik (list/sht/m2) turdan avto | `Qisman` | **PARTIAL** |  |
| 104 | Material kimniki — davalcheskoe belgisi | `Yo'q` | **MISSING** |  |
| 105 | Mijoz fayllari (maket/trafaret) buyurtmaga | `Qisman` | **PARTIAL** |  |
| 106 | Buyurtma tasdig'idan TZ avto KB/DB ga (event) | `STALE-DOC` | **MISSING** | Manba vizyon hujjati eskirgan (reja tuzatgan). |
| 107 | Gruzopodyomnost (kg) → gofra qatlam AI tavsiya | `Yo'q` | **MISSING** |  |
| 108 | KP avto-PDF (logo+narx+to'lov+imzo) | `Yo'q` | **MISSING** |  |
| 109 | Kotirovka imzosi (komdir ism+tel) karta-modeldan avto | `Yo'q` | **MISSING** |  |
| 110 | KP yuborish huquqi faqat komdir/rahbar | `Qisman` | **PARTIAL** |  |
| 111 | Debitor 'Daromadlar bo'limi' alohida rol | `Yo'q` | **MISSING** |  |
| 112 | Korporativ raqamdan aloqa + qo'ng'iroq jurnali (NO-2) | `Qisman` | **PARTIAL** |  |
| 113 | Menejer ketsa mijoz avto qayta biriktiriladi | `Yo'q` | **MISSING** |  |
| 114 | Lead bosqichi + konversiya % | `Qisman` | **PARTIAL** |  |
| 115 | Mavsumiy mahsulot signal + o'tgan yil mijoz | `Yo'q` | **MISSING** |  |
| 116 | Mahsulot katalogi ~15 toifaga moslansin | `Yo'q` | **MISSING** |  |
| 117 | Stakan/pizza maxsus o'lcham shabloni | `Yo'q` | **MISSING** |  |
| 118 | Rulonnye samokleyki rulon parametrlari | `Yo'q` | **MISSING** |  |
| 119 | Summa/Ostalos (Jami/To'langan/Qoldiq) avto | `Ha` | **PARTIAL** | ⭐ Fresh: `paid_amount` 13/13, `balance_due_amount` 1/13. |
| 120 | Va'da sanasi ICh quvvatidan tasdiqlansin | `Qisman` | **PARTIAL** |  |
| 121 | Va'da↔real → kechikish kuni+sababi | `Qisman` | **PARTIAL** |  |
| 122 | Upakovka turi (stepler/pallet/veryovka)→vaqt+material | `Yo'q` | **MISSING** |  |
| 123 | Palletda dona soni + pallet o'lchami | `Yo'q` | **MISSING** |  |
| 124 | Klishe/forma egaligi + arxiv muddati (3 yil) | `Yo'q` | **MISSING** |  |
| 125 | Buyurtma rentabelligi real-vaqt, margin<X qizil | `Qisman` | **PARTIAL** |  |
| 126 | Tannarx/margin RBAC (faqat rahbar+ ko'radi) | `Qisman` | **PARTIAL** |  |
| 127 | To'lov sharti shabloni (50%+5kun; 100%; N kun) | `Qisman` | **PARTIAL** |  |
| 128 | Otgruzka+5 kun→qoldiq muddati avto+ogohlantirish | `Qisman` | **PARTIAL** |  |
| 129 | 100% avans → 5% chegirma avto | `Yo'q` | **MISSING** |  |
| 130 | Narx NDS'siz saqlanib QQS alohida qatorda | `Qisman` | **PARTIAL** |  |
| 131 | Buyurtma o'zgartirish jurnali (tiraj/muddat/narx) | `Qisman` | **PARTIAL** |  |
| 132 | Maket/dizayn tasdig'idan keyingina bosma — majburiy gate | `Qisman` | **PARTIAL** |  |
| 133 | Reklamatsiya buyurtma+sex/uchastka+sabab kodi | `Qisman` | **PARTIAL** |  |
| 134 | Yangi vs takror mijoz har xil oqim | `Yo'q` | **MISSING** |  |
| 135 | Faollik segmenti + ABC ikki o'lcham | `Qisman` | **PARTIAL** |  |
| 136 | Buyurtma ID=oltin-ip, har bosqich shu ID ga | `Qisman` | **PARTIAL** |  |
| 137 | Yetkazish fakti (haydovchi+mashina+vaqt) qayd | `Ha` | **PARTIAL** | ⭐ Fresh rollback-probe: Drizzle `deliveries.id`=uuid (`schema-misc.ts:20`), jonli DB=integer serial → cuid INSERT xato. `deliveries`=1 seed qator. |
| 138 | Kongrev va tisnenie ALOHIDA operatsiya | `Yo'q` | **MISSING** |  |
| 139 | Tisnenie rangi zoloto/serebro → ombor folga | `Yo'q` | **MISSING** |  |
| 140 | Laminatsiya turi (glyants/mat/metal) ro'yxatdan | `Yo'q` | **MISSING** |  |
| 141 | Lak turi (sploshnoy/trafaret/VD) + qoplama % | `Yo'q` | **MISSING** |  |
| 142 | Kashirovka (offset+gofra) alohida operatsiya+narx | `Yo'q` | **MISSING** |  |
| 143 | Vysechka turi (avtotigel/rotatsion/plotter) | `Yo'q` | **MISSING** |  |
| 144 | Skleyka turi (avtomat/ruchnaya/FSM)→vaqt+narx | `Yo'q` | **MISSING** |  |
| 145 | Bez oborota/s oborotom (bir/ikki tomon) 2x | `Yo'q` | **MISSING** |  |
| 146 | 3-makro/3-mikro gofra turi (lug'atdan) | `Yo'q` | **MISSING** |  |
| 147 | Gofroyashik qatlami (2/3/5-sloy) + AI yuk | `Yo'q` | **MISSING** |  |
| 148 | Banderol alohida pozitsiya | `Yo'q` | **MISSING** |  |
| 149 | Latok standart SKU katalogi (Latok-449...) | `Yo'q` | **MISSING** |  |
| 150 | 'Tex opisanie po bumagam' avto-matn | `Yo'q` | **MISSING** |  |
| 151 | Marka T22/profil S markaziy lug'atdan | `Yo'q` | **MISSING** |  |
| 152 | Plyonka qalinligi (30/100 mkr) ro'yxatdan | `Yo'q` | **MISSING** |  |
| 153 | 'Papka No' buyurtmaga bog'lansin (UNIQUE) | `Qisman` | **PARTIAL** |  |
| 154 | 'Zakaz 1S' eski raqamni ixtiyoriy saqlash | `Yo'q` | **MISSING** |  |
| 155 | Qisman yetkazish + qisman faktura | `Qisman` | **PARTIAL** |  |
| 156 | Hisob-faktura raqami DB SEQUENCE (invoices_number_seq) atomic | `STALE-DOC` | **MISSING** | Manba vizyon hujjati eskirgan (reja tuzatgan). |
| 157 | Bekor jarima bosqichga qarab (maket/bosildi/tayyor) | `Yo'q` | **MISSING** |  |

### 7.3 Module-13 CRM — 135 item

| # | Vizyon itemi | Reja | **Yakuniy** | Fresh dalil / izoh |
|---|---|---|---|---|
| 1 | Lid-scoring real-time trigger bilan (cron emas) | `Yo'q` | **MISSING** |  |
| 2 | Round-robin race `SELECT FOR UPDATE SKIP LOCKED` bilan | `Yo'q` | **MISSING** |  |
| 3 | Ochiq qarzda egasizlantirish bloklanadi (Finance signal) | `STALE-DOC` | **MISSING** | Manba vizyon hujjati eskirgan (reja tuzatgan). |
| 4 | Menejer tashrifini o'zi mobil orqali kiritadi (GPS ixtiyoriy) | `Yo'q` | **MISSING** |  |
| 5 | KP ko'rildi: email pixel + Telegram belgisi, aks holda qo'lda | `Yo'q` | **MISSING** |  |
| 6 | Narx oshganda ta'sirlangan mijoz ro'yxati + eski narx blok | `Yo'q` | **MISSING** |  |
| 7 | Qarz holati Finance'dan keshlanadi (5 daq TTL) + SD real-time tekshiruv | `Yo'q` | **MISSING** |  |
| 8 | Egasizlantirish CRON QC/Finance da'vosini tekshiradi | `Qisman` | **PARTIAL** |  |
| 9 | Caller ID ko'p mijozda korporativ liniya flagi + qo'lda tanlash | `Yo'q` | **MISSING** |  |
| 10 | Sinov davri bayrog'i HR "sinov tugadi" eventidan avto | `Yo'q` | **MISSING** |  |
| 11 | VIP/segment har buyurtmadan keyin trigger bilan qayta hisob | `Yo'q` | **MISSING** |  |
| 12 | Kredit limiti oshganda blok + Daromadlar+direktor tasdig'i | `Qisman` | **PARTIAL** |  |
| 13 | KP 14 kun o'tsa narx FIFO avto-yangilanadi + menejer tasdig'i | `Yo'q` | **MISSING** |  |
| 14 | Eksportda SQL `WHERE assigned_to=current_user` + field-RBAC + audit | `Yo'q` | **MISSING** |  |
| 15 | QC reklamatsiya `QcReclamationOpenedEvent` → CRM jadvaliga (bir yo'nalish) | `Yo'q` | **MISSING** |  |
| 16 | 360° ko'rinish parallel so'rov + har blok skeleton | `Yo'q` | **MISSING** |  |
| 17 | Menejer ketganda korporativ akkaunt HR'da + yozishma arxiv (read-only) | `Yo'q` | **MISSING** |  |
| 18 | AI churn vazifasi faqat CRM ichida (Kanban'ga tushmaydi) | `STALE-DOC` | **MISSING** | Manba vizyon hujjati eskirgan (reja tuzatgan). |
| 19 | Format o'zgarishi dialogi faqat ta'sirlangan mahsulot liniyasida | `Yo'q` | **MISSING** |  |
| 20 | "O'lcham tasdiqlandi" bayrog'i Dizayn bosqichida dizayner belgilaydi (gate) | `Yo'q` | **MISSING** |  |
| 21 | ГП blanka 3 imzo (omborchi+haydovchi+menejer) PIN F5 elektron | `Yo'q` | **MISSING** |  |
| 22 | Qayta buyurtmada diff view + har maydon alohida tasdiq | `Yo'q` | **MISSING** |  |
| 23 | Imzolangan spetsifikatsiyada ham Finance qarz bloki ustun | `Yo'q` | **MISSING** |  |
| 24 | O'zga mijoz qidiruvida faqat nom+turi (field-RBAC) + audit | `Yo'q` | **MISSING** |  |
| 25 | Ta'minot import muammosi `SupplyImportIssueEvent` → CRM vazifa+direktor panel | `Yo'q` | **MISSING** |  |
| 26 | Dizayn/STP kun limiti oshsa Dizayn bo'lim boshlig'i+sotuvchiga bildirishnoma (E5) | `Yo'q` | **MISSING** |  |
| 27 | Qog'oz zayavka profili yangi bitim formasiga pre-fill + alohida snapshot | `Yo'q` | **MISSING** |  |
| 28 | AI churn + Marketing kampaniya bir vaqtda: "faol kampaniya" flagi tekshiriladi | `Qisman` | **PARTIAL** |  |
| 29 | Chegirma suiiste'mol bayrog'i: 90 kun 3+ marta yoki 10%+ (business.constants) | `Yo'q` | **MISSING** |  |
| 30 | Namuna buyurtmasi PP'ga "namuna" past ustuvorlik + daromad statistikasidan tashqari | `Yo'q` | **MISSING** |  |
| 31 | Korporativ raqam abonent doirasi real-time webhook + ruxsatsizda INCIDENT | `Yo'q` | **MISSING** |  |
| 32 | HR "ishdan ketdi" eventida avto-reassign + oraliqda "kutish" holati | `Qisman` | **PARTIAL** |  |
| 33 | HR holati (ta'til/kasal/sinov) real-time round-robin'ga ta'sir (`HR_EmployeeStatusChangedEvent`) | `Yo'q` | **MISSING** |  |
| 34 | Chiqimli/chiqimsiz narx IChM ma'lumotidan avto + "chiqim normasiz" ogohlantirish | `Yo'q` | **MISSING** |  |
| 35 | ГП-kod profiliga QC "brak/rad" belgisi + qayta buyurtmada ogohlantirish | `Yo'q` | **MISSING** |  |
| 36 | "Прошло (дней)" "Yuk chiqdi"da to'xtaydi; qisman to'lov to'xtatmaydi | `Yo'q` | **MISSING** |  |
| 37 | Yutildi→bekor qilinganda KPI avto-tuzatish eventi | `Yo'q` | **MISSING** |  |
| 38 | Keyingi buyurtma eslatma vaqti AI avto-hisob (standart 30 kun) | `Yo'q` | **MISSING** |  |
| 39 | Valyuta 5%+ sakrasa KP/bitim "qayta hisob kerak" statusiga (avto yangilanmaydi) | `Yo'q` | **MISSING** |  |
| 40 | Ombor kirish talablari Logistika rejasida `sales_orders`dan avto-tortiladi | `Yo'q` | **MISSING** |  |
| 41 | Yutqazilgan bitim root-cause real-time Director dashboard + haftalik hisobot | `Qisman` | **PARTIAL** |  |
| 42 | "Menejer fikri/hohishi" strukturali (kategoriya+matn) + AI onboarding tavsiya | `Yo'q` | **MISSING** |  |
| 43 | Korporativ raqam nazorati real-time + ruxsatsizda INCIDENT (НО-2) | `Yo'q` | **MISSING** |  |
| 44 | Korporativ kanal bypass texnik to'liq oldini olib bo'lmaydi — НО-2+siyosat+HR | `Yo'q` | **MISSING** |  |
| 45 | Leaderboard haftalik (Monday reset), faqat "Yutdik"; forecast alohida | `STALE-DOC` | **MISSING** | Manba vizyon hujjati eskirgan (reja tuzatgan). |
| 46 | Mas'ul operator/usta PP rejalashtirishda "tavsiya" (majburiy emas) | `Yo'q` | **MISSING** |  |
| 47 | "Asosiy mijoz" bayrog'i PP'ga `sales_orders` event orqali + WMS bron | `Qisman` | **PARTIAL** |  |
| 48 | CRM audit tizim-wide `audit_log`ga (A6, 7 yil) + `WHERE module='CRM'` filtr | `Yo'q` | **MISSING** |  |
| 49 | Klishe/STP 3 kun javob yo'q→Dizayn boshlig'i; 7 kun→Vysotskiy-7 bir daraja yuqori (E5) | `Yo'q` | **MISSING** |  |
| 50 | CRM oflayn (PWA): lid+faollik mumkin, KP faqat onlayn; conflict=server ustun | `Yo'q` | **MISSING** |  |
| 51 | Lid→bitim voronka + bosqich konversiyasi | `Ha` | **PARTIAL** | ⭐ Fresh: `funnel.service.ts` real, lekin FE `CrmFunnelAnalytics` — ORPHAN (`/crm/funnel`, sidebar yo'q, nav yo'q). |
| 52 | Voronka bosqichlarini kim belgilaydi (zavod jarayoni) | `Yo'q` | **MISSING** |  |
| 53 | Ko'p manba + manba majburiy | `Ha` | **FULLY** |  |
| 54 | Vebsayt+Telegramdan avto lid + bildirishnoma | `Ha` | **FULLY** |  |
| 55 | Avto sotuvchiga biriktirish (round-robin/hudud) | `Ha` | **PARTIAL** | ⭐ Fresh: `pickNextSalesManager()` `employees.role='sales_manager'` so'raydi; jonli DB'da bunday xodim **0 ta** (31/31 role NULL) → doim `null` → `crm_leads.assigned_to` 0/16. |
| 56 | Faollik jurnali (qo'ng'iroq/xat/uchrashuv) | `Qisman` | **PARTIAL** |  |
| 57 | Aloqa kanallari (SMS/Email/TG/WhatsApp) kartada | `Qisman` | **PARTIAL** |  |
| 58 | Yozishma tarixi avto kartada | `Qisman` | **PARTIAL** |  |
| 59 | Vazifa+eslatma+eskalatsiya | `Qisman` | **PARTIAL** |  |
| 60 | Kechikkan vazifa boshliq paneliga | `Qisman` | **PARTIAL** |  |
| 61 | Hot-lead avto ajratish (faollik+summa) | `Ha` | **FULLY** |  |
| 62 | Lead scoring 5 mezon vaznli ball | `Qisman` | **PARTIAL** |  |
| 63 | AI Next Best Action (taklif+inson tasdiq) | `Ha` | **PARTIAL** | ⭐ Fresh: `crm-ai.service.ts` `getNextBestAction()` obyekt qaytaradi; `AiCrmPage.tsx:39` natijani faqat local state'da saqlaydi. Inson-tasdiq oqimi yo'q. |
| 64 | AI churn bashorati + qaytarish vazifasi | `Ha` | **PARTIAL** | ⭐ Fresh: `churn.service.ts` real; lekin `POST /crm/ai/churn` (`crm-extended.service.ts:168`) hardcoded `{churnRisk:'low',score:0}` qaytaradi va aynan shu endpoint `manager` roliga ochiq. |
| 65 | Mijoz 360° (buyurtma+to'lov+qarz+shikoyat) | `Ha` | **FULLY** |  |
| 66 | Oltin ip: bitim yutilsa→sales_order avto | `Ha` | **PARTIAL** | ⭐ Fresh: `deal-won.listener.ts:55` `CreateOrderCommand` yuboradi, lekin jonli DB'da `won` deal'da `sales_order_id` NULL va `sales_orders.deal_id` 0/13 → hech qachon yakunlanmagan. |
| 67 | Yagona kanonik mijoz bazasi | `Ha` | **FULLY** |  |
| 68 | Mijoz segmentlari (VIP/asosiy/oddiy) | `STALE-DOC` | **MISSING** | Manba vizyon hujjati eskirgan (reja tuzatgan). |
| 69 | RFM/CLV panel | `Ha` | **PARTIAL** | ⭐ Fresh: `rfm/clv/kmeans.service.ts` mavjud; FE `CrmRfmClusters` — ORPHAN (`/crm/rfm`). |
| 70 | Yutqazish sababi majburiy + hisobot | `Qisman` | **PARTIAL** |  |
| 71 | KP tayyorlash+yuborish+holat kuzatish | `Qisman` | **PARTIAL** |  |
| 72 | Karta-model integratsiya (sotuvchi o'ziniki) | `Qisman` | **PARTIAL** |  |
| 73 | Yopilgan bitim→sotuvchi KPI/ЦКП avto | `Qisman` | **PARTIAL** |  |
| 74 | Qarz limitidan oshsa blok+tasdiq | `Qisman` | **PARTIAL** |  |
| 75 | Shikoyat/reklamatsiya kartada qizil belgi | `Qisman` | **PARTIAL** |  |
| 76 | Avto follow-up kampaniyalari (30/60/90) | `Qisman` | **PARTIAL** |  |
| 77 | Boshliq CRM dashboard (voronka+reyting+signal) | `Ha` | **PARTIAL** | ⭐ FE sahifasi aniqlanmadi (sidebar'da bunday yozuv yo'q) — **unverified**. |
| 78 | Telefon qo'ng'irog'ini yozib kartaga | `Yo'q` | **MISSING** |  |
| 79 | Mobil CRM (sotuvchi tashqarida) | `Qisman` | **PARTIAL** |  |
| 80 | Ma'lumot kirish chegarasi (o'ziniki) | `Qisman` | **PARTIAL** |  |
| 81 | НО-2: korporativ raqam menejer kartasiga | `Yo'q` | **MISSING** |  |
| 82 | НО-2: abonent doirasi cheklovi + flag | `Yo'q` | **MISSING** |  |
| 83 | НО-2: qo'ng'iroq nazorati Инспекция paneliga | `Yo'q` | **MISSING** |  |
| 84 | Сифат boshlig'i↔mijoz aloqasi kartada | `Qisman` | **PARTIAL** |  |
| 85 | Korporativ TG/biznes-akkaunt→CRM, menejer ketsa qoladi | `Yo'q` | **MISSING** |  |
| 86 | Debitor qarz Даромадлар bo'limiga (savdoda emas) | `Yo'q` | **MISSING** |  |
| 87 | Qarz holatini faqat Finance yangilaydi | `Qisman` | **PARTIAL** |  |
| 88 | Qarz aloqasi bir tarixda ko'rinadi | `Yo'q` | **MISSING** |  |
| 89 | Папка№ — buyurtma papkasi kartada | `Yo'q` | **MISSING** |  |
| 90 | Прошло (дней) — avto hisoblagich+limit signal | `Qisman` | **PARTIAL** |  |
| 91 | Mijoz qog'oz profili saqlash+pre-fill | `Yo'q` | **MISSING** |  |
| 92 | Примечание papkadan kartaga | `Yo'q` | **MISSING** |  |
| 93 | ГП-kod takror buyurtma tugmasi | `Yo'q` | **MISSING** |  |
| 94 | Mahsulot konstruksiya parametrlari kartada | `Yo'q` | **MISSING** |  |
| 95 | Mijoz maket/logotip kutubxonasi (versiyalar) | `Yo'q` | **MISSING** |  |
| 96 | ГП topshirish 3-imzo elektron blanka | `Yo'q` | **MISSING** |  |
| 97 | Yetkazilgach karta yangilash + follow-up | `Qisman` | **PARTIAL** |  |
| 98 | Haydovchi/transport mijoz kartasida | `Yo'q` | **MISSING** |  |
| 99 | Razmer plan↔aslida farqi qulf+flag | `Yo'q` | **MISSING** |  |
| 100 | Format o'zgarishi elektron rozilik | `Yo'q` | **MISSING** |  |
| 101 | Dizayn/o'lcham kelishuvi alohida voronka bosqichi | `Yo'q` | **MISSING** |  |
| 102 | Шошилмаслик — o'lcham tasdiqsiz PP ga o'tmaydi | `Yo'q` | **MISSING** |  |
| 103 | Mijoz mahsulot/biznes profili (nima qadoqlaydi) | `Qisman` | **PARTIAL** |  |
| 104 | Asosiy mijoz bayrog'i+ustuvorlik+zaxira | `Qisman` | **PARTIAL** |  |
| 105 | Mijoz kg-trend + pasayish signali | `Yo'q` | **MISSING** |  |
| 106 | Чиқимли/чиқимсиз narx varianti | `Yo'q` | **MISSING** |  |
| 107 | Qog'oz narxi o'zgarsa→qayta-narx vazifasi | `Yo'q` | **MISSING** |  |
| 108 | Mijoz×format narx jadvali | `Yo'q` | **MISSING** |  |
| 109 | Yutilgan bitim→PP reja navbatiga avto | `Qisman` | **PARTIAL** |  |
| 110 | Muddat stanok yukidan avto hisob | `Yo'q` | **MISSING** |  |
| 111 | Mahsulot→stanok marshruti, muddat navbatdan | `Yo'q` | **MISSING** |  |
| 112 | Савдо рахбари=hamma, менежер=o'ziniki | `Qisman` | **PARTIAL** |  |
| 113 | Egasizlantirmaslik: N kun faolliksiz→reassign | `STALE-DOC` | **MISSING** | Manba vizyon hujjati eskirgan (reja tuzatgan). |
| 114 | Menejer kunlik kg+summa boshliqqa | `Qisman` | **PARTIAL** |  |
| 115 | Yangi menejer mentor davri (RD-4) gate | `Yo'q` | **MISSING** |  |
| 116 | Ommaviy eksport blok+ruxsat+log | `Yo'q` | **MISSING** |  |
| 117 | Kontakt ko'rish chegarasi (field-level) | `Yo'q` | **MISSING** |  |
| 118 | CRM audit jurnali Инспекция ko'rinadi | `Qisman` | **PARTIAL** |  |
| 119 | Avans bayrog'i+foiz, avanssiz PP ga o'tmaydi | `Yo'q` | **MISSING** |  |
| 120 | Odatiy to'lov turi mijozda (naqd/o'tkazma/bartar) | `Yo'q` | **MISSING** |  |
| 121 | USD-bog'liq narx + kurs ogohlantirish | `Yo'q` | **MISSING** |  |
| 122 | Brak/qaytarish kartada + sabab kodi | `Qisman` | **PARTIAL** |  |
| 123 | Ochiq reklamatsiya→yangi yuk ogohlantirish | `Yo'q` | **MISSING** |  |
| 124 | Kompensatsiya/chegirma tarixi+suiiste'mol flag | `Yo'q` | **MISSING** |  |
| 125 | Oylik диог mijoz kesimida (kg) | `Yo'q` | **MISSING** |  |
| 126 | Yillik hajm mijoz kesimida (top ro'yxat) | `Qisman` | **PARTIAL** |  |
| 127 | Buyurtma↔tayyor↔chiqarilgan real-vaqt kartada | `Qisman` | **PARTIAL** |  |
| 128 | Mijoz ostida mahsulot liniyalari (narx/hajm/brak) | `Yo'q` | **MISSING** |  |
| 129 | STP/format versiya tarixi | `Yo'q` | **MISSING** |  |
| 130 | Korp-raqam aloqa teglash (mijoz/shaxsiy) | `Yo'q` | **MISSING** |  |
| 131 | Import-bog'liqlik toifasi + ta'sirlangan mijoz | `Yo'q` | **MISSING** |  |
| 132 | Mijoz ombor kirish talablari saqlash | `Yo'q` | **MISSING** |  |
| 133 | Kelishilgan o'rash/qadoqlash usuli kartada | `Yo'q` | **MISSING** |  |
| 134 | Namuna/Академияga sotuvdan ajratish | `Yo'q` | **MISSING** |  |
| 135 | Mijoz↔mas'ul operator/usta tarixi | `Yo'q` | **MISSING** |  |
---

## 8. MODERNIZATSIYA BO'SHLIQLARI

> **Cheklov:** yangi sahifa taklif qilinmaydi. Har bir taklif §1 dagi 21 sahifadan bittasini nomlaydi.
> **Manba:** umumiy ERP/CRM domen bilimi (veb-qidiruv ishlatilmadi). Ma'lumot bo'lmagan joylar `blocked-until` deb belgilangan.

### 8.1 Bugun mavjud analitik "dvigatel"lar

Muhim: analitik **servislar bor**, lekin ko'pchiligi **orphan sahifa** ortida.

| Servis | Fayl | Bugun qayerda ko'rinadi |
|---|---|---|
| Voronka + bosqich konversiyasi | `crm/analytics/funnel.service.ts` | `CrmFunnelAnalytics` — **orphan** |
| RFM / CLV / k-means | `crm/analytics/{rfm,clv,kmeans}.service.ts` | `CrmRfmClusters` — **orphan** |
| Churn + qayta-o'qitish | `crm/analytics/{churn,churn-retrain}.service.ts` | hech qayerda (compat endpoint hardcoded) |
| Kogorta | — | `CrmCohortAnalysis` — **orphan** |
| Mijoz ABC (Pareto) | `sd/application/customer-abc.service.ts` | hisoblanadi, lekin ro'yxatda ko'rsatilmaydi (§1.4/2) |
| Mijoz 360° | `drizzle-sd-customers/customer-360.builder.ts` | `/sd/customers/:id` ✅ |
| Debitor aging (0-30/31-60/61-90/90+) | `sd-payments.repository.ts:43` | `SDDebitors` — **orphan** |
| Oylik savdo trendi | `/api/sales/analytics/monthly-trend` | `/sd/dashboard` ✅ |
| Kvota / leaderboard | `sd-dashboard.repository.ts` | `/sd/dashboard` ✅ |
| Narx formulasi (komponentlar) | `sd-quotations.service.ts:118-124` | `/sd/sales-quotes` ✅ |

⭐ **Xulosa:** modulning eng katta analitik bo'shlig'i yangi hisobot yozish emas — **allaqachon yozilgan to'rt servisni mavjud sahifalarga ulash**.

### 8.2 (a) Ma'lumot-analitika bo'shliqlari

| # | Bo'shliq | Bugun | Qaysi mavjud sahifani kuchaytiradi | Holat |
|---|---|---|---|---|
| A1 | Voronka konversiyasi va bosqichda-turish vaqti | servis bor, sahifa orphan | `/crm-workspace` (kanban ustunlari ustiga) | ready-now |
| A2 | RFM segmenti va CLV | servis bor, sahifa orphan | `/sd/customers` (ustun) + `/sd/customers/:id` (blok) | ready-now |
| A3 | Churn xavfi nishoni | servis bor, hech qayerda | `/sd/customers`, `/crm-workspace` | ready-now |
| A4 | Kogorta ushlab qolish | sahifa orphan | `/sd/dashboard` | ready-now |
| A5 | **Debitor aging** | `getDebitors` bor, sahifa orphan | `/sd/sales-payments` — sahifaning maqsadi shu | ready-now |
| A6 | DSO (o'rtacha inkasso kuni), to'lov xulqi | yo'q | `/sd/sales-payments` + `/sd/dashboard` | **blocked-until** `payments` = 0 qator |
| A7 | Kotirovka→buyurtma konversiyasi va yopilish vaqti | yo'q | `/sd/sales-quotes` (sarlavha KPI qatori) | **blocked-until** `quotations` = 0 (create buzuq) |
| A8 | Chegirma sizishi / marja realizatsiyasi (reja ↔ fakt) | narx formulasi marjani hisoblaydi, taqqoslash yo'q | `/sd/sales-quotes`, `/sd/kpi` | blocked-until A7 |
| A9 | Yo'qotish sabablari Pareto'si | `sd_lost_orders.reason_code` yig'iladi, tahlil yo'q | `/sd/lost-orders` | ready-now (jadval bo'sh, lekin yozuv yo'li ishlaydi) |
| A10 | Prognoz aniqligi (bashorat ↔ fakt) | `SDSalesManagement` forecast tabi — orphan | `/sd/kpi` | ready-now |
| A11 | **Avans yig'ilishi va muddati o'tganlar** | sahifa literal `0` ko'rsatadi | `/sd/advance-control` — asosiy maqsadi | ready-now (`sales_orders.advance_*` mavjud) |
| A12 | Menejer pipeline tezligi (bitim/hafta, o'rtacha chek) | leaderboard bor, tezlik yo'q | `/sd/dashboard` | ready-now |
| A13 | Mijoz kontsentratsiyasi (top-5 ulushi) | ABC bor, kontsentratsiya yo'q | `/sd/dashboard` | ready-now |
| A14 | Shartnoma muddati tugashi ogohlantirishi | `valid_until` yoziladi, kuzatuv yo'q | `/sd/contracts` | blocked-until shartnoma create tuzatiladi |
| A15 | "Qarz" va "umumiy qiymat" ustunlarini jonlantirish | ustunlar bor, SELECT qaytarmaydi | `/sd/customers` | ready-now |

### 8.3 (b) AI-yordamchi bo'shliqlari (faqat mavjud sahifalar ichida)

| # | AI yordami | Qaysi mavjud sahifada | Nimaga tayanadi | Holat |
|---|---|---|---|---|
| B1 | Xavfli bitim bayrog'i (uzoq turgan / faolliksiz) | `/crm-workspace` | `churn.service.ts` + `crm_activities` | ready-now |
| B2 | Keyingi eng yaxshi harakat (taklif + inson tasdig'i) | `/crm-workspace` (bitim kartasi) | `crm-ai.service.ts:94` — bugun **saqlanmaydi** | ready-now (saqlash qo'shilsa) |
| B3 | **Dublikat lid ogohlantirishi** yaratish paytida | `/crm-workspace` (QuickCreateModal) | ⭐ `CrmDedupController` (`crm/lead-dedup`) **allaqachon mavjud**, FE ishlatmaydi | ready-now |
| B4 | To'lov anomaliyasi (g'ayrioddiy summa/takror) | `/sd/sales-payments` | — | **blocked-until** `payments` bo'sh |
| B5 | To'lov sanasi bashorati | `/sd/sales-payments` | tarixiy to'lov kerak | **blocked-until** |
| B6 | Kotirovka yutish ehtimoli | `/sd/sales-quotes` | `crm-lead-scoring` formulasi qayta ishlatilishi mumkin | blocked-until A7 |
| B7 | Marja qo'riqchisi (pol ostiga tushsa ogohlantirish) | `/sd/sales-quotes` | `calculatePrice()` marjani qaytaradi; chegara `/sd/settings` da | ready-now |
| B8 | Kredit-limit tavsiyasi to'lov tarixidan | `/sd/customers` | `credit_limit` ustuni to'ldirilgan (16/16) | **blocked-until** tarix yo'q |
| B9 | Churn nishoni + saqlab qolish taklifi | `/sd/customers` | `churn.service.ts` | ready-now |
| B10 | **Avans darvozasi tushuntiruvchisi** — "nega bu buyurtma bloklangan" | `/sd/orders/:id` | bugun eng foydali bo'lardi (darvoza sababini hech kim ko'rmaydi) | ready-now |
| B11 | Muddati o'tgan avanslarni ustuvorlashtirish | `/sd/advance-control` | `sales_orders.advance_*` | ready-now |
| B12 | Yo'qotish sababini avto-tasniflash (matn→kod) | `/sd/lost-orders` | `reason_text` + `reason_code` ikkalasi yoziladi | ready-now |
| B13 | Kvota-prognoz hikoyasi ("shu sur'atda 82%") | `/sd/kpi`, `/sd/dashboard/quota` | leaderboard + kvota | ready-now |
| B14 | AI natijalarini saqlash va audit izi | `/ai/crm` | bugun faqat FE state | ready-now |
| B15 | Anomaliya hikoyasi ("nima o'zgardi") | `/sd/dashboard` | trend ma'lumoti | ready-now |

> **Halol cheklovlar.** B4/B5/B8 va A6/A7 — bo'sh jadvallarga tayanadi (`payments`=0, `quotations`=0). Ular P0 create-tuzatishlaridan **keyin** ma'noli. Bu "best practice" emas, **kutish sharti**.
> **Unverified:** `CrmAiService` ichida haqiqiy LLM chaqiruvi bormi yoki evristikami — bu tahlirda ochilmadi. B1/B2/B6/B9 ni loyihalashdan oldin aniqlanishi kerak. Ustiga, `crm-extended.service.ts` dagi to'rtta compat AI endpoint **soxta** (§2.4) — ular AI qatlamining ishonchliligi haqida savol tug'diradi.

---

## 9. YAKUNIY TAVSIYALAR (34 ta)

Yagona raqamlangan ro'yxat, **ustuvorlik bo'yicha**. Har biri: tavsiya · manba bo'lim · og'irlik · **birga bajarilishi shart** (§5.4 bog'liqlik tahlilidan).

| # | Tavsiya | Manba | Og'irlik | Birga |
|---|---|---|---|---|
| 1 | `SDSalesOrders` yaratish formasiga mijoz maydonini qo'shib `customerId` yuborish — `sales_orders.customer_id` NOT NULL, hozir har yaratish yiqiladi | §2.1 | **P0** | — |
| 2 | Shartnoma yaratishga `order_id` ni ulash (yoki dialogni buyurtmadan chaqirish) — `sd_contracts.order_id` NOT NULL | §2.1 | **P0** | — |
| 3 | Taklifnoma yaratishni tuzatish: FE `items[]` ga `product_id` qo'shish **va** repo `customer_name` ni camelCase'dan o'qish (ikkala nuqson birga yiqitadi) | §2.1 | **P0** | 3a+3b birga |
| 4 | `QuickCreateModal` deal-create'ni `POST /crm/deals/quick` ga o'tkazish yoki strict DTO'ni yumshatish | §2.1 | **P0** | — |
| 5 | `users.role='manager'` ↔ BE `@Roles('sales_manager')` nomuvofiqligini hal qilish: rol satrini birlashtirish yoki `manager` ni SD/CRM ro'yxatlariga qo'shish — hozir 27/32 foydalanuvchi 198/257 endpointda 403 oladi | §3.2 | **P0** | 6 bilan |
| 6 | `employees.role` master-datasini to'ldirish — round-robin `sales_manager` topa olmaydi (31/31 NULL) | §3.4 | **P0** | 5, 7 bilan |
| 7 | `crm_leads.assigned_to` (16 qator) va `deals.assigned_to` (5 qator) ni backfill qilish — usiz scoping 0 qator ko'rsatadi | §3.4 | **P1** | 5, 6 bilan |
| 8 | `tech_bom/routing/card_approved` ni `execSdSalesOrderUpdate` orqali saqlash — hozir BE'da yozuvchi 0 ta (green-lie) | §2.4, §5.2(e) | **P0** | 9 bilan |
| 9 | `tech-checkpoint` tuzatilgach Trigger-6 birinchi marta ishlaydi → PP reja + SD bo'lim fan-out + MM `hitl_approvals` birdan uyg'onadi; ularni ataylab yoqish | §5.4 | **P0** | 8 bilan |
| 10 | `markPaymentPaid` `RETURNING` ga `amount` qo'shish — GL legi hech qachon bajarilmaydi (`entries` da `CP-` 0 ta) | §5.2(d) | **P0** | 11 bilan |
| 11 | 10 bilan **birga** `Number(id)` uuid nuqsonini tuzatish, aks holda barcha to'lovlar `CP-0` referensida to'qnashadi | §5.2(d) | **P0** | 10 bilan |
| 12 | `POST /sd/payments` ni camelCase→snake_case moslashtirish (`orderId`/`customerId`/`dueDate` jimgina yo'qoladi; overpay gardi ham o'chib qoladi) | §2.2 | **P0** | — |
| 13 | `/erp/sales` (Sotish Paneli) SAP-shim'ini hal qilish — repo `body['totalAmount']` o'qiydi, FE bu nomni umuman yubormaydi → summa doim 0; ~19 maydon tashlanadi | §1.4 | **P0** | — |
| 14 | FE kanban "won" harakatini `PATCH /crm/deals/:id/won` ga ulash — hozir `/stage` chaqiriladi, shuning uchun `DealWonEvent` hech qachon chiqmaydi va CRM→SD oltin ip ishlamaydi | §2.4, §5.2(c) | **P0** | 15 bilan |
| 15 | `crm_lead_stages` ga `QUALIFIED` bosqichini qo'shish — `convertLead` darvozasi `status='qualified'` talab qiladi, kanban bu holatga o'ta olmaydi | §2.4 | **P1** | 14 bilan |
| 16 | Mijoz tahrirlashdagi enum nomuvofiqligi: FE `blacklist` ↔ DTO `blacklisted`; ustiga `new`/`at_risk` statusli qatorlar har qanday tahrirlashda 400 beradi | §2.3 | **P1** | — |
| 17 | `advance_bypass_by` / `advance_bypass_reason` ni saqlash — pul-nazoratni chetlab o'tish kim tomonidan va nima sababdan qilingani yo'qoladi | §2.2 | **P1** | — |
| 18 | `leads.service.ts:65,74` va `deals.service.ts:88,109` — `findOne(id)` ga `user` ni uzatish; hozir har qanday CRM lid/bitim tahrirlash/o'chirish 404 beradi | §3.5 | **P1** | — |
| 19 | `crm_activities.entity_id` — FE `""` yuboradi, ustun `integer` → INSERT yiqiladi; `""`→`null` ga keltirish | §1.4 | **P1** | — |
| 20 | AI CRM'ning uch chaqiruvi BE Zod DTO'siga mos emas (`churn-risk` `activityData`, `email-template` `purpose/contactName/context`, `next-best-action` `lastActivities`) | §1.4 | **P1** | — |
| 21 | To'rtta soxta compat endpoint (`crm/ai/create-task`, `crm/chat`, `crm/auto-tasks`, `crm/ai/churn`) — real ish qilsin yoki halol `501` qaytarsin; ular aynan `manager` roliga ochiq | §2.4 | **P1** | 5 bilan |
| 22 | `/sd/advance-control` ni `sales_orders.advance_*` ga ulash — hozir `papka_orders` o'qiydi va ikkita KPI literal `0` | §1.4, §8.2 A11 | **P1** | — |
| 23 | `SDCustomers` ro'yxat SELECT'iga `openDebt`, `lifetime_value`, `customer_category` qo'shish — uchala ustun/KPI doim 0 ko'rsatadi va ABC natijasi hech qachon ko'rinmaydi | §1.4, §8.2 A15 | **P1** | — |
| 24 | `sd_rentals` ↔ `RentalPanel` ustun drifti (`areaM2`, `totalAmount`, `billed` ustunlari yo'q) — sxemani yoki FE'ni moslashtirish | §1.4 | **P1** | — |
| 25 | `GET /api/sd/payments/export` ni qurish yoki CSV tugmasini olib tashlash (hozir 404; `window.open` `Authorization` ham yubormaydi) | §1.4 | **P2** | — |
| 26 | `/crm/customer/:id` ikki marta ro'yxatdan o'tgan (`CRMRoutes.tsx:67` + `DirectorRoutes.tsx:52`) → ikki rolli foydalanuvchi uchun ikki karra mount | §1.4 | **P2** | — |
| 27 | `SDQuotaDashboard.tsx:56` — `subtitle` literal shablon-satr, ekranda `{kpi?.period}` ko'rinadi; sahifaga navigatsiya havolasi ham yo'q | §1.4 | **P2** | — |
| 28 | `SDExtendedTypes.ts:74` — `/sd/quota-dashboard` "quota" tabiga xaritalangan, lekin AppRouter uni boshqa sahifaga yo'naltiradi → tab hech qachon ochilmaydi | §1.4 | **P2** | 27 bilan |
| 29 | `@Roles` yo'q controllerlarni yopish (`/sd/customers`, `/sd/leads`, `/sd/orders` GET'lari, `/papka-orders`, `/crm/contacts`, `/crm/companies`, `/crm/activities`) — `RolesGuard` metadata topmasa `true` qaytaradi | §3.6 | **P1** | 5 bilan |
| 30 | Satr-scoping qamrovini kengaytirish (taklifnoma, buyurtma, shartnoma, to'lov, mijoz) yoki "hamma hammani ko'radi" siyosatini rasmiylashtirish | §3.3 | **P1** | 7 bilan |
| 31 | 3 alias-marshrutni o'chirish (`/ai-crm`, `/sd/quotations`, `/sd/manager-panel`) | §4.2 | **P2** | — |
| 32 | 12 o'lik sahifa + o'lik FE ma'lumot qatlami (~7010 qator) bo'yicha qaror. ⚠️ `CrmFunnelAnalytics`, `CrmRfmClusters`, `SDDebitors`, `SDDeliveries` — "ulanmagan qiymat", o'chirishdan oldin 33 ni ko'ring. `OrdersRegistry` o'chirilsa BE controlleri ham o'ladi | §4.3-4.5 | **P2** | 33 bilan |
| 33 | Mavjud analitik servislarni (voronka, RFM/CLV, churn, kogorta, debitor-aging) **mavjud sahifalarga ulash** — yangi sahifa qurmasdan; modulning eng arzon yutug'i | §8.1-8.2 | **P1** | 32 bilan |
| 34 | Dizayn: `EPPageHeader`/`EPSkeleton`/`EPEmptyState` ga o'tkazish (§6.3 A-C), `CRMWorkspace` da o'chirish tasdiqini qo'shish (Qoida 14), 3 mutatsiyaga `onError` (F2) | §6.3 | **P2** | — |

**Taqsimot:** P0 = 13 · P1 = 13 · P2 = 8 · **jami 34**

> **Halollik izohi:** 34 tavsiyaning hammasi §1-§8 dagi aniq, shu tahlirda tasdiqlangan topilmadan kelib chiqadi. To'ldiruvchi item kiritilmadi.

### 9.1 Tavsiya etilgan bajarilish tartibi (bog'liqliklardan)

```
1,2,3,4  (create yo'llarini ochish — modul ishlay boshlaydi)
   ↓
5,6,7,29,30  (RBAC: rol satri + master-data + backfill + scoping)
   ↓
12,10+11  (pul: to'lov bog'lanishi, keyin GL legi)
   ↓
14,15  (CRM→SD oltin ip)
   ↓
8+9  (tech-checkpoint → PP/MM kaskadi — eng katta blast radius)
   ↓
13,16..24  (sahifa-lokal tuzatishlar)
   ↓
33,32  (analitikani ulash, keyin o'liklarni o'chirish)
   ↓
25..28,31,34  (kosmetik)
```

---

## 10. Ishonch darajasi

**Yuqori — shu tahlirda `fayl:qator`, jonli `SELECT` yoki `BEGIN…ROLLBACK` probe bilan tasdiqlangan:**
to'rtta bloklangan create (uchtasi rollback-probe bilan) · `tech_*_approved` yozuvchisi yo'qligi · `markPaymentPaid` `RETURNING` da `amount` yo'qligi va `entries` da `CP-` yo'qligi · rol satri nomuvofiqligi (27/32, 198/257) · `employees.role` ochligi · `crm_activities.entity_id=''` xatosi · `deliveries.id` tur drifti · `DELIVERY_51_DISABLED` konstanta · `delivery_items` yozuvchisi yo'qligi · orphan ro'yxati va o'lik FE ma'lumot qatlami · dizayn matritsasi · vizyon `Ha` itemlarining 11 tasi pasaytirilishi.

**O'rta — agent hisobotidan, tanlab tekshirdim:** §7 dagi qolgan 271 item statusi (reja evidence'iga tayanadi); ba'zi sahifa-ichki tab shartnomalari.

**Tekshirilmagan (`unverified`):**
- Hech bir oqim **runtime'da haydab ko'rilmadi** (read-only faza; faqat `admin` bilan HTTP-probe qilindi: `/api/sd/orders`, `/api/sd/customers`, `/api/sd/payments`, `/api/crm/deals` → 200).
- `CrmAiService` ichida haqiqiy LLM chaqiruvi bormi.
- `crm-settings.service.ts` ichidagi SQL.
- `SDKpi` KPI-maqsad servisining maydon xaritalashi.
- Customer360 ning har bir tabining CRUD shartnomalari.
- M13 #77 uchun FE sahifasi.
- `entries` dagi `GL-0000000x` `SD_*` qatorlarini aynan qaysi yozuvchi qo'ygani (prefiks `GlPostingService` shakliga mos emas — ehtimol seed).

---

*Hisobot 2026-07-10 da 🔵 Tahlilchi rolida, to'liq yangi tekshiruv sifatida tuzildi. Kod, sxema, konfiguratsiya, ma'lumot o'zgartirilmadi. Barcha DB probe'lari `ROLLBACK` bilan yakunlandi.*
