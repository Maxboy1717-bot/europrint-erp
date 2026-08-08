# P20 — WMS / Ombor: WMS schema: locator + roll-card + movement-numbering DDL + warehouse-types seed

> **Paket:** P20 · **To'lqin:** Wave 1 · **DDL darvozasi:** HA (egasi ruxsati shart)
> **Bog'liqlik:** P01 (schema lib barrel) bajarilgan bo'lishi shart.
> **Yozildi:** 2026-06-19 · Advisor: Claude · Bajaruvchi: Muslimbek

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI** (Executor) sifatida ishlaysan. Ushbu direktivani o'qishdan oldin
`CLAUDE.md` + `docs/agent-constitution.md` + `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md`
fayllarini **to'liq o'qi**. Barcha qat'iy qoidalar qo'llaniladi.

**QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):**

| # | Qoida | Buzilsa |
|---|-------|---------|
| 1 | Result\<T\> hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ | Build bloker |
| 2 | `@Body` Zod bilan validate; `class-validator` TAQIQ | Build bloker |
| 3 | Drizzle ORM; raw SQL faqat murakkab holatda (`typedExecute<T>` bilan) | Reviewer FAIL |
| 4 | Q-40: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ | Commit reject |
| 5 | Q-46: Ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi | Egasi qarorida |
| 6 | Q-23/Q-31 FAYL IZOLYATSIYASI: faqat OWNED-FILE ro'yxatidagi fayllarga teg | Parallel agent xatosi |
| 7 | Q-35 DDL DARVOZASI: `CREATE TABLE`/migration faqat egasi ruxsati bilan; `-- APPROVED:` shart | Migration bloker |
| 8 | `git add <aniq-fayl>` faqat; `-A`/`.` TAQIQ | Parallel sessiya xatosi |
| 9 | Q-45: log/secret hech qachon commit qilinmaydi; JWT minting yo'q | Security breach |
| 10 | Self-verify: BE tsc 0, FE tsc 0, reviewer skriptlar, jonli DB-proof (kirit→saqla→o'qi) | DoD FAIL |
| 11 | "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi | Egasi qaytaradi |
| 12 | Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/ + modul vizyon-hujjati) | DoD FAIL |

**Bu agent to'lqini (Wave):** 1
**Bog'liqlik:** P01 — `lib/db/src/schema/index.ts` barrel tayyor bo'lishi shart.

---

## 1. IZOLYATSIYA MANIFESTI

Bu agent **FAQAT** quyidagi fayllarga tegadi:

```
lib/db/src/schema/wms-schema.ts
apps/api/src/shared/db/migrations/wms-p1-locator-roll-sequence.sql
apps/api/src/shared/db/migrations/wms-p1-warehouse-types-seed.sql
```

**BOSHQA HEH QUM FAYL O'ZGARTIRILMAYDI.**

Agar boshqa fayl o'zgartirish kerak bo'lsa — **TO'XTA**, egasiga flag qil, supurib ketma.

### DDL Darvozasi (Q-35)

Bu paket `ddlGate: true`. Bu degani:

- Migration fayllarini **YOZASIZ** lekin **ISHGA TUSHIRMAYSIZ**.
- Har bir `CREATE TABLE` va `ALTER TABLE` SQL blokida `-- APPROVED: <egasi> <sana>` izohi
  bo'shi **SHART**. Bu izoh egasi tomonidan to'ldiriladi.
- Migration faylini DB ga qo'llash faqat egasi ruxsatidan keyin amalga oshiriladi.
- Drizzle `pgTable` ta'riflari esa `wms-schema.ts` ga yoziladi — bu schema faylida
  DDL darvozasi kodi ta'sirida bo'lmaydi, chunki bu Drizzle type definitions; ammo
  migration SQL gated.

---

## 2. VIZYON

Manba: `docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md` + `docs/audit/OMBOR-KASSIR-INTERVYU-2026-06-08.md`.

### 2.1 7 Ombor turi (EP-WMS-002 / OMBOR-KASSIR-INTERVYU §1)

EuroPrint WMS da **7 ta asosiy ombor turi** mavjud (QC ombori va MES/Flekso/Ofset — bu modullar tashqarisida):

| Kod | Uz nomi | Tavsif |
|-----|---------|--------|
| `ROLL_PAPER` | Rulon qog'oz ombori | Gramaj/kenglik/FIFO; gofra uchun asosiy |
| `FINISHED_GOODS` | Tayyor mahsulot ombori | Ijara (30+ kun → menejerga yoziladi) |
| `RAW_MATERIAL` | Hom-ashyo ombori | Standart kirish/chiqish |
| `HOUSEHOLD` | Xo'jalik ombori | Mayda ehtiyotlar, iste'mol mollari |
| `EQUIPMENT` | Jihozlar ombori | Kapital jihozlar, aksessuarlar |
| `TOOLS` | Asbob-uskunalar ombori | Kichik asboblar, o'lchov qurilmalari |
| `SCRAP_BRAK` | Makulatura/brak ombori | Ikkilamchi xom ashyo, qayta ishlash |

**Qabul mezoni:** `warehouse_types` jadvalida yuqorida ko'rsatilgan 7 ta kod seed bilan
kiritilgan bo'lishi va `/api/wms/warehouse-types` endpoint orqali qaytarilishi kerak.

### 2.1-A DEPARTMENT_* Ichki Omborlar + Overflow (EP-WMS-002 / MASTER-SAVOL-JAVOB EP-WMS-075)

**⚠️ TUSHIB QOLGAN (00-INTERVYU-MOSLIK §2 WMS MISSING):**
Egasi MASTER-SAVOL-JAVOB EP-WMS-002 da aniq ko'rsatgan:
> "POS Q29 aniq beradi: MAIN, QUARANTINE, PRODUCTION_*, FINISHED_GOODS,
> **DEPARTMENT_* (30+)**, QC, DEFECTIVE."

Shuningdek VISION-1000 Q497:
> "Kunlik hisobotda barcha ombor turlari (MAIN, QUARANTINE, QC, PRODUCTION_*,
> FINISHED_GOODS, **DEPARTMENT_***) alohida ko'rsatiladi."

**`DEPARTMENT_*` degani:** har bo'lim (otdeleniye/otdel) o'zining ichki ombori bo'ladi —
masalan `DEPARTMENT_PRINT`, `DEPARTMENT_CUTTING`, `DEPARTMENT_PACKAGING` va h.k.
30+ bo'lim uchun 30+ ombor ko'zda tutilgan. Bu ombor menejerning `org_functions.id` ga
bog'langan bo'lishi kerak.

**Overflow mantig'i (EP-WMS-002 + OMBOR-KASSIR-INTERVYU konteksti):**
Asosiy ombor to'lib ketganda material DEPARTMENT ichki omboriga o'tkaziladi (overflow).
Bu hali egasi tomonidan to'liq spetsifikatsiya qilinmagan.

**Bu P20 direktiva uchun qaror:**
DEPARTMENT_* ombor turlari `warehouse_types` jadvalida generic `DEPARTMENT` tur
sifatida seed qilinadi. Har konkret bo'lim ombori `warehouses` jadvalida `type='DEPARTMENT'`
va `code='DEPT_{org_function_id}'` sifatida yaratiladi (ORG kaskad, EP-ORG-041 bilan bog'liq).

> ⚠️ **DEFER + EGASI QARORIGA:** To'liq DEPARTMENT_* seed va overflow mantig'i
> ORG-kaskad (EP-ORG-041) bilan birgalikda amalga oshirilishi kerak — u alohida
> paketda (P04/P05 ORG kengaytmasi). P20 faqat `DEPARTMENT` generic turini seed ga
> qo'shadi; real bo'lim omborlari ORG bo'lim yaratilganda avto-yaratiladigan qilib
> loyihalash **keyingi paketga qoldirildi**.
> **Overflow mantig'i** (asosiy ombor to'lganda DEPARTMENT ga o'tkazish) ham
> EGASI SPETSIFIKATSIYASI KERAK — hech qanday miqdor/qoida o'ylab topilmadi.

### 2.1-B Lahtak (Offcut / Qoldiq Parchalanishi) Tayinlash (EP-WMS-125 / VISION-1000 Q141)

**⚠️ TUSHIB QOLGAN (00-INTERVYU-MOSLIK §2 WMS MISSING):**
VISION-1000 Q141 + Q143 va MASTER-SAVOL-JAVOB EP-WMS-125:
> "Lahtak" = rulon/qog'ozdan kesilgandan qolgan yaratiladigan parchalanish (offcut).
> "Tayyor mahsulot omboridagi lahtak aybdor menejer profiliga o'tadi" (Q141).
> Lahtak `SCRAP_BRAK` omboriga yoki alohida `LAHTAK` zonasiga yo'naltiriladi.

**Bu P20 direktiva uchun qaror:**
1. `FINISHED_GOODS` ombori seed `rules` JSONB ichida `"lahtak_tracking": true` allaqachon
   mavjud (5.2 seed faylida — to'g'ri).
2. Lahtak mantig'ining to'liq implementatsiyasi (MES kesish operatsiyasi → lahtak yaratilishi
   → menejer profiliga bog'lanish) **P21 backend logikasi yoki MES/P15 paketiga tegishli**.

> ⚠️ **DEFER:** Lahtak tayinlash workflow (qaysi menejer, qaysi ombor, GL yozuvi qanday)
> EGASI SPETSIFIKATSIYASI KERAK. P20 faqat `SCRAP_BRAK` ombori va FINISHED_GOODS
> `lahtak_tracking` bayrog'ini schema darajasida belgilaydi. Biznes mantig'i (menejer
> profili bog'lanishi + GL) keyingi paketga qoldirildi.

### 2.2 Structured Locator (EP-WMS-073 / OMBOR-KASSIR-INTERVYU §1)

**Egasi ta'rifi (EP-WMS-073 override):**
> "Zona → Qator → Javon → Yacheyka" strukturali manzil, masalan `A-12-3-2`.
> Auto empty-slot suggestion: yangi tovar qo'yilganda bo'sh yacheykani tizim tavsiya qiladi.

**Hozirgi holat:** `warehouseBins` jadvalida `row`, `shelf`, `level` ustunlari mavjud lekin:
- `locator_code` (`A-12-3-2` formati) yo'q.
- `zone_id` `varchar` sifatida mavjud lekin `warehouseZones.id` ga FK yo'q.
- `is_occupied` boolean ustuni yo'q (bo'sh slot indikatori).
- Auto-suggest logikasi yo'q.

**Bu agent vazifasi:** `warehouse_locations` yangi jadval (yoki `warehouseBins` kengaytirish)
ni Drizzle `pgTable` sifatida belgilash + migration SQL gated holda yozish.

**Qaror:** `warehouseBins` jadval allaqachon mavjud va production da ishlatilmoqda.
Shuning uchun yangi `warehouse_locations` jadvali qo'shimcha model sifatida yaratiladi
(`warehouseBins` ga parallel, lekin structured-locator manzil uchun). Bu Q-46 qoidasiga
mos: mavjud `warehouseBins` o'chirilmaydi.

**Locator format:** `{zona_kodi}-{qator_raqami}-{javon_raqami}-{yacheyka_raqami}`, masalan `A-12-3-2`.

### 2.3 Movement Numbering (OMBOR-KASSIR-INTERVYU §13)

**Egasi ta'rifi:**
> Har bir harakatda `HOM-KIRIM-2026-00001` formatidagi noyob raqam generatsiya qilinadi.
> Format: `{ombor_tipi}-{harakat_tipi}-{yil}-{ketma-ket_raqam 5 ta xona}`.

**Hozirgi holat:**
- `stockMoves.moveNumber` — mavjud lekin format standartlashtirilmagan.
- `barcodeMovements` — `movement_number` ustuni yo'q.
- `warehouseTransactions.documentNumber` — mavjud lekin WMS-format emas.
- Hech qaerda PostgreSQL `sequence` yoki `movement_sequences` jadvali topilmadi.

**Bu agent vazifasi:** `movement_sequences` jadval (year+warehouse_type+action_type
kombinatsiyasi uchun counter) + helper SQL function `generate_wms_movement_number()`
DDL ni gated migration sifatida yozish.

### 2.4 Roll Card (Rulon Qog'oz Kartochkasi) (EP-WMS-014/032..039)

**Egasi ta'rifi (OMBOR-KASSIR-INTERVYU §4):**
> Har rulon: noyob ID + QR label + kenglik (mm) + diametr + gramaj g/m² (80..300) +
> boshlang'ich og'irlik (kg) + joriy qoldiq (kg) + taxminiy uzunlik (m, auto-calc) +
> tur (kraft/test-liner/fluting/white/makulatura) + yetkazib beruvchi + sertifikat +
> kelgan sana + namlik% + saqlash zonasi + FIFO status.

**Hozirgi holat:**
- `wms-schema.ts` da `roll_cards` yoki `paper_roll_cards` jadvali **topilmadi**.
- `RollManagementPage.tsx` `/api/agents/inventory/rolls` ga murojaat qiladi — bu agents
  module orqali (stub xavfi).
- `warehouseStock` da rulon-spetsifik ustunlar yo'q.

**Bu agent vazifasi:** `roll_cards` pgTable ta'rifini `wms-schema.ts` ga qo'shish +
gated migration SQL yozish.

### 2.5 warehouse_stock.owner_type (EP-WMS-123)

**Egasi ta'rifi (MASTER-SAVOL-JAVOB EP-WMS-123 / EP-WMS-019/020/133):**
> `owner_type` = `US` (EuroPrint o'zi) yoki `CLIENT_{id}` (davalcheskiy — mijoz materiali).
> Mijoz materiali faqat shu mijozning buyurtmalari uchun ko'rinadi.

**⚠️ DOIRA CHEKLOVI (00-INTERVYU-MOSLIK §2 WMS CONTRADICTS):**
Egasi kontekstida "davalcheskiy" (davallcheskiy) — **FAQAT tayyor mahsulot ombori (FINISHED_GOODS)**
uchun amal qiladi (EP-WMS-019/020/133 va VISION-1000 Q141: "tayyor mahsulot omboridagi lahtak
aybdor menejer profiliga o'tadi"). Xom-ashyo, rulon, asbob-uskunalar ombori uchun bu kontseptsiya
egasi tomonidan **aniqlanmagan**.

Shuning uchun:
- `owner_type` ustuni `warehouse_stock` ga qo'shiladi (jadval-keng ALTER — DB darajasida cheklov qiyin),
  lekin **faqat `FINISHED_GOODS` tur omborlariga tegishli qatorlarda ma'noli** deb belgilanadi.
- Xom-ashyo / rulon / asbob-uskunalar omborlarida `owner_type = 'US'` default bo'lib qoladi
  (hech qanday CLIENT tayinlanmaydi).
- Bir CHECK constraint qo'shilmaydi (chunki ombor turi `warehouse_stock` jadvalida bevosita mavjud
  emas — `warehouses.type` orqali join kerak). **Business rule servis qatlamida ta'minlanadi.**

> ⚠️ **EGASI QIYMATI KERAK:** Boshqa ombor turlari (ROLL_PAPER, RAW_MATERIAL, HOUSEHOLD…) uchun
> `owner_type` semantikasi kerakmi — egasi tasdiqlasin. Hozircha faqat FINISHED_GOODS uchun
> amalda ishlatiladi; boshqa turlarda default `'US'` qoladi.

**Hozirgi holat:** `warehouseStock` jadvalida `owner_type` ustuni **yo'q** (tekshirildi:
`wms-schema.ts` 391-420 qatorlar). Bu CRITICAL MISS for FINISHED_GOODS context.

**Bu agent vazifasi:** `warehouse_stock` ALTER TABLE + Drizzle ta'rifiga `owner_type`
ustunini qo'shish (gated). Servis qatlamiga `FINISHED_GOODS`-only enforcement izohi bilan.

---

## 3. HOZIRGI HOLAT

### 3.1 Mavjud narsalar (exists)

| Fayl:qator | Nima | Holat |
|-----------|------|-------|
| `wms-schema.ts:18-43` | `warehouses` pgTable (id/code/name/type/manager_id + 9 superset col) | ✅ Ishlamoqda |
| `wms-schema.ts:63-82` | `warehouseTypes` pgTable (code PK + nameUz/category/inboundFlow...) | ✅ Mavjud — SEED YO'Q |
| `wms-schema.ts:155-184` | `warehouseZones` (id/warehouseId/code/name/zoneType + `type` superset) | ✅ Mavjud |
| `wms-schema.ts:188-222` | `warehouseBins` (id/warehouseId/code/row/shelf/level/binType...) | ✅ Mavjud, lekin locator_code, is_occupied YO'Q |
| `wms-schema.ts:391-420` | `warehouseStock` canonical (quantity/reservedQty/reorderPoint/maxStock...) | ✅ Ishlamoqda — owner_type YO'Q |
| `wms-schema.ts:306-338` | `stockMoves` (moveNumber/moveDate/moveType...) | ✅ Mavjud — WMS-format numbering YO'Q |
| `wms-schema.ts:341-388` | `warehouseTransactions` (materialId/transactionDate/transactionType...) | ✅ Mavjud |
| `wms-schema.ts:452-486` | `barcodeMovements` (barcodeId/movementType/quantity...) | ✅ Mavjud |
| `wms-schema.ts:598-632` | `cycleCountResults` (systemQty/countedQty/variance%) | ✅ Mavjud |
| `wms-schema.ts:639-672` | `stockMovementGLPostings` | ✅ Mavjud |
| `wms-schema.ts:770-837` | `warehouseRentalSettings` + `warehouseRentalRecords` | ✅ Mavjud |
| `wms-schema.ts:705-730` | `productionMaterialBalance` | ✅ Mavjud |
| `wms-schema.ts:732-766` | `internalRequests` | ✅ Mavjud |
| `apps/api/src/modules/wms/wms.module.ts` | 22 controller, CQRS handlers, QcPassedListener | ✅ Ishlamoqda |

### 3.2 Yo'q narsalar (missing) — bu agent hal qiladigan

| Gap | Fayl | Holat |
|-----|------|-------|
| `warehouse_locations` jadvali (structured locator A-12-3-2) | `wms-schema.ts` | ❌ YO'Q |
| `locator_code`, `is_occupied` `warehouseBins` da | `wms-schema.ts:188` | ❌ YO'Q |
| `roll_cards` jadvali (barcha rulon maydonlari) | `wms-schema.ts` | ❌ YO'Q |
| `movement_sequences` jadvali (HOM-KIRIM-2026-00001) | `wms-schema.ts` | ❌ YO'Q |
| `warehouse_stock.owner_type` ustuni | `wms-schema.ts:391` | ❌ YO'Q |
| `warehouseTypes` 7-tip seed SQL | migrations/ | ❌ YO'Q |
| Migration SQL (locator+roll+sequence) | migrations/ | ❌ YO'Q (gated) |
| Migration SQL (7-tip seed) | migrations/ | ❌ YO'Q (gated) |

### 3.3 Buzuq yoki soxta (brokenOrFake)

| Fayl:qator | Muammo | P20 tegadimi? |
|-----------|--------|---------------|
| `wms-catalog.controller.ts:99` | `getDashboard()` hardcoded `{totalItems:0}` | ❌ Bu P20 scope'i tashqarisida |
| `wms-integration.controller.ts:84-122` | 6 ta `notImplemented()` stub | ❌ Tashqarida |
| `StubRoutes.tsx:72` | `/ai/wms` stub sahifa | ❌ Tashqarida |
| `wms-warehouses.controller.ts:64-72` | `getById()` O(N) memory scan | ❌ Tashqarida |
| `RollManagementPage.tsx` | `/api/agents/inventory/rolls` stub-xavfi | ❌ Tashqarida |
| `wms-analytics.service.ts:71-72` | `product_id::integer` cast xavfi | ❌ Tashqarida |

**Diqqat:** Yuqoridagi brokenOrFake elementlar bu agentning OWNED-FILE ro'yxatida
emas. Ularni bu sessiyada O'ZGARTIRMANG. Flag qiling, owner hal qiladi.

---

## 4. ISH (qadam-baqadam)

### 4.0 Boshlash tekshiruvi (Q-29 — verify-don't-trust)

**Birinchi qadam — fayllarni o'qing va jonli DB ni tekshiring:**

```bash
# 1. wms-schema.ts hozirgi holatini ko'ring
wc -l Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts
# → ~839 qator

# 2. warehouse_locations jadvali DB da mavjudmi?
node apps/api/_audit/q.cjs \
  "SELECT table_name FROM information_schema.tables WHERE table_name='warehouse_locations'"
# → 0 row = YO'Q (gated DDL shart)

# 3. roll_cards jadvali DB da mavjudmi?
node apps/api/_audit/q.cjs \
  "SELECT table_name FROM information_schema.tables WHERE table_name='roll_cards'"
# → 0 row = YO'Q (gated DDL shart)

# 4. movement_sequences jadvali DB da mavjudmi?
node apps/api/_audit/q.cjs \
  "SELECT table_name FROM information_schema.tables WHERE table_name='movement_sequences'"
# → 0 row = YO'Q (gated DDL shart)

# 5. warehouse_stock.owner_type ustuni mavjudmi?
node apps/api/_audit/q.cjs \
  "SELECT column_name FROM information_schema.columns \
   WHERE table_name='warehouse_stock' AND column_name='owner_type'"
# → 0 row = YO'Q (gated ALTER shart)

# 6. warehouse_types jadvali DB da mavjudmi va nechta qator?
node apps/api/_audit/q.cjs \
  "SELECT count(*) FROM warehouse_types"
# → 0 row = SEED kerak
```

**Agar jonli DB da ushbu jadvallar/ustunlar allaqachon mavjud bo'lsa — TO'XTA va egasiga
xabar bering** (boshqa agent parallel yaratgan bo'lishi mumkin).

---

### 4.1 Qadam 1: `wms-schema.ts` — `warehouse_locations` pgTable qo'shish

**Fayl:** `lib/db/src/schema/wms-schema.ts`

**Qo'shish joyi:** `warehouseBins` ta'rifidan keyin (hozirgi qator ~222 dan keyin),
`stockTransfers` dan oldin.

**Nima qo'shiladi:**

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED LOCATOR — EP-WMS-073 (Zona→Qator→Javon→Yacheyka: A-12-3-2)
// DDL GATED: warehouse_locations jadvali egasi ruxsatidan keyin yaratiladi.
// ─────────────────────────────────────────────────────────────────────────────
export const warehouseLocations = pgTable("warehouse_locations", {
  id:              serial("id").primaryKey(),
  warehouseId:     varchar("warehouse_id", { length: 50 }).notNull()
                     .references(() => warehouses.id, { onDelete: "cascade" }),
  zoneId:          integer("zone_id")
                     .references(() => warehouseZones.id, { onDelete: "set null" }),
  zoneCode:        varchar("zone_code", { length: 10 }).notNull(),   // A, B, C ...
  rowNum:          integer("row_num").notNull(),                      // 1..999
  shelfNum:        integer("shelf_num").notNull(),                    // 1..99
  cellNum:         integer("cell_num").notNull(),                     // 1..99
  locatorCode:     varchar("locator_code", { length: 20 }).notNull(), // A-12-3-2
  displayName:     text("display_name"),                              // ixtiyoriy nom
  isOccupied:      boolean("is_occupied").notNull().default(false),
  currentBarcodeId: varchar("current_barcode_id", { length: 100 }),  // joriy barcode (scan)
  maxWeightKg:     numericMoney("max_weight_kg"),
  maxVolumeLiter:  numericMoney("max_volume_liter"),
  locationType:    varchar("location_type", { length: 20 }).notNull().default("standard"),
  // standard | bulk | cold | roll (rulon uchun maxsus)
  isActive:        boolean("is_active").notNull().default(true),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_wh_locations_warehouse_id").on(t.warehouseId),
  index("idx_wh_locations_zone_id").on(t.zoneId),
  index("idx_wh_locations_is_occupied").on(t.isOccupied),
  index("idx_wh_locations_locator_code").on(t.locatorCode),
  unique("uq_wh_locations_locator").on(t.warehouseId, t.locatorCode),
  check("wh_locations_type_chk",
    sql`${t.locationType} IN ('standard','bulk','cold','roll')`),
  check("wh_locations_row_chk",  sql`${t.rowNum} >= 1 AND ${t.rowNum} <= 999`),
  check("wh_locations_shelf_chk", sql`${t.shelfNum} >= 1 AND ${t.shelfNum} <= 99`),
  check("wh_locations_cell_chk",  sql`${t.cellNum} >= 1 AND ${t.cellNum} <= 99`),
]);

export const insertWarehouseLocationSchema = createInsertSchema(warehouseLocations, {
  zoneCode:     z.string().min(1).max(10).regex(/^[A-Z]+$/, "Zona kodi katta harflar"),
  rowNum:       z.number().int().min(1).max(999),
  shelfNum:     z.number().int().min(1).max(99),
  cellNum:      z.number().int().min(1).max(99),
  locatorCode:  z.string().min(3).max(20)
                 .regex(/^[A-Z]+-\d+-\d+-\d+$/, "Format: A-12-3-2"),
  locationType: z.enum(["standard", "bulk", "cold", "roll"]).default("standard"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type WarehouseLocation = typeof warehouseLocations.$inferSelect;
export type InsertWarehouseLocation = z.infer<typeof insertWarehouseLocationSchema>;
```

**Edge-case:** `locatorCode` unique per warehouse (uq index qo'shilgan). Agar bir
omborga bir xil `A-12-3-2` ikki marta INSERT qilinsa — DB darajasida UNIQUE VIOLATION
qaytariladi. Repository `Result<T>` bilan bu xatoni ushlab qaytaradi.

---

### 4.2 Qadam 2: `wms-schema.ts` — `roll_cards` pgTable qo'shish

**Fayl:** `lib/db/src/schema/wms-schema.ts`

**Qo'shish joyi:** `warehouseLocations` ta'rifidan keyin, `stockTransfers` dan oldin.

**Nima qo'shiladi:**

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// RULON QOGOZ KARTOCHKASI — EP-WMS-014/032..039 (OMBOR-KASSIR-INTERVYU §4)
// Har bir fizik rulon alohida kartochka. FIFO: ochilgan rulonlar birinchi.
// DDL GATED: roll_cards jadvali egasi ruxsatidan keyin yaratiladi.
// ─────────────────────────────────────────────────────────────────────────────
export const rollCards = pgTable("roll_cards", {
  id:              serial("id").primaryKey(),
  uniqueRollId:    varchar("unique_roll_id", { length: 30 }).notNull().unique(),
  // Format: EP-ROLL-2026-000001 (auto-generated)

  warehouseId:     varchar("warehouse_id", { length: 50 }).notNull()
                     .references(() => warehouses.id, { onDelete: "restrict" }),
  locationId:      integer("location_id")
                     .references(() => warehouseLocations.id, { onDelete: "set null" }),
  materialId:      integer("material_id").notNull()
                     .references(() => materialCards.id, { onDelete: "restrict" }),
  supplierId:      integer("supplier_id"),  // FK mm-schema vendorlarga (cross-module ref)

  // Rulon fizik parametrlari
  widthMm:         integer("width_mm").notNull(),      // Kenglik mm (masalan 1000)
  diameterMm:      integer("diameter_mm").notNull(),   // Diametr mm
  gramajGsm:       integer("gramaj_gsm").notNull(),    // Gramaj g/m² (80..300)
  initialWeightKg: numericMoney("initial_weight_kg").notNull(),  // Boshlang'ich og'irlik kg
  currentWeightKg: numericMoney("current_weight_kg").notNull(),  // Joriy qoldiq kg
  // taxminiy uzunlik = (currentWeightKg * 1_000_000) / (gramajGsm * widthMm) — computed
  // Bu hisob-kitob service/VIEW darajasida bajariladi; DB da saqlanmaydi (derive etiladi)

  rollType:        varchar("roll_type", { length: 20 }).notNull(),
  // kraft | test_liner | fluting | white | makulatura

  // Kimyoviy/fizik xususiyatlar
  humidityPct:     numericMoney("humidity_pct"),       // Namlik %
  certificateNo:   varchar("certificate_no", { length: 100 }),  // Sertifikat raqami
  receivedDate:    varchar("received_date", { length: 10 }).notNull(), // YYYY-MM-DD

  // Zaxira zonasi va saqlash
  storageZone:     varchar("storage_zone", { length: 50 }),  // Saqlash zonasi kodi

  // FIFO holati
  status:          varchar("status", { length: 20 }).notNull().default("full"),
  // full | opened | remnant
  isFifoLocked:    boolean("is_fifo_locked").notNull().default(false),
  // true = eski rulon birinchi; yangisiga o'tishga bloker

  // QR/barcode
  qrLabelPrinted:  boolean("qr_label_printed").notNull().default(false),
  qrPrintedAt:     timestamp("qr_printed_at"),
  qrPrintedBy:     integer("qr_printed_by")
                     .references(() => users.id, { onDelete: "set null" }),

  // Kirim hujjati bilan bog'liq
  goodsReceiptId:  integer("goods_receipt_id"),   // WMS goods receipt ID (cross-ref)
  batchNumber:     varchar("batch_number", { length: 50 }), // Partiya/lot raqami

  // Audit
  createdBy:       integer("created_by")
                     .references(() => users.id, { onDelete: "set null" }),
  updatedBy:       integer("updated_by")
                     .references(() => users.id, { onDelete: "set null" }),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
  deletedAt:       timestamp("deleted_at"),
}, (t) => [
  index("idx_roll_cards_warehouse_id").on(t.warehouseId),
  index("idx_roll_cards_material_id").on(t.materialId),
  index("idx_roll_cards_status").on(t.status),
  index("idx_roll_cards_received_date").on(t.receivedDate),
  index("idx_roll_cards_is_fifo_locked").on(t.isFifoLocked),
  index("idx_roll_cards_deleted_at").on(t.deletedAt),
  check("roll_cards_type_chk",
    sql`${t.rollType} IN ('kraft','test_liner','fluting','white','makulatura')`),
  check("roll_cards_status_chk",
    sql`${t.status} IN ('full','opened','remnant')`),
  check("roll_cards_gramaj_chk",
    sql`${t.gramajGsm} >= 80 AND ${t.gramajGsm} <= 300`),
  check("roll_cards_weight_chk",
    sql`${t.currentWeightKg} >= 0 AND ${t.currentWeightKg} <= ${t.initialWeightKg}`),
  check("roll_cards_width_chk",
    sql`${t.widthMm} >= 100 AND ${t.widthMm} <= 5000`),
  check("roll_cards_diameter_chk",
    sql`${t.diameterMm} >= 50 AND ${t.diameterMm} <= 3000`),
]);

export const insertRollCardSchema = createInsertSchema(rollCards, {
  uniqueRollId:    z.string().min(5).max(30),
  widthMm:         z.number().int().min(100).max(5000),
  diameterMm:      z.number().int().min(50).max(3000),
  gramajGsm:       z.number().int().min(80).max(300),
  initialWeightKg: z.number().positive("Og'irlik musbat bo'lishi kerak"),
  currentWeightKg: z.number().min(0),
  rollType:        z.enum(["kraft", "test_liner", "fluting", "white", "makulatura"]),
  status:          z.enum(["full", "opened", "remnant"]).default("full"),
  receivedDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format"),
  humidityPct:     z.number().min(0).max(100).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type RollCard = typeof rollCards.$inferSelect;
export type InsertRollCard = z.infer<typeof insertRollCardSchema>;
```

**Izoh:** `supplierId` integer tipida lekin FK izoh sifatida yozilmagan, chunki
mm-schema vendors jadvaliga cross-module FK qo'shish P20 izolyatsiya chegara tashqarisida.
P03 (op-codes) yoki alohida migration da hal qilinadi.

**taxminiy uzunlik formulasi:**
```
uzunlik_m = (currentWeightKg × 1_000_000) / (gramajGsm × widthMm)
```
Bu service/repo darajasida `computed` sifatida hisoblanadi. `business.constants.ts` da:
```typescript
export const ROLL_LENGTH_FORMULA_DIVISOR = 1_000_000; // gramaj * kenglik bo'yicha
```

---

### 4.3 Qadam 3: `wms-schema.ts` — `movement_sequences` pgTable qo'shish

**Fayl:** `lib/db/src/schema/wms-schema.ts`

**Qo'shish joyi:** `rollCards` ta'rifidan keyin.

**Nima qo'shiladi:**

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// HARAKAT RAQAM GENERATORI — OMBOR-KASSIR-INTERVYU §13
// Format: HOM-KIRIM-2026-00001 (ombor_tur-harakat_tur-yil-ketmaket)
// Har (warehouse_type_code, action_type, year) kombinatsiyasi uchun alohida counter.
// DDL GATED: movement_sequences jadvali egasi ruxsatidan keyin yaratiladi.
// ─────────────────────────────────────────────────────────────────────────────
export const movementSequences = pgTable("movement_sequences", {
  id:                serial("id").primaryKey(),
  warehouseTypeCode: varchar("warehouse_type_code", { length: 40 }).notNull(),
  // ROLL_PAPER → HOM, FINISHED_GOODS → TMF, RAW_MATERIAL → HSY, HOUSEHOLD → XOJ,
  // EQUIPMENT → JHZ, TOOLS → ASB, SCRAP_BRAK → MAK
  actionTypeCode:    varchar("action_type_code", { length: 20 }).notNull(),
  // KIRIM | CHIQIM | TRANSFER | QAYTARISH | HISOBDAN_CHIQARISH
  actionTypePrefix:  varchar("action_type_prefix", { length: 20 }).notNull(),
  // KIRIM | CHIQIM | TRANSFER | QAYTARISH | SPISANIYE
  yearNum:           integer("year_num").notNull(),
  lastSequenceNum:   integer("last_sequence_num").notNull().default(0),
  totalGenerated:    integer("total_generated").notNull().default(0),
  updatedAt:         timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  unique("uq_movement_seq").on(t.warehouseTypeCode, t.actionTypeCode, t.yearNum),
  index("idx_movement_sequences_year").on(t.yearNum),
  check("movement_seq_action_chk",
    sql`${t.actionTypeCode} IN ('KIRIM','CHIQIM','TRANSFER','QAYTARISH','HISOBDAN_CHIQARISH')`),
  check("movement_seq_num_chk",
    sql`${t.lastSequenceNum} >= 0 AND ${t.totalGenerated} >= 0`),
]);

export type MovementSequence = typeof movementSequences.$inferSelect;

// Warehouse type → short prefix xaritasi (business.constants.ts ga ko'chirish mumkin)
// ROLL_PAPER=HOM, FINISHED_GOODS=TMF, RAW_MATERIAL=HSY, HOUSEHOLD=XOJ,
// EQUIPMENT=JHZ, TOOLS=ASB, SCRAP_BRAK=MAK
```

**Raqam generatsiya SQL (migration da `generate_wms_movement_number` funksiya):**

```sql
-- Format: {ombor_prefix}-{harakat_prefix}-{yil}-{ketma_ket 5 xona}
-- Misol: HOM-KIRIM-2026-00001
CREATE OR REPLACE FUNCTION generate_wms_movement_number(
  p_warehouse_type_code TEXT,
  p_action_type_code    TEXT,
  p_year                INTEGER
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_row          movement_sequences%ROWTYPE;
  v_next_num     INTEGER;
  v_wh_prefix    TEXT;
  v_action_prefix TEXT;
  v_result       TEXT;
BEGIN
  -- Ombor prefix xaritasi
  v_wh_prefix := CASE p_warehouse_type_code
    WHEN 'ROLL_PAPER'     THEN 'HOM'
    WHEN 'FINISHED_GOODS' THEN 'TMF'
    WHEN 'RAW_MATERIAL'   THEN 'HSY'
    WHEN 'HOUSEHOLD'      THEN 'XOJ'
    WHEN 'EQUIPMENT'      THEN 'JHZ'
    WHEN 'TOOLS'          THEN 'ASB'
    WHEN 'SCRAP_BRAK'     THEN 'MAK'
    ELSE UPPER(LEFT(p_warehouse_type_code, 3))
  END;

  v_action_prefix := p_action_type_code; -- KIRIM, CHIQIM ...

  -- Atomic counter (SELECT FOR UPDATE)
  INSERT INTO movement_sequences
    (warehouse_type_code, action_type_code, action_type_prefix, year_num,
     last_sequence_num, total_generated, updated_at)
  VALUES
    (p_warehouse_type_code, p_action_type_code, v_action_prefix, p_year,
     1, 1, NOW())
  ON CONFLICT ON CONSTRAINT uq_movement_seq
  DO UPDATE SET
    last_sequence_num = movement_sequences.last_sequence_num + 1,
    total_generated   = movement_sequences.total_generated + 1,
    updated_at        = NOW()
  RETURNING last_sequence_num INTO v_next_num;

  v_result := v_wh_prefix || '-' || v_action_prefix || '-'
           || p_year::TEXT || '-'
           || LPAD(v_next_num::TEXT, 5, '0');

  RETURN v_result;
END;
$$;
```

**Ishlatish misoli:**
```sql
SELECT generate_wms_movement_number('ROLL_PAPER', 'KIRIM', 2026);
-- → 'HOM-KIRIM-2026-00001'
SELECT generate_wms_movement_number('ROLL_PAPER', 'KIRIM', 2026);
-- → 'HOM-KIRIM-2026-00002'
```

---

### 4.4 Qadam 4: `wms-schema.ts` — `warehouseStock.ownerType` ustuni qo'shish

**Fayl:** `lib/db/src/schema/wms-schema.ts`

**Qo'shish joyi:** `warehouseStock` pgTable ichida (hozirgi qator ~391-420),
`unit` ustunidan keyin.

**Oldin (qator ~408):**
```typescript
  unit: varchar("unit", { length: 20 }),
});
```

**Keyin:**
```typescript
  unit: varchar("unit", { length: 20 }),
  // EP-WMS-123: Davalcheskiy — US (EuroPrint o'zi) yoki CLIENT_{id} (mijoz materiali).
  // ⚠️ DOIRA CHEKLOVI: Egasi bu kontseptsiyani FAQAT FINISHED_GOODS ombori uchun aniqlagan
  // (EP-WMS-019/020/133, VISION-1000 Q141 lahtak/menejer konteksti).
  // Xom-ashyo/rulon/boshqa ombor turlari uchun default='US' (CLIENT tayinlanmaydi).
  // Boshqa ombor turlarida owner_type=CLIENT_* ishlatish uchun EGASI TASDIG'I KERAK.
  // DDL GATED: ALTER TABLE warehouse_stock ADD COLUMN owner_type egasi ruxsatidan keyin.
  ownerType: varchar("owner_type", { length: 30 }).default("US"),
  // Qiymatlar: 'US' | 'CLIENT_{id}' (faqat FINISHED_GOODS kontekstida CLIENT ma'noli)
});
```

**`insertWarehouseStockSchema` ga qo'shimcha (hozirgi qator ~412-415 dan keyin):**
```typescript
export const insertWarehouseStockSchema = createInsertSchema(warehouseStock, {
  quantity:         z.number().min(0, "Miqdor 0 dan kam bo'lmasligi kerak"),
  reservedQuantity: z.number().min(0, "Zaxiralangan miqdor 0 dan kam bo'lmasligi kerak"),
  ownerType:        z.string().max(30).default("US"),
  // 'US' yoki 'CLIENT_{id}' formati
}).omit({ id: true, createdAt: true, lastUpdatedAt: true } as never);
```

---

## 5. DDL (GATED — egasi ruxsatisiz DB ga qo'llanmaydi)

### 5.1 `wms-p1-locator-roll-sequence.sql`

**Fayl:** `apps/api/src/shared/db/migrations/wms-p1-locator-roll-sequence.sql`

```sql
-- ============================================================
-- P20: WMS PHASE 1 — Locator + Roll Card + Movement Sequence
-- APPROVED: <EGASI ISMI> <SANA>         ← egasi to'ldiradi
-- ============================================================
-- GATED: Bu migration faqat egasi yuqoridagi "APPROVED" ni
-- to'ldirgandan keyin `psql -f ...` bilan ishga tushiriladi.
-- Ishga tushirish oldin: DB backup qiling.
-- Rollback: wms-p1-locator-roll-sequence--rollback.sql (alohida yoziladi)
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. warehouse_locations: structured locator (A-12-3-2 format)
-- EP-WMS-073 — Zona→Qator→Javon→Yacheyka
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouse_locations (
  id               SERIAL PRIMARY KEY,
  warehouse_id     VARCHAR(50) NOT NULL
                     REFERENCES warehouses(id) ON DELETE CASCADE,
  zone_id          INTEGER
                     REFERENCES warehouse_zones(id) ON DELETE SET NULL,
  zone_code        VARCHAR(10) NOT NULL,
  row_num          INTEGER NOT NULL
                     CHECK (row_num >= 1 AND row_num <= 999),
  shelf_num        INTEGER NOT NULL
                     CHECK (shelf_num >= 1 AND shelf_num <= 99),
  cell_num         INTEGER NOT NULL
                     CHECK (cell_num >= 1 AND cell_num <= 99),
  locator_code     VARCHAR(20) NOT NULL,    -- 'A-12-3-2'
  display_name     TEXT,
  is_occupied      BOOLEAN NOT NULL DEFAULT FALSE,
  current_barcode_id VARCHAR(100),
  max_weight_kg    NUMERIC(15,3),
  max_volume_liter NUMERIC(15,3),
  location_type    VARCHAR(20) NOT NULL DEFAULT 'standard'
                     CHECK (location_type IN ('standard','bulk','cold','roll')),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_wh_locations_locator UNIQUE (warehouse_id, locator_code)
);

CREATE INDEX IF NOT EXISTS idx_wh_locations_warehouse_id
  ON warehouse_locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wh_locations_zone_id
  ON warehouse_locations(zone_id);
CREATE INDEX IF NOT EXISTS idx_wh_locations_is_occupied
  ON warehouse_locations(is_occupied);
CREATE INDEX IF NOT EXISTS idx_wh_locations_locator_code
  ON warehouse_locations(locator_code);

COMMENT ON TABLE warehouse_locations IS
  'Structured locator: Zona→Qator→Javon→Yacheyka (A-12-3-2). EP-WMS-073.';
COMMENT ON COLUMN warehouse_locations.locator_code IS
  'Human-readable manzil, masalan A-12-3-2 (zona-qator-javon-yacheyka)';
COMMENT ON COLUMN warehouse_locations.is_occupied IS
  'true = bu yacheykada tovar bor; auto empty-slot suggestion uchun';

-- ------------------------------------------------------------
-- 2. roll_cards: rulon qog'oz kartochkasi
-- EP-WMS-014/032..039 (OMBOR-KASSIR-INTERVYU §4)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roll_cards (
  id                 SERIAL PRIMARY KEY,
  unique_roll_id     VARCHAR(30) NOT NULL UNIQUE,
  warehouse_id       VARCHAR(50) NOT NULL
                       REFERENCES warehouses(id) ON DELETE RESTRICT,
  location_id        INTEGER
                       REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  material_id        INTEGER NOT NULL
                       REFERENCES material_cards(id) ON DELETE RESTRICT,
  supplier_id        INTEGER,                        -- FK keyin (mm-schema)

  -- Fizik parametrlar
  width_mm           INTEGER NOT NULL
                       CHECK (width_mm >= 100 AND width_mm <= 5000),
  diameter_mm        INTEGER NOT NULL
                       CHECK (diameter_mm >= 50 AND diameter_mm <= 3000),
  gramaj_gsm         INTEGER NOT NULL
                       CHECK (gramaj_gsm >= 80 AND gramaj_gsm <= 300),
  initial_weight_kg  NUMERIC(10,3) NOT NULL CHECK (initial_weight_kg > 0),
  current_weight_kg  NUMERIC(10,3) NOT NULL DEFAULT 0
                       CHECK (current_weight_kg >= 0),

  roll_type          VARCHAR(20) NOT NULL
                       CHECK (roll_type IN
                         ('kraft','test_liner','fluting','white','makulatura')),

  -- Kimyoviy/fizik
  humidity_pct       NUMERIC(5,2) CHECK (humidity_pct >= 0 AND humidity_pct <= 100),
  certificate_no     VARCHAR(100),
  received_date      VARCHAR(10) NOT NULL,            -- YYYY-MM-DD

  storage_zone       VARCHAR(50),

  -- FIFO
  status             VARCHAR(20) NOT NULL DEFAULT 'full'
                       CHECK (status IN ('full','opened','remnant')),
  is_fifo_locked     BOOLEAN NOT NULL DEFAULT FALSE,

  -- QR label
  qr_label_printed   BOOLEAN NOT NULL DEFAULT FALSE,
  qr_printed_at      TIMESTAMPTZ,
  qr_printed_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,

  -- Kirim hujjati
  goods_receipt_id   INTEGER,
  batch_number       VARCHAR(50),

  -- Audit
  created_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_roll_cards_warehouse_id
  ON roll_cards(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_roll_cards_material_id
  ON roll_cards(material_id);
CREATE INDEX IF NOT EXISTS idx_roll_cards_status
  ON roll_cards(status);
CREATE INDEX IF NOT EXISTS idx_roll_cards_received_date
  ON roll_cards(received_date);
CREATE INDEX IF NOT EXISTS idx_roll_cards_is_fifo_locked
  ON roll_cards(is_fifo_locked);
CREATE INDEX IF NOT EXISTS idx_roll_cards_deleted_at
  ON roll_cards(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE roll_cards IS
  'Rulon qogoz kartochkasi. Har fizik rulon = 1 qator. FIFO tartibda chiqariladi.';
COMMENT ON COLUMN roll_cards.unique_roll_id IS
  'Format: EP-ROLL-2026-000001. QR label ushbu ID ga bosiladi.';
COMMENT ON COLUMN roll_cards.current_weight_kg IS
  'Joriy qoldiq kg. Ishlatilganda kamayadi. 0 = rulon tugagan.';
COMMENT ON COLUMN roll_cards.is_fifo_locked IS
  'true = bu rulon FIFO zanjirida birinchi navbatda chiqarilishi kerak.';

-- ------------------------------------------------------------
-- 3. movement_sequences: harakat raqam generatori
-- Format: HOM-KIRIM-2026-00001 (OMBOR-KASSIR-INTERVYU §13)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movement_sequences (
  id                  SERIAL PRIMARY KEY,
  warehouse_type_code VARCHAR(40) NOT NULL,
  action_type_code    VARCHAR(20) NOT NULL
                        CHECK (action_type_code IN
                          ('KIRIM','CHIQIM','TRANSFER','QAYTARISH','HISOBDAN_CHIQARISH')),
  action_type_prefix  VARCHAR(20) NOT NULL,
  year_num            INTEGER NOT NULL,
  last_sequence_num   INTEGER NOT NULL DEFAULT 0 CHECK (last_sequence_num >= 0),
  total_generated     INTEGER NOT NULL DEFAULT 0 CHECK (total_generated >= 0),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_movement_seq
    UNIQUE (warehouse_type_code, action_type_code, year_num)
);

CREATE INDEX IF NOT EXISTS idx_movement_sequences_year
  ON movement_sequences(year_num);

COMMENT ON TABLE movement_sequences IS
  'Harakat raqam counteri. Format: HOM-KIRIM-2026-00001. EP-WMS-002.';

-- movement_sequences uchun PostgreSQL funksiyasi
CREATE OR REPLACE FUNCTION generate_wms_movement_number(
  p_warehouse_type_code TEXT,
  p_action_type_code    TEXT,
  p_year                INTEGER
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_num      INTEGER;
  v_wh_prefix     TEXT;
  v_result        TEXT;
BEGIN
  -- Ombor tipi → qisqa prefix
  v_wh_prefix := CASE p_warehouse_type_code
    WHEN 'ROLL_PAPER'     THEN 'HOM'
    WHEN 'FINISHED_GOODS' THEN 'TMF'
    WHEN 'RAW_MATERIAL'   THEN 'HSY'
    WHEN 'HOUSEHOLD'      THEN 'XOJ'
    WHEN 'EQUIPMENT'      THEN 'JHZ'
    WHEN 'TOOLS'          THEN 'ASB'
    WHEN 'SCRAP_BRAK'     THEN 'MAK'
    ELSE UPPER(LEFT(p_warehouse_type_code, 3))
  END;

  -- Atomic increment (UPSERT + RETURNING)
  INSERT INTO movement_sequences
    (warehouse_type_code, action_type_code, action_type_prefix,
     year_num, last_sequence_num, total_generated, updated_at)
  VALUES
    (p_warehouse_type_code, p_action_type_code, p_action_type_code,
     p_year, 1, 1, NOW())
  ON CONFLICT ON CONSTRAINT uq_movement_seq
  DO UPDATE SET
    last_sequence_num = movement_sequences.last_sequence_num + 1,
    total_generated   = movement_sequences.total_generated + 1,
    updated_at        = NOW()
  RETURNING last_sequence_num INTO v_next_num;

  v_result := v_wh_prefix
           || '-' || p_action_type_code
           || '-' || p_year::TEXT
           || '-' || LPAD(v_next_num::TEXT, 5, '0');

  RETURN v_result;
END;
$$;

-- ------------------------------------------------------------
-- 4. warehouse_stock.owner_type ustuni qo'shish
-- EP-WMS-123 (davalcheskiy — mijoz materiali)
-- ⚠️ DOIRA CHEKLOVI (00-INTERVYU-MOSLIK §2 WMS CONTRADICTS):
--   Egasi bu kontseptsiyani FAQAT FINISHED_GOODS ombori uchun aniqlagan.
--   Bu ALTER TABLE barcha qatorlarga qo'shadi (DB cheklov uchun join kerak),
--   lekin servis qatlamida faqat FINISHED_GOODS omborlarida CLIENT_* tayinlanadi.
--   Boshqa ombor turlari (ROLL_PAPER/RAW_MATERIAL/HOUSEHOLD va boshqalar)
--   uchun owner_type='US' default bo'lib qoladi.
--   EGASI TASDIG'I KERAK: Boshqa ombor turlarida ham CLIENT tayinlash kerakmi?
-- ------------------------------------------------------------
ALTER TABLE warehouse_stock
  ADD COLUMN IF NOT EXISTS owner_type VARCHAR(30) DEFAULT 'US';

COMMENT ON COLUMN warehouse_stock.owner_type IS
  'US = EuroPrint ozi. CLIENT_{id} = mijoz (davalcheskiy). EP-WMS-123. '
  'Semantik doira: FAQAT FINISHED_GOODS ombori (egasi tasdig''i bilan boshqalarga kengaytiriladi).';

COMMIT;
```

---

### 5.2 `wms-p1-warehouse-types-seed.sql`

**Fayl:** `apps/api/src/shared/db/migrations/wms-p1-warehouse-types-seed.sql`

```sql
-- ============================================================
-- P20: WMS PHASE 1 — 7-tip warehouse_types seed
-- APPROVED: <EGASI ISMI> <SANA>         ← egasi to'ldiradi
-- ============================================================
-- IDEMPOTENT: ON CONFLICT DO UPDATE → xavfsiz qayta ishga tushirish.
-- QC_QUARANTINE va PRODUCTION_* turlari QC/MES modullariga tegishli —
-- bu seed da KIRITILMAYDI (izolyatsiya).
-- ============================================================

BEGIN;

INSERT INTO warehouse_types
  (code, name_uz, name_ru, category, icon,
   inbound_flow, outbound_flow,
   needs_quarantine, needs_qc, unit_basis, label_template,
   rules, sort_order, is_active)
VALUES
  -- 1. Rulon qog'oz ombori
  ('ROLL_PAPER',
   'Rulon qog''oz ombori',
   'Склад рулонной бумаги',
   'material',
   'Layers',
   'procurement_qc',
   'production_issue',
   TRUE,   -- har kirim karantinga
   TRUE,   -- gramaj QC tekshiruvi
   'weight',
   'roll',
   '{"fifo":true,"gramaj_check":true,"iot_scan_before_work":true,
     "overflow_logic":true,"roll_card_required":true}'::jsonb,
   1, TRUE),

  -- 2. Tayyor mahsulot ombori
  ('FINISHED_GOODS',
   'Tayyor mahsulot ombori',
   'Склад готовой продукции',
   'finished',
   'Package',
   'mes_qc',
   'sales_order',
   FALSE,  -- MES dan avtomatik keladi (allaqachon QC dan o'tgan)
   FALSE,
   'unit',
   'finished',
   '{"rental_enabled":true,"rental_free_days":30,
     "rental_charge_to":"manager","ijara_track":true,
     "lahtak_tracking":true,"shipping_doc_required":true}'::jsonb,
   2, TRUE),

  -- 3. Hom-ashyo ombori
  ('RAW_MATERIAL',
   'Hom-ashyo ombori',
   'Склад сырья',
   'material',
   'Box',
   'procurement_qc',
   'production_issue',
   TRUE,
   TRUE,
   'unit',
   'standard',
   '{"fifo":true,"fefo_for_dated":true,"batch_required":true}'::jsonb,
   3, TRUE),

  -- 4. Xo'jalik ombori
  ('HOUSEHOLD',
   'Xo''jalik ombori',
   'Хозяйственный склад',
   'material',
   'Home',
   'procurement_qc',
   'consume',
   TRUE,
   FALSE,
   'unit',
   'standard',
   '{"kassir_linkage":true}'::jsonb,
   4, TRUE),

  -- 5. Jihozlar ombori
  ('EQUIPMENT',
   'Jihozlar ombori',
   'Склад оборудования',
   'tools',
   'Wrench',
   'procurement_qc',
   'consume',
   FALSE,
   FALSE,
   'unit',
   'standard',
   '{"serial_number_required":true,"depreciation_linked":true}'::jsonb,
   5, TRUE),

  -- 6. Asbob-uskunalar ombori
  ('TOOLS',
   'Asbob-uskunalar ombori',
   'Склад инструментов',
   'tools',
   'Tool',
   'procurement_qc',
   'consume',
   FALSE,
   FALSE,
   'unit',
   'standard',
   '{"kassir_linkage":true,"serial_number_optional":true}'::jsonb,
   6, TRUE),

  -- 7. Makulatura/brak ombori
  ('SCRAP_BRAK',
   'Makulatura / brak ombori',
   'Склад макулатуры / брака',
   'waste',
   'Trash2',
   'waste_collect',
   'sell',
   FALSE,
   FALSE,
   'weight',
   'standard',
   '{"secondary_quality":true,"partial_recovery_revenue":true,"lahtak_receiver":true}'::jsonb,
   7, TRUE),

  -- 8. Bo'lim ichki ombori (DEPARTMENT_* — generic tur, EP-WMS-002)
  -- ⚠️ EGASI TA'RIFI: POS Q29 "DEPARTMENT_* (30+)" — har bo'lim o'z ichki omboriga ega.
  -- Har konkret bo'lim ombori 'warehouses' jadvalida type='DEPARTMENT', code='DEPT_{id}' sifatida
  -- ORG-kaskad orqali yaratiladi (EP-ORG-041). Bu seed faqat GENERIC turni ro'yxatga oladi.
  -- Overflow mantig'i (asosiy ombor to'lganda DEPARTMENT ga o'tkazish):
  -- EGASI SPETSIFIKATSIYASI KERAK — qoida/miqdor o'ylab topilmadi. Defer: ORG-kaskad paketi.
  ('DEPARTMENT',
   'Bo''lim ichki ombori',
   'Внутренний склад отдела',
   'internal',
   'Building2',
   'internal_issue',
   'internal_consume',
   FALSE,
   FALSE,
   'unit',
   'standard',
   '{"org_function_linked":true,"overflow_target":true,"overflow_logic":"EGASI_QIYMATI_KERAK"}'::jsonb,
   8, TRUE)

ON CONFLICT (code) DO UPDATE SET
  name_uz          = EXCLUDED.name_uz,
  name_ru          = EXCLUDED.name_ru,
  category         = EXCLUDED.category,
  icon             = EXCLUDED.icon,
  inbound_flow     = EXCLUDED.inbound_flow,
  outbound_flow    = EXCLUDED.outbound_flow,
  needs_quarantine = EXCLUDED.needs_quarantine,
  needs_qc         = EXCLUDED.needs_qc,
  unit_basis       = EXCLUDED.unit_basis,
  label_template   = EXCLUDED.label_template,
  rules            = EXCLUDED.rules,
  sort_order       = EXCLUDED.sort_order,
  is_active        = EXCLUDED.is_active;

COMMIT;

-- Verify:
-- SELECT code, name_uz, needs_quarantine, sort_order
-- FROM warehouse_types
-- WHERE code IN ('ROLL_PAPER','FINISHED_GOODS','RAW_MATERIAL',
--                'HOUSEHOLD','EQUIPMENT','TOOLS','SCRAP_BRAK','DEPARTMENT')
-- ORDER BY sort_order;
-- → 8 rows qaytishi kerak (7 asosiy + 1 DEPARTMENT generic tur)
-- DEPARTMENT tur: har bo'lim ombori 'warehouses' jadvalida type='DEPARTMENT', code='DEPT_{id}'
-- sifatida ORG-kaskad (EP-ORG-041) orqali avto-yaratiladi. Overflow mantig'i: EGASI KERAK.
```

---

## 6. QABUL MEZONI (Definition of Done)

Bu paket qabul qilinishi uchun BARCHA quyidagi shartlar bajarilishi shart:

### 6.1 Schema (Drizzle)

- [ ] `wms-schema.ts` ga 4 yangi element qo'shilgan:
  - `warehouseLocations` pgTable (locator_code, is_occupied, unique constraint)
  - `rollCards` pgTable (barcha rulon maydonlari: gramaj/kenglik/diametr/og'irlik/...)
  - `movementSequences` pgTable (warehouse_type+action_type+year unique)
  - `warehouseStock.ownerType` ustuni Drizzle ta'rifida mavjud
- [ ] Yangi jadvallar uchun Zod `insertSchema` va TypeScript `type` eksport qilingan
- [ ] Barcha CHECK constraint to'g'ri (gramaj 80..300, roll_type enum, locator_code format)
- [ ] Mavjud jadvallar (`warehouses`, `warehouseBins`, `warehouseStock`) O'ZGARTIRILMAGAN
  (faqat `warehouseStock` ga `ownerType` qo'shilgan, boshqa hech narsa emas)

### 6.2 Migration SQL (GATED)

- [ ] `wms-p1-locator-roll-sequence.sql` yozilgan:
  - `-- APPROVED: <egasi> <sana>` placeholder mavjud
  - `BEGIN;...COMMIT;` transaksiyada
  - `CREATE TABLE IF NOT EXISTS` (idempotent)
  - `generate_wms_movement_number()` SQL funksiyasi mavjud
  - `ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS owner_type`
- [ ] `wms-p1-warehouse-types-seed.sql` yozilgan:
  - 8 ta tur: ROLL_PAPER / FINISHED_GOODS / RAW_MATERIAL / HOUSEHOLD / EQUIPMENT / TOOLS / SCRAP_BRAK / DEPARTMENT
  - `ON CONFLICT DO UPDATE` (idempotent)
  - QC_QUARANTINE va PRODUCTION_* KIRITILMAGAN (izolyatsiya)
  - DEPARTMENT tur: generic ichki bo'lim ombori (EP-WMS-002); overflow qoidasi EGASI QIYMATI KERAK
- [ ] Migration fayllar `-- APPROVED:` to'ldirilmaguncha **ISHGA TUSHIRILMAGAN**

### 6.3 Tekshiruv (Verification)

- [ ] `pnpm tsc --noEmit` (BE) → 0 xato
- [ ] `pnpm tsc --noEmit` (FE) → 0 xato (agar schema FE ga eksport bo'lsa)
- [ ] `pnpm --filter @europrint/db build` → 0 xato
- [ ] `bash scripts/reviewer-result-pattern.sh` → 0 yangi FAIL
- [ ] `bash scripts/reviewer-array-safety.sh` → 0 yangi FAIL

### 6.4 DB-proof (migration APPROVED dan keyin)

- [ ] `warehouse_locations` jadval mavjud, `uq_wh_locations_locator` unique index ishlaydi
- [ ] `roll_cards` jadval mavjud, gramaj CHECK 79 qiymatida FAIL, 80 da PASS
- [ ] `movement_sequences` jadval mavjud
- [ ] `SELECT generate_wms_movement_number('ROLL_PAPER','KIRIM',2026)` → `HOM-KIRIM-2026-00001`
- [ ] Ikkinchi chaqiruv → `HOM-KIRIM-2026-00002`
- [ ] `warehouse_stock` da `owner_type` ustuni mavjud, default `US`
- [ ] `warehouse_types` da 7 ta qator, sort_order 1..7

### 6.5 Golden-thread regressiyasi yo'q

- [ ] `GET /api/wms/stock` — 200 qaytaradi (mavjud endpoint buzilmagan)
- [ ] `GET /api/wms/warehouses` — 200 qaytaradi
- [ ] `GET /api/pos/wh-features/...` — avvalgi holati saqlanadi
- [ ] `/warehouse/rolls` FE sahifasi yuklaydi (mavjud `/api/agents/inventory/rolls` buzilmagan)

---

## 7. SELF-VERIFY

### 7.1 Drizzle schema tekshiruvi

```bash
# BE tsc tekshiruv
cd Uzbek-Language-Module
pnpm --filter @europrint/api tsc --noEmit 2>&1 | tail -20
# → "0 errors" yoki eskirgan xatolar (P20 qo'shganlarga bog'liq yangi xato YO'Q)

# DB schema build
pnpm --filter @europrint/db build 2>&1 | tail -10
# → "Build succeeded" yoki "0 errors"
```

### 7.2 Yangi pgTable eksportlar mavjudmi?

```bash
grep -n "warehouseLocations\|rollCards\|movementSequences" \
  Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts
# → 4 ta eksport: pgTable ta'rif + insertSchema + type + type(Insert)
```

### 7.3 migration SQL sintaksis tekshiruvi (DB ga qo'llamasdan)

```bash
# PostgreSQL sintaksis tekshiruvi (psql --set ON_ERROR_STOP=1 -f ... --dry-run analog)
# Yoki psql dan BEGIN; ... ROLLBACK; bilan test:
psql -h localhost -U europrint -d europrint \
  -c "BEGIN; $(cat apps/api/src/shared/db/migrations/wms-p1-locator-roll-sequence.sql); ROLLBACK;"
# → "ROLLBACK" agar sintaksis to'g'ri bo'lsa (commit qilinmaydi)
```

### 7.4 owner_type default tekshiruvi (migration APPROVED dan keyin)

```bash
node apps/api/_audit/q.cjs \
  "SELECT column_name, column_default, is_nullable
   FROM information_schema.columns
   WHERE table_name='warehouse_stock' AND column_name='owner_type'"
# → column_default = 'US', is_nullable = 'YES'

# Mavjud qatorlar owner_type null holda qoladi — UPDATE kerak emas (default 'US')
# Yangi INSERT avtomatik 'US' oladi
```

### 7.5 Movement numbering funksiyasi testi (migration APPROVED dan keyin)

```bash
node apps/api/_audit/q.cjs \
  "SELECT generate_wms_movement_number('ROLL_PAPER','KIRIM',2026)"
# → { generate_wms_movement_number: 'HOM-KIRIM-2026-00001' }

node apps/api/_audit/q.cjs \
  "SELECT generate_wms_movement_number('FINISHED_GOODS','CHIQIM',2026)"
# → { generate_wms_movement_number: 'TMF-CHIQIM-2026-00001' }
```

### 7.6 7-tip seed tekshiruvi (migration APPROVED dan keyin)

```bash
node apps/api/_audit/q.cjs \
  "SELECT code, name_uz, needs_quarantine, sort_order
   FROM warehouse_types
   WHERE code IN ('ROLL_PAPER','FINISHED_GOODS','RAW_MATERIAL',
                  'HOUSEHOLD','EQUIPMENT','TOOLS','SCRAP_BRAK','DEPARTMENT')
   ORDER BY sort_order"
# → 8 qator, sort_order 1..8 (7 asosiy + DEPARTMENT generic tur)
```

### 7.7 Roll card CHECK constraint testi (migration APPROVED dan keyin)

```bash
# gramaj_gsm = 79 → REJECT (< 80)
node apps/api/_audit/q.cjs \
  "INSERT INTO roll_cards
   (unique_roll_id, warehouse_id, material_id, width_mm, diameter_mm,
    gramaj_gsm, initial_weight_kg, current_weight_kg, roll_type, received_date)
   VALUES ('TEST-CHK-001','<valid_wh_id>',1, 1000, 800, 79, 500, 500,
           'kraft', '2026-06-19')"
# → ERROR: new row violates check constraint "roll_cards_gramaj_chk"

# gramaj_gsm = 80 → PASS
node apps/api/_audit/q.cjs \
  "INSERT INTO roll_cards
   (unique_roll_id, warehouse_id, material_id, width_mm, diameter_mm,
    gramaj_gsm, initial_weight_kg, current_weight_kg, roll_type, received_date)
   VALUES ('TEST-CHK-001','<valid_wh_id>',1, 1000, 800, 80, 500, 500,
           'kraft', '2026-06-19')"
# → INSERT 0 1
# Keyin tozalab tashlang:
# DELETE FROM roll_cards WHERE unique_roll_id = 'TEST-CHK-001';
```

### 7.8 locator_code UNIQUE constraint testi (migration APPROVED dan keyin)

```bash
# Birinchi INSERT — muvaffaqiyatli
node apps/api/_audit/q.cjs \
  "INSERT INTO warehouse_locations
   (warehouse_id, zone_code, row_num, shelf_num, cell_num, locator_code)
   VALUES ('<valid_wh_id>','A',12,3,2,'A-12-3-2')"
# → INSERT 0 1

# Ikkinchi INSERT — bir xil locator → UNIQUE VIOLATION
node apps/api/_audit/q.cjs \
  "INSERT INTO warehouse_locations
   (warehouse_id, zone_code, row_num, shelf_num, cell_num, locator_code)
   VALUES ('<valid_wh_id>','A',12,3,2,'A-12-3-2')"
# → ERROR: duplicate key value violates unique constraint "uq_wh_locations_locator"
```

---

## 8. COMMIT

### 8.1 Aniq fayllar ro'yxati

```bash
git add Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts
git add Uzbek-Language-Module/apps/api/src/shared/db/migrations/wms-p1-locator-roll-sequence.sql
git add Uzbek-Language-Module/apps/api/src/shared/db/migrations/wms-p1-warehouse-types-seed.sql
```

**HECH QACHON:** `git add -A` yoki `git add .` — boshqa parallel agent fayllarini
buzadi.

### 8.2 Commit xabari formati

```
feat(wms): P20 Wave1 — warehouse_locations + roll_cards + movement_sequences DDL + 7-type seed

- wms-schema.ts: warehouseLocations pgTable (structured locator A-12-3-2, EP-WMS-073)
- wms-schema.ts: rollCards pgTable (gramaj/width/diameter/weight/FIFO, EP-WMS-014)
- wms-schema.ts: movementSequences pgTable (HOM-KIRIM-2026-00001 generator, OMBOR §13)
- wms-schema.ts: warehouseStock.ownerType col (davalcheskiy US/CLIENT_ID, EP-WMS-123)
- wms-p1-locator-roll-sequence.sql: GATED DDL (warehouse_locations+roll_cards+sequences+ALTER)
- wms-p1-warehouse-types-seed.sql: GATED seed (7 types: ROLL_PAPER..SCRAP_BRAK)
- generate_wms_movement_number() SQL function included in migration
ddlGate: APPROVED placeholder — egasi ruxsatidan keyin ishga tushiriladi

P20 Wave1 | dependsOn: P01 | BE tsc: 0 | DB-proof: gated (pending approval)
```

### 8.3 Keyin nima (bu agent bajarmaydi — faqat flag)

Quyidagi ishlar P20 scope TASHQARISIDA — egasi alohida agent bilan belgilaydi:

- `wms-catalog.controller.ts:99` `getDashboard()` hardcoded fix → P03 yoki alohida agent
- Roll card QR label printing endpoint (BE + ZPL/PDF) → alohida Wave 2+ agent
- `/api/wms/warehouse-locations` CRUD endpoint (BE) → alohida Wave 2+ agent
- `/api/wms/roll-cards` CRUD endpoint (BE + IoT scan) → alohida Wave 3 agent
- Auto empty-slot suggestion algoritm (service daraja) → alohida Wave 2+ agent
- `employee_debts` jadvali (kassir-linkage) → alohida agent (cross-module WMS+FIN+HR)
- `business.constants.ts` ga `ROLL_LENGTH_FORMULA_DIVISOR` qo'shish → birinchi foydalanuvchi agent
- `supplierId` FK `roll_cards` → mm-schema agent (cross-module)
- GSD accuracy KPI `owner_type` filtrlash → QC/HR agent

---

## 9. IZOLYATSIYA YAKUNIY TEKSHIRUV

Commit dan OLDIN quyidagi tekshiruvni bajaring:

```bash
# Faqat 3 ta fayl o'zgartirilganini tekshiring
git diff --name-only
# Natija shu 3 ta fayl BUNDAN BOSHQA narsa ko'rinmaydi:
# Uzbek-Language-Module/lib/db/src/schema/wms-schema.ts
# Uzbek-Language-Module/apps/api/src/shared/db/migrations/wms-p1-locator-roll-sequence.sql
# Uzbek-Language-Module/apps/api/src/shared/db/migrations/wms-p1-warehouse-types-seed.sql
```

Agar boshqa fayl ko'rinsa — tekshiring, qaytarib oling (`git checkout -- <boshqa-fayl>`),
keyin commit qiling.

---

## 10. HOLAT HISOBOTI SHABLONI (Q-38)

Har bosqich yakunida quyidagi formatda egaga xabar bering:

```
✅ P20 Wave1 — WMS Schema DDL

BAJARILDI:
- warehouseLocations pgTable: wms-schema.ts:??? qatorga qo'shildi
- rollCards pgTable: wms-schema.ts:??? qatorga qo'shildi (17 maydon, 6 CHECK)
- movementSequences pgTable: wms-schema.ts:??? qatorga qo'shildi
- warehouseStock.ownerType: wms-schema.ts:??? qatorga qo'shildi
- wms-p1-locator-roll-sequence.sql: ??? qator (GATED)
- wms-p1-warehouse-types-seed.sql: ??? qator (7 tip, idempotent)

GATED (egasi ruxsati kutilmoqda):
- "APPROVED: <egasi> <sana>" ni to'ldiring → men migration ishga tushiraman

TEKSHIRUV:
- BE tsc: 0 xato ✅
- DB-proof: gated (migration qo'llanmagan) ⏳
- Parallel agent brokenOrFake: FLAG QILINDI (controller:99, integration stubs) ⚠️

COMMIT: <hash> — P20 Wave1 DDL + gated migrations
```

---

*Oxirgi yangilanish: 2026-06-19. Bu direktiva Q-47 ga muvofiq ≥1000 qator.*
*Bajaruvchi: Muslimbek. Advisor: Claude. Egasi tasdiqi: KUTILMOQDA.*
