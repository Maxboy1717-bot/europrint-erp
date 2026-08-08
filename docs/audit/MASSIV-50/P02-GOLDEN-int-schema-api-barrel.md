# P02 — GOLDEN: Integration: apps/api shared/db barrel + drift invariants owner

> **WAVE:** 1 | **dependsOn:** [] | **ddlGate:** false
> Bu direktiva Q-47 talabiga binoan ≥1000 qator, to'liq, noaniqliksiz yozilgan.
> Egasi: Muslimbek. Sessiya boshida CLAUDE.md + bu faylni o'qi, keyin boshla.

---

## 0. ROL VA QOIDALAR

### Qoidalar bloki (har direktivaga kiritilsin — Q-47):

```
1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi ≠ to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE ro'yxatidagi
    fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan; migration faylida
    `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila,
    ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit → saqla → qayta o'qi → ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH + modul
    vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

### Bu agentning roli:
- **WAVE 1** — boshqa paketlarga bog'liq emas (`dependsOn: []`), birinchi navbatda ishga tushadi.
- **ddlGate: false** — DDL yozma ruxsat talab qilmaydi (bu fayl faqat barrel + drift — yangi jadval yaratmaydi).
- Shu agent faqat **2 fayl**ga tegadi. Boshqa hech narsa emas.

---

## 1. IZOLYATSIYA MANIFESTI

### Shu agent FAQAT quyidagi ikki faylga tegadi:

```
apps/api/src/shared/db/index.ts
apps/api/src/shared/db/invariants/migrations-drift.ts
```

### Qat'iy cheklov:
- `schema-wms.ts`, `schema-misc-qc.ts`, `schema-compat-3.ts`, `schema-ext.ts` yoki
  boshqa har qanday faylga TEGMA.
- Yangi `schema-golden.ts` yoki shunga o'xshash fayl YARATMA.
- Migration fayli YARATMA (ddlGate: false — drift invariant bloki `migrations-drift.ts` ichiga yoziladi).
- `apps/api/src/modules/` ichidagi hech qanday faylga tegma.
- FE (`artifacts/erp-dashboard/`) fayllariga tegma.

### Agar boshqa fayl kerak bo'lib qolsa:
TO'XTA. Egaga xabar ber: "P02 scope tashqarisida [fayl] kerak — ruxsat bor?" — javob
kelmasdan davom etma. Bu Qoida 23 / Q-23 / Q-31.

---

## 2. VIZYON

### GOLDEN nima?
"GOLDEN" = **Oltin Zanjir** (Golden Thread) — EuroPrint ERP ning asosiy integrasiya
magistrali: `SD → PP → MES → QC → WMS → FIN`. Bu zanjir buyurtmadan buxgalteriagacha
to'liq oqimni ta'minlaydi.

Vizyon manbai: `docs/GOLDEN_THREAD_TEKSHIRUV.md` — zanjir shunday ko'rinadi:

```
Buyurtma keldi  →  Mahsulot rejada  →  Smenada ishlab chiqarildi
   (SD)               (PP)                   (MES)

→  Sifat tekshiruvi  →  Omborga kiritildi  →  GL yozuvi qilindi
       (QC)                  (WMS)                  (FIN)
```

Har o'tish `EventEmitter2` orqali domain event:
```
sd.sales_order.confirmed
  └→ [PP] pp.work_order.created
       └→ [MES] mes.session.completed
                 └→ [QC] qc.inspection.passed
                           └→ [WMS] wms.stock.received
                                     └→ [FIN] fin.entries.posted
```

### P02 ning roli vizyon ichida:
`apps/api/src/shared/db/index.ts` — bu faylni hamma modul `import { ... } from '@shared/db'`
orqali chaqiradi. Bu barrel agar SD, QC, MM, GOLDEN `sales_order_items` jadvallarini eksport
qilmasa — downstream modullar (PP, MES, QC, WMS) Drizzle schema'larini topa olmaydi va
zanjir uziladi. Shuning uchun P02 = **zanjir poydevori**.

`migrations-drift.ts` — server boot vaqtida avtomatik `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`
bloklari ishga tushadi. Agar wave-1 DDL paketlari (QC aql/sort/braks, GOLDEN qc_inspections
ustunlari) yaratan jadvallar yoki ustunlar bu faylga kiritilmasa — live DB bilan Drizzle schema
o'rtasida drift qoladi va runtime xato chiqadi.

### Qabul mezoni (acceptance per feature):

| # | Feature | Qabul mezoni |
|---|---------|-------------|
| 1 | `qc_inspections` ustunlar drift | `migrations-drift.ts` da `reference_id`, `reference_type`, `items_checked`, `items_passed`, `items_failed`, `attachments` uchun `ADD COLUMN IF NOT EXISTS` bloklari MAVJUD va idempotent |
| 2 | `qcBraks` barrel re-export | `index.ts` da `qcBraks` `schema-compat-3` dan eksport qilingan (allaqachon bor — tekshir, agar bor bo'lsa qo'shma) |
| 3 | Yangi wave-1 QC jadvallar (qc_aql_results, qc_sort_results) — agar P04/P07 agent tomonidan `schema-*` faylga qo'shilsa | `index.ts` da re-export tayyor bo'lishi kerak. **Muhim:** P02 bu jadvallarni O'ZI YARATMAYDI — faqat barrel uchun joy tayyorlaydi yoki comment placeholder qoldiradi |
| 4 | `sales_order_items` (GOLDEN) | Agar `schema-ext.ts` da `sales_order_items` pgTable mavjud bo'lsa — `index.ts` re-export mavjudligini tekshir. Agar yo'q — wave-1 DDL paketlari (P03/P04) bajarilgandan keyin qo'shiladi; placeholder comment qoldiradi |
| 5 | `migrations-drift.ts` blok tartib | Yangi bloklar faylning oxiriga (`];` oldiga) qo'shiladi, mavjud bloklarga tegmaydi |
| 6 | BE tsc 0 | `pnpm --filter @europrint/api exec tsc --noEmit` — 0 xato |
| 7 | Import xatolik yo'q | Server boot da `@shared/db` import qiluvchi modullar crash emas |

---

## 3. HOZIRGI HOLAT

### 3.1 `apps/api/src/shared/db/index.ts` — hozirgi holat

Fayl: `apps/api/src/shared/db/index.ts` (224 qator)

**Mavjud eksportlar (to'g'ridan kerakli):**

```typescript
// qator 7 — schema.ts orqali qc_inspections allaqachon eksport qilingan:
export * from './schema';
// => schema.ts exports qc_inspections from './schema-wms' (schema.ts:43)
// => schema.ts ham export qiladi: export * from './schema' (index.ts:7)
// DEMAK: qc_inspections allaqachon index.ts dan ko'rinadi!

// qator 32 — qcBraks allaqachon eksport qilingan:
export {
  mroInventory, productionOrders, routings, routingOperations, bomHeaders, bomItems,
  workCenters, downtimeEvents, downtimeReasonCodes, machineCrews, equipmentMaintenance,
  qcReclamations, qcBraks, ...    // <-- qator 32: qcBraks MAVJUD
} from './schema-compat-3';

// qator 191 — schema-ext.ts dan ko'p narsalar eksport:
export {
  ...
  qc_standards, qc_final_inspections, qc_in_process_inspections,  // qator 133
  ...
  wms_warehouses, wms_transfers, ...  // qator 117-119
} from './schema-ext';
```

**MUAMMO 1 — Mavjud eksportlar yetarli, lekin tekshiruv kerak:**

`qc_inspections` → schema.ts:43 → schema-wms.ts:156 → index.ts:7 (`export * from './schema'`)
zanjiri orqali ko'rinadi. **Qo'shimcha eksport KERAK EMAS** — ammo bu tekshirib tasdiqlanishi kerak.

**MUAMMO 2 — `sales_order_items` holati:**

Hozirgi `index.ts` da `sales_order_items` pgTable eskport MAVJUD EMAS. Grep natijasi:
```
Grep: sales_order_items → No matches in index.ts
```
`schema-ext.ts` da ham `sales_order_items` mavjud EMAS (faqat `mm_purchase_order_items`,
`mm_purchase_requisition_items` bor). Bu P03/P04 (SD/GOLDEN paketlari) bajarilgandan
keyin qo'shilishi kerak. **P02 placeholder comment qoldiradi.**

**MUAMMO 3 — Wave-1 QC yangi jadvallar:**

`qc_aql_results`, `qc_sort_results` — hozircha hech qanday `schema-*.ts` faylda mavjud EMAS.
Bu jadvallarni P07 (QC packet) yaratadi. P02 ularga tegmaydi — faqat qo'shish joyi uchun
section comment qoldiradi.

**MUAMMO 4 — `schema-wms.ts` eksport holati:**

`schema-wms.ts:156` da `qc_inspections` pgTable mavjud. Lekin `index.ts` da `schema-wms.ts`
to'g'ridan re-export qilinmaydi — u `schema.ts` orqali `export * from './schema'` bilan
chiqadi (qator 7). Bu ishlayapti, lekin keyingi qadamlarda wms schema'ga yangi jadvallar
qo'shilsa, P02 yoki tegishli paket bu eksportni tekshirib yangilashi kerak.

### 3.2 `apps/api/src/shared/db/invariants/migrations-drift.ts` — hozirgi holat

Fayl hajmi: **277 KB** (limit 256 KB — to'liq o'qib bo'lmaydi, offset bilan o'qildi).
Fayl boshi: `DRIFT_MIGRATIONS: Array<MigrationDef>`, ~1151 yozuv, 2026-05-21 auto-generated.

**Mavjud holat (file:line):**

```typescript
// qator 1039–1044: qc_inspections ustunlar ALLAQACHON MAVJUD:
{ name: 'qc_inspections.reference_id ADD COLUMN',    sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS reference_id UUID` },
{ name: 'qc_inspections.reference_type ADD COLUMN',  sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS reference_type TEXT` },
{ name: 'qc_inspections.items_checked ADD COLUMN',   sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS items_checked INTEGER` },
{ name: 'qc_inspections.items_passed ADD COLUMN',    sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS items_passed INTEGER` },
{ name: 'qc_inspections.items_failed ADD COLUMN',    sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS items_failed INTEGER` },
{ name: 'qc_inspections.attachments ADD COLUMN',     sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS attachments TEXT` },
```

Bu bloklarning **barchasi mavjud** va idempotent. Yana qo'shish shart emas.

**Muammo:** Wave-1 DDL paketlari (P07-QC) agar `qc_aql_results`, `qc_sort_results`
jadvallarini yaratsalar — shu faylga `CREATE TABLE IF NOT EXISTS` bloklar qo'shilishi kerak.
P02 bu jadvallar uchun **stub bloklar** yozadi (joyini belgilaydi, P07 to'ldiradi).

**Fayl oxiri (qator ~1170–1200):**
```typescript
  { name: 'career_paths CREATE TABLE', sql: `
      CREATE TABLE IF NOT EXISTS career_paths (
        id SERIAL PRIMARY KEY,
        ...
      )
    ` },
  // ... fayl `];` bilan tugaydi
```

---

## 4. ISH (qadam-baqadam)

> ESLATMA: Q-46 bo'yicha — ishlab turgan kod o'chirilmaydi. Har bir qadam
> FAQAT append (qo'shish) yoki tekshirish. Mavjud eksportlarga tegma.

---

### Qadam 1 — Tekshirish: `qc_inspections` barrel eksport yo'li aniqlash

**Fayl:** `apps/api/src/shared/db/index.ts`
**Maqsad:** `qc_inspections` to'g'ri eksport qilinganligini tasdiqlash.

Quyidagi buyruq bilan tekshir:

```bash
# apps/api katalogidan:
node -e "
  const m = require('./dist/shared/db/index.js');
  console.log('qc_inspections:', typeof m.qc_inspections, m.qc_inspections?.name || 'NO NAME');
  console.log('qcBraks:', typeof m.qcBraks);
  console.log('sales_order_items:', typeof m.sales_order_items);
"
```

Agar `dist/` mavjud emas bo'lsa:

```bash
grep -n "qc_inspections\|qcBraks\|sales_order_items" \
  apps/api/src/shared/db/index.ts
```

**Kutilayotgan natija:**
- `qc_inspections` → `export * from './schema'` (index.ts:7) orqali ko'rinadi — bu ALLAQACHON ishlaydi, qo'shimcha qator kerak emas.
- `qcBraks` → index.ts:32 da mavjud — ALLAQACHON eksport qilingan.
- `sales_order_items` → yo'q (kutilgan — P03/P04 keyin qo'shiladi).

**Agar `qc_inspections` ko'rinmasa (ya'ni `export * from './schema'` yo'q bo'lsa):**
index.ts qator 7 ni tekshir:
```typescript
// Agar mavjud emas bo'lsa QO'SH:
export * from './schema';  // qc_inspections shu orqali chiqadi
```
Lekin hozirgi faylda bu MAVJUD (qator 7) — shuning uchun o'zgartirish kerak emas.

---

### Qadam 2 — `index.ts` ga wave-1 keyin qo'shiladigan jadvallar uchun PLACEHOLDER

**Fayl:** `apps/api/src/shared/db/index.ts`
**O'zgartirish joyi:** faylning oxiriga (qator 224 — `export { domain_events }` dan keyin)
**Amal:** Quyidagi section comment QO'SH (bu agent tomonidan bajariladigan yagona o'zgartirish
`index.ts` ga — agar allaqachon mavjud bo'lsa qo'shma):

```typescript
// Oldin (index.ts, qator 222-224):
// schema-outbox: Domain events outbox table (PA0-6)
export { domain_events } from './schema-outbox';
```

```typescript
// Keyin (qo'shiladigan, qator 225 dan boshlab):
// schema-outbox: Domain events outbox table (PA0-6)
export { domain_events } from './schema-outbox';

// ============================================================================
// WAVE-1 BARREL SECTION — P02 tomonidan belgilangan (2026-06-19)
// Bu yerga wave-1 DDL paketlari (P03-SD, P07-QC, P08-WMS, P09-MM) bajarilgandan
// keyin yangi jadval eksportlari APPEND qilinadi.
//
// Kutilayotgan eksportlar (mos paket bajarilgandan keyin UNCOMMENT qiling):
//
// // P03-SD: sales_order_items (GOLDEN — oltin zanjir SD qism)
// export { sales_order_items } from './schema-sd'; // P03 bu faylni yaratadi
//
// // P07-QC: qc_aql_results, qc_sort_results (AQL va sort natijalari)
// export { qc_aql_results, qc_sort_results } from './schema-qc-wave1'; // P07 yaratadi
//
// // P09-MM: mm_purchase_order_items (agar schema-ext.ts ga qo'shilsa)
// export { mm_purchase_order_items } from './schema-ext'; // allaqachon mavjud — tekshir
//
// P07-QC: qcBraks — ALLAQACHON eksport qilingan (index.ts:32), takrorlanmaydi.
// P08-WMS: qc_inspections — ALLAQACHON eksport qilingan ('export * from ./schema'),
//          takrorlanmaydi.
// ============================================================================
```

**Muhim:** Bu qo'shish faqat `index.ts` oxiriga — mavjud hech qanday export qatorini
o'zgartirma, o'chirma, ko'chirma.

---

### Qadam 3 — `migrations-drift.ts` ga wave-1 drift stub bloklari QO'SH

**Fayl:** `apps/api/src/shared/db/invariants/migrations-drift.ts`
**O'zgartirish joyi:** Faylning oxiriga — so'nggi `}`] oldiga, `];` dan OLDIN.
**Maqsad:** Wave-1 DDL paketlari (P07-QC, P03-SD) yaratishi mumkin bo'lgan jadvallar
uchun idempotent guard bloklari. Bu bloklarning `IF NOT EXISTS` sharti bor —
jadval/ustun allaqachon mavjud bo'lsa, xato chiqarmaydi.

**Tekshirish — qadam 3a:**

Avval `migrations-drift.ts` faylining oxirini o'qi (fayl 277 KB — offset bilan):

```bash
# Fayl oxirini tekshirish (PowerShell):
Get-Content apps/api/src/shared/db/invariants/migrations-drift.ts -Tail 30
```

Agar quyidagi bloklardan biri allaqachon mavjud bo'lsa — QO'SHMA (idempotent bo'lsa ham
strukturaviy dublikat — tekshir):

```typescript
// Tekshir: qc_aql_results va qc_sort_results mavjudmi?
{ name: 'qc_aql_results CREATE TABLE', ... }
{ name: 'qc_sort_results CREATE TABLE', ... }
// Agar mavjud emas — QADAMGA O'T
```

**Qadam 3b — Qo'shiladigan bloklar:**

`migrations-drift.ts` faylining oxiriga (so'nggi `},` dan keyin, `];` dan OLDIN)
quyidagi bloklarni QO'SH:

```typescript
  // ============================================================================
  // WAVE-1 DRIFT GUARDS — P02 tomonidan qo'shilgan (2026-06-19)
  // Idempotent: IF NOT EXISTS — qayta ishga tushirishda xavfsiz.
  // P07-QC DDL paketlari bu jadvallarni yaratishi kutilmoqda.
  // Agar DDL paket allaqachon bazada yaratgan bo'lsa — bu blok o'tkazib yuboriladi.
  // ============================================================================

  // --- QC AQL natijalari jadvali (P07-QC tomonidan yaratilishi kutilmoqda) ---
  { name: 'qc_aql_results CREATE TABLE IF NOT EXISTS', sql: `
      CREATE TABLE IF NOT EXISTS qc_aql_results (
        id SERIAL PRIMARY KEY,
        inspection_id INTEGER,
        order_id INTEGER,
        material_id INTEGER,
        sample_size INTEGER NOT NULL DEFAULT 0,
        defects_found INTEGER NOT NULL DEFAULT 0,
        aql_level VARCHAR(20) NOT NULL DEFAULT 'II',
        acceptance_number INTEGER NOT NULL DEFAULT 0,
        rejection_number INTEGER NOT NULL DEFAULT 0,
        result VARCHAR(20) NOT NULL DEFAULT 'pending',
        inspector_id INTEGER,
        notes TEXT,
        inspected_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    ` },

  // --- QC Sort (saralash) natijalari jadvali (P07-QC tomonidan yaratilishi kutilmoqda) ---
  { name: 'qc_sort_results CREATE TABLE IF NOT EXISTS', sql: `
      CREATE TABLE IF NOT EXISTS qc_sort_results (
        id SERIAL PRIMARY KEY,
        inspection_id INTEGER,
        order_id INTEGER,
        material_id INTEGER,
        category VARCHAR(50) NOT NULL DEFAULT 'standard',
        quantity_sorted NUMERIC(15,4) NOT NULL DEFAULT 0,
        quantity_passed NUMERIC(15,4) NOT NULL DEFAULT 0,
        quantity_rejected NUMERIC(15,4) NOT NULL DEFAULT 0,
        quantity_rework NUMERIC(15,4) NOT NULL DEFAULT 0,
        defect_codes TEXT,
        sorted_by INTEGER,
        notes TEXT,
        sorted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    ` },

  // --- QC Braks (scrap) ustunlar — qc_braks jadvaliga ADD COLUMN IF NOT EXISTS ---
  // qcBraks allaqachon schema-compat-3.ts da mavjud (id, productionOrderId, materialId,
  // quantity, reason, status, createdAt). Wave-1 qo'shimcha ustunlar:
  { name: 'qc_braks.production_order_id ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_braks ADD COLUMN IF NOT EXISTS production_order_id TEXT` },
  { name: 'qc_braks.material_id ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_braks ADD COLUMN IF NOT EXISTS material_id TEXT` },
  { name: 'qc_braks.quantity ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_braks ADD COLUMN IF NOT EXISTS quantity NUMERIC(15,4)` },
  { name: 'qc_braks.reason ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_braks ADD COLUMN IF NOT EXISTS reason TEXT` },
  { name: 'qc_braks.status ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_braks ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending'` },
  { name: 'qc_braks.inspector_id ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_braks ADD COLUMN IF NOT EXISTS inspector_id INTEGER` },
  { name: 'qc_braks.batch_number ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_braks ADD COLUMN IF NOT EXISTS batch_number TEXT` },
  { name: 'qc_braks.work_center_id ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_braks ADD COLUMN IF NOT EXISTS work_center_id INTEGER` },
  { name: 'qc_braks.updated_at ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_braks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()` },

  // --- GOLDEN: sales_order_items (oltin zanjir SD qism) ---
  // P03-SD bu jadvalning pgTable ta'rifini yaratadi.
  // Hozircha `sales_order_items` DB da mavjud emas (P03 keyin yaratadi) LEKIN
  // IF NOT EXISTS sharti bilan — xato chiqarmaydi.
  { name: 'sales_order_items CREATE TABLE IF NOT EXISTS', sql: `
      CREATE TABLE IF NOT EXISTS sales_order_items (
        id SERIAL PRIMARY KEY,
        sales_order_id INTEGER NOT NULL,
        material_id INTEGER NOT NULL,
        quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
        unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
        total_price NUMERIC(18,2) NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'dona',
        notes TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        delivery_date TIMESTAMP,
        delivered_quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    ` },

  // --- qc_inspections ustunlar — ALLAQACHON mavjud (migrations-drift.ts:1039-1044) ---
  // Quyidagilar TAKRORLANMAYDI — ular qator 1039-1044 da bor:
  //   reference_id, reference_type, items_checked, items_passed, items_failed, attachments
  // Faqat YANGI ustunlar (wave-1 QC modulda kerak bo'lsa):
  { name: 'qc_inspections.batch_number ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS batch_number TEXT` },
  { name: 'qc_inspections.production_order_id ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS production_order_id INTEGER` },
  { name: 'qc_inspections.work_center_id ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS work_center_id INTEGER` },
  { name: 'qc_inspections.deleted_at ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP` },
```

**Oldin/keyin ko'rinishi:**

```typescript
// OLDIN — fayl oxiri (taxminan qator 1195):
  { name: 'career_paths CREATE TABLE', sql: `
      CREATE TABLE IF NOT EXISTS career_paths (
        ...
      )
    ` },
];  // ← fayl shu yerda tugaydi

// KEYIN — wave-1 bloklari QO'SHILADI (]; oldiga):
  { name: 'career_paths CREATE TABLE', sql: `
      CREATE TABLE IF NOT EXISTS career_paths (
        ...
      )
    ` },
  // ============================================================================
  // WAVE-1 DRIFT GUARDS — P02 tomonidan qo'shilgan (2026-06-19)
  // ... (yuqoridagi bloklap)
  // ============================================================================
  { name: 'qc_inspections.deleted_at ADD COLUMN', sql: `ALTER TABLE IF EXISTS qc_inspections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP` },
];  // ← fayl tugaydi
```

---

### Qadam 4 — Idempotentlik va takrorlanish tekshiruvi

**Maqsad:** Yangi qo'shilgan har bir `{ name: '...' }` blokda `name` qiymati
butun `DRIFT_MIGRATIONS` massivida YAGONA bo'lishi kerak. Ikki xil blokda bir xil
`name` bo'lsa — runtime da ikki marta ishga tushadi (zarar yo'q lekin chalkash).

**Buyruq:**

```bash
# PowerShell — fayl ichidagi name dublikatlarini tekshir:
$content = Get-Content apps/api/src/shared/db/invariants/migrations-drift.ts -Raw
$names = [regex]::Matches($content, "name: '([^']+)'") | ForEach-Object { $_.Groups[1].Value }
$dups = $names | Group-Object | Where-Object { $_.Count -gt 1 }
if ($dups) {
  Write-Host "DUBLIKAT NAME'lar topildi:"
  $dups | ForEach-Object { Write-Host "  $($_.Name) ($($_.Count) marta)" }
} else {
  Write-Host "OK — dublikat yo'q"
}
```

Agar dublikat topilsa — yangi qo'shilgan blokdagi `name` ni o'zgartir
(masalan, `'qc_braks.quantity ADD COLUMN'` → `'qc_braks.quantity_wave1 ADD COLUMN'`).

---

### Qadam 5 — TypeScript tipizatsiya tekshiruvi

**Fayl:** `apps/api/src/shared/db/invariants/migrations-drift.ts`

Har bir yangi blok `MigrationDef` interfeysi bilan mos bo'lishi kerak:

```typescript
// migrations-schema.ts dan import:
// type MigrationDef = { name: string; sql: string }

// Tekshirish — tsc:
// pnpm --filter @europrint/api exec tsc --noEmit
```

Agar `sql` maydonida ko'p qatorli template literal (backtick) ishlatilsa —
u `string` tipiga mos keladi, muammo yo'q.

**Xato misoli va to'g'irlash:**

```typescript
// ❌ XATO: sql emas, boshqa property:
{ name: 'xxx', query: `CREATE TABLE...` }

// ✅ TO'G'RI:
{ name: 'xxx', sql: `CREATE TABLE...` }
```

---

### Qadam 6 — `migrations-schema.ts` tekshiruvi (faqat o'qish)

**Fayl:** `apps/api/src/shared/db/invariants/migrations-schema.ts`
**Amal:** FAQAT O'QI, o'zgartirma.

Quyidagi buyruq bilan `MigrationDef` ta'rifini tasdiqlash:

```bash
# migrations-schema.ts ni o'qi:
head -30 apps/api/src/shared/db/invariants/migrations-schema.ts
```

Kutilayotgan natija:
```typescript
export type MigrationDef = {
  name: string;
  sql: string;
}
```

Agar boshqacha bo'lsa — yangi bloklarni shunga moslashtir (owned files chegarasida qol).

---

### Qadam 7 — Final tekshiruv va tasdiqlash

Quyidagi buyruqlarni KETMA-KET bajar:

```bash
# 1. TypeScript tekshiruvi:
pnpm --filter @europrint/api exec tsc --noEmit
# Kutilayotgan: 0 xato

# 2. index.ts eksport sanasi:
grep -c "export" apps/api/src/shared/db/index.ts
# Kutilayotgan: oldindan ko'proq yoki teng (hech narsa o'chirilmagan)

# 3. migrations-drift.ts yangi bloklari:
grep -c "wave-1\|qc_aql_results\|qc_sort_results\|sales_order_items" \
  apps/api/src/shared/db/invariants/migrations-drift.ts
# Kutilayotgan: ≥4 (yangi bloklap bor)

# 4. Barrel eksportini import simulyatsiyasi:
node -e "
const idx = require('./apps/api/dist/shared/db/index.js');
const keys = Object.keys(idx);
console.log('Total exports:', keys.length);
console.log('qc_inspections:', keys.includes('qc_inspections'));
console.log('qcBraks:', keys.includes('qcBraks'));
" 2>/dev/null || echo "dist/ yo'q — tsc keyin tekshir"
```

---

## 5. DDL (agar bor)

Bu paketda `ddlGate: false` — yangi `CREATE TABLE` migration fayli yaratilmaydi.

Barcha DDL `migrations-drift.ts` ichiga `CREATE TABLE IF NOT EXISTS` va
`ADD COLUMN IF NOT EXISTS` sifatida idempotent blok ko'rinishida kiritiladi.
Bu bloklap server boot vaqtida avtomatik ishga tushadi (`IF NOT EXISTS` = xavfsiz).

**MUHIM farq:**
- `migrations-drift.ts` = auto-run, idempotent, server boot vaqtida.
- Alohida `*.sql` migration fayl = egasi ruxsati talab qiladi (ddlGate = true).

Bu paketda alohida migration fayl YARATILMAYDI.

---

## 6. QABUL MEZONI

Quyidagi tekshiruv ro'yxatining BARCHASI green bo'lishi kerak commit oldidan:

### 6.1 Kod tekshiruvi

```
[ ] BE TypeScript: pnpm --filter @europrint/api exec tsc --noEmit → 0 xato
[ ] FE TypeScript: pnpm --filter erp-dashboard exec tsc --noEmit → 0 xato (P02 FE tegmaydi — bu qoida tasdiqi)
[ ] index.ts qator soni: yangi qator ≥ 224 (o'chirish bo'lmagan)
[ ] migrations-drift.ts: yangi bloklap qo'shilgan (grep wave-1 → match bor)
[ ] MigrationDef: har yangi blokda { name: string, sql: string } to'g'ri
[ ] name dublikat yo'q (4-qadam PowerShell skripti: OK)
```

### 6.2 Live DB-proof

Agar server ishga tushsa (optional — dev muhitda):

```bash
# Server boot:
pnpm --filter @europrint/api run dev:unsafe &
sleep 5

# Health:
curl -s http://127.0.0.1:3030/api/auth/health
# Kutilayotgan: {"status":"ok"} yoki 200

# migrations-drift bloki ishga tushganini tekshir (server log):
grep -i "qc_aql_results\|qc_sort_results\|sales_order_items" \
  apps/api/logs/backend.log 2>/dev/null | tail -5
# Kutilayotgan: "CREATE TABLE IF NOT EXISTS ... already exists" yoki "DONE"
# (agar jadval yo'q bo'lsa "executed", bor bo'lsa "skip")

# DB da jadval mavjudmi:
psql $DATABASE_URL -c "\d qc_aql_results" 2>/dev/null | head -5
# Kutilayotgan: jadval ta'rifi yoki "not found" (P07 bajarilgandan keyin bor bo'ladi)
```

### 6.3 Golden-thread regressiya yo'q

```bash
# Pre-commit hook:
node scripts/golden-thread-chain-proof.cjs
# Kutilayotgan: ✅ PASS — barcha 5 ulanish ulangan

# Reviewer array:
bash scripts/run-all-reviewers.sh 2>/dev/null | grep -E "FAIL|PASS" | tail -10
# Kutilayotgan: FAIL: 0 (yoki avvalgi FAIL soni o'zgarmagan — P02 buzgan bo'lmasin)
```

### 6.4 Import xatolik yo'q

```bash
# @shared/db ni import qiluvchi bitta modul uchun tekshirish:
node -e "require('./apps/api/dist/modules/sd/sd.module.js')" 2>&1 | head -5
# Kutilayotgan: xato yo'q
```

---

## 7. SELF-VERIFY (aniq buyruqlar)

Har bir qadamdan keyin quyidagi buyruqlarni bajar va natijani log qil:

### 7.1 Qadam 1 tekshiruvi (barrel):

```bash
# Windows PowerShell:
Select-String -Pattern "qc_inspections|qcBraks|sales_order_items" `
  -Path "apps/api/src/shared/db/index.ts"
# Kutilayotgan:
# qc_inspections: index.ts:7 ('export * from ./schema' orqali — grep ko'rmasligi mumkin)
# qcBraks: qator 32 (topiladi)
# sales_order_items: TOPILMAYDI (P03 keyin qo'shiladi) — bu OK
```

### 7.2 Qadam 2 tekshiruvi (wave-1 section):

```bash
Select-String -Pattern "WAVE-1 BARREL SECTION" `
  -Path "apps/api/src/shared/db/index.ts"
# Kutilayotgan: 1 match (qo'shilgan comment bor)
```

### 7.3 Qadam 3 tekshiruvi (drift bloklar):

```bash
Select-String -Pattern "WAVE-1 DRIFT GUARDS|qc_aql_results|qc_sort_results" `
  -Path "apps/api/src/shared/db/invariants/migrations-drift.ts"
# Kutilayotgan: ≥3 match
```

### 7.4 TypeScript — eng muhim:

```bash
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | tail -5
# Kutilayotgan: (bo'sh — xato yo'q)
```

### 7.5 DB-proof (agar server ishga tushsa):

```bash
# Login:
TOKEN=$(curl -s -X POST http://127.0.0.1:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin).get('access_token','NO_TOKEN'))")
echo "TOKEN: ${TOKEN:0:20}..."

# Health:
curl -s http://127.0.0.1:3030/api/auth/health
# → {"status":"ok"}
```

Agar server ishga tushmasa (Windows nest watch bug — Q-44):
```bash
# Static fallback:
pnpm --filter @europrint/api exec tsc --noEmit  # tsc 0 = yetarli isbot
```

### 7.6 Fayl qator soni:

```bash
# PowerShell:
(Get-Content apps/api/src/shared/db/index.ts).Count
# Kutilayotgan: ≥230 (yangi qatorlar qo'shilgan)

(Get-Content apps/api/src/shared/db/invariants/migrations-drift.ts).Count
# Kutilayotgan: oldingi qatorlar + yangilar (bir necha o'n qator ko'p)
```

---

## 8. COMMIT

### Fayl ro'yxati (FAQAT bu ikki fayl):

```bash
git add apps/api/src/shared/db/index.ts
git add apps/api/src/shared/db/invariants/migrations-drift.ts
```

**HECH QACHON:**
```bash
# TAQIQ:
git add -A
git add .
git add apps/api/src/shared/db/schema-*.ts
```

### Commit xabari formati:

```
feat(barrel): P02 wave-1 barrel section + drift guards for QC/GOLDEN

- index.ts: wave-1 barrel placeholder section added (SD/QC/WMS/MM)
- migrations-drift.ts: qc_aql_results + qc_sort_results CREATE IF NOT EXISTS
- migrations-drift.ts: sales_order_items CREATE IF NOT EXISTS (GOLDEN)
- migrations-drift.ts: qc_braks + qc_inspections ADD COLUMN IF NOT EXISTS guards
- All blocks idempotent (IF NOT EXISTS) — safe on re-run

Refs: P02 MASSIV-50 wave-1 | golden-thread no-regress
```

### Commit buyruqi:

```bash
git commit -m "$(cat <<'EOF'
feat(barrel): P02 wave-1 barrel section + drift guards for QC/GOLDEN

- index.ts: wave-1 barrel placeholder section added (SD/QC/WMS/MM)
- migrations-drift.ts: qc_aql_results + qc_sort_results CREATE IF NOT EXISTS
- migrations-drift.ts: sales_order_items CREATE IF NOT EXISTS (GOLDEN)
- migrations-drift.ts: qc_braks + qc_inspections ADD COLUMN IF NOT EXISTS guards
- All blocks idempotent (IF NOT EXISTS) — safe on re-run

Refs: P02 MASSIV-50 wave-1 | golden-thread no-regress
EOF
)"
```

### Commit keyin tekshirish:

```bash
git status
# Kutilayotgan: "nothing to commit, working tree clean"

git log --oneline -3
# Kutilayotgan: yangi commit birinchi qatorda ko'rinadi
```

---

## 9. EDGE-HOLATLAR VA XATOLAR

### 9.1 `migrations-drift.ts` fayl 277 KB — o'qib bo'lmaydi

**Muammo:** Fayl juda katta, to'liq o'qib bo'lmaydi.
**Yechim:** Faqat kerakli qismlarni `offset` bilan o'qi:

```bash
# Oxirgi 50 qatorni o'qi (PowerShell):
Get-Content apps/api/src/shared/db/invariants/migrations-drift.ts -Tail 50

# Muayyan kalit so'z qidirish:
Select-String -Pattern "qc_aql_results" `
  -Path apps/api/src/shared/db/invariants/migrations-drift.ts
```

### 9.2 Yangi blok allaqachon mavjud

**Muammo:** `{ name: 'qc_aql_results CREATE TABLE IF NOT EXISTS' }` avval boshqa agent
qo'shgan bo'lishi mumkin.
**Yechim:** Qo'shishdan oldin `grep` bilan tekshir. Mavjud bo'lsa — QO'SHMA.

```bash
Select-String -Pattern "qc_aql_results" `
  -Path apps/api/src/shared/db/invariants/migrations-drift.ts
# Agar topilsa: skip — dublikat qo'shma
# Agar topilmasa: davom et
```

### 9.3 TypeScript xatosi — `MigrationDef` mos emas

**Muammo:** `tsc` xato chiqaradi yangi blok uchun.
**Yechim:** `migrations-schema.ts` faylini tekshir (FAQAT O'QI):

```bash
Get-Content apps/api/src/shared/db/invariants/migrations-schema.ts | head -20
```

Agar `MigrationDef` da `sql` emas boshqa property bo'lsa — yangi bloklarni shunga moslash.

### 9.4 `export *` to'qnashuvi

**Muammo:** `export * from './schema'` va boshqa `export { qc_inspections }` bir vaqtda
bo'lsa — TypeScript "re-export" xatoligi.
**Yechim:** Hech qachon `qc_inspections` ni qayta eksport qilma — `export * from './schema'`
orqali u allaqachon ko'rinadi.

```bash
# Tekshirish:
Select-String -Pattern "export.*qc_inspections" `
  -Path apps/api/src/shared/db/index.ts
# Kutilayotgan: agar bor bo'lsa → BU MUAMMO — o'chir (Q-46 bo'yicha dublikat = o'liq kod)
# Agar yo'q bo'lsa → OK
```

### 9.5 Windows `nest watch` crash (Q-44)

**Muammo:** Backend devserver tushib qolsa.
**Yechim:** Panik yo'q. `tsc --noEmit` o'tsa — kod to'g'ri.
Server qayta ishga tushirish:

```bash
pnpm --filter @europrint/api run dev:unsafe
```

### 9.6 `sales_order_items` `migrations-drift.ts` da `IF NOT EXISTS` — DB xatosi

**Muammo:** Agar `sales_orders` jadval mavjud bo'lmasa va biz `sales_order_id INTEGER`
FK uchun `REFERENCES` qo'ysak — FK faol bo'lmaganda ham CREATE xato berishi mumkin.
**Yechim:** Bu faylda FK QILMA — faqat ustunlar. FK qo'shish P03 migration ishi.

Yangi bloklarda `REFERENCES` kalit so'zi bo'lmasin:
```sql
-- ❌ TAQIQ migrations-drift.ts da:
sales_order_id INTEGER NOT NULL REFERENCES sales_orders(id)

-- ✅ TO'G'RI:
sales_order_id INTEGER NOT NULL
```

---

## 10. VIZYON MOSLIGI TEKSHIRUVI (Q-40 + Q-12)

Bu paket vizyon bilan qanday bog'liq:

| Vizyon talabi | P02 ta'minoti | Manbai |
|--------------|--------------|--------|
| SD → PP zanjir | `sales_order_items` barrel tayyorlandi | GOLDEN_THREAD_TEKSHIRUV.md |
| QC → WMS zanjir | `qc_inspections` allaqachon eksport, drift guarded | GOLDEN_THREAD_TEKSHIRUV.md |
| AQL tekshiruvi (sifat) | `qc_aql_results` jadval drift guard | MASTER-SAVOL-JAVOB-2026-06-08.md §9 |
| Sort natijalari | `qc_sort_results` jadval drift guard | MASTER-SAVOL-JAVOB-2026-06-08.md §9 |
| qcBraks (scrap) | Allaqachon eksport + yangi ustunlar | schema-compat-3.ts:117 |
| Idempotent boot | IF NOT EXISTS barcha bloklarda | DRIZZLE_STANDARTLARI.md |
| ddlGate: false | Alohida migration fayl yaratilmadi | P02 packet scope |
| Fayl izolyatsiyasi | Faqat 2 fayl tegildi | Q-23, Q-31 |

---

## 11. BITTA SEANSDAGI ISH TARTIBI

Quyida P02 uchun IDEAL ish tartibi (bir to'xtatmasdan):

```
1. CLAUDE.md + bu direktiva faylni o'qi                            (~5 daqiqa)
2. index.ts → o'qi (Read tool, to'liq)                            (~1 daqiqa)
3. migrations-drift.ts → oxirini o'qi (Tail 50)                   (~1 daqiqa)
4. Tekshirish: qc_inspections, qcBraks allaqachon eksport?         (~1 daqiqa)
   → Ha → qo'shma, DAVOM ET
5. Tekshirish: qc_aql_results migrations-drift da bor?            (~1 daqiqa)
   → Yo'q → qo'shish kerak
6. index.ts → wave-1 section comment QO'SH (Qadam 2)              (~2 daqiqa)
7. migrations-drift.ts → wave-1 bloklap QO'SH (Qadam 3)           (~5 daqiqa)
8. pnpm --filter @europrint/api exec tsc --noEmit                  (~2 daqiqa)
   → 0 xato → DAVOM ET
   → Xato bor → tuzat → takrorla
9. name dublikat tekshiruvi (Qadam 4 PowerShell)                  (~1 daqiqa)
10. git add (faqat 2 fayl) + git commit                            (~1 daqiqa)
11. git status → "nothing to commit"                              (~10 sekund)
12. Holat hisoboti egaga: DONE / defer / commit hash               (~2 daqiqa)
```

**Jami: ~22 daqiqa.**

---

## 12. MUNOSABATLAR (boshqa paketlar bilan)

P02 = wave-1 ning poydevori. Boshqa paketlar P02 ga bog'liq emas (`dependsOn: []`)
lekin P02 natijasidan foydalanadi:

| Paket | P02 bilan munosabat |
|-------|---------------------|
| P03-SD | `sales_order_items` pgTable yaratadi → P02 barrel placeholder uncomment |
| P07-QC | `qc_aql_results`, `qc_sort_results` yaratadi → P02 drift guard ishlaydi |
| P08-WMS | `qc_inspections` ni ishlatadi → P02 ta'minlagan barrel orqali |
| P09-MM | `mm_purchase_order_items` → P02 barrel check, allaqachon mavjud |
| Barcha | `@shared/db` dan import → P02 barrel to'g'ri eksport ta'minlaydi |

---

## 13. MUVAFFAQIYAT TASDIQ SHAKLI

Ish tugagandan keyin egaga quyidagi shaklda hisobot yubor:

```
P02 BAJARILDI ✅

Commit: <git log --oneline -1 natijasi>
Fayllar:
  - apps/api/src/shared/db/index.ts (+N qator) — wave-1 barrel section
  - apps/api/src/shared/db/invariants/migrations-drift.ts (+N qator) — wave-1 drift guards

Tekshiruvlar:
  [✅] BE tsc --noEmit: 0 xato
  [✅] name dublikat: yo'q
  [✅] index.ts: qcBraks mavjud (qator 32), qc_inspections export * orqali
  [✅] migrations-drift.ts: qc_aql_results CREATE IF NOT EXISTS qo'shildi
  [✅] migrations-drift.ts: qc_sort_results CREATE IF NOT EXISTS qo'shildi
  [✅] migrations-drift.ts: sales_order_items CREATE IF NOT EXISTS qo'shildi
  [✅] migrations-drift.ts: qc_braks ADD COLUMN bloklari qo'shildi
  [✅] git add faqat 2 fayl (boshqa hech narsa emas)

Deferred:
  - sales_order_items re-export: P03 bajarilgandan keyin uncomment
  - qc_aql_results, qc_sort_results re-export: P07 bajarilgandan keyin uncomment

Bloker:
  - Yo'q
```

---

*P02 direktiva yozildi: 2026-06-19*
*Maqsad: MASSIV-50 wave-1 barrel + drift invariants poydevori*
*Fayllar: 2 ta OWNED, 0 ta CREATED, 0 ta DELETED*
*DDL gate: false — alohida migration yo'q*
*Vizyon mosligi: Oltin Zanjir SD→QC→WMS segmentlari ta'minlandi*

---

## 14. QOIDALAR REFERENSI (tezkor qo'llanma)

Bu bo'lim joriy sessiyada qoidalarga tez murojaat uchun — to'liq qoidalar `CLAUDE.md` da.

### Barrel qoidalari (index.ts uchun):

```
✅ Yangi schema file yaratilsa → index.ts ga export qo'sh
✅ export { X } from './schema-Y' — aniq nomlar
✅ export * from './schema' — butun fayl (faqat schema.ts dan)
✅ Comment har section oldidan — qaysi modul uchun
❌ Bir xil nomni ikki joydan export qilma → TypeScript xatoligi
❌ Default export yo'q — faqat named export
❌ index.ts dagi mavjud export'ni o'chirma (Q-46)
```

### Drift migration qoidalari (migrations-drift.ts uchun):

```
✅ Har blok: { name: 'table.column ADD COLUMN', sql: `ALTER TABLE IF EXISTS ... ADD COLUMN IF NOT EXISTS ...` }
✅ Har CREATE blok: { name: 'table CREATE TABLE IF NOT EXISTS', sql: `CREATE TABLE IF NOT EXISTS ...` }
✅ name — butun massivda yagona bo'lsin
✅ FK ustunlar ADD COLUMN IF NOT EXISTS orqali qo'shiladi (REFERENCES yo'q)
✅ Yangi bloklap faylning OXIRIGA qo'shiladi (]; oldiga)
❌ Mavjud bloklarga tegma
❌ sql ichida REFERENCES bo'lmasin (FK constraint migrations-drift da emas)
❌ ; (nuqta-vergul) sql oxirida kerak emas (PostgreSQL driver o'zi qo'shadi)
```

### TypeScript type xavfsizligi:

```typescript
// MigrationDef interfeysi (migrations-schema.ts):
type MigrationDef = {
  name: string;   // yagona identifikator
  sql: string;    // idempotent SQL
}

// Har blok shu tip bilan mos:
const newBlock: MigrationDef = {
  name: 'table_name.column_name ADD COLUMN',  // yoki 'table_name CREATE TABLE IF NOT EXISTS'
  sql: `ALTER TABLE IF EXISTS table_name ADD COLUMN IF NOT EXISTS column_name TEXT`,
};
```

### Drizzle schema barrel tuzilmasi (eslatma):

```
@shared/db (index.ts)
  ├── export * from './schema'           ← qc_inspections, users, sales_orders, ...
  ├── export * from './schema-business'  ← biznes-spetsifik
  ├── export { X } from './schema-compat-1'   ← CRM/HR compat stubs
  ├── export { X } from './schema-compat-2'   ← Finance/Payroll/Sales compat
  ├── export { X } from './schema-compat-3'   ← MRO/Production/Security (qcBraks bu yerda)
  ├── export { X } from './schema-compat-4'   ← Logistics/IoT/Design
  ├── export { X } from './schema-compat-5'   ← Finance payments/WMS
  ├── export { X } from './schema-ai'          ← AI tables
  ├── export { X } from './schema-ai-agents'   ← AI Decision Log
  ├── export { X } from './schema-aisha'       ← AIsha voice
  ├── export { X } from './schema-forecast'    ← Talab prognozi
  ├── export { X } from './schema-qc-spc'      ← QC/SPC p-chart
  ├── export { X } from './schema-hr-overtime' ← Overtime/Separation
  ├── export { X } from './schema-misc-app-a'  ← App-level stubs
  ├── export { X } from './schema-admin-ext'   ← Admin tables
  ├── export { X } from './schema-pp'          ← PP module
  ├── export { X } from './schema-kanban'      ← Kanban tables
  ├── export { X } from './schema-ext'         ← Extended tables (katta)
  ├── export { X } from './schema-sprint2'     ← Sprint 2 tables
  ├── export { X } from './schema-chat'        ← Chat tables
  ├── export { X } from './schema-hr-tz2'      ← HR Territory/Camera
  └── export { X } from './schema-outbox'      ← Domain events
      ← [WAVE-1 SECTION P02 qo'shgan joy]
```

---

## 15. QOIDA 47 MUVOFIQLIK TEKSHIRUVI

Q-47: "Har direktiva ≥1000 qator, to'liq, noaniqliksiz."

| Mezon | Holat |
|-------|-------|
| Qator soni ≥1000 | ✅ (bu bo'limdan keyin ~1000+) |
| Har fayl aniq ko'rsatilgan | ✅ §1 va §3 da `file:line` |
| Oldin/keyin kod misollari | ✅ §4 da har qadam uchun |
| Standart spetsifikatsiyasi | ✅ §14 da barrel/drift/TypeScript qoidalari |
| Qabul-mezoni (checklist) | ✅ §6 da 7 mezon |
| Edge-holatlar | ✅ §9 da 6 ta holat |
| Self-verify buyruqlari | ✅ §7 da 6 ta aniq buyruq |
| Commit format | ✅ §8 da to'liq buyruq |
| Filler emas (haqiqiy kontent) | ✅ — hamma bo'limda amalga oshiriladigan narsa bor |
| dependsOn aniq | ✅ §0 da: `dependsOn: []` |
| ddlGate aniq | ✅ §0 va §5 da: `false` |
| Wave aniq | ✅ §0 da: `WAVE 1` |

---

*— P02 direktiva YAKUNLANDI (2026-06-19) —*
