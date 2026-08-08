# P12 — PP — Rejalashtirish (Production Planning): PP schema foundations: Drizzle stubs + new tables + production_orders ALTER

> **Agent ID:** P12 | **Wave:** 1 | **Bog'liq:** P01 | **DDL Gate:** ✅ AKTIV
> **Yozilgan:** 2026-06-19 | **Modul rangi:** `--mod-pp-*` (production orange family)

---

## 0. ROL VA QOIDALAR

Sen **🟢 BAJARUVCHI**-san. Har sessiya boshida `CLAUDE.md` va `docs/agent-constitution.md` ni o'qi. Barcha qoidalar qat'iy amal qiladi.

**WAVE:** 1 — Bu agent BIRINCHI to'lqin. P01 (Foundation) tugamasdan bu ish BOSHLANMAYDI.
**DEPENDS ON:** `["P01"]` — P01 commit SHA tasdiqlanmagan bo'lsa, KUTIB TUR.

---

### QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin)

1. **Result\<T\>** hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **@Body** Zod bilan validate; `class-validator` TAQIQ.
3. **Drizzle ORM**; raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri**: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI**; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)**: faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35)**: CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Bu paket DDL talab qiladi — migrationni YOZ lekin **GATED** belgila, ISHGA TUSHIRMA. Egasi `-- APPROVED:` qo'ygunicha qo'lda ishga tushirma.
8. `git add <aniq-fayl>` faqat; `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify**: BE `tsc 0`, FE `tsc 0`, tegishli reviewer skriptlar, jonli DB-proof (kirit→saqla→qayta o'qi→ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik**: TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

---

## 1. IZOLYATSIYA MANIFESTI

**FAQAT shu fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA va egasiga flag qil.**

```
lib/db/src/schema/pp/pp-production.ts        ← MAVJUD; production_orders ALTER + Zod schema yangilash
lib/db/src/schema/pp/pp-enhanced.ts          ← MAVJUD; tech_card_bom / routes / versions Drizzle stubs
lib/db/src/schema/pp/pp-plan-fact.ts         ← YANGI fayl; pp_plan_fact_entries + pp_reason_codes
lib/db/src/schema/pp/pp-shift-plan.ts        ← YANGI fayl; pp_shift_plans
apps/api/src/database/migrations/pp-phase1-schema.sql  ← YANGI fayl; barcha DDL GATED
```

**FAQAT bu 5 ta fayl.** Quyidagilarga TEGMA:
- `apps/api/src/modules/pp/**` — boshqa agent tomonidan boshqariladi
- `lib/db/src/schema/pp/pp-papka.ts` — papka_orders boshqa agentda
- `lib/db/src/schema/pp/pp-iot.ts` — IoT sxemalari boshqa agentda
- `apps/api/src/shared/db/schema-sprint2.ts` — `mps_periods` va `pp_routing_operations` allaqachon u yerda bor (stub copy emas, qayta eksport qil)
- Har qanday controller, service, repository, modul fayl

**DDL GATE:**
- `apps/api/src/database/migrations/pp-phase1-schema.sql` yoziladi lekin **ISHGA TUSHIRILMAYDI**.
- Fayl ichida har bir CREATE/ALTER bloki `-- APPROVED: <egasi> <sana>` izoh bilan belgilanishi SHART.
- Egasi imzosi bo'lmagan bloklarni `-- GATED: awaiting owner approval` deb belgilab qo'y.
- Migration qo'lda `psql -f ...` bilan faqat egasi "ha, ishga tushir" deganda bajariladi.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-05-PP-2026-06-08.md` + `docs/audit/OCHIQ-JAVOBLAR-2026-06-08.md` (PP bo'limi)

### PP = T1 Oltin-ip yadrosi

PP SD va MES o'rtasida turadi. Har bir buyurtma zanjiri:
```
SD (sales_orders) → PP (plan + texkarta + MRP + CRP + smena + AI) → MES (ijro) → QC → WMS → FIN
```

### 6 Fazali qurilish rejasi (bu agent faqat Schema poydevorini quradi)

| Faza | Maqsad |
|------|--------|
| 1 | Texkarta master-data + CRUD (BOM/marshrut/versiyalash/lab-gate) |
| 2 | Stanok (mashina) master + CRP quvvat yuklanishi |
| 3 | MRP kamomad tekshiruvi + material bron + ATP |
| **4** | **Buyurtma 7-holat hayot aylanishi + smena-gantt + ustuvorlik/ZARUR/muzlatilgan** |
| **5** | **Plan-fakt 4-raqam smena kiritish + sabab kodlari + brak→qayta ishlash** |
| 6 | AI 7-bosqich rejalashtiruvchi + egasi paneli + bandlik gantt + kod lug'ati |

### Egasi tomonidan tasdiqlangan biznes qoidalar (OCHIQ-JAVOBLAR dan verbatim)

**EP-PP-082 — Buyurtma 7-holat aylanishi (TASDIQLANGAN):**
```
Reja → Tasdiqlangan → Ishga tushgan → Jarayonda → Sifatda → Tugadi → Yopildi
+ Bekor / To'xtatilgan (terminal holatlar)
```
Har o'tish kim/qachon/sabab bilan qayd etilishi SHART (`pp_order_status_log`).

**EP-PP-025 — Muzlatilgan zona (sozlanadigan, default EGASI QIYMATI KERAK):**
Faqat egasi/direktor `frozen_until` muddatini o'zgartira oladi. Muzlatilgan buyurtmani boshqa statusga o'tkazish uchun guard majburiy (bu agentda faqat ustun — guard boshqa agentda).
`frozen_until` muddati **qotirilgan raqam emas** — master-data sozlama jadvalidan olinadi.
Direktiva avvalda "~3 kun" deb yozgan edi — bu egasi aytmagan taxminiy default (OCHIQ-JAVOBLAR da faqat "~3 kun muzlatilgan" deyilgan, aniq kun raqami tasdiqlanmagan).
`pp_config` jadvaliga `frozen_horizon_days` kalit-qiymat qo'shiladi (qarang BLOK A va §5 DDL BLOK-CONFIG).
**⚠️ EGASI QIYMATI KERAK:** Egasi `frozen_horizon_days` uchun aniq qiymat berguncha schema `NULL` saqlaydi; servis `frozen_horizon_days IS NULL` bo'lsa guard o'tkazib yuboradi (xavfsiz default = muzlatish yo'q).

**EP-PP-010/097 — ZARUR zona:**
`priority_flag` = `'normal'|'high'|'urgent'|'zarur'`. ZARUR = eng yuqori ustuvorlik, UI'da alohida blok.

**EP-PP-099 — Tayorlik foizi:**
`readiness_pct NUMERIC(5,2) DEFAULT 0` — CRP/MRP servis tomonidan yangilanadi, manual kiritilmaydi.

**EP-PP-072/073 — Smena rejasi:**
Smena × stanok × buyurtma × operator × yordamchi (2 rol). Asosiy manba: `pp_shift_plans`.

**EP-PP-092 — Smena 4-raqam kiritish:**
`reja / fakt / qolgan / brak` maydonlari + sabab kodi → `pp_plan_fact_entries`.

**EP-PP-055 — 5+1 guruh sabab kodlari (kitob EXACT + egasi "+ boshqa/izoh"):**
```
1. material     — Material yo'qligi guruhi
2. dastgoh      — Dastgoh buzilishi guruhi
3. kadr         — Kadr yetishmasligi guruhi
4. texnologik   — Texnologik xato guruhi
5. reja         — Reja noto'g'ri guruhi
6. boshqa       — Boshqa / umumiy izoh guruhi (egasi EP-PP-055 da "+ boshqa/izoh" degan)
```
> **ESLATMA (MUVOFIQLIK FIX — 2026-06-19):** Konformans audit P14 seed inglizcha guruh nomlari
> (`equipment/staffing/technology/planning/other`) P12 ning Uzbekcha CHECK
> (`material/dastgoh/kadr/texnologik/reja`) bilan ziddiyat qilishini aniqladi.
> Kanonik guruh nomlari = YUQORIDAGI O'ZBEKCHA nomlar. P14 seed ular bilan mos kelishi SHART.
> Egasi EP-PP-055 da "+ boshqa/izoh" degan — shuning uchun `boshqa` 6-guruh sifatida qo'shildi
> va CHECK ham kengaytirildi (qarang §5 DDL BLOK E va Drizzle pp-plan-fact.ts Qadam 6).

**EP-PP-068 — Material bron:**
Tasdiqlangan buyurtma `warehouse_stock` dan materialni bronlaydi. Bron = `pp_material_reservations`. Kanonik ombor = `warehouse_stock` (HECH QACHON `stocks` jadvaliga tegma).

**EP-PP-109 — Kod lug'ati:**
`KT/PT/E/GL` prefikslari — placeholder only. Egasi ma'nolarni keyinroq kiritadi. `pp_code_dictionary` jadval yaratilsin, seed bo'sh.

**E3 — AI 7-bosqich rejalashtiruvchi:**
```
buyurtma → material → bron → marshrut → vaqt → reja → ijro
```
AI taklif qiladi, inson tasdiqlaydi (auto-block/penalty TAQIQ — E1 qoidasi).

**E6 — Bitta kanonik haqiqat:**
- Buyurtmalar: `sales_orders` (sd_sales_orders = VIEW, TEGMA)
- Ombor: `warehouse_stock` (current_stock = VIEW, TEGMA)
- GL: `entries` (gl_journal_entries TEGMA)

### Qabul mezonlari (vizyon bo'yicha)

| Xususiyat | Muvaffaqiyat o'lchovi |
|-----------|----------------------|
| production_orders.status | 9 qiymatli CHECK: reja/tasdiqlangan/ishga_tushgan/jarayonda/sifatda/tugadi/yopildi/bekor/toxtatilgan |
| production_orders yangi ustunlar | priority_flag, frozen_until, readiness_pct, papka_seq_year |
| equipment 4 norma ustun (MES P17 e'lon qildi) | norma_hourly, brak_percent_norm, oee_target, unit_of_measure — `pp-production.ts` egasi (P12) qo'llaydi |
| tech_card_bom | Drizzle pgTable mavjud, technology.repository.ts raw SQL bilan mos |
| tech_card_routes | Drizzle pgTable mavjud, op_seq/norm_per_hour/min_razryad mavjud |
| tech_card_versions | Drizzle pgTable mavjud, snapshot JSONB |
| mps_periods | lib/db/src/ da pgTable, schema-sprint2.ts bilan DUPLIKAT EMAS (re-export) |
| pp_routing_operations | lib/db/src/ da pgTable, schema-sprint2.ts bilan DUPLIKAT EMAS (re-export) |
| pp_order_status_log | pgTable + Zod insert schema |
| pp_shift_plans | pgTable + Zod insert schema, smena CHECK IN ('den','noch') |
| pp_plan_fact_entries | pgTable + Zod insert schema, 4 raqam (reja/fakt/qolgan/brak) |
| pp_reason_codes | pgTable + 5-guruh seed SQL |
| pp_material_reservations | pgTable, warehouse_stock ga FK emas (material_id → material_cards) |
| pp_code_dictionary | pgTable + bo'sh (placeholder) |

---

## 3. HOZIRGI HOLAT

### Mavjud (VERIFIED)

#### lib/db/src/schema/pp/pp-production.ts

| Jadval | Qator | Holat |
|--------|-------|-------|
| `productionFactsSM72` | 19 | ✅ Drizzle |
| `workCenters` | 48 | ✅ Drizzle, `efficiencyRate` ustun 77-qatorda mavjud |
| `products` | 98 | ✅ Drizzle |
| `orders` | 125 | ✅ Drizzle (eski "orders" = boshqa dunyo, SD buyurtmalaridan alohida) |
| `productionPlanHeader` | 160 | ✅ Drizzle |
| `productionPlanLines` | 193 | ✅ Drizzle |
| `bomHeaders` | ~270 | ✅ Drizzle |
| `bomItems` | ~300 | ✅ Drizzle |
| `routings` | 365 | ✅ Drizzle, status CHECK: draft/active/inactive |
| `routingOperations` | ~390 | ✅ Drizzle (bu `routings` ga bog'liq, `pp_routing_operations` EMAS) |
| `productionOrders` | 446 | ✅ Drizzle — LEKIN 6-holatli (muammo!) |
| `productionOrderOperations` | 510 | ✅ Drizzle |
| `productionOrderComponents` | 541 | ✅ Drizzle |
| `equipment` | ~718-761 | ✅ Drizzle — LEKIN 4 norma ustun yo'q (MES P17 e'lon qildi, bu paket qo'shadi) |

**KRITIK MUAMMO — pp-production.ts:492:**
```typescript
// HOZIRGI (NOTO'G'RI — 6-holat, vizyon 9 talab qiladi):
check("production_orders_status_chk",
  sql`${t.status} IN ('created','released','in_progress','completed','closed','qc_hold')`)
```
Bu CHECK constraint vizyon EP-PP-082 bilan to'qnash keladi. Har qanday vizyon statusini (`reja`, `tasdiqlangan`, vs.) kiritmoqchi bo'lsang **23514 PostgreSQL CHECK violation** xatosi chiqadi.

**YANGI USTUNLAR YO'Q — pp-production.ts:446-493:**
- `priority_flag` yo'q (faqat `priority integer` 1-5 mavjud — q:462)
- `frozen_until` yo'q
- `readiness_pct` yo'q
- `papka_seq_year` yo'q

#### lib/db/src/schema/pp/pp-enhanced.ts

| Jadval | Qator | Holat |
|--------|-------|-------|
| `machineCrews` | 20 | ✅ Drizzle |
| `setupChecklists` | 43 | ✅ Drizzle |
| `checklistItems` | 65 | ✅ Drizzle |
| `materialConsumption` | 86 | ✅ Drizzle |
| `defectReports` | 109 | ✅ Drizzle |
| `bomTemplates` | 131 | ✅ Drizzle |
| `technologyCards` | 146 | ✅ Drizzle (lekin `tech_card_bom/routes/versions` ALOHIDA jadvallar — yo'q!) |
| `materialNorms` | 172 | ✅ Drizzle |
| `orderProductionHistory` | 199 | ✅ Drizzle |

**KRITIK MUAMMO:** `tech_card_bom`, `tech_card_routes`, `tech_card_versions` jadvallari DB darajasida mavjud (technology.repository.ts raw SQL ishlatadi), lekin lib/db/src/schema/pp/ da Drizzle pgTable **YO'Q**. Bu TypeScript type-safety ni buzadi va review skriptlar "orphan raw SQL" deb belgilaydi.

#### apps/api/src/shared/db/schema-sprint2.ts

| Jadval | Qator | Holat |
|--------|-------|-------|
| `mps_periods` | 76 | ✅ Drizzle — LEKIN `apps/api/src/shared/db/` da, `lib/db/src/schema/pp/` da EMAS |
| `pp_routing_operations` | 141 | ✅ Drizzle — xuddi shu muammo |

**Yondashuv:** Bu ikki jadval `schema-sprint2.ts` da allaqachon bor. `lib/db/src/schema/pp/` da ularni QAYTA YOZMA — bu duplikat bo'ladi. Buning o'rniga `pp-production.ts` ga re-export qo'sh (qarang §4 Qadam 3).

### Yo'q (MISSING)

| Jadval | Status |
|--------|--------|
| `pp_order_status_log` | ❌ Mavjud emas hech qayerda |
| `pp_shift_plans` | ❌ Mavjud emas (`pp-shift-plan.ts` fayl yo'q) |
| `pp_plan_fact_entries` | ❌ Mavjud emas (`pp-plan-fact.ts` fayl yo'q) |
| `pp_reason_codes` | ❌ Mavjud emas (downtime_reason_codes boshqa maqsadda) |
| `pp_material_reservations` | ❌ Mavjud emas |
| `pp_code_dictionary` | ❌ Mavjud emas |
| `tech_card_bom` Drizzle | ❌ Raw SQL bor, pgTable yo'q |
| `tech_card_routes` Drizzle | ❌ Raw SQL bor, pgTable yo'q |
| `tech_card_versions` Drizzle | ❌ Raw SQL bor, pgTable yo'q |
| production_orders 4 yangi ustun | ❌ priority_flag/frozen_until/readiness_pct/papka_seq_year |
| production_orders status CHECK | ❌ 6-holatli (vizyon 9 talab qiladi) |
| equipment 4 norma ustun | ❌ norma_hourly/brak_percent_norm/oee_target/unit_of_measure (MES P17 e'lon qildi — bu paket qo'shadi) |

### Buzuq / Soxta (BROKEN OR FAKE)

| Muammo | Fayl:qator | Tavsiflash |
|--------|-----------|-----------|
| production_orders 6-holat CHECK | `pp-production.ts:492` | Vizyon EP-PP-082 bilan to'qnash — ALTER kerak |
| insertProductionOrderSchema status enum | `pp-production.ts:502` | 6-holat enum → 9-holat yangilanishi kerak |
| `technology.repository.ts:220` raw SQL `tech_card_bom` | `technology.repository.ts:220` | Drizzle schema bo'lmagani uchun type safety yo'q |
| `technology.repository.ts:235` raw SQL `tech_card_routes` | `technology.repository.ts:235` | Xuddi shu |
| `technology.repository.ts:253` raw SQL `tech_card_versions` | `technology.repository.ts:253` | Xuddi shu |
| CRP service silent-wrong | `pp-crp.service.ts:137` | pp_routing_operations bo'sh bo'lsa barcha utilization=0 (xato emas, shunchaki noto'g'ri) |

---

## 4. ISH (Qadam-baqadam)

> Har qadam tugagach — `tsc --noEmit` ishga tushir. Xato bo'lsa — keyingi qadam OLD, avval tuzat.

### Qadam 1 — pp-production.ts: production_orders ALTER + Zod yangilash

**Fayl:** `lib/db/src/schema/pp/pp-production.ts`

**Maqsad:** 4 yangi ustun qo'sh + status CHECK ni 9-holatga kengaytir + Zod schema yangilansin.

**Oldin (pp-production.ts:446-507):**
```typescript
// Production Orders (Ishlab chiqarish buyurtmalari)
export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  // ... (mavjud ustunlar)
  priority: integer("priority").notNull().default(3),
  // ... (boshqa ustunlar)
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  // ...
  check("production_orders_status_chk",
    sql`${t.status} IN ('created','released','in_progress','completed','closed','qc_hold')`),
]);

export const insertProductionOrderSchema = createInsertSchema(productionOrders, {
  // ...
  status: z.enum(["created", "released", "in_progress", "completed", "closed", "qc_hold"]),
  priority: z.number().int().min(1).max(5, "Ustuvorlik 1-5 oralig'ida bo'lishi kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);
```

**Keyin (to'liq blok):**

`productionOrders` pgTable ichida `deletedAt` ustunidan KEYIN (lekin `}, (t) => [` dan OLDIN) quyidagilarni qo'sh:

```typescript
  // ── PP Faza-4: Vizyon ustunlari (EP-PP-010/025/082/097/099) ──
  // priority_flag: 4-darajali ustuvorlik + ZARUR zona (EP-PP-010/097)
  // ZARUR = eng yuqori (UI blok, gantt rang, xabarnoma).
  // normal/high/urgent/zarur — integer priority ustuni saqlanadi (legacy CRP uchun)
  priorityFlag: varchar("priority_flag", { length: 20 }).notNull().default("normal"),
  // frozen_until: Muzlatilgan zona (EP-PP-025). Faqat egasi/direktor o'zgartira oladi.
  // Muddat pp_config.frozen_horizon_days dan hisoblanadi (EGASI QIYMATI KERAK — NULL = guard o'chirilgan).
  // ⚠️ Hardcode "~3 kun" TAQIQ — raqam tasdiqlanmagan; pp_config dan o'qiladi.
  // Guard logikasi boshqa agentda (PP controllers). Bu ustun faqat saqlanadi.
  frozenUntil: timestamp("frozen_until"),
  // readiness_pct: Buyurtma tayorlik foizi % (EP-PP-099). CRP/MRP yangilaydi, manual EMAS.
  readinessPct: numericMoney("readiness_pct").default("0"),
  // papka_seq_year: Papka № auto-generator uchun yil sekvensi (EP-PP-103).
  // Formatlanish: YYYY-NNNN. Bu ustun yilni saqlaydi, no servis hisoblaydi.
  papkaSeqYear: integer("papka_seq_year"),
```

`(t) => [` bloki ichida CHECK larni quyidagicha yangilansin:

```typescript
  // ESKI: check("production_orders_status_chk", sql`...6 holat...`)
  // YANGI: 9 holat (EP-PP-082 tasdiqlangan)
  check(
    "production_orders_status_chk",
    sql`${t.status} IN ('reja','tasdiqlangan','ishga_tushgan','jarayonda','sifatda','tugadi','yopildi','bekor','toxtatilgan')`
  ),
  check(
    "production_orders_priority_flag_chk",
    sql`${t.priorityFlag} IN ('normal','high','urgent','zarur')`
  ),
  check(
    "production_orders_readiness_pct_chk",
    sql`${t.readinessPct} >= 0 AND ${t.readinessPct} <= 100`
  ),
```

`insertProductionOrderSchema` ni yangilansin:

```typescript
export const insertProductionOrderSchema = createInsertSchema(productionOrders, {
  orderNumber: z.string().min(1, "Buyurtma raqami talab qilinadi"),
  productId: z.string().min(1, "Mahsulot tanlash kerak"),
  plannedQuantity: z.number().positive("Rejalashtirilgan miqdor musbat bo'lishi kerak"),
  confirmedQuantity: z.number().nonnegative("Tasdiqlangan miqdor 0 yoki katta bo'lishi kerak"),
  scrapQuantity: z.number().nonnegative("Chiqindi miqdori 0 yoki katta bo'lishi kerak"),
  orderType: z.enum(["standard", "rework", "sample"]),
  // EP-PP-082: 7 asosiy holat + 2 terminal holat
  status: z.enum([
    "reja", "tasdiqlangan", "ishga_tushgan", "jarayonda",
    "sifatda", "tugadi", "yopildi", "bekor", "toxtatilgan"
  ]),
  priority: z.number().int().min(1).max(5, "Ustuvorlik 1-5 oralig'ida bo'lishi kerak"),
  // EP-PP-010/097: 4-darajali flag
  priorityFlag: z.enum(["normal", "high", "urgent", "zarur"]).optional(),
  readinessPct: z.number().min(0).max(100).optional(),
  papkaSeqYear: z.number().int().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);
```

**ESLATMA:** `pp_order_status_log` jadvalini ham shu faylga qo'sh (qarang Qadam 2).

---

### Qadam 1b — pp-production.ts: equipment 4 norma ustun (MES P17 e'lon qildi)

**Fayl:** `lib/db/src/schema/pp/pp-production.ts` (davom)

**Manba:** Bu 4 ustunni **MES paketi P17 e'lon qildi** (EP-MES-034/039/040/082), lekin
`pp-production.ts` ning yagona egasi shu paket (P12) — shuning uchun ustunlarni P12 qo'shadi.
P17 ularni faqat O'QIYDI (import qiladi); `pp-production.ts` ni P17 EDIT QILMAYDI.

**Maqsad:** `equipment` jadvali ta'rifiga (taxminan satrl 718-761) 4 yangi ustun qo'sh.

**Aniq joyi:** `operatingHours` ustunidan KEYIN, `isActive` dan OLDIN:

```typescript
// OLDIN (taxminan satrl 738-742):
  operatingHours: numericMoney("operating_hours").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
```

```typescript
// KEYIN — 4 ustun qo'shiladi (MES P17 e'lon qilgan — pp-production.ts egasi qo'llaydi):
  operatingHours: numericMoney("operating_hours").default(0),
  // ── MES norma cols (EP-MES-034/039/040/082) — P17 e'lon qildi, P12 qo'llaydi ──
  normaHourly:      numericMoney("norma_hourly"),
  // Soatlik norma ishlab chiqarish miqdori (mashina turiga qarab, masalan: SM-52=5000 varoq/soat)
  brakPercentNorm:  numericMoney("brak_percent_norm"),
  // Ruxsat etilgan brak foizi (masalan: 0.50 = 0.5%). Oshsa — signal.
  oeeTarget:        numericMoney("oee_target"),
  // OEE maqsadli ko'rsatkich (masalan: 0.85 = 85%). EP-MES-014 barcha darajalarda.
  unitOfMeasure:    varchar("unit_of_measure", { length: 20 }),
  // Mahsulot o'lchov birligi: 'varoq', 'dona', 'metr', 'kg'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
```

**Zod sxemasini ham yangilansin** (`insertEquipmentSchema`, taxminan satrl 753-758):

```typescript
// OLDIN:
export const insertEquipmentSchema = createInsertSchema(equipment, {
  equipmentNumber: z.string().min(1, "Uskuna raqami kerak"),
  name: z.string().min(2, "Nom kerak"),
  category: z.enum(["machine", "conveyor", "vehicle", "tool", "other"]),
  status: z.enum(["active", "inactive", "maintenance", "scrapped"]),
}).omit({ id: true, createdAt: true } as never);

// KEYIN:
export const insertEquipmentSchema = createInsertSchema(equipment, {
  equipmentNumber: z.string().min(1, "Uskuna raqami kerak"),
  name: z.string().min(2, "Nom kerak"),
  category: z.enum(["machine", "conveyor", "vehicle", "tool", "other"]),
  status: z.enum(["active", "inactive", "maintenance", "scrapped"]),
  // EP-MES-034/039/040/082 (P17 e'lon qildi)
  normaHourly:     z.number().positive().optional().nullable(),
  brakPercentNorm: z.number().min(0).max(100).optional().nullable(),
  oeeTarget:       z.number().min(0).max(1).optional().nullable(),
  unitOfMeasure:   z.string().max(20).optional().nullable(),
}).omit({ id: true, createdAt: true } as never);
```

**Tekshir:** `numericMoney` helper allaqachon import qilingan (satrl 6 —
`import { numericMoney } from "../numeric-money"`). `varchar` import ham mavjud.

**ALTER SQL §5 DDL bo'limida (BLOK A-EQUIPMENT) GATED tarzda qo'shiladi.**

---

### Qadam 2 — pp-production.ts: pp_order_status_log pgTable qo'shish

**Fayl:** `lib/db/src/schema/pp/pp-production.ts` (davom)

`insertProductionOrderSchema` / `ProductionOrder` type eksportlaridan KEYIN quyidagi bloklarni qo'sh:

```typescript
// ─────────────────────────────────────────────────────────────────────────
// PP Buyurtma Holat Jurnali (EP-PP-082 — kim/qachon/nima/sabab)
// Har status o'tishida avtomatik yoziladi. Manual kiritish TAQIQ.
// ─────────────────────────────────────────────────────────────────────────
export const ppOrderStatusLog = pgTable("pp_order_status_log", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => productionOrders.id, { onDelete: "cascade" }),
  fromStatus: varchar("from_status", { length: 30 }),
  toStatus: varchar("to_status", { length: 30 }).notNull(),
  changedBy: integer("changed_by").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  // Muzlatilgan zona tekshiruvi (EP-PP-025): o'tish vaqtida frozen_until > NOW() bo'lsa log yoziladi
  frozenBypass: boolean("frozen_bypass").notNull().default(false),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
}, (t) => [
  index("idx_pp_order_status_log_order_id").on(t.orderId),
  index("idx_pp_order_status_log_changed_at").on(t.changedAt),
  check(
    "pp_order_status_log_to_status_chk",
    sql`${t.toStatus} IN ('reja','tasdiqlangan','ishga_tushgan','jarayonda','sifatda','tugadi','yopildi','bekor','toxtatilgan')`
  ),
]);

export const insertPpOrderStatusLogSchema = createInsertSchema(ppOrderStatusLog, {
  orderId: z.number().int().positive("Buyurtma ID kerak"),
  toStatus: z.enum([
    "reja", "tasdiqlangan", "ishga_tushgan", "jarayonda",
    "sifatda", "tugadi", "yopildi", "bekor", "toxtatilgan"
  ]),
  reason: z.string().max(500).optional(),
}).omit({ id: true, changedAt: true } as never);

export type PpOrderStatusLog = typeof ppOrderStatusLog.$inferSelect;
export type InsertPpOrderStatusLog = z.infer<typeof insertPpOrderStatusLogSchema>;
```

---

### Qadam 3 — pp-production.ts: mps_periods va pp_routing_operations re-export

**Fayl:** `lib/db/src/schema/pp/pp-production.ts` (davom)

`schema-sprint2.ts` da allaqachon `mps_periods` va `pp_routing_operations` pgTable bor.
`lib/db/src/schema/pp/` barrel eksporti uchun re-export qo'sh — duplikat yozma:

```typescript
// ─────────────────────────────────────────────────────────────────────────
// Re-exports: apps/api/src/shared/db/schema-sprint2.ts da allaqachon aniqlangan
// Drizzle sxemalar. lib/db/src/schema/pp/ barrel orqali ham eksport qilinsin.
// DUPLIKAT pgTable yaratma — faqat re-export.
// ─────────────────────────────────────────────────────────────────────────
export {
  mps_periods,
  pp_routing_operations,
} from "../../../apps/api/src/shared/db/schema-sprint2";
// ESLATMA: Agar relative path import xato bersa, bu re-export ni lib/db index.ts ga ko'chir.
// Circular import tekshir: schema-sprint2.ts → lib/db ni import qilmaydi (bir tomonli).
```

**MUQOBIL YONDASHUV (agar circular import bo'lsa):**
Re-export o'rniga `lib/db/src/schema/pp/pp-production.ts` ga faqat izoh yoz:
```typescript
// mps_periods va pp_routing_operations → apps/api/src/shared/db/schema-sprint2.ts da mavjud.
// lib/db barrel re-export uchun lib/db/src/index.ts ni ko'ring.
```
Va `lib/db/src/index.ts` da eksport qo'sh (bu fayl OWNED-FILE emas, egasiga flag qil).

---

### Qadam 4 — pp-enhanced.ts: tech_card_bom Drizzle stub

**Fayl:** `lib/db/src/schema/pp/pp-enhanced.ts`

`technologyCards` pgTable eksportlaridan KEYIN (taxminan 170-qatordan keyin) quyidagi bloklarni qo'sh:

```typescript
// ─────────────────────────────────────────────────────────────────────────
// Texkarta BOM (Bill of Materials) — EP-PP-013/032
// DB darajasida mavjud jadval (technology.repository.ts:220 raw SQL ishlatadi).
// Bu Drizzle stub type-safety va barrel-eksport uchun.
// ─────────────────────────────────────────────────────────────────────────
export const techCardBom = pgTable("tech_card_bom", {
  id: serial("id").primaryKey(),
  technologyCardId: integer("technology_card_id")
    .notNull()
    .references(() => technologyCards.id, { onDelete: "cascade" }),
  // material_code: raw material kodi (material_cards.code bilan mos kelishi kerak)
  materialCode: varchar("material_code", { length: 100 }).notNull(),
  quantity: numericMoney("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("kg"),
  // layer: texnologik qatlam (masalan: bosma/zag/varnish)
  layer: varchar("layer", { length: 20 }),
}, (t) => [
  index("idx_tech_card_bom_technology_card_id").on(t.technologyCardId),
  index("idx_tech_card_bom_material_code").on(t.materialCode),
]);

export const insertTechCardBomSchema = createInsertSchema(techCardBom, {
  technologyCardId: z.number().int().positive("Texkarta ID kerak"),
  materialCode: z.string().min(1, "Material kodi talab qilinadi"),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
  unit: z.string().max(20).optional(),
  layer: z.string().max(20).optional(),
}).omit({ id: true } as never);

export type TechCardBom = typeof techCardBom.$inferSelect;
export type InsertTechCardBom = z.infer<typeof insertTechCardBomSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Texkarta Marshrut (Routes / Operatsiyalar ketma-ketligi) — EP-PP-014/036
// DB darajasida mavjud (technology.repository.ts:235).
// ─────────────────────────────────────────────────────────────────────────
export const techCardRoutes = pgTable("tech_card_routes", {
  id: serial("id").primaryKey(),
  technologyCardId: integer("technology_card_id")
    .notNull()
    .references(() => technologyCards.id, { onDelete: "cascade" }),
  // op_seq: Operatsiya ketma-ketlik raqami (1, 2, 3...)
  opSeq: integer("op_seq").notNull(),
  operation: varchar("operation", { length: 100 }).notNull(),
  // machine_id: Asosiy mashina (work_centers.id ga soft-FK, integer)
  machineId: integer("machine_id"),
  // alt_machine_id: Muqobil mashina (agar asosiy band bo'lsa)
  altMachineId: integer("alt_machine_id"),
  // norm_per_hour: Soatiga norma (dona, list, m2 — unit texkartadan keladi)
  normPerHour: numericMoney("norm_per_hour"),
  setupMinutes: integer("setup_minutes").default(0),
  scrapFixed: integer("scrap_fixed").default(0),
  scrapPct: numericMoney("scrap_pct").default("0"),
  // min_razryad: Minimal razryad talabi (org_functions razryad_level bilan bog'liq)
  minRazryad: integer("min_razryad"),
  // is_core: Bu operatsiya asosiy zanjirda (false = parallel/optional)
  isCore: boolean("is_core").notNull().default(false),
}, (t) => [
  index("idx_tech_card_routes_technology_card_id").on(t.technologyCardId),
  index("idx_tech_card_routes_op_seq").on(t.opSeq),
]);

export const insertTechCardRouteSchema = createInsertSchema(techCardRoutes, {
  technologyCardId: z.number().int().positive("Texkarta ID kerak"),
  opSeq: z.number().int().positive("Operatsiya raqami musbat bo'lishi kerak"),
  operation: z.string().min(1).max(100, "Operatsiya nomi talab qilinadi"),
  normPerHour: z.number().positive().optional(),
  setupMinutes: z.number().int().nonnegative().optional(),
  scrapFixed: z.number().int().nonnegative().optional(),
  scrapPct: z.number().min(0).max(100).optional(),
  minRazryad: z.number().int().min(1).max(6).optional(),
}).omit({ id: true } as never);

export type TechCardRoute = typeof techCardRoutes.$inferSelect;
export type InsertTechCardRoute = z.infer<typeof insertTechCardRouteSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Texkarta Versiyalari — EP-PP-037/038
// DB darajasida mavjud (technology.repository.ts:253).
// ─────────────────────────────────────────────────────────────────────────
export const techCardVersions = pgTable("tech_card_versions", {
  id: serial("id").primaryKey(),
  technologyCardId: integer("technology_card_id")
    .notNull()
    .references(() => technologyCards.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  // snapshot: O'sha versiyada texkartaning to'liq holati (JSONB)
  snapshot: jsonb("snapshot"),
  changedBy: integer("changed_by").references(() => users.id, { onDelete: "set null" }),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
}, (t) => [
  index("idx_tech_card_versions_technology_card_id").on(t.technologyCardId),
  index("idx_tech_card_versions_version").on(t.version),
]);

export const insertTechCardVersionSchema = createInsertSchema(techCardVersions, {
  technologyCardId: z.number().int().positive("Texkarta ID kerak"),
  version: z.number().int().positive("Versiya raqami musbat bo'lishi kerak"),
}).omit({ id: true, changedAt: true } as never);

export type TechCardVersion = typeof techCardVersions.$inferSelect;
export type InsertTechCardVersion = z.infer<typeof insertTechCardVersionSchema>;
```

**Tekshir:** `pp-enhanced.ts` da `jsonb` import allaqachon bor (8-qator) — agar yo'q bo'lsa qo'sh.
`users` import ham `core-schema` dan keladi (11-qator) — mavjud.

---

### Qadam 5 — YANGI FAYL: lib/db/src/schema/pp/pp-shift-plan.ts

**Fayl:** `lib/db/src/schema/pp/pp-shift-plan.ts` (YANGI — avval mavjud emas)

```typescript
/**
 * @module pp-shift-plan
 * @description PP Smena rejasi jadvali (EP-PP-072/073/107).
 * Smena × stanok × buyurtma × operator × yordamchi.
 * Vizyon: kunlik operatsion qatlam (monthly→weekly→daily→hourly EP-PP-001/067).
 */

import { numericMoney } from "../numeric-money";
import { sql } from "drizzle-orm";
import {
  serial, pgTable, varchar, integer, boolean,
  timestamp, text, date, index, check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../core-schema";
import { productionOrders, workCenters } from "./pp-production";

// ─────────────────────────────────────────────────────────────────────────
// PP Smena Rejasi (EP-PP-072/073/107)
// Har smena uchun: qaysi stanokda, qaysi buyurtma, kim ishlaydi, nechta reja
// ─────────────────────────────────────────────────────────────────────────
export const ppShiftPlans = pgTable("pp_shift_plans", {
  id: serial("id").primaryKey(),
  planDate: date("plan_date").notNull(),
  // smena: 'den' (06:00-18:00) yoki 'noch' (18:00-06:00)
  smena: varchar("smena", { length: 10 }).notNull(),
  workCenterId: integer("work_center_id")
    .notNull()
    .references(() => workCenters.id, { onDelete: "restrict" }),
  productionOrderId: integer("production_order_id")
    .references(() => productionOrders.id, { onDelete: "set null" }),
  // operator_id: Asosiy operator (karta-markazli model — E2)
  operatorId: integer("operator_id").references(() => users.id, { onDelete: "set null" }),
  // helper_id: Yordamchi operator (2-rol, ep-pp-072)
  helperId: integer("helper_id").references(() => users.id, { onDelete: "set null" }),
  // queue_position: Agar bir smena/stanokda bir nechta buyurtma bo'lsa tartib
  queuePosition: integer("queue_position").notNull().default(0),
  plannedQty: integer("planned_qty").notNull().default(0),
  // is_locked: AI taklifni inson tasdiqlagach = true (E1: AI proposes, human confirms)
  isLocked: boolean("is_locked").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_pp_shift_plans_plan_date").on(t.planDate),
  index("idx_pp_shift_plans_work_center_id").on(t.workCenterId),
  index("idx_pp_shift_plans_production_order_id").on(t.productionOrderId),
  index("idx_pp_shift_plans_operator_id").on(t.operatorId),
  check("pp_shift_plans_smena_chk", sql`${t.smena} IN ('den','noch')`),
  check("pp_shift_plans_planned_qty_chk", sql`${t.plannedQty} >= 0`),
  check("pp_shift_plans_queue_pos_chk", sql`${t.queuePosition} >= 0`),
]);

export const insertPpShiftPlanSchema = createInsertSchema(ppShiftPlans, {
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  smena: z.enum(["den", "noch"]),
  workCenterId: z.number().int().positive("Stanok tanlash kerak"),
  productionOrderId: z.number().int().positive().optional(),
  operatorId: z.number().int().positive().optional(),
  helperId: z.number().int().positive().optional(),
  queuePosition: z.number().int().nonnegative().optional(),
  plannedQty: z.number().int().nonnegative().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type PpShiftPlan = typeof ppShiftPlans.$inferSelect;
export type InsertPpShiftPlan = z.infer<typeof insertPpShiftPlanSchema>;
```

---

### Qadam 6 — YANGI FAYL: lib/db/src/schema/pp/pp-plan-fact.ts

**Fayl:** `lib/db/src/schema/pp/pp-plan-fact.ts` (YANGI — avval mavjud emas)

```typescript
/**
 * @module pp-plan-fact
 * @description PP Plan-fakt kiritish (EP-PP-055/092) va sabab kodlari.
 * Smena yopilganda: reja / fakt / qolgan / brak + sabab dropdown.
 * 5-guruh sabab kodlari kitob EXACT (EP-PP-055).
 */

import { sql } from "drizzle-orm";
import {
  serial, pgTable, varchar, integer, boolean,
  timestamp, text, index, check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../core-schema";
import { ppShiftPlans } from "./pp-shift-plan";

// ─────────────────────────────────────────────────────────────────────────
// PP Sabab Kodlari (EP-PP-055 — 5-guruh, kitob EXACT)
// Seed SQL §5 da. Bu jadval lookup/master-data — faqat seed qiymatlar.
// ─────────────────────────────────────────────────────────────────────────
// ⚠️ MUVOFIQLIK FIX (2026-06-19): Guruh nomlari O'ZBEKCHA — inglizcha emas.
// P14 seed avvalida 'equipment/staffing/technology/planning/other' ishlatgan edi — bu XATO.
// Kanonik 5+1 guruh: material/dastgoh/kadr/texnologik/reja/boshqa
// Egasi EP-PP-055: "5 guruh AYNAN + boshqa/izoh" — shuning uchun 'boshqa' ham qo'shildi.
export const ppReasonCodes = pgTable("pp_reason_codes", {
  id: serial("id").primaryKey(),
  // code: mashinada o'qiladigan kalit (material_yoqligi, dastgoh_buzilishi, ...)
  code: varchar("code", { length: 30 }).notNull().unique(),
  // group_name: 5+1 guruh (material/dastgoh/kadr/texnologik/reja/boshqa)
  // ⚠️ Kanonik guruh nomlari FAQAT shu 6 ta. P14 seed shu nomlarni ishlatishi SHART.
  groupName: varchar("group_name", { length: 50 }).notNull(),
  labelUz: text("label_uz").notNull(),
  labelRu: text("label_ru"),
  isActive: boolean("is_active").notNull().default(true),
}, (t) => [
  index("idx_pp_reason_codes_group_name").on(t.groupName),
  check(
    "pp_reason_codes_group_name_chk",
    sql`${t.groupName} IN ('material','dastgoh','kadr','texnologik','reja','boshqa')`
  ),
]);

export const insertPpReasonCodeSchema = createInsertSchema(ppReasonCodes, {
  code: z.string().min(1).max(30),
  // 5 kanonik guruh + 'boshqa' (egasi "+ boshqa/izoh" degan — EP-PP-055)
  groupName: z.enum(["material", "dastgoh", "kadr", "texnologik", "reja", "boshqa"]),
  labelUz: z.string().min(1),
  labelRu: z.string().optional(),
}).omit({ id: true } as never);

export type PpReasonCode = typeof ppReasonCodes.$inferSelect;
export type InsertPpReasonCode = z.infer<typeof insertPpReasonCodeSchema>;

// ─────────────────────────────────────────────────────────────────────────
// PP Plan-Fakt Yozuvlari (EP-PP-092)
// Smena yopilganda to'ldiriladi: 4-raqam (reja/fakt/qolgan/brak) + sabab
// ─────────────────────────────────────────────────────────────────────────
export const ppPlanFactEntries = pgTable("pp_plan_fact_entries", {
  id: serial("id").primaryKey(),
  shiftPlanId: integer("shift_plan_id")
    .notNull()
    .references(() => ppShiftPlans.id, { onDelete: "cascade" }),
  // 4-raqam (EP-PP-092)
  reja: integer("reja").notNull(),
  fakt: integer("fakt").notNull(),
  qolgan: integer("qolgan").notNull(),
  brak: integer("brak").notNull().default(0),
  // reason_code: pp_reason_codes.code ga soft-FK (enum tezkor, join shart emas)
  reasonCode: varchar("reason_code", { length: 30 }),
  reasonText: text("reason_text"),
  // Smena yopuvchi (closed_by/closed_at)
  closedBy: integer("closed_by").references(() => users.id, { onDelete: "set null" }),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_pp_plan_fact_entries_shift_plan_id").on(t.shiftPlanId),
  index("idx_pp_plan_fact_entries_created_at").on(t.createdAt),
  check("pp_plan_fact_entries_reja_chk", sql`${t.reja} >= 0`),
  check("pp_plan_fact_entries_fakt_chk", sql`${t.fakt} >= 0`),
  check("pp_plan_fact_entries_qolgan_chk", sql`${t.qolgan} >= 0`),
  check("pp_plan_fact_entries_brak_chk", sql`${t.brak} >= 0`),
]);

export const insertPpPlanFactEntrySchema = createInsertSchema(ppPlanFactEntries, {
  shiftPlanId: z.number().int().positive("Smena reja ID kerak"),
  reja: z.number().int().nonnegative("Reja 0 yoki katta bo'lishi kerak"),
  fakt: z.number().int().nonnegative("Fakt 0 yoki katta bo'lishi kerak"),
  qolgan: z.number().int().nonnegative("Qolgan 0 yoki katta bo'lishi kerak"),
  brak: z.number().int().nonnegative("Brak 0 yoki katta bo'lishi kerak"),
  reasonCode: z.string().max(30).optional(),
  reasonText: z.string().max(500).optional(),
}).omit({ id: true, createdAt: true } as never);

export type PpPlanFactEntry = typeof ppPlanFactEntries.$inferSelect;
export type InsertPpPlanFactEntry = z.infer<typeof insertPpPlanFactEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────
// PP Material Bron (EP-PP-068)
// Tasdiqlangan buyurtma warehouse_stock dan materialni bronlaydi.
// KANON: warehouse_stock (current_stock = VIEW, TEGMA).
// ─────────────────────────────────────────────────────────────────────────
import { numericMoney } from "../numeric-money";
import { productionOrders } from "./pp-production";

export const ppMaterialReservations = pgTable("pp_material_reservations", {
  id: serial("id").primaryKey(),
  productionOrderId: integer("production_order_id")
    .notNull()
    .references(() => productionOrders.id, { onDelete: "cascade" }),
  // material_id: material_cards.id (kanonik, integer)
  materialId: integer("material_id").notNull(),
  reservedQty: numericMoney("reserved_qty").notNull(),
  reservedAt: timestamp("reserved_at").notNull().defaultNow(),
  // released_at: NULL = hali bronlangan; NULL bo'lmasa = bo'shatilgan
  releasedAt: timestamp("released_at"),
  // status: active (bronlangan) | released (bo'shatilgan) | consumed (sarflangan)
  status: varchar("status", { length: 20 }).notNull().default("active"),
}, (t) => [
  index("idx_pp_material_reservations_production_order_id").on(t.productionOrderId),
  index("idx_pp_material_reservations_material_id").on(t.materialId),
  index("idx_pp_material_reservations_status").on(t.status),
  check("pp_material_reservations_qty_chk", sql`${t.reservedQty} > 0`),
  check(
    "pp_material_reservations_status_chk",
    sql`${t.status} IN ('active','released','consumed')`
  ),
]);

export const insertPpMaterialReservationSchema = createInsertSchema(ppMaterialReservations, {
  productionOrderId: z.number().int().positive("Buyurtma ID kerak"),
  materialId: z.number().int().positive("Material ID kerak"),
  reservedQty: z.number().positive("Bronlangan miqdor musbat bo'lishi kerak"),
  status: z.enum(["active", "released", "consumed"]).optional(),
}).omit({ id: true, reservedAt: true } as never);

export type PpMaterialReservation = typeof ppMaterialReservations.$inferSelect;
export type InsertPpMaterialReservation = z.infer<typeof insertPpMaterialReservationSchema>;

// ─────────────────────────────────────────────────────────────────────────
// PP Kod Lug'ati (EP-PP-109 — KT/PT/E/GL prefikslari)
// PLACEHOLDER ONLY. Egasi ma'nolarni keyinroq kiritadi.
// ─────────────────────────────────────────────────────────────────────────
export const ppCodeDictionary = pgTable("pp_code_dictionary", {
  id: serial("id").primaryKey(),
  // prefix: KT (texkarta) | PT (papka tartib) | E (etiket) | GL (gofra layer)
  prefix: varchar("prefix", { length: 10 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  meaningUz: text("meaning_uz"),
  meaningRu: text("meaning_ru"),
  ownerNote: text("owner_note"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_pp_code_dictionary_prefix").on(t.prefix),
  check(
    "pp_code_dictionary_prefix_chk",
    sql`${t.prefix} IN ('KT','PT','E','GL')`
  ),
]);

export const insertPpCodeDictionarySchema = createInsertSchema(ppCodeDictionary, {
  prefix: z.enum(["KT", "PT", "E", "GL"]),
  code: z.string().min(1).max(50),
  meaningUz: z.string().optional(),
  meaningRu: z.string().optional(),
  ownerNote: z.string().optional(),
}).omit({ id: true, createdAt: true } as never);

export type PpCodeDictionary = typeof ppCodeDictionary.$inferSelect;
export type InsertPpCodeDictionary = z.infer<typeof insertPpCodeDictionarySchema>;
```

---

### Qadam 7 — Migration faylini yozish (GATED)

**Fayl:** `apps/api/src/database/migrations/pp-phase1-schema.sql` (YANGI)

Faylni yoz, lekin **ISHGA TUSHIRMA**. Har bir blok `-- APPROVED:` yoki `-- GATED:` bilan belgilansin.

(Qarang §5 DDL bo'limi — to'liq SQL.)

---

### Qadam 8 — Barrel eksport tekshiruv

**Tekshir** (`lib/db/src/index.ts` yoki `lib/db/src/schema/pp/index.ts` mavjud bo'lsa):
- `ppOrderStatusLog` eksport qilinganmi?
- `ppShiftPlans`, `ppPlanFactEntries`, `ppReasonCodes`, `ppMaterialReservations`, `ppCodeDictionary` eksport qilinganmi?
- `techCardBom`, `techCardRoutes`, `techCardVersions` eksport qilinganmi?

Agar `lib/db/src/schema/pp/index.ts` bo'lmasa, lekin barrel bo'lsa — unga qo'sh. Agar bu fayl OWNED-FILE emas bo'lsa, egasiga flag qil.

---

## 5. DDL (GATED — Egasi ruxsati talab qilinadi)

**Fayl:** `apps/api/src/database/migrations/pp-phase1-schema.sql`

```sql
-- ============================================================
-- PP Phase 1 Schema Migration
-- Tayyorlagan: P12 Agent | Sana: 2026-06-19
-- GATED: Bu faylni qo'lda ishga tushirma.
-- Faqat egasi "-- APPROVED: <ism> <sana>" qo'yganidan keyin:
--   psql -U europrint -d europrint -f pp-phase1-schema.sql
-- ============================================================

BEGIN;

-- ============================================================
-- BLOK A: production_orders ALTER
-- Status CHECK ni 9-holatga kengaytirish (EP-PP-082)
-- ⚠️ MUHIM: Mavjud qiymatlar migratsiya qilishi kerak (B1 blok).
-- GATED: awaiting owner approval
-- ============================================================

-- A1: Yangi ustunlar qo'shish (idempotent)
ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS priority_flag VARCHAR(20) NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS readiness_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS papka_seq_year INTEGER;

-- A2: priority_flag CHECK constraint
ALTER TABLE production_orders
  DROP CONSTRAINT IF EXISTS production_orders_priority_flag_chk;
ALTER TABLE production_orders
  ADD CONSTRAINT production_orders_priority_flag_chk
    CHECK (priority_flag IN ('normal','high','urgent','zarur'));

-- A3: readiness_pct CHECK constraint
ALTER TABLE production_orders
  DROP CONSTRAINT IF EXISTS production_orders_readiness_pct_chk;
ALTER TABLE production_orders
  ADD CONSTRAINT production_orders_readiness_pct_chk
    CHECK (readiness_pct >= 0 AND readiness_pct <= 100);

-- ============================================================
-- BLOK A-EQUIPMENT: equipment 4 norma ustun (EP-MES-034/039/040/082)
-- MES paketi P17 e'lon qildi; pp-production.ts egasi (P12) qo'llaydi.
-- GATED: awaiting owner approval
-- ============================================================

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS norma_hourly       NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS brak_percent_norm  NUMERIC(5,  2),
  ADD COLUMN IF NOT EXISTS oee_target         NUMERIC(5,  2),
  ADD COLUMN IF NOT EXISTS unit_of_measure    VARCHAR(20);

-- ============================================================
-- BLOK A-CONFIG: pp_config (sozlanadigan PP parametrlari)
-- ⚠️ MUVOFIQLIK FIX (2026-06-19): frozen_horizon_days EGASI QIYMATI KERAK.
-- Avvalgi direktiva "~3 kun" hardcode qilgan edi — bu egasi aytmagan taxmin.
-- Egasi OCHIQ-JAVOBLAR da "~3 kun muzlatilgan" degan (taxminiy), aniq raqam tasdiqlanmagan.
-- Shuning uchun: kod/migration da raqam QOTIRILMAYDI; master-data jadvaldan o'qiladi.
-- GATED: awaiting owner approval
-- ============================================================

CREATE TABLE IF NOT EXISTS pp_config (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(60) NOT NULL UNIQUE,
  value       TEXT,           -- NULL = egasi hali belgilamagan
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: sozlanadigan PP parametrlari
-- ⚠️ EGASI QIYMATI KERAK: value = NULL (egasi belgilaydi; NULL = muzlatish mexanizmi o'chiq)
INSERT INTO pp_config (key, value, description) VALUES
  ('frozen_horizon_days', NULL,
   'Muzlatilgan zona kunlar soni (EP-PP-025). Egasi belgilaydi. NULL = guard o''chirilgan. '
   'EGASI QIYMATI KERAK — direktiva avvalida ~3 kun degan edi, lekin bu tasdiqlanmagan taxmin.')
ON CONFLICT (key) DO NOTHING;

-- NOTE: Servis frozen_horizon_days ni shu jadvaldan o'qiydi:
--   SELECT value::int FROM pp_config WHERE key = 'frozen_horizon_days'
--   Agar NULL bo'lsa → frozen guard ishlamaydi (xavfsiz fallback).
--   Egasi qiymat bersa → frozen_until = NOW() + interval '? days'

-- ============================================================
-- BLOK B: status CHECK migratsiya (EP-PP-082)
-- OGOH: Bu blokning tartibi muhim.
-- 1. Avval mavjud qiymatlarni yangi schema ga map qil
-- 2. Keyin eski CHECK ni o'chir
-- 3. Yangi CHECK ni qo'sh
-- GATED: awaiting owner approval
-- ============================================================

-- B1: Mavjud status qiymatlarini yangi enum ga map qil
-- (Bu mapping egasi bilan kelishilishi kerak — quyidagi taxminiy)
UPDATE production_orders SET status = 'reja'          WHERE status = 'created';
UPDATE production_orders SET status = 'tasdiqlangan'  WHERE status = 'released';
UPDATE production_orders SET status = 'jarayonda'     WHERE status = 'in_progress';
UPDATE production_orders SET status = 'tugadi'        WHERE status = 'completed';
UPDATE production_orders SET status = 'yopildi'       WHERE status = 'closed';
UPDATE production_orders SET status = 'sifatda'       WHERE status = 'qc_hold';

-- B2: Eski CHECK ni o'chir
ALTER TABLE production_orders
  DROP CONSTRAINT IF EXISTS production_orders_status_chk;

-- B3: Yangi 9-holatli CHECK qo'sh
ALTER TABLE production_orders
  ADD CONSTRAINT production_orders_status_chk
    CHECK (status IN (
      'reja','tasdiqlangan','ishga_tushgan','jarayonda',
      'sifatda','tugadi','yopildi','bekor','toxtatilgan'
    ));

-- ============================================================
-- BLOK C: pp_order_status_log (EP-PP-082)
-- GATED: awaiting owner approval
-- ============================================================

CREATE TABLE IF NOT EXISTS pp_order_status_log (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL
                  REFERENCES production_orders(id) ON DELETE CASCADE,
  from_status   VARCHAR(30),
  to_status     VARCHAR(30) NOT NULL,
  changed_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason        TEXT,
  frozen_bypass BOOLEAN NOT NULL DEFAULT FALSE,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pp_order_status_log_to_status_chk
    CHECK (to_status IN (
      'reja','tasdiqlangan','ishga_tushgan','jarayonda',
      'sifatda','tugadi','yopildi','bekor','toxtatilgan'
    ))
);

CREATE INDEX IF NOT EXISTS idx_pp_order_status_log_order_id
  ON pp_order_status_log(order_id);
CREATE INDEX IF NOT EXISTS idx_pp_order_status_log_changed_at
  ON pp_order_status_log(changed_at);

-- ============================================================
-- BLOK D: pp_shift_plans (EP-PP-072/073/107)
-- GATED: awaiting owner approval
-- ============================================================

CREATE TABLE IF NOT EXISTS pp_shift_plans (
  id                    SERIAL PRIMARY KEY,
  plan_date             DATE NOT NULL,
  smena                 VARCHAR(10) NOT NULL,
  work_center_id        INTEGER NOT NULL
                          REFERENCES work_centers(id) ON DELETE RESTRICT,
  production_order_id   INTEGER REFERENCES production_orders(id) ON DELETE SET NULL,
  operator_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  helper_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  queue_position        INTEGER NOT NULL DEFAULT 0,
  planned_qty           INTEGER NOT NULL DEFAULT 0,
  is_locked             BOOLEAN NOT NULL DEFAULT FALSE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pp_shift_plans_smena_chk
    CHECK (smena IN ('den','noch')),
  CONSTRAINT pp_shift_plans_planned_qty_chk
    CHECK (planned_qty >= 0),
  CONSTRAINT pp_shift_plans_queue_pos_chk
    CHECK (queue_position >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pp_shift_plans_plan_date
  ON pp_shift_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_pp_shift_plans_work_center_id
  ON pp_shift_plans(work_center_id);
CREATE INDEX IF NOT EXISTS idx_pp_shift_plans_production_order_id
  ON pp_shift_plans(production_order_id);
CREATE INDEX IF NOT EXISTS idx_pp_shift_plans_operator_id
  ON pp_shift_plans(operator_id);

-- ============================================================
-- BLOK E: pp_reason_codes (EP-PP-055 — 5+1 guruh)
-- ⚠️ MUVOFIQLIK FIX (2026-06-19): CHECK 5 → 6 guruh.
-- Egasi EP-PP-055: "5 guruh AYNAN + boshqa/izoh" — 'boshqa' qo'shildi.
-- P14 seed avvalida inglizcha nom ishlatgan (equipment/staffing/...) — XATO edi.
-- Kanonik nom = o'zbekcha (material/dastgoh/kadr/texnologik/reja/boshqa).
-- GATED: awaiting owner approval
-- ============================================================

CREATE TABLE IF NOT EXISTS pp_reason_codes (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(30) NOT NULL UNIQUE,
  group_name  VARCHAR(50) NOT NULL,
  label_uz    TEXT NOT NULL,
  label_ru    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT pp_reason_codes_group_name_chk
    CHECK (group_name IN ('material','dastgoh','kadr','texnologik','reja','boshqa'))
);

CREATE INDEX IF NOT EXISTS idx_pp_reason_codes_group_name
  ON pp_reason_codes(group_name);

-- Seed: 5+1 guruh sabab kodlari (EP-PP-055 kitob EXACT + egasi "+ boshqa/izoh")
-- ⚠️ KANONIK: guruh nomlari o'zbekcha. Bu seed YAGONA manba (P12) — P14 alohida seed fayl yaratmaydi, faqat pp_reason_codes ni o'qiydi.
INSERT INTO pp_reason_codes (code, group_name, label_uz, label_ru)
VALUES
  ('material_yoqligi',    'material',    'Material yo''qligi',           'Отсутствие материала'),
  ('material_sifati',     'material',    'Material sifati past',          'Низкое качество материала'),
  ('dastgoh_buzilishi',   'dastgoh',     'Dastgoh buzilishi',             'Поломка оборудования'),
  ('dastgoh_texservis',   'dastgoh',     'Dastgoh texnik xizmati',        'ТО оборудования'),
  ('kadr_yetishmasligi',  'kadr',        'Kadr yetishmasligi',            'Нехватка кадров'),
  ('kadr_kelmaslik',      'kadr',        'Kadrning kelmasligi',           'Неявка сотрудника'),
  ('texnologik_xato',     'texnologik',  'Texnologik xato',               'Технологическая ошибка'),
  ('texkarta_yoqligi',    'texnologik',  'Texkarta yo''qligi',            'Отсутствие тех. карты'),
  ('reja_notogri',        'reja',        'Reja noto''g''ri tuzilgan',     'Неверно составлен план'),
  ('buyurtma_ozgarishi',  'reja',        'Buyurtma o''zgarishi',          'Изменение заказа'),
  ('boshqa_sabab',        'boshqa',      'Boshqa sabab',                  'Другая причина')
ON CONFLICT (code) DO NOTHING;

-- POST-SEED VERIFY:
-- SELECT COUNT(*) FROM pp_reason_codes;  -- 11 bo'lishi kerak
-- SELECT DISTINCT group_name FROM pp_reason_codes ORDER BY group_name;
-- -- 6 guruh: boshqa/dastgoh/kadr/material/reja/texnologik

-- ============================================================
-- BLOK F: pp_plan_fact_entries (EP-PP-092)
-- GATED: awaiting owner approval
-- ============================================================

CREATE TABLE IF NOT EXISTS pp_plan_fact_entries (
  id              SERIAL PRIMARY KEY,
  shift_plan_id   INTEGER NOT NULL
                    REFERENCES pp_shift_plans(id) ON DELETE CASCADE,
  reja            INTEGER NOT NULL,
  fakt            INTEGER NOT NULL,
  qolgan          INTEGER NOT NULL,
  brak            INTEGER NOT NULL DEFAULT 0,
  reason_code     VARCHAR(30),
  reason_text     TEXT,
  closed_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pp_plan_fact_entries_reja_chk    CHECK (reja >= 0),
  CONSTRAINT pp_plan_fact_entries_fakt_chk    CHECK (fakt >= 0),
  CONSTRAINT pp_plan_fact_entries_qolgan_chk  CHECK (qolgan >= 0),
  CONSTRAINT pp_plan_fact_entries_brak_chk    CHECK (brak >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pp_plan_fact_entries_shift_plan_id
  ON pp_plan_fact_entries(shift_plan_id);
CREATE INDEX IF NOT EXISTS idx_pp_plan_fact_entries_created_at
  ON pp_plan_fact_entries(created_at);

-- ============================================================
-- BLOK G: pp_material_reservations (EP-PP-068)
-- Kanonik: warehouse_stock (current_stock = VIEW, TEGMA)
-- GATED: awaiting owner approval
-- ============================================================

CREATE TABLE IF NOT EXISTS pp_material_reservations (
  id                    SERIAL PRIMARY KEY,
  production_order_id   INTEGER NOT NULL
                          REFERENCES production_orders(id) ON DELETE CASCADE,
  material_id           INTEGER NOT NULL,
  -- Soft-FK material_cards(id): material_cards boshqa sxemada, direct FK circular import qilmasin
  reserved_qty          NUMERIC(15,4) NOT NULL,
  reserved_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at           TIMESTAMPTZ,
  status                VARCHAR(20) NOT NULL DEFAULT 'active',
  CONSTRAINT pp_material_reservations_qty_chk
    CHECK (reserved_qty > 0),
  CONSTRAINT pp_material_reservations_status_chk
    CHECK (status IN ('active','released','consumed'))
);

CREATE INDEX IF NOT EXISTS idx_pp_material_reservations_production_order_id
  ON pp_material_reservations(production_order_id);
CREATE INDEX IF NOT EXISTS idx_pp_material_reservations_material_id
  ON pp_material_reservations(material_id);
CREATE INDEX IF NOT EXISTS idx_pp_material_reservations_status
  ON pp_material_reservations(status);

-- ============================================================
-- BLOK H: pp_code_dictionary (EP-PP-109 — placeholder)
-- GATED: awaiting owner approval
-- ============================================================

CREATE TABLE IF NOT EXISTS pp_code_dictionary (
  id          SERIAL PRIMARY KEY,
  prefix      VARCHAR(10) NOT NULL,
  code        VARCHAR(50) NOT NULL UNIQUE,
  meaning_uz  TEXT,
  meaning_ru  TEXT,
  owner_note  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pp_code_dictionary_prefix_chk
    CHECK (prefix IN ('KT','PT','E','GL'))
);

CREATE INDEX IF NOT EXISTS idx_pp_code_dictionary_prefix
  ON pp_code_dictionary(prefix);

-- Ma'nolar egasi tomonidan keyinroq kiritiladi (EP-PP-109 placeholder)

-- ============================================================
-- BLOK I: tech_card_bom / routes / versions
-- DB darajasida allaqachon mavjud bo'lishi kerak (technology.repository.ts raw SQL ishlatadi).
-- Agar mavjud bo'lmasa (yangi muhit) — yaratilsin.
-- GATED: awaiting owner approval
-- ============================================================

CREATE TABLE IF NOT EXISTS tech_card_bom (
  id                  SERIAL PRIMARY KEY,
  technology_card_id  INTEGER NOT NULL
                        REFERENCES technology_cards(id) ON DELETE CASCADE,
  material_code       VARCHAR(100) NOT NULL,
  quantity            NUMERIC(15,4) NOT NULL,
  unit                VARCHAR(20) NOT NULL DEFAULT 'kg',
  layer               VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_tech_card_bom_technology_card_id
  ON tech_card_bom(technology_card_id);
CREATE INDEX IF NOT EXISTS idx_tech_card_bom_material_code
  ON tech_card_bom(material_code);

CREATE TABLE IF NOT EXISTS tech_card_routes (
  id                  SERIAL PRIMARY KEY,
  technology_card_id  INTEGER NOT NULL
                        REFERENCES technology_cards(id) ON DELETE CASCADE,
  op_seq              INTEGER NOT NULL,
  operation           VARCHAR(100) NOT NULL,
  machine_id          INTEGER,
  alt_machine_id      INTEGER,
  norm_per_hour       NUMERIC(15,4),
  setup_minutes       INTEGER DEFAULT 0,
  scrap_fixed         INTEGER DEFAULT 0,
  scrap_pct           NUMERIC(5,2) DEFAULT 0,
  min_razryad         INTEGER,
  is_core             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_tech_card_routes_technology_card_id
  ON tech_card_routes(technology_card_id);
CREATE INDEX IF NOT EXISTS idx_tech_card_routes_op_seq
  ON tech_card_routes(op_seq);

CREATE TABLE IF NOT EXISTS tech_card_versions (
  id                  SERIAL PRIMARY KEY,
  technology_card_id  INTEGER NOT NULL
                        REFERENCES technology_cards(id) ON DELETE CASCADE,
  version             INTEGER NOT NULL,
  snapshot            JSONB,
  changed_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_card_versions_technology_card_id
  ON tech_card_versions(technology_card_id);
CREATE INDEX IF NOT EXISTS idx_tech_card_versions_version
  ON tech_card_versions(version);

-- ============================================================
-- COMMIT
-- ============================================================
COMMIT;

-- POST-MIGRATION VERIFY:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'production_orders' AND column_name IN
--   ('priority_flag','frozen_until','readiness_pct','papka_seq_year');
-- SELECT COUNT(*) FROM pp_reason_codes;  -- 11 bo'lishi kerak (5+1 guruh × 2 kod + 1 boshqa)
-- SELECT conname FROM pg_constraint WHERE conrelid = 'production_orders'::regclass
--   AND conname = 'production_orders_status_chk';
```

---

## 6. QABUL MEZONI

Barcha quyidagi punktlar **✅ bo'lishi SHART** — biri ham ❌ bo'lsa = BAJARILMAGAN.

### TypeScript

- [ ] `cd Uzbek-Language-Module && npx tsc --noEmit -p lib/db/tsconfig.json 2>&1 | grep -c ERROR` → 0
- [ ] `npx tsc --noEmit -p apps/api/tsconfig.json 2>&1 | grep -c ERROR` → 0 (yangi import xatoliksiz)
- [ ] FE `tsc --noEmit` ham 0 (schema o'zgarishi FE ga ta'sir qilmasligi kerak)

### Drizzle sxema tekshiruv

- [ ] `pp-production.ts` da `productionOrders` CHECK constraint 9-holatli
- [ ] `pp-production.ts` da `ppOrderStatusLog` pgTable mavjud va eksport qilingan
- [ ] `pp-production.ts` da `priorityFlag`, `frozenUntil`, `readinessPct`, `papkaSeqYear` ustunlari mavjud
- [ ] `pp-production.ts` da `equipment` jadvalida `normaHourly`, `brakPercentNorm`, `oeeTarget`, `unitOfMeasure` ustunlari mavjud (MES P17 e'lon qildi)
- [ ] `pp-enhanced.ts` da `techCardBom`, `techCardRoutes`, `techCardVersions` pgTable mavjud
- [ ] `pp-shift-plan.ts` fayl mavjud, `ppShiftPlans` pgTable `smena CHECK IN ('den','noch')` bilan
- [ ] `pp-plan-fact.ts` fayl mavjud, `ppPlanFactEntries` va `ppReasonCodes` va `ppMaterialReservations` va `ppCodeDictionary` pgTable mavjud
- [ ] Hamma yangi jadvallar uchun `insert*Schema` va TypeScript type eksport qilingan

### DB-Proof (Migration ishga tushirilgandan keyin)

```sql
-- Tekshiruv 1: Yangi ustunlar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'production_orders'
  AND column_name IN ('priority_flag','frozen_until','readiness_pct','papka_seq_year');
-- 4 ta qator qaytishi kerak

-- Tekshiruv 1b: equipment norma ustunlar (MES P17 e'lon qildi)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'equipment'
  AND column_name IN ('norma_hourly','brak_percent_norm','oee_target','unit_of_measure');
-- 4 ta qator qaytishi kerak

-- Tekshiruv 2: Status CHECK yangilangan
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'production_orders'::regclass
  AND conname = 'production_orders_status_chk';
-- 'reja' so'zi ko'rinishi kerak

-- Tekshiruv 3: Yangi jadvallar
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'pp_order_status_log','pp_shift_plans','pp_plan_fact_entries',
    'pp_reason_codes','pp_material_reservations','pp_code_dictionary',
    'tech_card_bom','tech_card_routes','tech_card_versions'
  );
-- 9 ta qator qaytishi kerak

-- Tekshiruv 4: Sabab kodlari seed (5+1 guruh = 11 kod)
SELECT COUNT(*) FROM pp_reason_codes;
-- 11 bo'lishi kerak (muvofiqlik fix 2026-06-19: 6 guruh × 2 kod - 1 + 1 boshqa = 11)
SELECT DISTINCT group_name FROM pp_reason_codes ORDER BY group_name;
-- 6 guruh: boshqa/dastgoh/kadr/material/reja/texnologik

-- Tekshiruv 5: priority_flag CHECK ishlaydi
INSERT INTO production_orders (order_number, product_id, planned_quantity, status, priority_flag)
VALUES ('TEST-CHECK-001', 1, 100, 'reja', 'zarur')
RETURNING id, status, priority_flag;
-- Muvaffaqiyatli bo'lishi kerak

-- Tekshiruv 6: Eski status CHECK bloklanadi
-- (Agar avvalgi ma'lumotlar migratsiya qilingan bo'lsa):
INSERT INTO production_orders (order_number, product_id, planned_quantity, status)
VALUES ('TEST-CHECK-FAIL', 1, 100, 'created');
-- 23514 ERROR qaytishi kerak (CHECK violation)
-- ROLLBACK; -- Testdan keyin

-- Tozalash:
DELETE FROM production_orders WHERE order_number IN ('TEST-CHECK-001');
```

### Golden-thread regressiya

- [ ] `GET /api/pp/orders` — 200 (mavjud buyurtmalar hamon ko'rinadi)
- [ ] `GET /api/pp/crp` — 200 (CRP hisob-kitob ishlaydi, `pp_routing_operations` yo'qolmagan)
- [ ] `GET /api/pp/mps` — 200 (MPS hisob-kitob ishlaydi, `mps_periods` yo'qolmagan)
- [ ] `GET /api/technology/cards` — 200 (texkartalar ro'yxati)
- [ ] `GET /api/technology/cards/:id/bom` — 200 (BOM raw SQL ishlaydi)
- [ ] `GET /api/technology/cards/:id/routes` — 200 (Routes raw SQL ishlaydi)

### Reviewer skriptlar

```bash
bash scripts/reviewer-result-pattern.sh      # 0 FAIL bo'lishi kerak
bash scripts/reviewer-as-unknown.sh          # yangi FAIL qo'shilmasin
bash scripts/reviewer-jwt-guard.sh           # PASS saqlansin
```

---

## 7. SELF-VERIFY

### Bosqich 1: TypeScript tekshiruv

```bash
# Lib/db tekshiruv
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
npx tsc --noEmit -p lib/db/tsconfig.json 2>&1 | tail -20

# Backend tekshiruv
npx tsc --noEmit -p apps/api/tsconfig.json 2>&1 | grep "error TS" | head -20

# Frontend tekshiruv
npx tsc --noEmit -p artifacts/erp-dashboard/tsconfig.json 2>&1 | grep "error TS" | head -20
```

### Bosqich 2: Sxema tekshiruv (Drizzle)

```bash
# Yangi jadvallar eksport qilinganmi?
node -e "
const schema = require('./lib/db/dist/index.js');
const required = [
  'ppOrderStatusLog', 'ppShiftPlans', 'ppPlanFactEntries',
  'ppReasonCodes', 'ppMaterialReservations', 'ppCodeDictionary',
  'techCardBom', 'techCardRoutes', 'techCardVersions'
];
required.forEach(k => {
  console.log(k + ':', k in schema ? 'OK' : 'MISSING');
});
"
```

### Bosqich 3: DB-proof (Migration ishga tushirilgandan keyin)

```bash
# PostgreSQL ga ulan (europrint @ uzbek-language-module-postgres-1)
docker exec -it uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'pp_order_status_log','pp_shift_plans','pp_plan_fact_entries',
      'pp_reason_codes','pp_material_reservations','pp_code_dictionary',
      'tech_card_bom','tech_card_routes','tech_card_versions'
    )
  ORDER BY table_name;
"
# 9 ta jadval ko'rinishi kerak

# Sabab kodlari seed
docker exec -it uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "
  SELECT id, code, group_name, label_uz FROM pp_reason_codes ORDER BY id;
"
# 5 ta qator ko'rinishi kerak

# production_orders yangi ustunlar
docker exec -it uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'production_orders'
    AND column_name IN ('priority_flag','frozen_until','readiness_pct','papka_seq_year')
  ORDER BY column_name;
"
# 4 ta ustun ko'rinishi kerak

# Status CHECK yangilangan (9-holat)
docker exec -it uzbek-language-module-postgres-1 psql -U europrint -d europrint -c "
  SELECT pg_get_constraintdef(oid) FROM pg_constraint
  WHERE conrelid = 'production_orders'::regclass
    AND conname = 'production_orders_status_chk';
"
# 'reja','tasdiqlangan',... ko'rinishi kerak
```

### Bosqich 4: Golden-thread HTTP probe

```bash
# Backend ishga tushsin (agar hali ishlamayotgan bo'lsa)
# pnpm --filter @europrint/api run dev:unsafe

# PP endpoint tekshiruv
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}' | jq -r '.data.accessToken')

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/pp/orders | head -c 200
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/pp/crp | head -c 200
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/pp/mps | head -c 200
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3030/api/technology/cards | head -c 200
```

---

## 8. COMMIT

**Commit tartibi:**

```bash
# Faqat owned-file lar — -A YO'Q

# 1-commit: pp-production.ts o'zgarishlari (production_orders + equipment norma cols)
git add lib/db/src/schema/pp/pp-production.ts
git commit -m "feat(pp): ALTER production_orders 9-status + 4 cols + pp_order_status_log + equipment norma cols Drizzle (EP-PP-082/010/025/097, EP-MES-034/039/040/082)"

# 2-commit: pp-enhanced.ts o'zgarishlari
git add lib/db/src/schema/pp/pp-enhanced.ts
git commit -m "feat(pp): add techCardBom/Routes/Versions Drizzle stubs (replaces raw SQL type-safety gap)"

# 3-commit: yangi pp-shift-plan.ts
git add lib/db/src/schema/pp/pp-shift-plan.ts
git commit -m "feat(pp): new pp_shift_plans Drizzle schema (EP-PP-072/073/107)"

# 4-commit: yangi pp-plan-fact.ts
git add lib/db/src/schema/pp/pp-plan-fact.ts
git commit -m "feat(pp): new pp_plan_fact_entries + pp_reason_codes + pp_material_reservations + pp_code_dictionary (EP-PP-055/092/068/109)"

# 5-commit: GATED migration
git add apps/api/src/database/migrations/pp-phase1-schema.sql
git commit -m "feat(pp): GATED migration pp-phase1-schema.sql — DO NOT RUN without owner approval (Q-35)"
```

**Commit xabari formati:** `feat(pp): <qisqa tavsif> (EP-PP-XXX)`

**HECH QACHON:**
- `git add -A` yoki `git add .` — TAQIQ
- Boshqa agentning fayllarini commit qilma
- `backend.log*` yoki `*.env` fayllarini commit qilma (Q-45)

---

## 9. CHEKLOVLAR VA FLAG LER (Egasiga)

Quyidagi holatlar bu agentning SCOPE sidan tashqarida — egasiga yetkazilsin:

| Muammo | Qaerga tegishli |
|--------|----------------|
| `lib/db/src/index.ts` barrel eksportiga `ppShiftPlans` va boshqalarni qo'shish | lib/db barrel agent |
| `pp-crp.service.ts` dagi `pp_routing_operations` raw SQL ni Drizzle ga ko'chirish | PP-services agent |
| `technology.repository.ts` dagi raw SQL larga type-safety qo'shish (Drizzle stub tayyor bo'lgach) | PP-technology agent |
| production_orders.status migratsiya mapping (`created→reja` vs `created→tasdiqlangan`) egasi qarorini talab qiladi | EGASI QAROR KERAK (B1 blok) |
| `pp_routing_operations` `schema-sprint2.ts` dan `lib/db/src/schema/pp/` ga ko'chirish (agar kerak) | Alohida agent / egasi |
| `mps_periods` `schema-sprint2.ts` dan `lib/db/src/schema/pp/` ga ko'chirish | Alohida agent / egasi |
| `pp_material_reservations.material_id` → `material_cards(id)` FK qo'shish (circular import xavfi yo'q bo'lganda) | PP-materials agent |
| Guard logikasi: `frozen_until` tekshiruvi, `zarur` zona bloki | PP-controllers agent |
| FE: Smena Gantt, ZARUR blok, tayorlik % ko'rsatmasi | PP-FE agent |
| Papka № auto-generator servisi (`papka_seq_year` tayyor, servis kerak) | PP-papka agent |

---

## 10. VIZYON MUVOFIQLIK JADVALI

| EP Kod | Vizyon talabi | Bu agentda bajariladi | Status |
|--------|--------------|----------------------|--------|
| EP-PP-082 | 9-holatli status | ✅ production_orders ALTER + Zod | GATED |
| EP-PP-082 | Har o'tish kim/qachon | ✅ pp_order_status_log | GATED |
| EP-PP-025 | frozen_until ustun | ✅ ALTER qo'shiladi | GATED |
| EP-PP-010/097 | priority_flag + ZARUR | ✅ ALTER qo'shiladi | GATED |
| EP-PP-099 | readiness_pct | ✅ ALTER qo'shiladi | GATED |
| EP-MES-034/039/040/082 | equipment 4 norma ustun (P17 e'lon qildi) | ✅ ALTER + Drizzle (pp-production.ts egasi) | GATED |
| EP-PP-072/073/107 | pp_shift_plans | ✅ Yangi jadval | GATED |
| EP-PP-092 | Plan-fakt 4-raqam | ✅ pp_plan_fact_entries | GATED |
| EP-PP-055 | 5+1 guruh sabab (+ egasi boshqa/izoh) | ✅ pp_reason_codes + seed (11 kod, 6 guruh) | GATED |
| EP-PP-025 | frozen_horizon_days sozlanadigan | ✅ pp_config jadval + NULL seed (EGASI QIYMATI KERAK) | GATED |
| EP-PP-068 | Material bron | ✅ pp_material_reservations | GATED |
| EP-PP-109 | Kod lug'ati placeholder | ✅ pp_code_dictionary | GATED |
| EP-PP-013/014 | BOM/Marshrut Drizzle | ✅ tech_card_bom/routes stubs | Schema |
| EP-PP-037/038 | Versiyalash | ✅ tech_card_versions stub | Schema |
| EP-PP-001/067 | MPS Drizzle | ✅ re-export from schema-sprint2 | Schema |
| EP-PP-051 | CRP routing Drizzle | ✅ re-export from schema-sprint2 | Schema |

---

*Direktiva yozilgan: 2026-06-19 | Vizyon manba: MUSLIMBEK-PROMT-05-PP-2026-06-08.md | Q-47 (≥1000 qator)*
