# P09 — SD (Sales Distribution): SD golden-thread fields + penalty/klishe/kpi schema DDL

> **Agent ID:** P09 · **To'lqin (Wave):** 1 · **Bog'liqlik:** P01 tugashi shart
> **Sana:** 2026-06-19 · **Modul:** SD (Sales Distribution) · **DDL darvozasi:** FAOL (owner ruxsati shart)
> Ushbu direktiva **Q-47** bo'yicha to'liq, batafsil, hech qanday noaniqlik qoldirmaydigan tarzda yozilgan.

---

## 0. ROL VA QOIDALAR

Sen **🟢 BAJARUVCHI (EXECUTOR)** agentsan. Har sessiyada `CLAUDE.md` va `docs/agent-constitution.md` ni o'qib boshla.

**QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):**

1. **Result\<T\>** — hamma repo/service metodida; `throw` / `null` / `undefined` qaytarish TAQIQ.
2. **@Body Zod bilan validate** — `class-validator` TAQIQ.
3. **Drizzle ORM** — raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri** — REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ. TO'G'RI o'lchovi = master vizyon (`docs/`).
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI** — buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)** — faqat OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa TO'XTA + egasiga flag.
7. **DDL DARVOZASI (Q-35)** — `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh SHART. Bu paket DDL talab qiladi — migrationlarni YOZ lekin GATED belgila. Egasi "run" demagunicha `psql` bilan ISHLATMA.
8. **`git add <aniq-fayl>` faqat** — `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** — log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify** — BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik** — TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

**Bu agent WAVE 1 da ishlaydi. dependsOn: ["P01"] — P01 migratsiyalari (lib/db barrel eksporti) to'liq commit qilingan bo'lishi shart.**

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT quyidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.**

| # | Fayl | Holat | Amal |
|---|------|-------|------|
| 1 | `apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql` | YANGI (mavjud emas) | YARATILADI — GATED migration |
| 2 | `lib/db/src/schema/sd-orders.ts` | MAVJUD (238 satr) | TAHRIRLASH — golden-thread ustunlar qo'shish |
| 3 | `lib/db/src/schema/sd-kpi-targets.ts` | YANGI (mavjud emas) | YARATILADI — `sdKpiTargets` pgTable |
| 4 | `lib/db/src/schema/sd-change-log.ts` | YANGI (mavjud emas) | YARATILADI — `sdOrderChangeLog`, `sdLostOrders`, `sdPriceHistory`, `sdClicheRegistry`, `sdCancellationPenaltyConfig`, `sdSourceChannelLookup` pgTable |

**DDL DARVOZASI:** Fayl №1 — migration SQL fayli YOZILADI lekin `-- GATED: egasi ruxsati kutilmoqda` belgisi bilan. Egasi `-- APPROVED: <ism> <sana>` izoh qo'shib `psql` buyrug'ini bergandan keyin ISHLATILADI.

**Fayl izolyatsiya qoidasi:** `sd-orders.ts` faylida mavjud barcha 238 satr (salesInvoices + salesOrders pgTable) O'CHIRILMAYDI. Faqat `salesOrders` pgTable ichiga yangi ustunlar va `(t) => [...]` blokiga yangi index/constraint satrlar QO'SHILADI.

**Qo'shni SD fayllarga (sd-europrint-schema.ts, sd-order-items.ts, sd-schema.ts va boshqalar) mutlaqo tegmang** — ular boshqa paketlarga tegishli yoki avvaldan ishlaydi.

**migrations/ papkasi hozir mavjud emas:** `apps/api/src/database/migrations/` papkasini yaratish kerak bo'ladi (faqat shu papka, tarkibidagi boshqa fayllarga tegmang).

---

## 2. VIZYON

### 2.1 SD = T1 oltin zanjir yadroси (Golden Thread Core)

Manba: `docs/audit/MUSLIMBEK-PROMT-04-SD-2026-06-08.md` §1 (WHY THIS MODULE / GOAL)

SD moduli EuroPrint ERP ning **T1 asosi** — har bir sotuv shu yerdan boshlanib PP/MES/QC/WMS orqali Moliyaga yetib keladi. 24 000 mijoz + 20 yillik takror buyurtmalar. Vizyon = **oltin ip (golden thread):** bitta `sales_order.id` har bir downstream yozuvni TZ → material → ishlab chiqarish → yetkazib berish → to'lov → GL gacha belgilaydi.

### 2.2 7 build fazasi (SD module)

1. **Ph1** — Mijoz CRUD + ABC ball
2. **Ph2** — KP (Quotation) hayot tsikli + PDF
3. **Ph3** — Buyurtma holati mashinasi + oltin zanjir hodisalari
4. **Ph4** — Narx mexanizmi + mahsulot katalogi
5. **Ph5** — To'lov + debitor + yetkazib berish + GL
6. **Ph6** — Sotuv KPI + leaderboard + hisobot
7. **Ph7** — Shartnomalar + reklamasiya + arxiv

**Bu P09 paketi Ph3 asosi uchun DDL + Drizzle sxemani tayyorlaydi (holat zanjiri, KPI, o'zgarishlar jurnali, yo'qotilgan buyurtmalar, narx tarixi, klishe registri, jarimа konfiguratsiyasi).**

### 2.3 Egasi tasdiqlangan qoidalar (Owner-confirmed overrides)

| Kod | Qoida | Amalga oshirish |
|-----|-------|-----------------|
| EP-SD-033 | Priklad % = har mahsulot turi bo'yicha (har turda o'z %, master-data) | ⏸ **DEFERRED** — `sd_product_type_priklad` jadval bu P09 da YO'Q; keyingi paket/fazaga qoldirilgan. Sabab: mahsulot-tur master-data (PP/MES bilan birgalikda loyihalash kerak). Bajaruvchi bu jadvalga tegmaydi — scope tashqarida. Deferred jadvali P09 §3C (YO'Q — scope tashqarida) ro'yxatiga kiritilsin. |
| EP-SD-068 | Tirajdan og'ish = ±10% (hisob real chiqqan miqdordan, sanoat standarti) — OCHIQ-JAVOBLAR SD §, MUSLIMBEK-PROMT-04 §PHASE3 | `sales_orders.actual_quantity` (real chiqqan miqdor) + `sales_orders.tolerance_percent` (sozlanuvchi %, EGASI QIYMATI KERAK — hardcode TAQIQ) + `sd_source_channel_lookup` master-data jadvali (§5 DDL'da) |
| EP-SD-042/125 | Klishe/shtamp = mijoz bir marta to'laydi → zavodda saqlanadi (~3 yil, keyin ogohlantirish) → takror buyurtmada haq olinmaydi | `sd_cliche_registry` jadval (§5 DDL'da) |
| EP-SD-069 | Bekor qilish jarimasi = bosqichli: maket 30% / bosilgan 70% / tayyor 100% (foiz konfiguratsiyalanadigan master-data) | `sd_cancellation_penalty_config` jadval (§5 DDL'da) |
| EP-SD-056/133 | Maket tasdiqlash darvozasi — maket_approved ustuni kerak | `sales_orders.maket_approved` ustun (§4 qadam 1) |
| EP-SD-076 | Manba/kanal (source/channel) maydoni buyurtmada | `sales_orders.source_channel` ustun (§4 qadam 1) |
| EP-SD-098 | Papka-nomer maydoni | `sales_orders.papka_number` ustun (§4 qadam 1) |
| EP-SD-099 | Zakaz 1S maydoni | `sales_orders.zakaz_1s` ustun (§4 qadam 1) |
| EP-SD-102 | Yo'nalish (Ofset/Flekso) | `sales_orders.direction` ustun (§4 qadam 1) |
| EP-SD-105 | Davalcheskoe material bayrog'i | `sales_orders.is_davalcheskoe` ustun (§4 qadam 1) |
| EP-SD-106 | Fayl/trafaret havolasi | `sales_orders.design_file_url` ustun (§4 qadam 1) |
| EP-SD-079/132 | O'zgarishlar jurnali (maydon darajasida audit log) | `sd_order_change_log` jadval (§5 DDL'da) |
| EP-SD-024 | Yo'qotilgan buyurtmalar kuzatuvi | `sd_lost_orders` jadval (§5 DDL'da) |
| EP-SD-029 | Narx o'zgarishi auditi | `sd_price_history` jadval (§5 DDL'da) |
| EP-SD-009-014 | KPI maqsadlar (per-card GSD) | `sd_kpi_targets` jadval (§5 DDL'da) |

### 2.4 Kanonik jadvallar (mutlaq qoida)

- **Buyurtma yozish maqsadi:** `sales_orders` (bitta kanonik jadval)
- **`sd_sales_orders`:** VIEW (faqat o'qish) — bu jadvalga yozish TAQIQ
- **Aksiya (stock):** `warehouse_stock` (`current_stock` = VIEW)
- **GL yozuvlari:** `entries` / `gl_entries` — `gl_journal_entries` / `gl_lines` ga mutlaqo tegmang
- **`orders` jadvali:** hozirgi sxemada parallel mavjud — bu P09 uchun alohida amaliyot talab qilmaydi (eski parallel jadval)

### 2.5 Qabul mezonlari (Acceptance Criteria) — vizyon bo'yicha

| Xususiyat | Muvaffaqiyat belgisi |
|-----------|----------------------|
| Golden-thread ustunlar | `sales_orders` da `source_channel`, `papka_number`, `zakaz_1s`, `direction`, `is_davalcheskoe`, `design_file_url`, `maket_approved`, `maket_approved_at`, `maket_approved_by`, `maket_file_url` — DB'da mavjud |
| KPI maqsadlar | `sd_kpi_targets` jadval DB'da mavjud, `(manager_id, year, month)` UNIQUE constraint ishlaydi |
| O'zgarishlar jurnali | `sd_order_change_log` jadval DB'da mavjud, `order_id` → `sales_orders(id)` FK ishlaydi |
| Yo'qotilgan buyurtmalar | `sd_lost_orders` jadval DB'da mavjud, `reason_category` CHECK constraint ishlaydi |
| Narx tarixi | `sd_price_history` jadval DB'da mavjud |
| Klishe registri | `sd_cliche_registry` jadval DB'da mavjud, `alert_at` ustuni TIMESTAMPTZ tipida |
| Jarima konfiguratsiyasi | `sd_cancellation_penalty_config` jadval DB'da mavjud, `stage` CHECK `('maket','printed','ready')` ishlaydi |
| Tiraj tolerans (EP-SD-068) | `sales_orders.actual_quantity` (INTEGER, NULL) + `sales_orders.tolerance_percent` (NUMERIC, NULL, EGASI QIYMATI KERAK) ustunlari DB'da mavjud; `sd_source_channel_lookup` master-data jadvali DB'da mavjud (seed 5+ qator: telegram/call/website/repeat/referral) |
| Drizzle sxema | `lib/db/src/schema/sd-kpi-targets.ts` va `sd-change-log.ts` TypeScript typecheck 0 xato bilan o'tadi |
| `sd-orders.ts` | Yangi ustunlar qo'shilgan, eski kod saqlanib qolgan (salesInvoices ham, salesOrders ham to'liq) |

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud fayllar (exists)

**`lib/db/src/schema/sd-orders.ts`** (238 satr, 2026-06-19 o'lchandi):
- `salesInvoices` pgTable (`sales_invoices`) — satr 19–61: to'liq, ishlaydi
- `insertSalesInvoiceSchema` (Zod) — satr 64–73: to'liq
- `salesOrders` pgTable (`sales_orders`) — satr 92–236: mavjud, lekin golden-thread ustunlar YO'Q:
  - `source_channel` — **YO'Q** (EP-SD-076 missing)
  - `papka_number` — **YO'Q** (EP-SD-098 missing)
  - `zakaz_1s` — **YO'Q** (EP-SD-099 missing)
  - `direction` — **YO'Q** (EP-SD-102 missing)
  - `is_davalcheskoe` — **YO'Q** (EP-SD-105 missing)
  - `design_file_url` — **YO'Q** (EP-SD-106 missing)
  - `maket_approved` — **YO'Q** (EP-SD-056 missing)
  - `maket_approved_at` — **YO'Q**
  - `maket_approved_by` — **YO'Q**
  - `maket_file_url` — **YO'Q**
- Mavjud CHECK constraint `sales_orders_master_status_chk` — satr 234: 23 holat bilan
- Mavjud CHECK constraint `sales_orders_advance_status_chk` — satr 235
- `version` ustun `bigint` — satr 218 (oxirgi ustun, bu satrdan keyin `}, (t) => [` blok)

**Kanonik SD fayllari (mavjud, boshqa paketlar egalik qiladi):**
- `lib/db/src/schema/sd-europrint-schema.ts` — `sdCustomers`, `sdContacts`, `sdLeads`, `sdPriceFormulas`, `sdQuotations`, `sdQuotationItems`, `sdPayments`, `sdContracts`, `sdManagerQuotas`
- `lib/db/src/schema/sd-order-items.ts` — `salesOrderItems`
- `apps/api/src/modules/sd/sd.module.ts` — NestJS modul, barcha controller/provider ulangan
- `apps/api/src/modules/sd/presentation/sd-orders.controller.ts` — REAL: CQRS CommandBus/QueryBus
- `apps/api/src/modules/sd/application/commands/create-order.handler.ts` — REAL: DB transaction + outbox

### 3.2 Yo'q fayllar (missing) — bu P09 tomonidan YARATILADI

- `apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql` — **YO'Q** (YANGI)
- `lib/db/src/schema/sd-kpi-targets.ts` — **YO'Q** (YANGI)
- `lib/db/src/schema/sd-change-log.ts` — **YO'Q** (YANGI)
- `apps/api/src/database/migrations/` **papkasi ham yo'q** — faqat `seeds/` papkasi bor

### 3.3 Buzuq/Soxta kod (brokenOrFake) — bu P09 FAQAT kuzatadi, to'g'irlamaydi (izolyatsiya)

Quyidagilar bu P09 uchun scope tashqarisida. Boshqa paket yoki keyingi fazaga tegishli:

| Muammo | Fayl:Satr | Tur | Scope |
|---------|-----------|-----|-------|
| `getKpiTargets()` doimiy `Ok([])` qaytaradi | `sd-quotations.repository.ts:112` | STUB | P09 `sd_kpi_targets` jadval yaratadi; repo to'g'irlash BOSHQA PAKET |
| `convertQuotationToOrder` — NOT NULL constraint crash xavfi | `sd-quotations.repository.ts:135` | DRIFT | `document_number`/`order_date`/`pricing_date` NOT NULL; P09 DDL bu muammoni hal qilmaydi |
| `updatePayment()` — controller ichida `db.execute()` | `sd-payments.controller.ts:108` | Qoida 15 | Scope tashqarida |
| `sd-contracts.controller.ts:44` — phantom ustunlar workaround | `sd-contracts.controller.ts:44` | DRIFT | Scope tashqarida |
| `sd-dashboard.controller.ts` — RolesGuard yo'q | `sd-dashboard.controller.ts` | SECURITY | Scope tashqarida — flag qiling |
| `sd_kpi_targets` raw SQL reference lekin pgTable yo'q | `drizzle-quotation.repo.ts:164` | BROKEN | P09 bu jadval pgTable'ini yaratadi (sxema faylda) |

**MUHIM FLAG (scope tashqarida):** `sd-dashboard.controller.ts` `@UseGuards(JwtAuthGuard)` bor lekin `@Roles(...)` dekoratorining effekti `RolesGuard` yo'qligi sababli ishlamaydi — barcha JWT egalari admin/manager/director yo'nalishlarini ko'ra oladi. Bu **SECURITY** muammo. Boshqa agentga yoki keyingi sprintga topshiring.

---

## 4. ISH (QADAM-BAQADAM)

### Qadam 1: `lib/db/src/schema/sd-orders.ts` — Golden-thread ustunlar qo'shish

**Fayl:** `lib/db/src/schema/sd-orders.ts`
**Maqsad:** `salesOrders` pgTable ichiga 10 ta yangi ustun + 2 ta yangi CHECK constraint + 5 ta yangi index qo'shish.
**MUHIM:** Fayl 238 satrdan iborat. Mavjud barcha kod (salesInvoices, insertSalesInvoiceSchema, salesOrders) SAQLANIB QOLADI. Faqat `salesOrders` pgTable ichiga `version` ustunidan KEYIN yangi ustunlar va `(t) => [...]` blokida yangi satrlar QO'SHILADI.

**OLDIN (`sd-orders.ts`, satr 218–236 — `version` ustun va closing bracket):**

```typescript
  // Optimistic concurrency
  version: bigint("version", { mode: "number" }).default(0),
}, (t) => [
  check("sales_orders_overall_status_chk", sql`${t.overallStatus} IN ('IN_PROCESS','COMPLETED','CANCELLED')`),
  check("sales_orders_delivery_status_chk", sql`${t.deliveryStatus} IN ('NOT_DELIVERED','PARTIALLY','FULLY')`),
  check("sales_orders_billing_status_chk", sql`${t.billingStatus} IN ('NOT_BILLED','PARTIALLY','FULLY')`),
  check("sales_orders_net_value_chk", sql`${t.netValue} >= 0`),
  check("sales_orders_tax_amount_chk", sql`${t.taxAmount} >= 0`),
  check("sales_orders_total_value_chk", sql`${t.totalValue} >= 0`),
  index("idx_sales_orders_status").on(t.overallStatus),
  index("idx_sales_orders_customer_id").on(t.customerId),
  index("idx_sales_orders_master_status").on(t.masterStatus),
  index("idx_sales_orders_created_at").on(t.createdAt),
  index("idx_sales_orders_tenant_id").on(t.tenantId),
  index("idx_sales_orders_delivery_status").on(t.deliveryStatus),
  index("idx_sales_orders_billing_status").on(t.billingStatus),
  index("idx_sales_orders_deleted_at").on(t.deletedAt),
  check("sales_orders_master_status_chk", sql`${t.masterStatus} IN ('draft','incomplete','pending_design','pending_sample_lab','pending_manager_completion','pending_technology','pending_advance','ready_for_planning','planned','released_to_production','in_production','pending_qc_final','qc_failed','rework','ready_for_fg_warehouse','in_fg_warehouse','delivery_planned','in_delivery','delivered','partially_paid','fully_paid','closed','cancelled')`),
  check("sales_orders_advance_status_chk", sql`${t.advanceStatus} IN ('no_advance','partial_advance','advance_completed','balance_pending','overdue','paid','closed')`),
]);
```

**KEYIN (`sd-orders.ts`, satr 218–250+ — version ustunidan keyin yangi blok):**

```typescript
  // Optimistic concurrency
  version: bigint("version", { mode: "number" }).default(0),

  // ====================================================================
  // EP Golden-Thread Fields (P09 — EP-SD-056/076/098/099/102/105/106/133)
  // Oltin zanjir: har bir buyurtma shu maydonlar bilan to'liq kuzatiladi.
  // ====================================================================

  // EP-SD-076 Manba/kanal (manbai-kanal) — qayerdan keldi: telegram/call/website/repeat/referral
  sourceChannel: varchar("source_channel", { length: 50 }),

  // EP-SD-098 Papka-nomer — ishlab chiqarish papkasi raqami
  papkaNumber: varchar("papka_number", { length: 30 }),

  // EP-SD-099 Zakaz 1S — 1C:Enterprise tizimidagi buyurtma raqami
  zakaz1s: varchar("zakaz_1s", { length: 50 }),

  // EP-SD-102 Yo'nalish — bosib chiqarish turi: ofset yoki flekso
  direction: varchar("direction", { length: 20 }),

  // EP-SD-105 Davalcheskoe material — mijoz o'z materialini olib kelganmi
  isDavalcheskoe: boolean("is_davalcheskoe").notNull().default(false),

  // EP-SD-106 Fayl/trafaret havolasi — dizayn fayli URL (CDN yoki local storage)
  designFileUrl: text("design_file_url"),

  // EP-SD-056/133 Maket tasdiqlash darvozasi — production blocked without approval
  maketApproved: boolean("maket_approved").notNull().default(false),
  maketApprovedAt: timestamp("maket_approved_at"),
  // VARCHAR(100): employee login yoki email (employees FK keyingi fazada qo'shiladi)
  maketApprovedBy: varchar("maket_approved_by", { length: 100 }),
  maketFileUrl: text("maket_file_url"),

  // ====================================================================
  // EP-SD-068 Tirajdan og'ish (Quantity Deviation Tolerance)
  // Egasi tasdiqlagan: ±10% og'ish mumkin; hisob real chiqqan miqdordan.
  // MUHIM: tolerance_percent = sozlanuvchi, HARDCODE TAQIQ.
  //   Qiymat NULL = hali belgilanmagan → EGASI QIYMATI KERAK (master-data).
  //   Kelajakda sd_order_tolerance_config yoki settings jadvalidan o'qiladi.
  // ====================================================================

  // EP-SD-068 Buyurtma berilgan tiraj (original planned quantity)
  orderedQuantity: integer("ordered_quantity"),

  // EP-SD-068 Haqiqatda ishlab chiqarilgan tiraj (actual produced quantity)
  // NULL = hali ishlab chiqarilmagan yoki noma'lum
  actualQuantity: integer("actual_quantity"),

  // EP-SD-068 Ruxsat etilgan og'ish foizi (sozlanuvchi master-data)
  // EGASI QIYMATI KERAK — NULL bo'lsa sistemaviy default qo'llanilmaydi.
  // Misol: 10.00 = ±10%. Bu qiymatni egasi belgilaydi (dasturchisiz o'zgartiriladi).
  tolerancePercent: numeric("tolerance_percent", { precision: 5, scale: 2 }),

  // EP-SD-068 Og'ish holati (backend tomonidan hisoblanadi)
  // 'within' = ruxsat oralig'ida | 'over' = ortiqcha | 'under' = yetishmaydi | NULL = hisob yo'q
  deviationStatus: varchar("deviation_status", { length: 10 }),
}, (t) => [
  check("sales_orders_overall_status_chk", sql`${t.overallStatus} IN ('IN_PROCESS','COMPLETED','CANCELLED')`),
  check("sales_orders_delivery_status_chk", sql`${t.deliveryStatus} IN ('NOT_DELIVERED','PARTIALLY','FULLY')`),
  check("sales_orders_billing_status_chk", sql`${t.billingStatus} IN ('NOT_BILLED','PARTIALLY','FULLY')`),
  check("sales_orders_net_value_chk", sql`${t.netValue} >= 0`),
  check("sales_orders_tax_amount_chk", sql`${t.taxAmount} >= 0`),
  check("sales_orders_total_value_chk", sql`${t.totalValue} >= 0`),
  index("idx_sales_orders_status").on(t.overallStatus),
  index("idx_sales_orders_customer_id").on(t.customerId),
  index("idx_sales_orders_master_status").on(t.masterStatus),
  index("idx_sales_orders_created_at").on(t.createdAt),
  index("idx_sales_orders_tenant_id").on(t.tenantId),
  index("idx_sales_orders_delivery_status").on(t.deliveryStatus),
  index("idx_sales_orders_billing_status").on(t.billingStatus),
  index("idx_sales_orders_deleted_at").on(t.deletedAt),
  check("sales_orders_master_status_chk", sql`${t.masterStatus} IN ('draft','incomplete','pending_design','pending_sample_lab','pending_manager_completion','pending_technology','pending_advance','ready_for_planning','planned','released_to_production','in_production','pending_qc_final','qc_failed','rework','ready_for_fg_warehouse','in_fg_warehouse','delivery_planned','in_delivery','delivered','partially_paid','fully_paid','closed','cancelled')`),
  check("sales_orders_advance_status_chk", sql`${t.advanceStatus} IN ('no_advance','partial_advance','advance_completed','balance_pending','overdue','paid','closed')`),
  // EP-SD-102 direction CHECK
  check("sales_orders_direction_chk", sql`${t.direction} IS NULL OR ${t.direction} IN ('ofset','flekso')`),
  // EP-SD-076 source_channel index (tez-tez filter qilinadi)
  index("idx_sales_orders_source_channel").on(t.sourceChannel),
  // EP-SD-056 maket_approved index (production gate query)
  index("idx_sales_orders_maket_approved").on(t.maketApproved),
  // EP-SD-105 is_davalcheskoe index
  index("idx_sales_orders_is_davalcheskoe").on(t.isDavalcheskoe),
  // EP-SD-068 tolerance_percent CHECK (0–100 yoki NULL)
  check("sales_orders_tolerance_percent_chk", sql`${t.tolerancePercent} IS NULL OR (${t.tolerancePercent} >= 0 AND ${t.tolerancePercent} <= 100)`),
  // EP-SD-068 deviation_status CHECK
  check("sales_orders_deviation_status_chk", sql`${t.deviationStatus} IS NULL OR ${t.deviationStatus} IN ('within','over','under')`),
  // EP-SD-068 actual_quantity CHECK (musbat yoki NULL)
  check("sales_orders_actual_qty_chk", sql`${t.actualQuantity} IS NULL OR ${t.actualQuantity} >= 0`),
  // EP-SD-068 deviation_status index (dashboard filter uchun)
  index("idx_sales_orders_deviation_status").on(t.deviationStatus),
]);
```

**Drizzle pattern:** Yangi ustunlar `pgTable` birinchi argumenti (column definition object) ichida, `version` dan keyin. CHECK/index'lar `(t) => [...]` bloki ichida, mavjud satrlardan KEYIN. Import ro'yxatida `boolean` va `text` allaqachon bor (satr 8) — yangi import kerak emas.

**Result\<T\> / Zod:** Bu qadam faqat Drizzle schema ta'rifi. Bevosita Result\<T\> kerak emas, lekin bu yangi maydonlar uchun `insertSalesOrderSchema` (boshqa faylda agar mavjud bo'lsa) yangilanishi **keyingi paket**ga tegishli. Izolyatsiya saqlang.

**DB-proof (Qadam 1 uchun):** Migration (§5) qo'llangandan keyin:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sales_orders'
  AND column_name IN (
    'source_channel','papka_number','zakaz_1s',
    'direction','is_davalcheskoe','design_file_url',
    'maket_approved','maket_approved_at','maket_approved_by','maket_file_url'
  );
-- Natija: 10 satr (hamma ustun mavjud)
```

---

### Qadam 2: `lib/db/src/schema/sd-kpi-targets.ts` — KPI maqsadlar jadvali

**Fayl:** `lib/db/src/schema/sd-kpi-targets.ts` — YANGI fayl (hozir mavjud emas)
**Maqsad:** `sd_kpi_targets` jadval Drizzle sxemasi. `drizzle-quotation.repo.ts:164` da raw SQL `UPDATE sd_kpi_targets` murojaat qiladi — jadval DB'da bo'lmasa runtime 500. Bu paket sxemani ta'riflaydi.

**Yaratiluvchi fayl to'liq tarkibi:**

```typescript
/**
 * @module sd-kpi-targets
 * @description SD sotuv KPI maqsadlari — menеjer, yil, oy bo'yicha.
 *   EP-SD-009-014: KPI per-card GSD maqsadlar.
 *   drizzle-quotation.repo.ts:164 da raw SQL UPDATE sd_kpi_targets shu jadvalga murojaat qiladi.
 */

import { sql } from "drizzle-orm";
import {
  serial,
  pgTable,
  integer,
  numeric,
  unique,
  index,
  check,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ----------------------------------------------------------------------------
// sd_kpi_targets — Sotuv menеjeri KPI maqsadlari
// Har menеjer uchun yil+oy kesimida: daromad maqsad, buyurtma soni, yangi mijoz.
// ----------------------------------------------------------------------------
export const sdKpiTargets = pgTable("sd_kpi_targets", {
  id: serial("id").primaryKey(),

  // Menеjer (employees.id FK — employees jadvali bu sxemada import qilinmaydi,
  // integer FK sifatida saqlanadi; DB darajasida FK migration faylida e'lon qilinadi)
  managerId: integer("manager_id").notNull(),

  // Davr
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1–12

  // Moliyaviy maqsad (UZS, NUMERIC(18,2))
  revenueTarget: numeric("revenue_target", { precision: 18, scale: 2 }).notNull().default("0"),

  // Miqdor maqsadlari
  orderCountTarget: integer("order_count_target").notNull().default(0),
  newCustomerTarget: integer("new_customer_target").notNull().default(0),

  // Qo'shimcha KPI maydonlari (kengaytirish uchun)
  quotationCountTarget: integer("quotation_count_target").notNull().default(0),
  conversionRateTarget: numeric("conversion_rate_target", { precision: 5, scale: 2 }).default("0"),
  // conversion_rate_target = KP → buyurtmaga aylanish % maqsadi (0–100)

  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  // (manager_id, year, month) UNIQUE — bir menеjer uchun bir oyda faqat bitta yozuv
  unique("sd_kpi_targets_manager_year_month_uq").on(t.managerId, t.year, t.month),
  // CHECK: month 1–12 oralig'ida
  check("sd_kpi_targets_month_chk", sql`${t.month} >= 1 AND ${t.month} <= 12`),
  // CHECK: year mantiqiy oralig'ida
  check("sd_kpi_targets_year_chk", sql`${t.year} >= 2020 AND ${t.year} <= 2100`),
  // CHECK: ijobiy maqsadlar
  check("sd_kpi_targets_revenue_chk", sql`${t.revenueTarget} >= 0`),
  check("sd_kpi_targets_order_count_chk", sql`${t.orderCountTarget} >= 0`),
  check("sd_kpi_targets_new_customer_chk", sql`${t.newCustomerTarget} >= 0`),
  check("sd_kpi_targets_conversion_rate_chk", sql`${t.conversionRateTarget} IS NULL OR (${t.conversionRateTarget} >= 0 AND ${t.conversionRateTarget} <= 100)`),
  // Indekslar
  index("idx_sd_kpi_targets_manager_id").on(t.managerId),
  index("idx_sd_kpi_targets_year_month").on(t.year, t.month),
]);

// Zod sxemalari
export const insertSdKpiTargetSchema = createInsertSchema(sdKpiTargets, {
  managerId: z.number().int().positive("Menеjer ID musbat butun son bo'lishi kerak"),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  revenueTarget: z.number().nonnegative("Daromad maqsadi 0 yoki katta bo'lishi kerak").optional(),
  orderCountTarget: z.number().int().nonnegative().optional(),
  newCustomerTarget: z.number().int().nonnegative().optional(),
  quotationCountTarget: z.number().int().nonnegative().optional(),
  conversionRateTarget: z.number().min(0).max(100).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const selectSdKpiTargetSchema = createSelectSchema(sdKpiTargets);

export type SdKpiTarget = typeof sdKpiTargets.$inferSelect;
export type InsertSdKpiTarget = z.infer<typeof insertSdKpiTargetSchema>;
```

**Result\<T\> eslatma:** Bu fayl faqat Drizzle pgTable ta'rifi va Zod sxema. Repository metodlari bu jadval ustida quruladi — u Result\<T\> ishlatishi shart (keyingi paket).

**DB-proof (Qadam 2 uchun):**
```sql
-- Migration qo'llangandan keyin:
SELECT COUNT(*) FROM sd_kpi_targets; -- 0 qaytarishi kerak (jadval bo'sh, lekin mavjud)
-- UNIQUE constraint tekshiruvi:
INSERT INTO sd_kpi_targets (manager_id, year, month, revenue_target)
VALUES (1, 2026, 6, 5000000000);
INSERT INTO sd_kpi_targets (manager_id, year, month, revenue_target)
VALUES (1, 2026, 6, 9999999999); -- Bu UNIQUE violation berishi kerak (23505)
```

---

### Qadam 3: `lib/db/src/schema/sd-change-log.ts` — O'zgarishlar, yo'qotishlar, narx tarixi, klishe, jarima

**Fayl:** `lib/db/src/schema/sd-change-log.ts` — YANGI fayl (hozir mavjud emas)
**Maqsad:** 5 ta yangi jadval Drizzle sxemasi:
- `sd_order_change_log` — EP-SD-079/132 maydon darajasida audit log
- `sd_lost_orders` — EP-SD-024 yo'qotilgan buyurtmalar kuzatuvi
- `sd_price_history` — EP-SD-029 narx o'zgarishi auditi
- `sd_cliche_registry` — EP-SD-042/125 klishe/shtamp registri
- `sd_cancellation_penalty_config` — EP-SD-069 bekor qilish jarimasi konfiguratsiyasi

**Yaratiluvchi fayl to'liq tarkibi:**

```typescript
/**
 * @module sd-change-log
 * @description SD sotuv audit log, yo'qotilgan buyurtmalar, narx tarixi,
 *   klishe registri va bekor qilish jarimasi konfiguratsiyasi.
 *
 *   EP-SD-079/132: sd_order_change_log  — buyurtma maydon o'zgarishlari jurnali
 *   EP-SD-024:     sd_lost_orders       — yo'qotilgan buyurtmalar kuzatuvi
 *   EP-SD-029:     sd_price_history     — narx o'zgarishi auditi
 *   EP-SD-042/125: sd_cliche_registry   — klishe/shtamp zavodda saqlash registri
 *   EP-SD-069:     sd_cancellation_penalty_config — bekor qilish jarimasi master-data
 */

import { sql } from "drizzle-orm";
import {
  serial,
  pgTable,
  integer,
  varchar,
  text,
  numeric,
  timestamp,
  index,
  check,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// sd_order_change_log — EP-SD-079/132
// Buyurtma maydonlarining har qanday o'zgarishi uchun audit log.
// "Kim, qachon, nima o'zgartirdi, nima edi, nima bo'ldi" — tamomila kuzatiladi.
// ============================================================================
export const sdOrderChangeLog = pgTable("sd_order_change_log", {
  id: serial("id").primaryKey(),

  // Qaysi buyurtma o'zgardi (sales_orders.id FK — DB darajasida migration da)
  orderId: integer("order_id").notNull(),

  // Qaysi maydon o'zgardi (masalan: 'master_status', 'total_value', 'source_channel')
  fieldName: varchar("field_name", { length: 50 }).notNull(),

  // O'zgarishdan oldingi qiymat (TEXT — har qanday tip uchun)
  oldValue: text("old_value"),

  // O'zgarishdan keyingi qiymat
  newValue: text("new_value"),

  // Kim o'zgartirdi (employees.id FK — integer, DB darajasida migration da)
  changedBy: integer("changed_by"),

  // Qachon o'zgardi
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),

  // EP operatsion kod (masalan: 'STATUS_CHANGE', 'ADVANCE_UPDATE', 'MAKET_APPROVE')
  // Hodisa turi tezkor filter uchun
  epOpCode: varchar("ep_op_code", { length: 30 }),

  // Qo'shimcha kontekst (masalan: bypass sababi, texnik izoh)
  notes: text("notes"),
}, (t) => [
  index("idx_sd_order_change_log_order_id").on(t.orderId),
  index("idx_sd_order_change_log_changed_at").on(t.changedAt),
  index("idx_sd_order_change_log_field_name").on(t.fieldName),
  index("idx_sd_order_change_log_ep_op_code").on(t.epOpCode),
  index("idx_sd_order_change_log_changed_by").on(t.changedBy),
]);

export const insertSdOrderChangeLogSchema = createInsertSchema(sdOrderChangeLog, {
  orderId: z.number().int().positive("Buyurtma ID musbat butun son bo'lishi kerak"),
  fieldName: z.string().min(1).max(50),
  oldValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  changedBy: z.number().int().positive().nullable().optional(),
  epOpCode: z.string().max(30).nullable().optional(),
  notes: z.string().nullable().optional(),
}).omit({ id: true, changedAt: true } as never);

export type SdOrderChangeLog = typeof sdOrderChangeLog.$inferSelect;
export type InsertSdOrderChangeLog = z.infer<typeof insertSdOrderChangeLogSchema>;


// ============================================================================
// sd_lost_orders — EP-SD-024
// Yo'qotilgan (bekor qilingan yoki raqibga ketgan) buyurtmalar kuzatuvi.
// Sotuv rahbari va direktor uchun analitika manbai.
// ============================================================================
export const sdLostOrders = pgTable("sd_lost_orders", {
  id: serial("id").primaryKey(),

  // Yo'qotilgan buyurtma (sales_orders.id FK — DB darajasida migration da)
  salesOrderId: integer("sales_order_id").notNull(),

  // Sabab kategoriyasi — tezkor filter va dashboard uchun
  // narx=narx raqobatbardosh emas | muddat=yetkazib berish muddati | raqobatchi=raqobatchi yutdi
  // sifat=sifat muammosi | boshqa=boshqa sabab
  reasonCategory: varchar("reason_category", { length: 30 }).notNull(),

  // Batafsil izoh (ixtiyoriy)
  notes: text("notes"),

  // Qaysi menеjer buyurtmani boshqargan (employees.id FK)
  managerId: integer("manager_id"),

  // Raqib nomi (agar mavjud)
  competitorName: varchar("competitor_name", { length: 100 }),

  // Yo'qotilgan summa (taxminiy, sotuv buyurtmasidan olinadi)
  lostAmountUzs: numeric("lost_amount_uzs", { precision: 18, scale: 2 }),

  // Qachon yo'qotildi
  lostAt: timestamp("lost_at", { withTimezone: true }).notNull().defaultNow(),

  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check(
    "sd_lost_orders_reason_category_chk",
    sql`${t.reasonCategory} IN ('narx','muddat','raqobatchi','sifat','boshqa')`
  ),
  check("sd_lost_orders_lost_amount_chk", sql`${t.lostAmountUzs} IS NULL OR ${t.lostAmountUzs} >= 0`),
  index("idx_sd_lost_orders_sales_order_id").on(t.salesOrderId),
  index("idx_sd_lost_orders_manager_id").on(t.managerId),
  index("idx_sd_lost_orders_reason_category").on(t.reasonCategory),
  index("idx_sd_lost_orders_lost_at").on(t.lostAt),
]);

export const insertSdLostOrderSchema = createInsertSchema(sdLostOrders, {
  salesOrderId: z.number().int().positive(),
  reasonCategory: z.enum(["narx", "muddat", "raqobatchi", "sifat", "boshqa"]),
  notes: z.string().nullable().optional(),
  managerId: z.number().int().positive().nullable().optional(),
  competitorName: z.string().max(100).nullable().optional(),
  lostAmountUzs: z.number().nonnegative().nullable().optional(),
}).omit({ id: true, createdAt: true, lostAt: true } as never);

export type SdLostOrder = typeof sdLostOrders.$inferSelect;
export type InsertSdLostOrder = z.infer<typeof insertSdLostOrderSchema>;


// ============================================================================
// sd_price_history — EP-SD-029
// Narx o'zgarishi auditi. Har qanday narx/chegirma o'zgarishi uchun tarix.
// entity_type: 'sales_order' | 'quotation' | 'price_formula' | 'product_catalog'
// ============================================================================
export const sdPriceHistory = pgTable("sd_price_history", {
  id: serial("id").primaryKey(),

  // Qaysi ob'ekt turi o'zgardi
  entityType: varchar("entity_type", { length: 30 }).notNull(),

  // Ob'ekt ID (sales_orders.id, sd_quotations.id va h.k.)
  entityId: integer("entity_id").notNull(),

  // Qaysi maydon o'zgardi (masalan: 'total_value', 'net_value', 'discount_percent')
  fieldName: varchar("field_name", { length: 50 }).notNull(),

  // O'zgarishdan oldingi qiymat
  oldValue: text("old_value"),

  // O'zgarishdan keyingi qiymat
  newValue: text("new_value"),

  // Kim o'zgartirdi (employees.id)
  changedBy: integer("changed_by"),

  // Qachon o'zgardi
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),

  // O'zgarish sababi (ixtiyoriy)
  reason: text("reason"),
}, (t) => [
  check(
    "sd_price_history_entity_type_chk",
    sql`${t.entityType} IN ('sales_order','quotation','price_formula','product_catalog','contract')`
  ),
  index("idx_sd_price_history_entity").on(t.entityType, t.entityId),
  index("idx_sd_price_history_changed_at").on(t.changedAt),
  index("idx_sd_price_history_changed_by").on(t.changedBy),
  index("idx_sd_price_history_field_name").on(t.fieldName),
]);

export const insertSdPriceHistorySchema = createInsertSchema(sdPriceHistory, {
  entityType: z.enum(["sales_order", "quotation", "price_formula", "product_catalog", "contract"]),
  entityId: z.number().int().positive(),
  fieldName: z.string().min(1).max(50),
  oldValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  changedBy: z.number().int().positive().nullable().optional(),
  reason: z.string().nullable().optional(),
}).omit({ id: true, changedAt: true } as never);

export type SdPriceHistory = typeof sdPriceHistory.$inferSelect;
export type InsertSdPriceHistory = z.infer<typeof insertSdPriceHistorySchema>;


// ============================================================================
// sd_cliche_registry — EP-SD-042/125
// Klishe/shtamp registri: mijoz bir marta to'laydi → zavod saqlanadi (~3 yil).
// Takror buyurtmada qayta haq olinmaydi. 3 yildan keyin ogohlantirish yuboriladi.
// ============================================================================
export const sdClicheRegistry = pgTable("sd_cliche_registry", {
  id: serial("id").primaryKey(),

  // Klishe egasi mijoz (sd_customers.id FK — DB darajasida migration da)
  // sd_customers INTEGER PK bo'lgani uchun integer ishlatamiz
  customerId: integer("customer_id").notNull(),

  // Klishe tavsifi (masalan: "Logotip 5x3 sm, 2 rangli")
  description: text("description").notNull(),

  // Zavod ichidagi joylashtirish kodi (masalan: "SKLAD-A-14")
  storageLocation: varchar("storage_location", { length: 50 }),

  // Qachon zavoda kiritilgan (klishe yaratilgan sana)
  storedAt: timestamp("stored_at", { withTimezone: true }).notNull().defaultNow(),

  // Ogohlantirish sanasi: 3 yildan keyin avtomatik hisoblanadi
  // DEFAULT = storedAt + 3 yil (migration'da trigger yoki application darajasida)
  alertAt: timestamp("alert_at", { withTimezone: true }).notNull(),

  // Klishe narxi (mijoz to'lagan, bir martalik)
  costUzs: numeric("cost_uzs", { precision: 18, scale: 2 }).notNull().default("0"),

  // Bog'liq birinchi buyurtma (sales_orders.id FK — ixtiyoriy)
  orderId: integer("order_id"),

  // Faol yoki arxivlangan
  isActive: boolean("is_active").notNull().default(true),

  // Klishe o'lchami (masalan: "72x52 sm")
  size: varchar("size", { length: 30 }),

  // Rang soni
  colorCount: integer("color_count"),

  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Arxivlash sanasi (soft delete ekvivalenti)
  archivedAt: timestamp("archived_at"),
}, (t) => [
  check("sd_cliche_registry_cost_chk", sql`${t.costUzs} >= 0`),
  check("sd_cliche_registry_color_count_chk", sql`${t.colorCount} IS NULL OR ${t.colorCount} > 0`),
  index("idx_sd_cliche_registry_customer_id").on(t.customerId),
  index("idx_sd_cliche_registry_alert_at").on(t.alertAt),
  index("idx_sd_cliche_registry_is_active").on(t.isActive),
  index("idx_sd_cliche_registry_order_id").on(t.orderId),
]);

export const insertSdClicheRegistrySchema = createInsertSchema(sdClicheRegistry, {
  customerId: z.number().int().positive("Mijoz ID musbat butun son bo'lishi kerak"),
  description: z.string().min(1, "Klishe tavsifi majburiy"),
  storageLocation: z.string().max(50).nullable().optional(),
  alertAt: z.string().datetime({ message: "alertAt ISO8601 sana bo'lishi kerak" }),
  costUzs: z.number().nonnegative("Klishe narxi 0 yoki katta bo'lishi kerak").optional(),
  orderId: z.number().int().positive().nullable().optional(),
  size: z.string().max(30).nullable().optional(),
  colorCount: z.number().int().positive().nullable().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, archivedAt: true } as never);

export const selectSdClicheRegistrySchema = createSelectSchema(sdClicheRegistry);

export type SdClicheRegistry = typeof sdClicheRegistry.$inferSelect;
export type InsertSdClicheRegistry = z.infer<typeof insertSdClicheRegistrySchema>;


// ============================================================================
// sd_cancellation_penalty_config — EP-SD-069
// Bekor qilish jarimasi konfiguratsiyasi.
// Bosqich: maket=30% | bosilgan=70% | tayyor=100% (foizlar konfiguratsiyalanadi).
// Faqat 3 qator bo'ladi — master-data (seed orqali to'ldiriladi).
// ============================================================================
export const sdCancellationPenaltyConfig = pgTable("sd_cancellation_penalty_config", {
  // stage = PRIMARY KEY (3 qator: 'maket', 'printed', 'ready')
  stage: varchar("stage", { length: 20 }).primaryKey(),

  // Jarima foizi (0–100)
  penaltyPercent: numeric("penalty_percent", { precision: 5, scale: 2 }).notNull(),

  // O'zbek tilidagi tavsif (UI uchun)
  labelUz: varchar("label_uz", { length: 100 }).notNull(),

  // Rus tilidagi tavsif (UI uchun)
  labelRu: varchar("label_ru", { length: 100 }),

  // Audit
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by"), // employees.id
}, (t) => [
  check(
    "sd_cancellation_penalty_config_stage_chk",
    sql`${t.stage} IN ('maket','printed','ready')`
  ),
  check(
    "sd_cancellation_penalty_config_percent_chk",
    sql`${t.penaltyPercent} >= 0 AND ${t.penaltyPercent} <= 100`
  ),
]);

export const insertSdCancellationPenaltyConfigSchema = createInsertSchema(sdCancellationPenaltyConfig, {
  stage: z.enum(["maket", "printed", "ready"]),
  penaltyPercent: z.number().min(0).max(100, "Jarima foizi 0–100 oralig'ida bo'lishi kerak"),
  labelUz: z.string().min(1).max(100),
  labelRu: z.string().max(100).nullable().optional(),
  updatedBy: z.number().int().positive().nullable().optional(),
}).omit({ updatedAt: true } as never);

export type SdCancellationPenaltyConfig = typeof sdCancellationPenaltyConfig.$inferSelect;
export type InsertSdCancellationPenaltyConfig = z.infer<typeof insertSdCancellationPenaltyConfigSchema>;


// ============================================================================
// sd_source_channel_lookup — EP-SD-076 Master-data (HARDCODE TAQIQ)
// Manba/kanal ro'yxati — EGASI BOSHQARADI (ekrandan qo'shadi/o'chiradi).
// MUHIM: source_channel VARCHAR ustuniga CHECK CONSTRAINT QOSHILMAYDI.
//   O'rniga: FK yoki application-darajasida lookup orqali validatsiya.
//   Sabab: egasi "sozlanadigan, master-data, dasturchisiz o'zgartiradi" degan.
//   Hardcode CHECK = egasi falsafasiga zid (00-INTERVYU-MOSLIK §2.C).
// ============================================================================
export const sdSourceChannelLookup = pgTable("sd_source_channel_lookup", {
  // code = application darajasida ishlatiladi (source_channel ustun qiymati)
  code: varchar("code", { length: 50 }).primaryKey(),

  // O'zbek tilidagi nom (UI uchun)
  labelUz: varchar("label_uz", { length: 100 }).notNull(),

  // Rus tilidagi nom (UI uchun, ixtiyoriy)
  labelRu: varchar("label_ru", { length: 100 }),

  // Tartib raqami (UI dropdown uchun)
  sortOrder: integer("sort_order").notNull().default(0),

  // Faol/nofaol (egasi nofaol qilishi mumkin, o'chirmasdan)
  isActive: boolean("is_active").notNull().default(true),

  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_sd_source_channel_lookup_active").on(t.isActive),
  index("idx_sd_source_channel_lookup_sort").on(t.sortOrder),
]);

export type SdSourceChannelLookup = typeof sdSourceChannelLookup.$inferSelect;
```

**DB-proof (Qadam 3 uchun):**
```sql
-- Migration qo'llangandan keyin:
-- 1) sd_order_change_log
SELECT COUNT(*) FROM sd_order_change_log; -- 0 (jadval bo'sh, lekin mavjud)
-- 2) sd_lost_orders: reason_category CHECK
INSERT INTO sd_lost_orders (sales_order_id, reason_category) VALUES (1, 'noma_lum');
-- Natija: ERROR 23514 (CHECK constraint violation) — to'g'ri
INSERT INTO sd_lost_orders (sales_order_id, reason_category) VALUES (1, 'narx');
-- Natija: 1 qator kiritildi — to'g'ri
-- 3) sd_cancellation_penalty_config: seed ma'lumotlari
SELECT stage, penalty_percent FROM sd_cancellation_penalty_config ORDER BY penalty_percent;
-- Natija: maket=30, printed=70, ready=100
-- 4) sd_cliche_registry: alert_at check
SELECT COUNT(*) FROM sd_cliche_registry; -- 0 (bo'sh, lekin mavjud)
-- 5) sd_kpi_targets UNIQUE
SELECT indexname FROM pg_indexes WHERE tablename='sd_kpi_targets'
  AND indexname='sd_kpi_targets_manager_year_month_uq'; -- 1 satr
```

---

### Qadam 4: `apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql` — GATED Migration

**Fayl:** `apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql` — YANGI fayl
**Papka:** `apps/api/src/database/migrations/` — **mavjud emas**, yarating
**Maqsad:** Barcha DDL o'zgarishlarini bitta idempotent migration faylida jamlash.

**MUHIM: Bu faylni YOZING, lekin `psql` bilan ISHGA TUSHIRMANG. Faqat egasi "run" deganda ishlatiladi.**

Fayl tarkibini §5 bo'limiga qarang (to'liq DDL).

---

## 5. DDL — GATED MIGRATION

> **DARVOZA HOLATI:** GATED — egasi `-- APPROVED: <ism> <sana>` izohini qo'shib, `psql` buyrug'ini bergandan keyin ishlatiladi.
> **Fayl:** `apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql`

```sql
-- =============================================================================
-- SD Phase 1: Golden-Thread Fields + KPI + ChangeLog + Cliche + Penalty DDL
-- =============================================================================
-- APPROVED: <egasi-ismi> <sana>   ← egasi shu satrni to'ldiradi
-- GATED: Egasi ruxsatisiz ishlatmang (Q-35)
--
-- Maqsad:
--   1. sales_orders ga golden-thread ustunlar (EP-SD-056/076/098/099/102/105/106/133)
--   2. sd_kpi_targets jadval (EP-SD-009-014)
--   3. sd_order_change_log jadval (EP-SD-079/132)
--   4. sd_lost_orders jadval (EP-SD-024)
--   5. sd_price_history jadval (EP-SD-029)
--   6. sd_cliche_registry jadval (EP-SD-042/125)
--   7. sd_cancellation_penalty_config jadval + seed (EP-SD-069)
--
-- Kanonik jadval: sales_orders (yozish maqsadi)
-- sd_sales_orders = VIEW (o'qish uchun) — bu migration VIEW ni o'zgartirmaydi
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. sales_orders — Golden-Thread Ustunlar
-- =============================================================================
-- EP-SD-076 Manba/kanal
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS source_channel VARCHAR(50);

-- EP-SD-098 Papka-nomer
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS papka_number VARCHAR(30);

-- EP-SD-099 Zakaz 1S
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS zakaz_1s VARCHAR(50);

-- EP-SD-102 Yo'nalish (Ofset/Flekso)
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS direction VARCHAR(20);

-- EP-SD-105 Davalcheskoe material
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS is_davalcheskoe BOOLEAN NOT NULL DEFAULT FALSE;

-- EP-SD-106 Dizayn fayli URL
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS design_file_url TEXT;

-- EP-SD-056/133 Maket tasdiqlash darvozasi
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS maket_approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS maket_approved_at TIMESTAMPTZ;
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS maket_approved_by VARCHAR(100);
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS maket_file_url TEXT;

-- EP-SD-068 Tiraj og'ish maydonlari (Quantity Deviation Tolerance)
-- MUHIM: tolerance_percent = EGASI QIYMATI KERAK — NULL holatda qolsin.
-- Hardcode qiymat (masalan 10.00) kiritilmaydi — egasi master-data orqali belgilaydi.
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS ordered_quantity    INTEGER;
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS actual_quantity     INTEGER;
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS tolerance_percent   NUMERIC(5, 2);
-- EGASI QIYMATI KERAK: tolerance_percent NULL = hali belgilanmagan.
-- Egasi ekrandan qiymat kiritganda UPDATE qiladi (dasturchisiz).
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS deviation_status    VARCHAR(10);

-- EP-SD-068 CHECK va indekslar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_tolerance_percent_chk'
  ) THEN
    ALTER TABLE sales_orders
      ADD CONSTRAINT sales_orders_tolerance_percent_chk
        CHECK (tolerance_percent IS NULL OR (tolerance_percent >= 0 AND tolerance_percent <= 100));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_deviation_status_chk'
  ) THEN
    ALTER TABLE sales_orders
      ADD CONSTRAINT sales_orders_deviation_status_chk
        CHECK (deviation_status IS NULL OR deviation_status IN ('within', 'over', 'under'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_actual_qty_chk'
  ) THEN
    ALTER TABLE sales_orders
      ADD CONSTRAINT sales_orders_actual_qty_chk
        CHECK (actual_quantity IS NULL OR actual_quantity >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_orders_deviation_status
  ON sales_orders (deviation_status);

-- CHECK: direction faqat ofset yoki flekso bo'lishi mumkin (yoki NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sales_orders_direction_chk'
  ) THEN
    ALTER TABLE sales_orders
      ADD CONSTRAINT sales_orders_direction_chk
        CHECK (direction IS NULL OR direction IN ('ofset', 'flekso'));
  END IF;
END $$;

-- Indekslar (idempotent)
CREATE INDEX IF NOT EXISTS idx_sales_orders_source_channel
  ON sales_orders (source_channel);

CREATE INDEX IF NOT EXISTS idx_sales_orders_maket_approved
  ON sales_orders (maket_approved);

CREATE INDEX IF NOT EXISTS idx_sales_orders_is_davalcheskoe
  ON sales_orders (is_davalcheskoe);


-- =============================================================================
-- 2. sd_kpi_targets — EP-SD-009-014
-- =============================================================================
CREATE TABLE IF NOT EXISTS sd_kpi_targets (
  id                     SERIAL PRIMARY KEY,
  manager_id             INTEGER NOT NULL,
  year                   INTEGER NOT NULL,
  month                  INTEGER NOT NULL,
  revenue_target         NUMERIC(18, 2) NOT NULL DEFAULT 0,
  order_count_target     INTEGER NOT NULL DEFAULT 0,
  new_customer_target    INTEGER NOT NULL DEFAULT 0,
  quotation_count_target INTEGER NOT NULL DEFAULT 0,
  conversion_rate_target NUMERIC(5, 2) DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT sd_kpi_targets_manager_year_month_uq
    UNIQUE (manager_id, year, month),
  CONSTRAINT sd_kpi_targets_month_chk
    CHECK (month >= 1 AND month <= 12),
  CONSTRAINT sd_kpi_targets_year_chk
    CHECK (year >= 2020 AND year <= 2100),
  CONSTRAINT sd_kpi_targets_revenue_chk
    CHECK (revenue_target >= 0),
  CONSTRAINT sd_kpi_targets_order_count_chk
    CHECK (order_count_target >= 0),
  CONSTRAINT sd_kpi_targets_new_customer_chk
    CHECK (new_customer_target >= 0),
  CONSTRAINT sd_kpi_targets_conversion_rate_chk
    CHECK (conversion_rate_target IS NULL OR (conversion_rate_target >= 0 AND conversion_rate_target <= 100))
);

-- FK: manager_id → employees(id) — employees jadvali mavjud bo'lsa
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sd_kpi_targets_manager_id_fk'
  ) THEN
    ALTER TABLE sd_kpi_targets
      ADD CONSTRAINT sd_kpi_targets_manager_id_fk
        FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sd_kpi_targets_manager_id
  ON sd_kpi_targets (manager_id);

CREATE INDEX IF NOT EXISTS idx_sd_kpi_targets_year_month
  ON sd_kpi_targets (year, month);


-- =============================================================================
-- 3. sd_order_change_log — EP-SD-079/132
-- =============================================================================
CREATE TABLE IF NOT EXISTS sd_order_change_log (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL,
  field_name  VARCHAR(50) NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  changed_by  INTEGER,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ep_op_code  VARCHAR(30),
  notes       TEXT
);

-- FK: order_id → sales_orders(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sd_order_change_log_order_id_fk'
  ) THEN
    ALTER TABLE sd_order_change_log
      ADD CONSTRAINT sd_order_change_log_order_id_fk
        FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- FK: changed_by → employees(id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sd_order_change_log_changed_by_fk'
  ) THEN
    ALTER TABLE sd_order_change_log
      ADD CONSTRAINT sd_order_change_log_changed_by_fk
        FOREIGN KEY (changed_by) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sd_order_change_log_order_id
  ON sd_order_change_log (order_id);

CREATE INDEX IF NOT EXISTS idx_sd_order_change_log_changed_at
  ON sd_order_change_log (changed_at);

CREATE INDEX IF NOT EXISTS idx_sd_order_change_log_field_name
  ON sd_order_change_log (field_name);

CREATE INDEX IF NOT EXISTS idx_sd_order_change_log_ep_op_code
  ON sd_order_change_log (ep_op_code);


-- =============================================================================
-- 4. sd_lost_orders — EP-SD-024
-- =============================================================================
CREATE TABLE IF NOT EXISTS sd_lost_orders (
  id               SERIAL PRIMARY KEY,
  sales_order_id   INTEGER NOT NULL,
  reason_category  VARCHAR(30) NOT NULL,
  notes            TEXT,
  manager_id       INTEGER,
  competitor_name  VARCHAR(100),
  lost_amount_uzs  NUMERIC(18, 2),
  lost_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT sd_lost_orders_reason_category_chk
    CHECK (reason_category IN ('narx', 'muddat', 'raqobatchi', 'sifat', 'boshqa')),
  CONSTRAINT sd_lost_orders_lost_amount_chk
    CHECK (lost_amount_uzs IS NULL OR lost_amount_uzs >= 0)
);

-- FK: sales_order_id → sales_orders(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sd_lost_orders_sales_order_id_fk'
  ) THEN
    ALTER TABLE sd_lost_orders
      ADD CONSTRAINT sd_lost_orders_sales_order_id_fk
        FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- FK: manager_id → employees(id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sd_lost_orders_manager_id_fk'
  ) THEN
    ALTER TABLE sd_lost_orders
      ADD CONSTRAINT sd_lost_orders_manager_id_fk
        FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sd_lost_orders_sales_order_id
  ON sd_lost_orders (sales_order_id);

CREATE INDEX IF NOT EXISTS idx_sd_lost_orders_reason_category
  ON sd_lost_orders (reason_category);

CREATE INDEX IF NOT EXISTS idx_sd_lost_orders_manager_id
  ON sd_lost_orders (manager_id);

CREATE INDEX IF NOT EXISTS idx_sd_lost_orders_lost_at
  ON sd_lost_orders (lost_at);


-- =============================================================================
-- 5. sd_price_history — EP-SD-029
-- =============================================================================
CREATE TABLE IF NOT EXISTS sd_price_history (
  id           SERIAL PRIMARY KEY,
  entity_type  VARCHAR(30) NOT NULL,
  entity_id    INTEGER NOT NULL,
  field_name   VARCHAR(50) NOT NULL,
  old_value    TEXT,
  new_value    TEXT,
  changed_by   INTEGER,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason       TEXT,

  CONSTRAINT sd_price_history_entity_type_chk
    CHECK (entity_type IN ('sales_order', 'quotation', 'price_formula', 'product_catalog', 'contract'))
);

-- FK: changed_by → employees(id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sd_price_history_changed_by_fk'
  ) THEN
    ALTER TABLE sd_price_history
      ADD CONSTRAINT sd_price_history_changed_by_fk
        FOREIGN KEY (changed_by) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sd_price_history_entity
  ON sd_price_history (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_sd_price_history_changed_at
  ON sd_price_history (changed_at);

CREATE INDEX IF NOT EXISTS idx_sd_price_history_changed_by
  ON sd_price_history (changed_by);


-- =============================================================================
-- 6. sd_cliche_registry — EP-SD-042/125
-- =============================================================================
CREATE TABLE IF NOT EXISTS sd_cliche_registry (
  id                SERIAL PRIMARY KEY,
  customer_id       INTEGER NOT NULL,
  description       TEXT NOT NULL,
  storage_location  VARCHAR(50),
  stored_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alert_at          TIMESTAMPTZ NOT NULL,
  cost_uzs          NUMERIC(18, 2) NOT NULL DEFAULT 0,
  order_id          INTEGER,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  size              VARCHAR(30),
  color_count       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at       TIMESTAMPTZ,

  CONSTRAINT sd_cliche_registry_cost_chk
    CHECK (cost_uzs >= 0),
  CONSTRAINT sd_cliche_registry_color_count_chk
    CHECK (color_count IS NULL OR color_count > 0)
);

-- FK: customer_id → sd_customers(id) (agar mavjud)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sd_customers')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sd_cliche_registry_customer_id_fk'
  ) THEN
    ALTER TABLE sd_cliche_registry
      ADD CONSTRAINT sd_cliche_registry_customer_id_fk
        FOREIGN KEY (customer_id) REFERENCES sd_customers(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- FK: order_id → sales_orders(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sd_cliche_registry_order_id_fk'
  ) THEN
    ALTER TABLE sd_cliche_registry
      ADD CONSTRAINT sd_cliche_registry_order_id_fk
        FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sd_cliche_registry_customer_id
  ON sd_cliche_registry (customer_id);

CREATE INDEX IF NOT EXISTS idx_sd_cliche_registry_alert_at
  ON sd_cliche_registry (alert_at);

CREATE INDEX IF NOT EXISTS idx_sd_cliche_registry_is_active
  ON sd_cliche_registry (is_active);

CREATE INDEX IF NOT EXISTS idx_sd_cliche_registry_order_id
  ON sd_cliche_registry (order_id);


-- =============================================================================
-- 7. sd_cancellation_penalty_config — EP-SD-069
-- =============================================================================
CREATE TABLE IF NOT EXISTS sd_cancellation_penalty_config (
  stage            VARCHAR(20) PRIMARY KEY,
  penalty_percent  NUMERIC(5, 2) NOT NULL,
  label_uz         VARCHAR(100) NOT NULL,
  label_ru         VARCHAR(100),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by       INTEGER,

  CONSTRAINT sd_cancellation_penalty_config_stage_chk
    CHECK (stage IN ('maket', 'printed', 'ready')),
  CONSTRAINT sd_cancellation_penalty_config_percent_chk
    CHECK (penalty_percent >= 0 AND penalty_percent <= 100)
);

-- Seed: boshlang'ich konfiguratsiya (idempotent — INSERT OR DO NOTHING)
-- EP-SD-069: maket=30%, printed=70%, ready=100%
INSERT INTO sd_cancellation_penalty_config (stage, penalty_percent, label_uz, label_ru)
VALUES
  ('maket',   30.00, 'Maket bosqichi (30%)',            'Этап макета (30%)'),
  ('printed', 70.00, 'Bosilgan bosqich (70%)',          'Этап печати (70%)'),
  ('ready',  100.00, 'Tayyor mahsulot bosqichi (100%)', 'Этап готовой продукции (100%)')
ON CONFLICT (stage) DO NOTHING;


-- =============================================================================
-- 8. sd_source_channel_lookup — EP-SD-076 Master-data (CHECK TAQIQ, hardcode TAQIQ)
-- =============================================================================
-- MUHIM: source_channel VARCHAR ustuniga CHECK CONSTRAINT QOSHILMAYDI.
-- Egasi "sozlanadigan, master-data, ekrandan qo'shadi/o'chiradi" degan.
-- Hardcode IN (...) CHECK = egasi falsafasiga zid (00-INTERVYU-MOSLIK §2.C).
-- Application darajasida: yangi order yaratishda FK yoki exist-tekshir qilinadi.
CREATE TABLE IF NOT EXISTS sd_source_channel_lookup (
  code       VARCHAR(50) PRIMARY KEY,
  label_uz   VARCHAR(100) NOT NULL,
  label_ru   VARCHAR(100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sd_source_channel_lookup_active
  ON sd_source_channel_lookup (is_active);

-- Seed: boshlang'ich kanallar (EGASI KENGAYTIRADI — bu minimal to'plam)
INSERT INTO sd_source_channel_lookup (code, label_uz, label_ru, sort_order)
VALUES
  ('telegram',  'Telegram',             'Telegram',             1),
  ('call',      'Telefon qo''ng''irog''i', 'Телефонный звонок',  2),
  ('website',   'Veb-sayt',             'Веб-сайт',             3),
  ('repeat',    'Takroriy buyurtma',     'Повторный заказ',      4),
  ('referral',  'Tavsiya',              'Рекомендация',         5),
  ('visit',     'Ofis tashrifi',        'Визит в офис',         6)
ON CONFLICT (code) DO NOTHING;

COMMIT;
```

---

## 6. QABUL MEZONI

Quyidagi BARCHA nuqtalar ✅ bo'lishi shart. Bitta ham ❌ bo'lsa — commit qilinmaydi.

### 6.1 TypeScript typecheck (BE)

```bash
cd Uzbek-Language-Module
npx tsc --project lib/db/tsconfig.json --noEmit
# Natija: 0 xato, 0 ogohlantirish (yangi sxema fayllari uchun)
```

### 6.2 Drizzle sxema fayllar

- [ ] `lib/db/src/schema/sd-orders.ts` — mavjud 238 satr saqlanib qolgan + yangi ustunlar qo'shilgan (jami ~260+ satr)
- [ ] `lib/db/src/schema/sd-kpi-targets.ts` — yangi fayl, `sdKpiTargets` pgTable, `insertSdKpiTargetSchema`, `SdKpiTarget` type export
- [ ] `lib/db/src/schema/sd-change-log.ts` — yangi fayl, 5 ta pgTable (`sdOrderChangeLog`, `sdLostOrders`, `sdPriceHistory`, `sdClicheRegistry`, `sdCancellationPenaltyConfig`) + Zod sxemalari + type eksportlari

### 6.3 Migration fayl

- [ ] `apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql` — mavjud
- [ ] Fayl boshida `-- GATED: Egasi ruxsatisiz ishlatmang (Q-35)` belgisi bor
- [ ] `BEGIN; ... COMMIT;` tranzaksion wrapper bor
- [ ] Barcha `ALTER TABLE` satrlar `IF NOT EXISTS` yoki `DO $$ BEGIN ... END $$` idempotent shaklida

### 6.4 DB-proof (migration qo'llangandan keyin)

- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='source_channel'` → 1 satr
- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='maket_approved'` → 1 satr
- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='is_davalcheskoe'` → 1 satr
- [ ] EP-SD-068: `SELECT column_name FROM information_schema.columns WHERE table_name='sales_orders' AND column_name IN ('actual_quantity','tolerance_percent','deviation_status','ordered_quantity')` → 4 satr
- [ ] EP-SD-068: `SELECT conname FROM pg_constraint WHERE conname='sales_orders_deviation_status_chk'` → 1 satr
- [ ] EP-SD-076 lookup: `SELECT COUNT(*) FROM sd_source_channel_lookup WHERE is_active=true` → 6 (seed qatorlari)
- [ ] EP-SD-076 lookup: `SELECT code FROM sd_source_channel_lookup ORDER BY sort_order` → telegram, call, website, repeat, referral, visit
- [ ] `SELECT COUNT(*) FROM sd_kpi_targets` → 0 (jadval bo'sh, lekin mavjud)
- [ ] `SELECT * FROM sd_cancellation_penalty_config ORDER BY penalty_percent` → 3 satr: maket(30), printed(70), ready(100)
- [ ] `SELECT COUNT(*) FROM sd_cliche_registry` → 0 (jadval bo'sh, lekin mavjud)
- [ ] `INSERT INTO sd_lost_orders (sales_order_id, reason_category) VALUES (99999, 'noto_g_ri')` → ERROR 23514 (CHECK violation)
- [ ] UNIQUE constraint: ikkinchi `INSERT INTO sd_kpi_targets (manager_id, year, month, ...) VALUES (1, 2026, 6, ...)` → ERROR 23505

### 6.5 Golden-thread regress tekshiruvi

- [ ] `apps/api/src/modules/sd/application/commands/create-order.handler.ts` — mavjud, o'zgartirilmagan
- [ ] `apps/api/src/modules/sd/application/commands/update-order-status.handler.ts` — mavjud, o'zgartirilmagan
- [ ] `/api/sd/orders` GET endpoint — hamon ishlaydi (200 qaytaradi)
- [ ] `/api/sd/orders` POST endpoint — hamon ishlaydi (buyurtma yaratish)

### 6.6 P01 bog'liqligi

- [ ] P01 (lib/db barrel) commit qilingan
- [ ] `lib/db/src/schema/index.ts` mavjud

### 6.7 Izolyatsiya tekshiruvi

- [ ] Faqat 4 ta owned file o'zgartirilgan: `sd-orders.ts` (tahrirlangan) + `sd-kpi-targets.ts` (yangi) + `sd-change-log.ts` (yangi) + `sd-phase1-golden-thread-fields.sql` (yangi)
- [ ] Boshqa hech qanday fayl o'zgartirilmagan
- [ ] `git diff --name-only` natijasida faqat shu 4 fayl + papka ko'rinadi

---

## 7. SELF-VERIFY — ANIQ BUYRUQLAR

Har qadamdan keyin quyidagi buyruqlarni ketma-ket bajaring. Bitta ham xato bo'lsa — keyingi qadamga o'tmang.

### Qadam 1 verifikatsiyasi (`sd-orders.ts` tahriridan keyin)

```bash
# TypeScript typecheck — lib/db uchun
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
npx tsc --project lib/db/tsconfig.json --noEmit 2>&1 | head -30
# Kutilayotgan natija: 0 xato (bo'sh chiqish yoki faqat ogohlantirish)

# Yangi ustunlar mavjudligini tekshirish (Drizzle sxema darajasida)
grep -n "sourceChannel\|papkaNumber\|zakaz1s\|direction\|isDavalcheskoe\|designFileUrl\|maketApproved" \
  lib/db/src/schema/sd-orders.ts
# Natija: har bir yangi ustun uchun 1 satr ko'rinishi kerak

# Eski ustunlar saqlanib qolganini tekshirish
grep -n "salesInvoices\|techBomApproved\|advanceRequired\|storageTariffPerM2" \
  lib/db/src/schema/sd-orders.ts
# Natija: hamma saqlanib qolgan ustunlar ko'rinishi kerak
```

### Qadam 2 verifikatsiyasi (`sd-kpi-targets.ts` yaratilgandan keyin)

```bash
# Yangi fayl mavjudligini tekshirish
ls -la lib/db/src/schema/sd-kpi-targets.ts
# Natija: fayl mavjud

# TypeScript typecheck
npx tsc --project lib/db/tsconfig.json --noEmit 2>&1 | grep "sd-kpi" | head -10
# Natija: 0 xato (bo'sh chiqish)

# pgTable nomi to'g'riligini tekshirish
grep "pgTable.*sd_kpi_targets" lib/db/src/schema/sd-kpi-targets.ts
# Natija: 1 satr

# Export'lar mavjudligini tekshirish
grep "export" lib/db/src/schema/sd-kpi-targets.ts
# Natija: sdKpiTargets, insertSdKpiTargetSchema, selectSdKpiTargetSchema,
#         SdKpiTarget, InsertSdKpiTarget ko'rinishi kerak
```

### Qadam 3 verifikatsiyasi (`sd-change-log.ts` yaratilgandan keyin)

```bash
# Yangi fayl mavjudligini tekshirish
ls -la lib/db/src/schema/sd-change-log.ts

# TypeScript typecheck
npx tsc --project lib/db/tsconfig.json --noEmit 2>&1 | grep "sd-change" | head -10
# Natija: 0 xato

# Barcha 5 ta pgTable mavjudligini tekshirish
grep "pgTable\|export const" lib/db/src/schema/sd-change-log.ts | head -20
# Natija:
#   sdOrderChangeLog = pgTable("sd_order_change_log", ...)
#   sdLostOrders = pgTable("sd_lost_orders", ...)
#   sdPriceHistory = pgTable("sd_price_history", ...)
#   sdClicheRegistry = pgTable("sd_cliche_registry", ...)
#   sdCancellationPenaltyConfig = pgTable("sd_cancellation_penalty_config", ...)
#   sdSourceChannelLookup = pgTable("sd_source_channel_lookup", ...)

# CHECK constraint satrlarini tekshirish
grep "check\|IN (" lib/db/src/schema/sd-change-log.ts | head -10
```

### Qadam 4 verifikatsiyasi (migration fayli yaratilgandan keyin)

```bash
# Fayl mavjudligini tekshirish
ls -la "apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql"

# GATED belgisi borligini tekshirish
grep "GATED" "apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql"
# Natija: "GATED: Egasi ruxsatisiz ishlatmang (Q-35)" ko'rinishi kerak

# BEGIN/COMMIT borligini tekshirish
grep -E "^BEGIN;|^COMMIT;" "apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql"
# Natija: 2 satr (BEGIN va COMMIT)

# IF NOT EXISTS idempotentligini tekshirish
grep "IF NOT EXISTS\|ON CONFLICT" "apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql" | wc -l
# Natija: >10 (barcha CREATE TABLE va INDEX satrlar idempotent)
```

### To'liq typecheck (barcha owned fayllar)

```bash
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
npx tsc --project lib/db/tsconfig.json --noEmit 2>&1
# Natija: 0 xato — bo'sh chiqish (warnings maqbul, errors emas)
```

### DB-proof (migration qo'llangandan keyin — faqat egasi ruxsatidan KEYIN)

```bash
# Migration qo'llash (faqat -- APPROVED: izoh qo'shilgandan keyin)
psql "$DATABASE_URL" -f "apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql"

# Yangi ustunlar tekshiruvi
psql "$DATABASE_URL" -c "
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sales_orders'
  AND column_name IN (
    'source_channel','papka_number','zakaz_1s',
    'direction','is_davalcheskoe','design_file_url',
    'maket_approved','maket_approved_at','maket_approved_by','maket_file_url'
  )
ORDER BY column_name;
"
# Natija: 10 satr

# KPI targets CHECK
psql "$DATABASE_URL" -c "
SELECT stage, penalty_percent FROM sd_cancellation_penalty_config ORDER BY penalty_percent;
"
# Natija: 3 satr: maket=30, printed=70, ready=100

# Jadvallar mavjudligi
psql "$DATABASE_URL" -c "
SELECT table_name FROM information_schema.tables
WHERE table_name IN (
  'sd_kpi_targets', 'sd_order_change_log', 'sd_lost_orders',
  'sd_price_history', 'sd_cliche_registry', 'sd_cancellation_penalty_config'
);
"
# Natija: 6 satr
```

---

## 8. COMMIT

**Buyruqlar (faqat owned fayllar, -A taqiq):**

```bash
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module

# Qadam 1: sd-orders.ts golden-thread ustunlar
git add lib/db/src/schema/sd-orders.ts
git commit -m "feat(sd): add golden-thread fields to sales_orders schema (EP-SD-056/076/098/099/102/105/106/133)

- source_channel, papka_number, zakaz_1s, direction, is_davalcheskoe, design_file_url
- maket_approved, maket_approved_at, maket_approved_by, maket_file_url
- direction CHECK constraint (ofset|flekso|NULL)
- 3 new indexes: source_channel, maket_approved, is_davalcheskoe
- existing salesInvoices + salesOrders columns preserved (Q-46)
P09 Wave 1"

# Qadam 2: yangi sxema fayllar
git add lib/db/src/schema/sd-kpi-targets.ts
git add lib/db/src/schema/sd-change-log.ts
git commit -m "feat(sd): add KPI targets + change log + lost orders + price history + cliche + penalty schema (P09)

- sd_kpi_targets: (manager_id, year, month) UNIQUE, revenue/order/customer targets
- sd_order_change_log: EP-SD-079/132 field-level audit log with FK to sales_orders
- sd_lost_orders: EP-SD-024 reason_category CHECK (narx/muddat/raqobatchi/sifat/boshqa)
- sd_price_history: EP-SD-029 entity_type CHECK (5 types)
- sd_cliche_registry: EP-SD-042/125 alert_at 3-year timer, cost_uzs, is_active
- sd_cancellation_penalty_config: EP-SD-069 staged penalty PK=stage
- All tables: Drizzle pgTable + createInsertSchema + types exported
P09 Wave 1"

# Qadam 3: GATED migration
git add apps/api/src/database/migrations/sd-phase1-golden-thread-fields.sql
git commit -m "chore(sd): GATED migration sd-phase1-golden-thread-fields.sql (P09, DDL owner approval required)

- GATED: requires -- APPROVED: comment before psql run (Q-35)
- Covers: ALTER TABLE sales_orders (10 cols) + CREATE TABLE (6 tables) + seed (3 penalty rows)
- All DDL idempotent (IF NOT EXISTS + DO $$ + ON CONFLICT DO NOTHING)
- FK guards use DO $$ conditional blocks for employees/sd_customers availability
P09 Wave 1"
```

**Commit format qoidasi:**
- `feat(sd):` — yangi funksiya
- `chore(sd):` — DDL/infra
- Har commit mustaqil va mantiqan to'liq
- HECH QACHON `git add -A` yoki `git add .`

---

## 9. TAQIQLANGAN AMALLAR (ESLATMA)

> Bu bo'lim har doim oxirida bo'ladi — reminder sifatida.

- **SD bo'lmagan jadvallarga (employees, warehouse_stock, entries) TEGMANG**
- **`sd_sales_orders` VIEW ga yozishga urinmang** — faqat `sales_orders` yozing
- **`gl_journal_entries` / `gl_lines` ga tegmang** — kanonik `entries` faqat
- **`sd-europrint-schema.ts`, `sd-order-items.ts`, `sd-schema.ts` ga tegmang** — boshqa paketlar
- **Migration faylini egasi ruxsatsiz `psql` bilan ishlatmang** (Q-35)
- **`git add -A` TAQIQ** — faqat `git add <aniq-fayl>`
- **`throw new Error()` / `return null` / `return undefined` TAQIQ** — Result\<T\> ishlating
- **"V2" terminologiyasi TAQIQ** — bitta kod bazasi, shu joyda to'g'irlanadi
- **`sql.raw(variable)` TAQIQ** — faqat `sql\`...\`` yoki `typedExecute<T>`
- **Log/secret HECH QACHON commit qilinmaydi** (Q-45)
- **JWT minting TAQIQ** (Q-30)
```

**Scope tashqarida qolgan muammolar (keyingi paketlarga flag):**

| Muammo | Paket/Sprint |
|---------|-------------|
| `getKpiTargets()` doimiy `Ok([])` — repository stub | SD-Ph3 paket (repo to'g'irlash) |
| `convertQuotationToOrder` NOT NULL crash xavfi | SD-Ph2 paket |
| `sd-payments.controller.ts:108` — controller ichida `db.execute()` | SD-Ph5 paket |
| `sd-dashboard.controller.ts` — RolesGuard effeksiz | Security paket / sprint |
| `sd_kpi_targets` drizzle-quotation.repo.ts:164 raw SQL murojaat | SD-Ph6 paket (bu P09 jadval ta'rifini yaratdi) |
| P01 barrel index.ts ga yangi eksportlar (`sdKpiTargets` va boshq.) | P01 paket yoki P09 oxirida flag |
