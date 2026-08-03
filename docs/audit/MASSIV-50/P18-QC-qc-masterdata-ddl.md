# P18 — qc: QC master-data DDL: defect_catalog + AQL + sort-levels + BE CRUD

> **WAVE:** 1 | **dependsOn:** ["P01", "P02"] | **ddlGate:** true
> **Modul:** qc | **Slug:** qc-masterdata-ddl
> **Executor:** Muslimbek | **Sana:** 2026-06-19

---

## 0. ROL VA QOIDALAR

Sen 🟢 **BAJARUVCHI (EXECUTOR)**. Sessiya boshida quyidagilarni o'qi:
`CLAUDE.md` → `docs/agent-constitution.md` → `docs/audit/LOYIHA-QOIDALARI-2026-06-08.md`

### QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):

1. **Result<T>** — hamma repo/service metodida; `throw`/`null`/`undefined` TAQIQ.
2. **@Body Zod bilan validate** — `class-validator` TAQIQ.
3. **Drizzle ORM** — raw SQL faqat murakkab holatda (izoh + `typedExecute<T>`).
4. **Q-40 ishlaydi ≠ to'g'ri** — REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5. **Q-46 ishlab turgan kod O'CHIRILMAYDI** — buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6. **FAYL IZOLYATSIYASI (Q-23/Q-31)** — faqat shu paketning OWNED-FILE ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil, supurib ketma.
7. **DDL DARVOZASI (Q-35)** — `CREATE TABLE` / migration faqat egasi ruxsati bilan; migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8. **`git add <aniq-fayl>` faqat** — `-A` / `.` TAQIQ. Bitta commit = bitta mantiqiy guruh.
9. **Q-45/Q-30** — log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. **Self-verify** — BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof (kirit → saqla → qayta o'qi → ko'rinadimi).
11. **"V2"/"Strangler Fig"/"V1 vs V2"** terminologiyasi TAQIQ — bitta kod bazasi, shu joyda to'g'irlanadi.
12. **Vizyon-moslik** — TO'G'RI o'lchovi = master vizyon (`docs/XARITA-REJA-YONALISH` + modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.

### WAVE va bog'liqlik:

| Parametr | Qiymat |
|---|---|
| Wave | 1 (poydevor; boshqalar shunga tayangan) |
| dependsOn | P01 (lib/db barrel), P02 (api shared barrel) |
| ddlGate | **true** — har bir yangi `CREATE TABLE` faqat egasi `-- APPROVED:` bilan |

**MUHIM:** P01 va P02 tugaguncha bu paket boshlanmaydi. Boshlanishdan oldin:
```bash
# P01/P02 bitganini tekshir
grep -r "defectCatalog\|qc_aql_table\|qcSortLevels" \
  lib/db/src/schema/ apps/api/src/shared/db/ 2>/dev/null | head -5
```
Natija bo'sh bo'lsa — siz birinchi yozuvchisiz. Natija bor bo'lsa — P01/P02 bilan koordinatsiya.

---

## 1. IZOLYATSIYA MANIFESTI

### FAQAT shu fayllarga teg:

```
apps/api/src/shared/db/schema-misc-qc.ts          ← defect_catalog + qc_aql_table + qc_sort_levels Drizzle jadval ta'riflari
lib/db/src/schema/qc-schema.ts                     ← qcAqlTable + qcSortLevels Drizzle export (lib barrel uchun)
apps/api/src/modules/qc/infrastructure/repositories/qc-catalog.repository.ts   ← YANGI fayl
apps/api/src/modules/qc/application/qc-catalog.service.ts                      ← YANGI fayl
apps/api/src/modules/qc/presentation/qc-catalog.controller.ts                  ← YANGI fayl
apps/api/src/modules/qc/qc.module.ts              ← yangi provider/controller ro'yxatiga qo'shish
```

**FAQAT shu fayllarga teg; boshqasi kerak bo'lsa — TO'XTA va egasiga flag qil.**

### DDL GATE — migration fayllari:

Migration fayllari bu paketda YOZILADI lekin `-- APPROVED:` satri bo'lmasa ISHGA TUSHIRILMAYDI:

```
apps/api/src/shared/db/migrations/p18-d1-defect-catalog.sql
apps/api/src/shared/db/migrations/p18-d2-qc-aql-table.sql
apps/api/src/shared/db/migrations/p18-d3-qc-sort-levels.sql
```

Egasi `-- APPROVED: <egasi> <sana>` izoh qo'shib "ha, ishga tushir" demagunicha `psql`ga berma.

### Bu paketga TAQIQLANGAN fayllar (misol):

- `apps/api/src/modules/qc/presentation/qc-defects.controller.ts` — P18 EMAS (mavjud)
- `apps/api/src/modules/qc/application/qc-defects-extended.service.ts` — P18 EMAS
- `lib/db/src/schema/pp-schema.ts` — boshqa modul
- `apps/api/src/shared/db/schema-wms.ts` — boshqa paket
- `artifacts/erp-dashboard/**` — FE bu paketda emas (BE only)

---

## 2. VIZYON

**Manba:** `docs/audit/MUSLIMBEK-PROMT-07-QC-2026-06-08.md` §1 + §PHASE 1

### QC nima uchun T1 "oltin zanjir" moduli:

QC (Sifat Nazorati) = **har ishlab chiqarish qadamida sifat darvozasi**. Yuk QC tasdiqisiz ombordan chiqmaydi. Nuqson ildiz-sabab aniqlanmasa — yopiq emas.

### РД-5 zanjir qadamlari (Abdullaev kitob qonuni):

1. Zakaz start → operator o'z-o'zini tekshiradi (texkarta + material + parametrlar)
2. Har smena → ОТК oraliq sifat tekshiruvi (yarim tayyor mahsulot)
3. Nuqson topildi → СОЗ darhol xabardor → texnolog + uchastka rahbari baholaydi
4. Bosh texnolog / ishlab chiqarish rahbari qaror qabul qiladi (ОТК faqat dalil, qaror emas)
5. Buyurtma tugashi → ОТК: **QABUL / REWORK / CHIQARISH**
6. Oy oxiri → Совершенствование: takroriy nuqson tahlili + korrupsiya chorasi

### Egasi 4 yangi biznes-qarori (bu paket uchun asos):

| Qaror kodi | Mazmuun | Qoida |
|---|---|---|
| EP-QC-003 | AQL = standart 2.5 | Lot hajmi → namuna hajmi → Ac/Re qiyinlik bo'yicha |
| EP-QC-005 | Nuqson og'irligi = 3 daraja | kritik (0% o'tadi) / jiddiy / kichik (estetik) |
| EP-QC-072 | Sort = 1/2/3-sort + brak | Har sortda narx koeffitsienti (sotib bo'ladi, axlatga tashlanmaydi) |
| EP-QC-090 | Nuqson sababi = 2 tur | "keluvchi nuqson" (oldingi qadam) vs "bu qadam nuqsoni" (adolatli javobgarlik) |

### Bu paket (Phase 1) maqsadi — poydevor lug'at:

Quyidagi 3 yangi jadval yaratiladi; boshqa QC featurelari shunga tayanadi:

1. **`defect_catalog`** — kodlangan nuqson turi ro'yxati (seed SQL TASDIQLANГАН, CREATE TABLE migratsiya yo'q)
2. **`qc_aql_table`** — AQL 2.5 standart jadval (lot hajmi → namuna → Ac/Re) — **P18 YAGONA EGASI**
3. **`qc_sort_levels`** — sort darajalari (1/2/3/brak + narx koeffitsienti)

Va ularni boshqarish uchun BE CRUD:

- `qc-catalog.repository.ts` — Drizzle repo (Result<T>)
- `qc-catalog.service.ts` — biznes qoidalari (Result<T>)
- `qc-catalog.controller.ts` — REST API (`/api/qc/catalog`, **`/api/qc/aql`**, `/api/qc/sort-levels`)
- `qc.module.ts` — yangi provider/controller ro'yxatiga qo'shish

> ⚠️ **KROSS-PAKET EGALIK QOIDASI (00-INTERVYU-MOSLIK §1-daraja #2):**
> `qc_aql_table` jadvalini **FAQAT P18 yaratadi va boshqaradi**. P19 shu jadvalga murojaat qiladi lekin qayta yaratmaydi.
> - P18 → `CREATE TABLE qc_aql_table` + `/api/qc/aql` endpoint (yagona URL)
> - P19 → `d19-03-qc-aql-table.sql` yo'q, `/api/qc/aql-table` yo'q — ikkala URL bitta ma'lumot bersa ikki xil URL TAQIQ
> - P19 ning `AQLTablePage.tsx` — `/api/qc/aql-table` emas, `/api/qc/aql` URL ishlatadi

> ⚠️ **AQL EDITION NOANIQLIK — EGASI QARORI KERAK:**
> Egasi "AQL 2.5 standart" degan (EP-QC-003), lekin qaysi edition (ISO 2859-1 ╳ MIL-STD-1916) aniqlanmagan.
> P18 migration `p18-d2-qc-aql-table.sql` da 7-qator ISO 2859-1 soddalashtirilgan jadval bor.
> **EGASI QIYMATI KERAK:** iso_2859_1 (7 qator: 1-50/51-150/151-500/501-1200/1201-3200/3201-10000/10001+)
> yoki mil_std_1916 (11 qator) — P18 `aql_level` ustunini kengaytirish mumkin.
> Hozircha ISO 2859-1 soddalashtirilgan 7-qator A-default sifatida qoldiriladi.

### Qabul mezoni (per feature):

| Feature | Qabul mezoni |
|---|---|
| `defect_catalog` Drizzle schema | `schema-misc-qc.ts`da `defect_catalog` pgTable mavjud; `lib/db/qc-schema.ts`da re-export |
| `defect_catalog` migration | `p18-d1-defect-catalog.sql` GATED (APPROVED kutilyapti) |
| `qc_aql_table` Drizzle schema | ikkala schema faylida mavjud |
| `qc_sort_levels` Drizzle schema | ikkala schema faylida mavjud |
| BE CRUD | `/api/qc/catalog` GET/POST/PUT/DELETE real DB, Result<T>, Zod |
| BE CRUD | `/api/qc/aql` GET real DB (lot_size bo'yicha qidiruv) |
| BE CRUD | `/api/qc/sort-levels` GET/POST/PUT/DELETE real DB |
| Physical norm endpoint | `/api/qc/physical-norms` GET (material_card_id bo'yicha) |
| qc.module.ts | `QcCatalogRepository`, `QcCatalogService`, `QcCatalogController` ro'yxatda |
| tsc | BE tsc 0 |
| DB-proof | INSERT → SELECT → ko'rinadi (har 3 jadval uchun) |

---

## 3. HOZIRGI HOLAT

### 3.1 MAVJUD (EXISTS)

#### `apps/api/src/shared/db/schema-misc-qc.ts` (161 satr)

Bu fayl hozir quyidagi jadvallarni e'lon qiladi:
- `qc_defects` (12:29) — uuid PK, severity text, status text
- `qc_reclamations` (31:45) — uuid PK, **`schema-misc-qc.ts` versiyasi** (uuid customer_id)
- `qc_checkpoints` (47:56) — serial PK
- `qc_certificates` (58:70) — serial PK
- `qc_lab_tests` (72:85) — serial PK
- `qc_parameters` (87:99) — serial PK
- `qc_spc_data` (101:109) — serial PK
- `qc_standards` (111:120) — serial PK (DIQQAT: `lib/db/qc-schema.ts`dagi `qcStandards` bilan nomi bir xil — ikkala ta'rif parallel mavjud)
- `mm_vendors` (122:133) — serial PK
- `knowledge_base` (135:147) — uuid PK
- `qc_supplier_quality` (149:160) — serial PK, `vendorId integer`

**MUHIM TOPILMA:** `defect_catalog` jadvali `schema-misc-qc.ts`da **YO'Q**. Lekin `docs/migration/seed/seed-05-defects.sql` (1:8) da `INSERT INTO defect_catalog` bor va fayl boshi: `-- APPROVED: owner (2026-06-18)`. Demak seed tasdiqlanган, ammo `CREATE TABLE` migratsiyasi hali yozilmagan.

#### `lib/db/src/schema/qc-schema.ts` (374 satr)

Hozir quyidagilar mavjud:
- `qcStandards` (22:40) — serial PK, `code`, `type`, `category`
- `qcParameterDefinitions` (44:67) — serial PK, `standardId FK`
- `qcMaterialTests` (71:102) — serial PK, `orderId FK papkaOrders`, `materialCardId FK materialCards`
- `qcFinalInspections` (153:176) — serial PK
- `qcReclamations` (205:242) — serial PK, **bu versiyada `clientId varchar`** (schema-misc-qc.ts bilan FARQ qiladi)
- `qcBraks` (257:279) — serial PK, causation_type MAVJUD EMAS (EP-QC-090 gap)
- `qcSupplierQuality` (293:307) — serial PK, `supplierId varchar` (schema-misc-qc.ts bilan FARQ: `vendorId integer`)
- `inlineQcChecks` (319:327) — serial PK
- `qcRootCauses` (333:363) — serial PK, to'liq ta'rif bor lekin migratsiyasi topilmadi

**MUHIM TOPILMA:** `qcAqlTable`, `qcSortLevels`, `defectCatalog` — **YO'Q**. Bu paket yozishi kerak.

#### `apps/api/src/modules/qc/qc.module.ts` (150 satr)

To'liq ro'yxat (satr 98:150):
- Controllers: `QcInspectionsController`, `QcDefectsController`, `QcExtendedController`, `QcDefectsExtendedController`, `QcReclamationsController`, `QcNewController`, `QcParametersController`, `PrintController`, `QcDpmoController`
- Providers: `DrizzleQcReclamationRepo`, `DrizzleDefectRepository` (QC_DEFECT_REPO), `DrizzleDefectsRepository` (DEFECTS_REPO), `DrizzleQcComputeRepository` (QC_COMPUTE_REPO), `QcNewRepository`, `QcParametersRepository`, domain services (SpcService, FmeaService, DeltaEService, ...)

**`QcCatalogRepository`, `QcCatalogService`, `QcCatalogController` — yo'q.** Bu paket qo'shadi.

#### Mavjud repository fayllar (`infrastructure/repositories/`):

```
drizzle-defect.repo.ts
drizzle-inspection.repo.ts
drizzle-qc-reclamation.repo.ts
drizzle-qc.repo.ts
qc-defects-extended.repository.ts
qc-extended-final.repository.ts
qc-extended-in-process.repository.ts
qc-extended-root-causes.repository.ts
qc-extended-standards.repository.ts
qc-extended.repository.ts
qc-new.repository.ts
qc-parameters.repository.ts
```

`qc-catalog.repository.ts` — **YO'Q**. Bu paket yaratadi.

#### Seed SQL:

`docs/migration/seed/seed-05-defects.sql` — **TASDIQLANГАН** (`-- APPROVED: owner (2026-06-18)`). 25 nuqson yozuvi: DEF-U-001..004 (universal), DEF-G-001..006 (gofra), DEF-O-001..007 (offset), DEF-S-001..003 (silkscreen), DEF-F-001..003 (flexi).

Jadval ustunlari seed'dan: `code`, `name_uz`, `name_ru`, `direction`, `severity`, `auto_reject`, `description_uz`, `corrective_action_uz`, `created_at`, `updated_at`.

### 3.2 KAMCHILIKLAR (MISSING)

| Gap kodi | Nima yo'q | Fayl |
|---|---|---|
| D1 | `defect_catalog` CREATE TABLE migration | `p18-d1-defect-catalog.sql` (GATED) |
| D2 | `defect_catalog` Drizzle pgTable ta'rifi | `schema-misc-qc.ts` + `qc-schema.ts` |
| D3 | `qc_aql_table` jadval + Drizzle schema | `p18-d2-qc-aql-table.sql` (GATED) |
| D4 | `qc_sort_levels` jadval + Drizzle schema | `p18-d3-qc-sort-levels.sql` (GATED) |
| D5 | `qc-catalog.repository.ts` | to'liq yangi fayl |
| D6 | `qc-catalog.service.ts` | to'liq yangi fayl |
| D7 | `qc-catalog.controller.ts` | to'liq yangi fayl |
| D8 | `qc.module.ts` ro'yxatga qo'shish | satr 86:96 `repositories` + satr 100:110 `controllers` + providers |
| D9 | Physical norm endpoint `/api/qc/physical-norms` | `qc-catalog.controller.ts` ichida |

### 3.3 BUZUQ / SOXTA (BROKEN/FAKE)

| Fayl:satr | Muammo | Tavsif |
|---|---|---|
| `application/queries/get-defects.handler.ts:27` | NOTO'G'RI jadval | `quality_defects_camera` ni so'raydi — kamera AI jadvali, domain `qc_defects` emas |
| `application/queries/get-reclamations.handler.ts:27` | SOXTA | `quality_defects_camera` ni qaytaradi — reklamatsiya EMAS |
| `presentation/qc-new.controller.ts:117:128` | Qoida 15 buzilishi | `db.execute(sql...)` to'g'ridan controller ichida |
| `presentation/qc-parameters.controller.ts:155:157` | `return` yo'q | `unwrapOrInternal` chaqiriladi lekin natija qaytarilmaydi |
| `schema-misc-qc.ts:31` vs `lib/db/qc-schema.ts:205` | Dual schema | `qc_reclamations` — uuid vs serial PK; P18 bu ikkilikni **tegmaydi** (P07 ishi) |
| `qc_supplier_quality` dual | schema-misc-qc vendorId int vs lib/db supplierId varchar | P07 ishi, P18 tegmaydi |

**DIQQAT:** Buzuq fayllar ro'yxatdagi muammolar P18 OWNED FILES'da EMAS (controller/handler fayllar emas). Bu paket faqat yangi fayllarga tegadi. Agar yangi controller yozishda o'sha noto'g'ri handler'larni ko'rishga to'g'ri kelsa — flag qil, lekin o'zgartirma.

---

## 4. ISH (QADAM-BAQADAM)

### QADAM 0 — Jonli tekshiruv (boshlanishdan oldin)

```bash
# 4.0.1: P01/P02 tayyor ekanini tekshir
ls lib/db/src/schema/qc-schema.ts
ls apps/api/src/shared/db/schema-misc-qc.ts

# 4.0.2: defect_catalog jadval DB'da bormi?
# (agar docker ishlayotgan bo'lsa)
psql $DATABASE_URL -c "\d defect_catalog" 2>&1 | head -5
# Agar "did not exist" → CREATE TABLE migration hali ishga tushirilmagan (kutilmoqda)

# 4.0.3: mavjud qc_aql_table yoki qc_sort_levels bormi?
psql $DATABASE_URL -c "\d qc_aql_table" 2>&1
psql $DATABASE_URL -c "\d qc_sort_levels" 2>&1

# 4.0.4: seed fayli tasdiqlanganmi?
head -3 docs/migration/seed/seed-05-defects.sql
# Kutilayotgan chiqish: "-- APPROVED: owner (2026-06-18)"
```

Agar `defect_catalog` jadval DB'da allaqachon bor bo'lsa (ba'zi oldingi migration ishga tushirilgan bo'lishi mumkin) — schema'dan ustunlar listini ol va D2 qadamida moslashtir.

---

### QADAM 1 — `schema-misc-qc.ts`: 3 yangi pgTable ta'rifi

**Fayl:** `apps/api/src/shared/db/schema-misc-qc.ts`

**Hozirgi holat (161 satr):** `qc_supplier_quality` — oxirgi jadval (149:160), `knowledge_base` (135:147).

**Qo'shish:** Faylning oxiriga (161-satrdan keyin) 3 ta yangi export qo'shiladi.

#### 1.1 `defect_catalog` pgTable

```typescript
// Oldin: fayl 161-satrda tugaydi (qc_supplier_quality eksport)
// Keyin: faylning oxiriga qo'shiladi

export const defect_catalog = pgTable('defect_catalog', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),           // DEF-U-001, DEF-G-002 ...
  name_uz: text('name_uz').notNull(),              // UZ lotin
  name_ru: text('name_ru'),                        // RU (Yandex tarjima)
  name_cyr: text('name_cyr'),                      // UZ kirill
  direction: text('direction').notNull(),          // universal | gofra | offset | silkscreen | flexi
  severity: text('severity').notNull().default('MINOR'), // CRITICAL | MAJOR | MINOR
  auto_reject: boolean('auto_reject').notNull().default(false),
  description_uz: text('description_uz'),
  corrective_action_uz: text('corrective_action_uz'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Import tekshiruvi:** `serial`, `boolean` allaqachon import qilinganini tekshir (satr 6:10). Agar yo'q bo'lsa import qatoriga qo'sh.

**Nima uchun bu ustunlar:** seed-05-defects.sql (satr 9:20) aniq ustun nomlarini ko'rsatadi. `name_cyr` kelajakdagi i18n uchun (hozircha null bo'lishi mumkin).

#### 1.2 `qc_aql_table` pgTable

AQL 2.5 standart (EP-QC-003). Egasi A-default: jiddiy Ac=1/Re=2, kichik Ac=3/Re=4.

```typescript
export const qc_aql_table = pgTable('qc_aql_table', {
  id: serial('id').primaryKey(),
  lot_size_from: integer('lot_size_from').notNull(),    // lot_size >= dan
  lot_size_to: integer('lot_size_to').notNull(),        // lot_size <= gacha (999999 = cheksiz)
  sample_size: integer('sample_size').notNull(),        // namuna soni
  // kritik (0% o'tadi — AQL 0 = Ac=0, Re=1)
  ac_critical: integer('ac_critical').notNull().default(0),
  re_critical: integer('re_critical').notNull().default(1),
  // jiddiy (A-default: Ac=1, Re=2)
  ac_major: integer('ac_major').notNull().default(1),
  re_major: integer('re_major').notNull().default(2),
  // kichik (A-default: Ac=3, Re=4)
  ac_minor: integer('ac_minor').notNull().default(3),
  re_minor: integer('re_minor').notNull().default(4),
  aql_level: text('aql_level').notNull().default('2.5'), // kelajakda 1.0/4.0 bo'lishi mumkin
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Biznes qoida:** `lot_size_from` va `lot_size_to` birgalikda unique bo'lishi kerak. Unique index migration'da qo'shiladi.

#### 1.3 `qc_sort_levels` pgTable

Sort darajalari (EP-QC-072). 1-sort=to'liq narx, 2-sort=kamroq, 3-sort=yanada kam, brak=0.

```typescript
export const qc_sort_levels = pgTable('qc_sort_levels', {
  id: serial('id').primaryKey(),
  level: text('level').notNull().unique(), // '1', '2', '3', 'brak'
  name_uz: text('name_uz').notNull(),      // "1-sort", "2-sort", "3-sort", "Brak"
  name_ru: text('name_ru'),
  price_coefficient: decimal('price_coefficient', { precision: 5, scale: 4 })
    .notNull().default('1.0000'),           // 1.0000 = to'liq narx; 0.0000 = brak
  description_uz: text('description_uz'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Import tekshiruvi:** `decimal` hozir `schema-misc-qc.ts` satr 7da import qilingan. `integer` satr 8da bor.

#### 1.4 Zod insert schema'lari (schema-misc-qc.ts'ga qo'shish)

```typescript
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

// defect_catalog
export const insertDefectCatalogSchema = createInsertSchema(defect_catalog, {
  code: z.string().min(3).max(20).regex(/^DEF-[A-Z]-\d{3}$/, 'Format: DEF-X-NNN'),
  name_uz: z.string().min(1).max(200),
  direction: z.enum(['universal', 'gofra', 'offset', 'silkscreen', 'flexi']),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']),
}).omit({ id: true, created_at: true, updated_at: true } as never);

export type InsertDefectCatalog = z.infer<typeof insertDefectCatalogSchema>;
export type DefectCatalog = typeof defect_catalog.$inferSelect;

// qc_aql_table
export const insertQcAqlSchema = createInsertSchema(qc_aql_table, {
  lot_size_from: z.number().int().min(1),
  lot_size_to: z.number().int().min(1),
  sample_size: z.number().int().min(1),
  ac_critical: z.number().int().min(0).default(0),
  re_critical: z.number().int().min(1).default(1),
  ac_major: z.number().int().min(0).default(1),
  re_major: z.number().int().min(1).default(2),
  ac_minor: z.number().int().min(0).default(3),
  re_minor: z.number().int().min(1).default(4),
}).omit({ id: true, created_at: true, updated_at: true } as never);

export type InsertQcAql = z.infer<typeof insertQcAqlSchema>;
export type QcAql = typeof qc_aql_table.$inferSelect;

// qc_sort_levels
export const insertQcSortLevelSchema = createInsertSchema(qc_sort_levels, {
  level: z.enum(['1', '2', '3', 'brak']),
  name_uz: z.string().min(1).max(100),
  price_coefficient: z.string().regex(/^\d+\.\d{4}$/).default('1.0000'),
}).omit({ id: true, created_at: true, updated_at: true } as never);

export type InsertQcSortLevel = z.infer<typeof insertQcSortLevelSchema>;
export type QcSortLevel = typeof qc_sort_levels.$inferSelect;
```

**DIQQAT:** `drizzle-zod` va `z` import `schema-misc-qc.ts`ga yangi qo'shiladi — hozir bu importlar yo'q (fayl boshi tekshirildi, satr 1:10). Qo'shish:
```typescript
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
```

---

### QADAM 2 — `lib/db/src/schema/qc-schema.ts`: Re-export

**Fayl:** `lib/db/src/schema/qc-schema.ts` (374 satr)

**Hozirgi holat:** `qcRootCauses` (333:363) oxirgi eksport, `insertQcRootCauseSchema` (365:370), type'lar (372:373).

**Maqsad:** `schema-misc-qc.ts`da yozilgan 3 yangi jadval + schema'larni lib barrel uchun re-export qilish.

**Qo'shish — faylning oxiriga (374-satrdan keyin):**

```typescript
// ========== P18: QC Master-data jadvallari (shared/db/schema-misc-qc.ts dan) ==========
// Re-export: lib/db barrel uchun. Asosiy ta'rif apps/api/src/shared/db/schema-misc-qc.ts da.
export {
  defect_catalog,
  insertDefectCatalogSchema,
  type InsertDefectCatalog,
  type DefectCatalog,
  qc_aql_table,
  insertQcAqlSchema,
  type InsertQcAql,
  type QcAql,
  qc_sort_levels,
  insertQcSortLevelSchema,
  type InsertQcSortLevel,
  type QcSortLevel,
} from '../../../../apps/api/src/shared/db/schema-misc-qc';
```

**MUHIM:** Import yo'li to'g'riligini tekshir. `lib/db/src/schema/` dan `apps/api/src/shared/db/` ga nisbiy yo'l:
```
../../../../apps/api/src/shared/db/schema-misc-qc
```
Agar `@shared/db` alias mavjud bo'lsa — `tsconfig.json`da tekshir va mos yo'lni ishlat.

**Agar circular import xavfi bo'lsa (Q-46 + dedup-safety-rules.md §3):**
Re-export o'rniga nusxasini yoz (bir tomonli import, cyclic shim yo'q). Lekin avval alias tekshir — ko'p hollarda to'g'ri ishlaydi.

---

### QADAM 3 — Migration fayllar (GATED)

Bu qadam faqat egasi `-- APPROVED:` bilan tasdiqlaydi.

**QADAM 3.0 — Egasiga ko'rsat, ruxsat so'ra:**

Quyidagi migration'larni yozgandan keyin egasiga yukla:
> "P18 D1/D2/D3 migration'lar tayyorlandi. `-- APPROVED:` qatorini to'ldiring va `psql` bilan ishga tushirish uchun ruxsat bering."

#### 3.1 — `p18-d1-defect-catalog.sql` (GATED)

```sql
-- APPROVED: <egasi> <sana>
-- P18-D1: defect_catalog CREATE TABLE
-- Ishlatish: psql $DATABASE_URL -f apps/api/src/shared/db/migrations/p18-d1-defect-catalog.sql
-- Idempotent: IF NOT EXISTS

BEGIN;

CREATE TABLE IF NOT EXISTS defect_catalog (
  id            SERIAL PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name_uz       TEXT NOT NULL,
  name_ru       TEXT,
  name_cyr      TEXT,
  direction     TEXT NOT NULL
    CHECK (direction IN ('universal','gofra','offset','silkscreen','flexi')),
  severity      TEXT NOT NULL DEFAULT 'MINOR'
    CHECK (severity IN ('CRITICAL','MAJOR','MINOR')),
  auto_reject   BOOLEAN NOT NULL DEFAULT FALSE,
  description_uz TEXT,
  corrective_action_uz TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defect_catalog_direction
  ON defect_catalog(direction);
CREATE INDEX IF NOT EXISTS idx_defect_catalog_severity
  ON defect_catalog(severity);
CREATE INDEX IF NOT EXISTS idx_defect_catalog_is_active
  ON defect_catalog(is_active)
  WHERE is_active = TRUE;

COMMENT ON TABLE defect_catalog IS 'P18: QC nuqson turi kataloги — gofra/offset/silkscreen/flexi/universal. Seed: seed-05-defects.sql (APPROVED 2026-06-18).';

COMMIT;

-- Tekshirish:
-- SELECT code, name_uz, direction, severity FROM defect_catalog ORDER BY direction, code;
```

#### 3.2 — `p18-d2-qc-aql-table.sql` (GATED)

```sql
-- APPROVED: <egasi> <sana>
-- P18-D2: qc_aql_table CREATE TABLE (AQL 2.5 standart)
-- EP-QC-003/054/056

BEGIN;

CREATE TABLE IF NOT EXISTS qc_aql_table (
  id             SERIAL PRIMARY KEY,
  lot_size_from  INTEGER NOT NULL,
  lot_size_to    INTEGER NOT NULL,        -- 999999 = cheksiz
  sample_size    INTEGER NOT NULL,
  ac_critical    INTEGER NOT NULL DEFAULT 0,
  re_critical    INTEGER NOT NULL DEFAULT 1,
  ac_major       INTEGER NOT NULL DEFAULT 1,
  re_major       INTEGER NOT NULL DEFAULT 2,
  ac_minor       INTEGER NOT NULL DEFAULT 3,
  re_minor       INTEGER NOT NULL DEFAULT 4,
  aql_level      TEXT NOT NULL DEFAULT '2.5',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT qc_aql_lot_range_unique UNIQUE (lot_size_from, lot_size_to, aql_level),
  CONSTRAINT qc_aql_lot_range_chk CHECK (lot_size_from <= lot_size_to),
  CONSTRAINT qc_aql_sample_positive CHECK (sample_size > 0),
  CONSTRAINT qc_aql_critical_chk CHECK (ac_critical < re_critical),
  CONSTRAINT qc_aql_major_chk CHECK (ac_major < re_major),
  CONSTRAINT qc_aql_minor_chk CHECK (ac_minor < re_minor)
);

COMMENT ON TABLE qc_aql_table IS 'P18: AQL 2.5 standart. lot_size oraliq → namuna → Ac/Re qiyinlik bo''yicha (EP-QC-003).';

-- A-default qiymatlar (AQL 2.5, ISO 2859-1 Level II soddalashtirilgan):
-- Egasi bu qiymatlarni admin paneldan o'zgartira oladi.
INSERT INTO qc_aql_table
  (lot_size_from, lot_size_to, sample_size, ac_critical, re_critical, ac_major, re_major, ac_minor, re_minor)
VALUES
  (1,      50,     5,   0,1, 1,2, 3,4),
  (51,     150,    13,  0,1, 1,2, 3,4),
  (151,    500,    20,  0,1, 2,3, 5,6),
  (501,    1200,   32,  0,1, 2,3, 7,8),
  (1201,   3200,   50,  0,1, 3,4, 10,11),
  (3201,   10000,  80,  0,1, 3,4, 14,15),
  (10001,  999999, 125, 0,1, 5,6, 21,22)
ON CONFLICT (lot_size_from, lot_size_to, aql_level) DO NOTHING;

COMMIT;

-- Tekshirish:
-- SELECT lot_size_from, lot_size_to, sample_size, ac_major, re_major FROM qc_aql_table ORDER BY lot_size_from;
```

#### 3.3 — `p18-d3-qc-sort-levels.sql` (GATED)

```sql
-- APPROVED: <egasi> <sana>
-- P18-D3: qc_sort_levels CREATE TABLE (EP-QC-072)

BEGIN;

CREATE TABLE IF NOT EXISTS qc_sort_levels (
  id                 SERIAL PRIMARY KEY,
  level              TEXT NOT NULL UNIQUE
    CHECK (level IN ('1','2','3','brak')),
  name_uz            TEXT NOT NULL,
  name_ru            TEXT,
  price_coefficient  NUMERIC(5,4) NOT NULL DEFAULT 1.0000
    CHECK (price_coefficient >= 0.0000 AND price_coefficient <= 1.0000),
  description_uz     TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE qc_sort_levels IS 'P18: Sort darajalari (EP-QC-072). 1-sort=to''liq narx, brak=0. Narx koeffitsienti egasi tomonidan belgilanadi.';

-- A-default qiymatlar (egasi sozlaydi):
INSERT INTO qc_sort_levels (level, name_uz, name_ru, price_coefficient, description_uz)
VALUES
  ('1',    '1-sort',  '1-й сорт', 1.0000, 'To''liq standart mahsulot'),
  ('2',    '2-sort',  '2-й сорт', 0.7500, 'Kichik nuqson bor, sotiladi (arzonroq)'),
  ('3',    '3-sort',  '3-й сорт', 0.5000, 'Sezilarli nuqson, limitlangan foydalanish'),
  ('brak', 'Brak',    'Брак',     0.0000, 'Sotib bo''lmaydigan mahsulot')
ON CONFLICT (level) DO UPDATE SET
  name_uz = EXCLUDED.name_uz,
  name_ru = EXCLUDED.name_ru
  -- price_coefficient ni o'zgartirmaydi (egasi qiymat qo'ygan bo'lishi mumkin)
;

COMMIT;

-- Tekshirish:
-- SELECT level, name_uz, price_coefficient FROM qc_sort_levels ORDER BY level;
```

---

### QADAM 4 — `qc-catalog.repository.ts` (YANGI fayl)

**Fayl:** `apps/api/src/modules/qc/infrastructure/repositories/qc-catalog.repository.ts`

Hozir bu fayl **mavjud emas**. To'liq yaratiladi.

**Shablon (to'liq):**

```typescript
/**
 * @module qc-catalog.repository
 * @description QC master-data (defect_catalog, qc_aql_table, qc_sort_levels) Drizzle repo.
 * Result<T> pattern. Real DB only — Q-40/Q-43.
 */

import { Injectable } from '@nestjs/common';
import { eq, and, gte, lte, isNull, asc } from 'drizzle-orm';
import { db } from '@shared/db';
import {
  defect_catalog,
  qc_aql_table,
  qc_sort_levels,
  type DefectCatalog,
  type InsertDefectCatalog,
  type QcAql,
  type InsertQcAql,
  type QcSortLevel,
  type InsertQcSortLevel,
} from '@shared/db/schema-misc-qc';
import { safeCall, Result, AppErr, ok, err } from '@common/result';

// ────────────────────────────────────────────────
// Defect Catalog
// ────────────────────────────────────────────────

@Injectable()
export class QcCatalogRepository {

  // ── DEFECT CATALOG ──────────────────────────

  async findAllDefects(opts?: { direction?: string; severity?: string; activeOnly?: boolean }): Promise<Result<DefectCatalog[]>> {
    return safeCall(async () => {
      const conditions = [];
      if (opts?.activeOnly !== false) {
        conditions.push(eq(defect_catalog.is_active, true));
      }
      if (opts?.direction) {
        conditions.push(eq(defect_catalog.direction, opts.direction));
      }
      if (opts?.severity) {
        conditions.push(eq(defect_catalog.severity, opts.severity));
      }

      return db
        .select()
        .from(defect_catalog)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(defect_catalog.direction), asc(defect_catalog.code));
    });
  }

  async findDefectByCode(code: string): Promise<Result<DefectCatalog>> {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(defect_catalog)
        .where(eq(defect_catalog.code, code))
        .limit(1);
      if (!rows[0]) throw new Error(`defect_catalog: ${code} topilmadi`);
      return rows[0];
    });
  }

  async findDefectById(id: number): Promise<Result<DefectCatalog>> {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(defect_catalog)
        .where(eq(defect_catalog.id, id))
        .limit(1);
      if (!rows[0]) throw new Error(`defect_catalog id=${id} topilmadi`);
      return rows[0];
    });
  }

  async createDefect(dto: InsertDefectCatalog): Promise<Result<DefectCatalog>> {
    return safeCall(async () => {
      const rows = await db
        .insert(defect_catalog)
        .values({ ...dto, created_at: new Date(), updated_at: new Date() })
        .returning();
      if (!rows[0]) throw new Error('defect_catalog INSERT qaytarmadi');
      return rows[0];
    });
  }

  async updateDefect(id: number, dto: Partial<InsertDefectCatalog>): Promise<Result<DefectCatalog>> {
    return safeCall(async () => {
      const rows = await db
        .update(defect_catalog)
        .set({ ...dto, updated_at: new Date() })
        .where(eq(defect_catalog.id, id))
        .returning();
      if (!rows[0]) throw new Error(`defect_catalog id=${id} UPDATE topilmadi`);
      return rows[0];
    });
  }

  async softDeleteDefect(id: number): Promise<Result<{ id: number; deleted: boolean }>> {
    return safeCall(async () => {
      const rows = await db
        .update(defect_catalog)
        .set({ is_active: false, updated_at: new Date() })
        .where(eq(defect_catalog.id, id))
        .returning({ id: defect_catalog.id });
      if (!rows[0]) throw new Error(`defect_catalog id=${id} o'chirish topilmadi`);
      return { id: rows[0].id, deleted: true };
    });
  }

  // ── AQL TABLE ───────────────────────────────

  async findAqlForLot(lotSize: number, aqlLevel = '2.5'): Promise<Result<QcAql>> {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(qc_aql_table)
        .where(
          and(
            lte(qc_aql_table.lot_size_from, lotSize),
            gte(qc_aql_table.lot_size_to, lotSize),
            eq(qc_aql_table.aql_level, aqlLevel),
            eq(qc_aql_table.is_active, true),
          ),
        )
        .limit(1);
      if (!rows[0]) throw new Error(`AQL qoidasi topilmadi: lot=${lotSize}, aql=${aqlLevel}`);
      return rows[0];
    });
  }

  async findAllAqlRows(): Promise<Result<QcAql[]>> {
    return safeCall(async () =>
      db.select().from(qc_aql_table)
        .where(eq(qc_aql_table.is_active, true))
        .orderBy(asc(qc_aql_table.lot_size_from)),
    );
  }

  async createAqlRow(dto: InsertQcAql): Promise<Result<QcAql>> {
    return safeCall(async () => {
      const rows = await db.insert(qc_aql_table).values(dto).returning();
      if (!rows[0]) throw new Error('qc_aql_table INSERT qaytarmadi');
      return rows[0];
    });
  }

  async updateAqlRow(id: number, dto: Partial<InsertQcAql>): Promise<Result<QcAql>> {
    return safeCall(async () => {
      const rows = await db
        .update(qc_aql_table)
        .set({ ...dto, updated_at: new Date() })
        .where(eq(qc_aql_table.id, id))
        .returning();
      if (!rows[0]) throw new Error(`qc_aql_table id=${id} topilmadi`);
      return rows[0];
    });
  }

  // ── SORT LEVELS ─────────────────────────────

  async findAllSortLevels(): Promise<Result<QcSortLevel[]>> {
    return safeCall(async () =>
      db.select().from(qc_sort_levels)
        .where(eq(qc_sort_levels.is_active, true))
        .orderBy(asc(qc_sort_levels.level)),
    );
  }

  async findSortLevelByLevel(level: string): Promise<Result<QcSortLevel>> {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(qc_sort_levels)
        .where(eq(qc_sort_levels.level, level))
        .limit(1);
      if (!rows[0]) throw new Error(`qc_sort_levels level=${level} topilmadi`);
      return rows[0];
    });
  }

  async createSortLevel(dto: InsertQcSortLevel): Promise<Result<QcSortLevel>> {
    return safeCall(async () => {
      const rows = await db.insert(qc_sort_levels).values(dto).returning();
      if (!rows[0]) throw new Error('qc_sort_levels INSERT qaytarmadi');
      return rows[0];
    });
  }

  async updateSortLevel(id: number, dto: Partial<InsertQcSortLevel>): Promise<Result<QcSortLevel>> {
    return safeCall(async () => {
      const rows = await db
        .update(qc_sort_levels)
        .set({ ...dto, updated_at: new Date() })
        .where(eq(qc_sort_levels.id, id))
        .returning();
      if (!rows[0]) throw new Error(`qc_sort_levels id=${id} topilmadi`);
      return rows[0];
    });
  }

  // ── PHYSICAL NORMS (qc_parameters jadvali orqali) ──

  /**
   * Material card uchun fizik normalarni qaytaradi.
   * qcParameterDefinitions (lib/db/qc-schema.ts:44) — standardId FK bor.
   * Hozirda material_card FK yo'q (gap: missing). Bu metod barcha faol parametrlarni qaytaradi.
   * TODO (P18 gap — egasi ruxsatisiz tegma): material_card_id FK qo'shish kerak (DDL kerak).
   */
  async findPhysicalNorms(opts?: { activeOnly?: boolean }): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      // qc_parameters jadvali (schema-misc-qc.ts:87) mavjud
      // Real SELECT: category='physical' bo'lganlarni qaytaradi
      const { qc_parameters } = await import('@shared/db/schema-misc-qc');
      return db
        .select()
        .from(qc_parameters)
        .where(
          and(
            eq(qc_parameters.category, 'physical' as string),
            opts?.activeOnly !== false ? eq(qc_parameters.isActive, true) : undefined,
          ),
        )
        .orderBy(asc(qc_parameters.name));
    });
  }
}
```

**Import yo'llari tekshiruvi:**
- `@shared/db` → `apps/api/src/shared/db/index.ts` barrel (P02 ta'minlaydi)
- `@shared/db/schema-misc-qc` → to'g'ridan import (barrel'da bo'lmasa ham ishlaydi)
- `@common/result` → `apps/api/src/common/result.ts` mavjudligini tekshir

Agar `@common/result` yo'li boshqacha bo'lsa (masalan `@api/common/result`) — `tsconfig.json`dan tekshir.

---

### QADAM 5 — `qc-catalog.service.ts` (YANGI fayl)

**Fayl:** `apps/api/src/modules/qc/application/qc-catalog.service.ts`

**Shablon (to'liq):**

```typescript
/**
 * @module qc-catalog.service
 * @description QC master-data biznes-qoidalari (defect_catalog, AQL, sort-levels, physical-norms).
 * Faqat repo orqali ishlaydi — db.* to'g'ridan chaqirish TAQIQ (Qoida 15).
 * Result<T> qaytaradi — throw TAQIQ (Qoida 1).
 */

import { Injectable } from '@nestjs/common';
import { QcCatalogRepository } from '../infrastructure/repositories/qc-catalog.repository';
import {
  type DefectCatalog,
  type InsertDefectCatalog,
  type QcAql,
  type InsertQcAql,
  type QcSortLevel,
  type InsertQcSortLevel,
} from '@shared/db/schema-misc-qc';
import { Result, err, AppErr } from '@common/result';

@Injectable()
export class QcCatalogService {

  constructor(private readonly repo: QcCatalogRepository) {}

  // ── DEFECT CATALOG ──────────────────────────

  async listDefects(direction?: string, severity?: string): Promise<Result<DefectCatalog[]>> {
    return this.repo.findAllDefects({ direction, severity, activeOnly: true });
  }

  async getDefectByCode(code: string): Promise<Result<DefectCatalog>> {
    if (!code?.trim()) {
      return err(AppErr('QC_INVALID_INPUT', 'Nuqson kodi kiritilmagan'));
    }
    return this.repo.findDefectByCode(code.trim().toUpperCase());
  }

  async getDefectById(id: number): Promise<Result<DefectCatalog>> {
    if (!Number.isInteger(id) || id < 1) {
      return err(AppErr('QC_INVALID_INPUT', 'Noto\'g\'ri nuqson ID'));
    }
    return this.repo.findDefectById(id);
  }

  async createDefect(dto: InsertDefectCatalog): Promise<Result<DefectCatalog>> {
    // Biznes qoida: code format DEF-X-NNN
    const codePattern = /^DEF-[A-Z]-\d{3}$/;
    if (!codePattern.test(dto.code)) {
      return err(AppErr('QC_INVALID_CODE', `Noto'g'ri kod formati: ${dto.code}. Kerak: DEF-X-NNN`));
    }
    // severity = CRITICAL bo'lsa auto_reject majburiy true
    const enriched: InsertDefectCatalog = {
      ...dto,
      auto_reject: dto.severity === 'CRITICAL' ? true : dto.auto_reject ?? false,
    };
    return this.repo.createDefect(enriched);
  }

  async updateDefect(id: number, dto: Partial<InsertDefectCatalog>): Promise<Result<DefectCatalog>> {
    if (!Number.isInteger(id) || id < 1) {
      return err(AppErr('QC_INVALID_INPUT', 'Noto\'g\'ri ID'));
    }
    // Agar severity CRITICAL ga o'zgarsa — auto_reject=true
    const enriched = dto.severity === 'CRITICAL'
      ? { ...dto, auto_reject: true }
      : dto;
    return this.repo.updateDefect(id, enriched);
  }

  async deleteDefect(id: number): Promise<Result<{ id: number; deleted: boolean }>> {
    if (!Number.isInteger(id) || id < 1) {
      return err(AppErr('QC_INVALID_INPUT', 'Noto\'g\'ri ID'));
    }
    return this.repo.softDeleteDefect(id);
  }

  // ── AQL ─────────────────────────────────────

  /** Lot hajmi bo'yicha AQL qoidasini topadi (EP-QC-003) */
  async getAqlForLot(lotSize: number): Promise<Result<QcAql>> {
    if (!Number.isInteger(lotSize) || lotSize < 1) {
      return err(AppErr('QC_INVALID_INPUT', 'Lot hajmi musbat butun son bo\'lishi kerak'));
    }
    return this.repo.findAqlForLot(lotSize);
  }

  async listAqlTable(): Promise<Result<QcAql[]>> {
    return this.repo.findAllAqlRows();
  }

  async createAqlRow(dto: InsertQcAql): Promise<Result<QcAql>> {
    if (dto.lot_size_from > dto.lot_size_to) {
      return err(AppErr('QC_INVALID_INPUT', 'lot_size_from > lot_size_to bo\'lishi mumkin emas'));
    }
    if (dto.ac_critical >= dto.re_critical) {
      return err(AppErr('QC_INVALID_INPUT', 'AQL: ac_critical < re_critical bo\'lishi shart'));
    }
    return this.repo.createAqlRow(dto);
  }

  async updateAqlRow(id: number, dto: Partial<InsertQcAql>): Promise<Result<QcAql>> {
    return this.repo.updateAqlRow(id, dto);
  }

  // ── SORT LEVELS ─────────────────────────────

  async listSortLevels(): Promise<Result<QcSortLevel[]>> {
    return this.repo.findAllSortLevels();
  }

  async getSortLevelByLevel(level: string): Promise<Result<QcSortLevel>> {
    const allowed = ['1', '2', '3', 'brak'];
    if (!allowed.includes(level)) {
      return err(AppErr('QC_INVALID_INPUT', `Sort darajasi: ${allowed.join('/')}`));
    }
    return this.repo.findSortLevelByLevel(level);
  }

  async createSortLevel(dto: InsertQcSortLevel): Promise<Result<QcSortLevel>> {
    // price_coefficient 0..1 oraliqda
    const coeff = parseFloat(dto.price_coefficient ?? '1.0000');
    if (isNaN(coeff) || coeff < 0 || coeff > 1) {
      return err(AppErr('QC_INVALID_INPUT', 'Narx koeffitsienti 0.0000-1.0000 oraliqda bo\'lishi kerak'));
    }
    return this.repo.createSortLevel(dto);
  }

  async updateSortLevel(id: number, dto: Partial<InsertQcSortLevel>): Promise<Result<QcSortLevel>> {
    if (dto.price_coefficient !== undefined) {
      const coeff = parseFloat(dto.price_coefficient);
      if (isNaN(coeff) || coeff < 0 || coeff > 1) {
        return err(AppErr('QC_INVALID_INPUT', 'Narx koeffitsienti 0.0000-1.0000 oraliqda'));
      }
    }
    return this.repo.updateSortLevel(id, dto);
  }

  // ── PHYSICAL NORMS ──────────────────────────

  async getPhysicalNorms(): Promise<Result<Record<string, unknown>[]>> {
    return this.repo.findPhysicalNorms({ activeOnly: true });
  }
}
```

---

### QADAM 6 — `qc-catalog.controller.ts` (YANGI fayl)

**Fayl:** `apps/api/src/modules/qc/presentation/qc-catalog.controller.ts`

**Qoidalar:** Qoida 3 (Zod), Qoida 6 (transport only), Qoida 8 (JWT guard), Q-40 (real DB).

**Shablon (to'liq):**

```typescript
/**
 * @module qc-catalog.controller
 * @description QC master-data REST API: defect_catalog, AQL, sort-levels, physical-norms.
 * Transport layer only — biznes logika QcCatalogService da.
 * Endpoint'lar: /api/qc/catalog, /api/qc/aql, /api/qc/sort-levels, /api/qc/physical-norms
 */

import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, ParseIntPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { QcCatalogService } from '../application/qc-catalog.service';
import { unwrapOrThrow } from '@common/result';
import { z } from 'zod';

// ── Zod schemalar ──────────────────────────────

const CreateDefectSchema = z.object({
  code: z.string().min(3).max(20),
  name_uz: z.string().min(1).max(200),
  name_ru: z.string().max(200).optional(),
  name_cyr: z.string().max(200).optional(),
  direction: z.enum(['universal', 'gofra', 'offset', 'silkscreen', 'flexi']),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']),
  auto_reject: z.boolean().optional(),
  description_uz: z.string().optional(),
  corrective_action_uz: z.string().optional(),
});

const UpdateDefectSchema = CreateDefectSchema.partial();

const CreateAqlSchema = z.object({
  lot_size_from: z.number().int().min(1),
  lot_size_to: z.number().int().min(1),
  sample_size: z.number().int().min(1),
  ac_critical: z.number().int().min(0).default(0),
  re_critical: z.number().int().min(1).default(1),
  ac_major: z.number().int().min(0).default(1),
  re_major: z.number().int().min(1).default(2),
  ac_minor: z.number().int().min(0).default(3),
  re_minor: z.number().int().min(1).default(4),
  aql_level: z.string().default('2.5'),
});

const CreateSortLevelSchema = z.object({
  level: z.enum(['1', '2', '3', 'brak']),
  name_uz: z.string().min(1).max(100),
  name_ru: z.string().max(100).optional(),
  price_coefficient: z.string().regex(/^\d+\.\d{4}$/).default('1.0000'),
  description_uz: z.string().optional(),
});

const UpdateSortLevelSchema = CreateSortLevelSchema.partial().omit({ level: true });

// ── Controller ─────────────────────────────────

@Controller('qc')
@UseGuards(JwtAuthGuard)
export class QcCatalogController {

  constructor(private readonly svc: QcCatalogService) {}

  // ── DEFECT CATALOG ──────────────────────────

  /** GET /api/qc/catalog?direction=gofra&severity=CRITICAL */
  @Get('catalog')
  async listDefects(
    @Query('direction') direction?: string,
    @Query('severity') severity?: string,
  ) {
    const result = await this.svc.listDefects(direction, severity);
    return unwrapOrThrow(result);
  }

  /** GET /api/qc/catalog/code/:code */
  @Get('catalog/code/:code')
  async getDefectByCode(@Param('code') code: string) {
    const result = await this.svc.getDefectByCode(code);
    return unwrapOrThrow(result);
  }

  /** GET /api/qc/catalog/:id */
  @Get('catalog/:id')
  async getDefectById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.svc.getDefectById(id);
    return unwrapOrThrow(result);
  }

  /** POST /api/qc/catalog */
  @Post('catalog')
  @HttpCode(HttpStatus.CREATED)
  async createDefect(@Body() body: unknown) {
    const dto = CreateDefectSchema.parse(body);
    const result = await this.svc.createDefect(dto);
    return unwrapOrThrow(result);
  }

  /** PUT /api/qc/catalog/:id */
  @Put('catalog/:id')
  async updateDefect(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = UpdateDefectSchema.parse(body);
    const result = await this.svc.updateDefect(id, dto);
    return unwrapOrThrow(result);
  }

  /** DELETE /api/qc/catalog/:id (soft delete) */
  @Delete('catalog/:id')
  async deleteDefect(@Param('id', ParseIntPipe) id: number) {
    const result = await this.svc.deleteDefect(id);
    return unwrapOrThrow(result);
  }

  // ── AQL ─────────────────────────────────────

  /** GET /api/qc/aql — to'liq jadval */
  @Get('aql')
  async listAqlTable() {
    const result = await this.svc.listAqlTable();
    return unwrapOrThrow(result);
  }

  /** GET /api/qc/aql/lookup?lot_size=500 — lot hajmiga mos qoida */
  @Get('aql/lookup')
  async aqlLookup(@Query('lot_size') lotSizeStr: string) {
    const lotSize = parseInt(lotSizeStr, 10);
    if (isNaN(lotSize) || lotSize < 1) {
      throw new Error('lot_size musbat son bo\'lishi kerak');
    }
    const result = await this.svc.getAqlForLot(lotSize);
    return unwrapOrThrow(result);
  }

  /** POST /api/qc/aql */
  @Post('aql')
  @HttpCode(HttpStatus.CREATED)
  async createAqlRow(@Body() body: unknown) {
    const dto = CreateAqlSchema.parse(body);
    const result = await this.svc.createAqlRow(dto);
    return unwrapOrThrow(result);
  }

  /** PUT /api/qc/aql/:id */
  @Put('aql/:id')
  async updateAqlRow(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = CreateAqlSchema.partial().parse(body);
    const result = await this.svc.updateAqlRow(id, dto);
    return unwrapOrThrow(result);
  }

  // ── SORT LEVELS ─────────────────────────────

  /** GET /api/qc/sort-levels */
  @Get('sort-levels')
  async listSortLevels() {
    const result = await this.svc.listSortLevels();
    return unwrapOrThrow(result);
  }

  /** GET /api/qc/sort-levels/:level (level = '1'|'2'|'3'|'brak') */
  @Get('sort-levels/:level')
  async getSortLevel(@Param('level') level: string) {
    const result = await this.svc.getSortLevelByLevel(level);
    return unwrapOrThrow(result);
  }

  /** POST /api/qc/sort-levels */
  @Post('sort-levels')
  @HttpCode(HttpStatus.CREATED)
  async createSortLevel(@Body() body: unknown) {
    const dto = CreateSortLevelSchema.parse(body);
    const result = await this.svc.createSortLevel(dto);
    return unwrapOrThrow(result);
  }

  /** PUT /api/qc/sort-levels/:id */
  @Put('sort-levels/:id')
  async updateSortLevel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = UpdateSortLevelSchema.parse(body);
    const result = await this.svc.updateSortLevel(id, dto);
    return unwrapOrThrow(result);
  }

  // ── PHYSICAL NORMS ──────────────────────────

  /** GET /api/qc/physical-norms — fizik parametr normalari (EP-QC-015/031/033) */
  @Get('physical-norms')
  async getPhysicalNorms() {
    const result = await this.svc.getPhysicalNorms();
    return unwrapOrThrow(result);
  }
}
```

**`unwrapOrThrow` helper tekshiruvi:**

Agar `@common/result` da `unwrapOrThrow` yo'q bo'lsa (faqat `ok`/`err`/`AppErr` mavjud) — quyidagi local helper qo'sh:

```typescript
// controller boshida (import'lardan keyin)
function unwrapOrThrow<T>(result: Result<T>): T {
  if (!result.ok) {
    const { HttpException, HttpStatus } = require('@nestjs/common');
    throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST);
  }
  return result.data;
}
```

Agar `unwrapOrThrow` allaqachon mavjud bo'lsa — import qil, yuqoridagi bloкni qo'shma.

---

### QADAM 7 — `qc.module.ts`: Yangi provider/controller qo'shish

**Fayl:** `apps/api/src/modules/qc/qc.module.ts`

**Hozirgi holat:**
- `repositories` bloki (satr 86:96): `DrizzleQcReclamationRepo`, `DrizzleDefectRepository`, ...
- `controllers` ro'yxati (satr 100:110): 9 ta controller
- `providers` ro'yxati (satr 111:142): commandHandlers, queryHandlers, ...

**O'zgarish 1 — import qo'shish (fayl boshiga):**

```typescript
// Hozirgi import'lardan keyin (satr 65 atrofida)
import { QcCatalogRepository } from './infrastructure/repositories/qc-catalog.repository';
import { QcCatalogService } from './application/qc-catalog.service';
import { QcCatalogController } from './presentation/qc-catalog.controller';
```

**O'zgarish 2 — `repositories` blokiga qo'shish (satr 86:96):**

```typescript
// Oldin:
const repositories = [
  DrizzleQcReclamationRepo,
  { provide: QC_DEFECT_REPO, useClass: DrizzleDefectRepository },
  ...
];

// Keyin:
const repositories = [
  DrizzleQcReclamationRepo,
  { provide: QC_DEFECT_REPO, useClass: DrizzleDefectRepository },
  { provide: DEFECTS_REPO, useClass: DrizzleDefectsRepository },
  { provide: QC_COMPUTE_REPO, useClass: DrizzleQcComputeRepository },
  QcNewRepository,
  QcParametersRepository,
  QcCatalogRepository,   // ← yangi
];
```

**O'zgarish 3 — `@Module` controllers (satr 100:110):**

```typescript
// Oldin:
controllers: [
  QcInspectionsController,
  ...
  QcDpmoController,
],

// Keyin:
controllers: [
  QcInspectionsController,
  QcDefectsController,
  QcExtendedController,
  QcDefectsExtendedController,
  QcReclamationsController,
  QcNewController,
  QcParametersController,
  PrintController,
  QcDpmoController,
  QcCatalogController,   // ← yangi
],
```

**O'zgarish 4 — `providers` (satr 111 atrofida, `DefectsService` dan oldin):**

```typescript
providers: [
  ...commandHandlers,
  ...eventHandlers,
  ...queryHandlers,
  ...repositories,
  ...
  QcCatalogService,   // ← yangi (repositorylardan keyin)
  DefectsService,
  ...
],
```

**O'zgarish 5 — exports (satr 143:148):**

```typescript
// Oldin:
exports: [QC_DEFECT_REPO, QC_REPOSITORY_PROVIDER, DEFECTS_REPO, DefectsService, ...],

// Keyin (QcCatalogService export qilinadi — boshqa modul kerak qilishi mumkin):
exports: [
  QC_DEFECT_REPO, QC_REPOSITORY_PROVIDER, DEFECTS_REPO,
  DefectsService, QcCatalogService,   // ← yangi
  DefectDetectorService, SpcService, FmeaService,
  InkConsumptionService, ImpositionService, SpoilageService, DeltaEService,
  DpmoService,
],
```

---

## 5. DDL (GATED)

Yuqorida qadam 3da to'liq SQL berildi. Bu bo'lim egasi uchun xulosa:

| Migration fayl | Jadval | Holat |
|---|---|---|
| `p18-d1-defect-catalog.sql` | `defect_catalog` | GATED — `-- APPROVED:` kutilmoqda |
| `p18-d2-qc-aql-table.sql` | `qc_aql_table` | GATED — `-- APPROVED:` kutilmoqda |
| `p18-d3-qc-sort-levels.sql` | `qc_sort_levels` | GATED — `-- APPROVED:` kutilmoqda |

**Egasi qadamlari:**

1. Har migration faylida `-- APPROVED: <ism> <sana>` o'rniga to'liq ma'lumot kiritadi
2. "Ishga tushir" deb aytadi
3. Executor ishga tushiradi:
   ```bash
   psql $DATABASE_URL -f apps/api/src/shared/db/migrations/p18-d1-defect-catalog.sql
   psql $DATABASE_URL -f apps/api/src/shared/db/migrations/p18-d2-qc-aql-table.sql
   psql $DATABASE_URL -f apps/api/src/shared/db/migrations/p18-d3-qc-sort-levels.sql
   # D1 dan keyin seed:
   psql $DATABASE_URL -f docs/migration/seed/seed-05-defects.sql
   ```

**Tartib:** D1 → seed-05-defects.sql → D2 → D3. D1 bo'lmasa seed ishlamaydi (jadval yo'q).

---

## 6. QABUL MEZONI

### 6.1 Kod sifati

- [ ] BE `tsc --noEmit` 0 xato
- [ ] `bash scripts/reviewer-result-pattern.sh` — yangi fayllar FAIL: 0
- [ ] `bash scripts/reviewer-dto-validation.sh` — controller'da Zod PASS
- [ ] `bash scripts/reviewer-jwt-guard.sh` — `QcCatalogController` PASS
- [ ] `bash scripts/reviewer-as-unknown.sh` — yangi fayllar 0

### 6.2 Schema sifati

- [ ] `schema-misc-qc.ts`: `defect_catalog`, `qc_aql_table`, `qc_sort_levels` pgTable eksport qilingan
- [ ] `qc-schema.ts`: 3 yangi jadval va ularning Zod schema/type'lari re-export qilingan
- [ ] Import/export'larda cyclic import yo'q (`dedup-safety-rules.md §3`)

### 6.3 Funksionallik (real DB-proof)

- [ ] `defect_catalog` — INSERT va SELECT ishlaydi:
  ```bash
  curl -s -X POST http://localhost:3030/api/qc/catalog \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"code":"DEF-T-001","name_uz":"Test","direction":"universal","severity":"MINOR"}' \
    | jq '.id'
  # → raqam (null emas)
  ```
- [ ] `qc_aql_table` — AQL lookup ishlaydi:
  ```bash
  curl -s "http://localhost:3030/api/qc/aql/lookup?lot_size=200" \
    -H "Authorization: Bearer $TOKEN" | jq '.sample_size'
  # → 20 (yoki tegishli A-default qiymat)
  ```
- [ ] `qc_sort_levels` — ro'yxat 4 qator qaytaradi:
  ```bash
  curl -s "http://localhost:3030/api/qc/sort-levels" \
    -H "Authorization: Bearer $TOKEN" | jq 'length'
  # → 4
  ```
- [ ] `physical-norms` — 404 emas, bo'sh massiv yoki natija:
  ```bash
  curl -s "http://localhost:3030/api/qc/physical-norms" \
    -H "Authorization: Bearer $TOKEN" | jq 'type'
  # → "array"
  ```

### 6.4 Regressiya yo'qligi (golden-thread)

- [ ] Mavjud QC endpointlar ishlashda davom etadi:
  ```bash
  curl -s http://localhost:3030/api/qc/defects -H "Authorization: Bearer $TOKEN" | jq 'type'
  curl -s http://localhost:3030/api/qc/reclamations -H "Authorization: Bearer $TOKEN" | jq 'type'
  curl -s http://localhost:3030/api/qc/inspections -H "Authorization: Bearer $TOKEN" | jq 'type'
  ```
  Har biri `"array"` yoki `{data: [...]}` qaytarishi kerak (500 emas).

### 6.5 Vizyon-moslik (Q-40)

- [ ] `defect_catalog` faqat **kodlangan lug'at** (26 ta seed yozuv); dinamik yozuvlar ham qo'shiladi (CRUD ishlaydi)
- [ ] AQL lookup `lot_size=1` → `sample_size=5` (D2 default qiymati bilan)
- [ ] `price_coefficient=0.0000` → brak (sifir koeffitsient)
- [ ] `severity=CRITICAL` → `auto_reject=true` (service biznes qoidasi)
- [ ] `/api/qc/aql` URL yagona (P19 da `/api/qc/aql-table` URL ishlatilmaydi)

### 6.6 Tushib qolgan vizyon elementlari — DEFER YOZUVLARI (OCHIQ-JAVOBLAR §QC)

> Quyidagi elementlar egasi AYNAN talab qilgan (OCHIQ-JAVOBLAR §QC liniyalar 291-297), lekin P18 Wave-1 doirасида emas.
> **Keyingi paketga (P18-Wave-2 yoki alohida paket) o'tkazildi. Bu elementlar jim yo'qolmaydi — flaglangan.**

| Vizyon elementi | Egasi qaror kodi | Defer sababi | Keyingi qadam |
|---|---|---|---|
| **Sertifikat-PDF** (avto PDF, SF-2026-NNNNN, uz/ru/en shablon, laborant+sifat-boshlig'i imzo+QR) | EP-QC-014/060-064 | Wave-1 = master-data DDL only; PDF generator + template infra kerak | P18-Wave-2 yoki alohida FE paket; **EGASI QIYMATI KERAK**: sertifikat shablon formati (uz/ru/en raqam) |
| **DPMO/Sigma tahlili** (brak% → DPMO, sigma darajasi) | EP-QC-018 | Statistik hisob-kitob; qcBraks + qcInspections ma'lumoti kerak (P19 dan keyin) | P18-Wave-2; **EGASI QIYMATI KERAK**: sigma maqsad (masalan 4σ) |
| **Pareto tahlili** (nuqson sabab-tur bo'yicha Pareto 80/20) | EP-QC-020 | Reporting/chart layer; Wave-1 da ma'lumot emas | P18-Wave-2; defect_catalog direction/severity asosida |
| **COQ (sifat xarajati)** — ichki+tashqi brak xarajati | EP-QC-025 | GL/FIN integratsiya kerak; FIN module bilan kross-modul | FIN modul bilan birgalikda; **EGASI QIYMATI KERAK**: GL kod (xarajat markazi) |
| **СОЗ-Telegram xabardorlik** (anomaliya topilganda СОЗ + texnolog + uchastka rahbari Telegram) | EP-QC-024 | NTF modul (P46/P47) tayyor bo'lgandan keyin; routing matritsa kerak | NTF modul bilan birgalikda (P47 routing); **EGASI QIYMATI KERAK**: Telegram guruh ID'lari |
| **Brak ≤ 2% maqsad** (har operatsiyaga sozlanadigan threshold, asl 2% A-default) | EP-QC-084 | Threshold master-data jadvalida saqlanishi kerak, qotirilmaydi | `qc_sort_levels` jadvaliga yaqin — yoki alohida `qc_config` jadval; **EGASI QIYMATI KERAK**: har operatsiya turi uchun brak% maqsad |
| **Retest** (chegara zonasida 2-namuna qayta tekshiruv) | EP-QC-075 | AQL lookup mantig'ining kengaytmasi; Wave-2 | AQL servis kengaytmasi; chegara = Ac va Re o'rtasidagi zona |

---

## 7. SELF-VERIFY

### 7.1 TypeScript tekshiruv

```bash
# Backend tsc
cd C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | tail -20
# Kutilayotgan: 0 xato

# lib/db tsc
pnpm --filter @europrint/db exec tsc --noEmit 2>&1 | tail -10
# Kutilayotgan: 0 xato
```

### 7.2 Migration tekshiruv (GATED — egasi ruxsatidan keyin)

```bash
# D1
psql $DATABASE_URL -c "\d defect_catalog"
# → ustunlar ro'yxati: id, code, name_uz, direction, severity, ...

# D2
psql $DATABASE_URL -c "SELECT lot_size_from, lot_size_to, sample_size FROM qc_aql_table ORDER BY lot_size_from;"
# → 7 qator (default qiymatlar)

# D3
psql $DATABASE_URL -c "SELECT level, name_uz, price_coefficient FROM qc_sort_levels ORDER BY level;"
# → 4 qator: 1, 2, 3, brak

# Seed
psql $DATABASE_URL -c "SELECT direction, count(*) FROM defect_catalog GROUP BY direction;"
# → universal:4, gofra:6, offset:7, silkscreen:3, flexi:3
```

### 7.3 API round-trip

```bash
# 1. Token olish
TOKEN=$(curl -s -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}' | jq -r '.access_token')

# 2. Defect yaratish
NEW_ID=$(curl -s -X POST http://localhost:3030/api/qc/catalog \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "DEF-T-TEST",
    "name_uz": "Test nuqson",
    "direction": "universal",
    "severity": "MINOR"
  }' | jq -r '.id')
echo "Yangi ID: $NEW_ID"

# 3. Qayta o'qish (real saqlangan ekanini tasdiqlash)
curl -s "http://localhost:3030/api/qc/catalog/$NEW_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{id, code, name_uz}'

# 4. AQL lookup
curl -s "http://localhost:3030/api/qc/aql/lookup?lot_size=500" \
  -H "Authorization: Bearer $TOKEN" | jq '{lot_size_from, lot_size_to, sample_size, ac_major}'

# 5. Sort levels
curl -s "http://localhost:3030/api/qc/sort-levels" \
  -H "Authorization: Bearer $TOKEN" | jq '[.[] | {level, price_coefficient}]'

# 6. Mavjud endpoint'lar regressiya yo'q
for ep in defects reclamations inspections parameters; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://localhost:3030/api/qc/$ep" \
    -H "Authorization: Bearer $TOKEN")
  echo "$ep: $STATUS"
done
# Hamma 200 bo'lishi kerak
```

### 7.4 qc.module.ts ro'yxat tekshiruv

```bash
grep -n "QcCatalogController\|QcCatalogService\|QcCatalogRepository" \
  apps/api/src/modules/qc/qc.module.ts
# Har birida satr raqami ko'rinishi kerak (import + providers + controllers + exports)
```

### 7.5 Drizzle schema eksport tekshiruv

```bash
# schema-misc-qc.ts'da yangi jadvallar bormi
grep -n "defect_catalog\|qc_aql_table\|qc_sort_levels" \
  apps/api/src/shared/db/schema-misc-qc.ts

# qc-schema.ts'da re-export bormi
grep -n "defect_catalog\|qcAqlTable\|qcSortLevels\|defectCatalog" \
  lib/db/src/schema/qc-schema.ts
```

---

## 8. COMMIT

**QADAM 1 qadam yakunda (schema + migration fayllar):**

```bash
git add apps/api/src/shared/db/schema-misc-qc.ts
git add lib/db/src/schema/qc-schema.ts
git add apps/api/src/shared/db/migrations/p18-d1-defect-catalog.sql
git add apps/api/src/shared/db/migrations/p18-d2-qc-aql-table.sql
git add apps/api/src/shared/db/migrations/p18-d3-qc-sort-levels.sql
git commit -m "feat(qc/p18): defect_catalog+aql_table+sort_levels Drizzle schema + GATED migrations

- schema-misc-qc.ts: defect_catalog, qc_aql_table, qc_sort_levels pgTable + Zod schemas
- qc-schema.ts: re-export yangi jadvallar (lib barrel)
- migrations: p18-d1/d2/d3 GATED (egasi APPROVED kutilmoqda)
- EP-QC-003 AQL 2.5 | EP-QC-005 3-daraja | EP-QC-072 sort"
```

**QADAM 2 (repo + service + controller + module):**

```bash
git add apps/api/src/modules/qc/infrastructure/repositories/qc-catalog.repository.ts
git add apps/api/src/modules/qc/application/qc-catalog.service.ts
git add apps/api/src/modules/qc/presentation/qc-catalog.controller.ts
git add apps/api/src/modules/qc/qc.module.ts
git commit -m "feat(qc/p18): QcCatalogRepository + Service + Controller + module registration

- qc-catalog.repository.ts: defect CRUD + AQL lookup + sort-levels + physical-norms
- qc-catalog.service.ts: biznes qoidalar (severity=CRITICAL→auto_reject, AQL validation)
- qc-catalog.controller.ts: /api/qc/catalog /api/qc/aql /api/qc/sort-levels /api/qc/physical-norms
- qc.module.ts: QcCatalogRepository/Service/Controller ro'yxatga qo'shildi
- Result<T> + Zod + JwtAuthGuard — barcha endpointlarda"
```

**QADAM 3 (migration ishga tushirilgandan keyin — egasi APPROVED bergandan so'ng):**

```bash
git add apps/api/src/shared/db/migrations/p18-d1-defect-catalog.sql
git add apps/api/src/shared/db/migrations/p18-d2-qc-aql-table.sql
git add apps/api/src/shared/db/migrations/p18-d3-qc-sort-levels.sql
git commit -m "chore(qc/p18): DDL migrations APPROVED + applied

- D1: defect_catalog CREATE TABLE (direction/severity CHECK constraints)
- D2: qc_aql_table CREATE TABLE + 7 AQL 2.5 default rows
- D3: qc_sort_levels CREATE TABLE + 4 default sort (1/2/3/brak)
- APPROVED: egasi <sana>"
```

**TAQIQLANGAN:** `git add -A`, `git add .`, bir commitda boshqa modul fayllari.

---

## 9. EDGE HOLATLAR VA OGOHLANTIRISHLAR

### 9.1 `schema-misc-qc.ts` dual `qc_standards` muammosi

`schema-misc-qc.ts:111` da `qc_standards` pgTable bor. `lib/db/qc-schema.ts:22` da ham `qcStandards` bor — bular bir xil jadval, ikkita Drizzle ta'rifi.

**P18 bu ikkilikni TEGMAYDI** (owned files ichida emas, P07 ishi). Agar re-export qilishda `qcStandards` nomlar to'qnashuv bo'lsa — re-export'ga faqat yangi 3 ta jadvalni kiritasan, `qcStandards` ni chiqarma.

### 9.2 `@shared/db` barrel'da `defect_catalog` yo'q bo'lishi

P02 barrel yangi jadvallarni avtomatik qo'shmasligi mumkin. Agar repository'da `import { defect_catalog } from '@shared/db'` ishlamasa — to'g'ridan import qil:
```typescript
import { defect_catalog } from '@shared/db/schema-misc-qc';
```

### 9.3 AQL lookup uchun edge case

`lot_size=999999` dan katta bo'lsa — `lot_size_to=999999` qator mos kelmaydi. Service'da:
```typescript
const safeSize = Math.min(lotSize, 999999);
return this.repo.findAqlForLot(safeSize);
```

### 9.4 `price_coefficient` tip

Drizzle'da `decimal` TypeScript `string` qaytaradi. Controller'dan `parseFloat` qilmang — faqat `string` formatida saqlang va qaytaring. FE o'zi parslab ishlatadi.

### 9.5 `drizzle-zod` import

`lib/db/src/schema/qc-schema.ts` allaqachon `createInsertSchema` import qilgan (satr 9). `schema-misc-qc.ts`da esa yo'q — yangi import qo'shiladi. `drizzle-zod` paket `package.json`da borligini tekshir:
```bash
grep "drizzle-zod" apps/api/package.json lib/db/package.json
```
Agar yo'q bo'lsa: `pnpm --filter @europrint/api add drizzle-zod` (va `@europrint/db` uchun ham).

### 9.6 `qcRootCauses` migratsiya gap

`lib/db/qc-schema.ts:333` da `qcRootCauses` Drizzle ta'rifi bor lekin migratsiya yo'q (gap). **Bu P18 emas** — alohida flag: egasiga xabar ber, P07 yoki keyingi commit'da yechiladi.

---

## 10. HOLAT HISOBOTI SHABLONI (egaga yuborish uchun)

Har qadam bitganda Uzbek tilida:

```
✅ P18 QADAM [N] YAKUNLANDI

Nima bajarildi:
- [fayl]: [qanday o'zgardi]
- ...

DB-proof:
- defect_catalog: [N] qator
- qc_aql_table: [N] qator
- qc_sort_levels: [N] qator

tsc: 0 xato
Commit: [hash]

Navbatdagi qadam: [N+1] — [tavsif]
Ruxsat kerakmi? [ha/yo'q]
```

---

*P18 direktiva — Wave 1 — QC poydevor lug'at. Yaratildi: 2026-06-19.*
*dependsOn: P01 (lib barrel), P02 (api barrel). ddlGate: true.*
*Manba: docs/audit/MUSLIMBEK-PROMT-07-QC-2026-06-08.md §PHASE 1 + gap map.*
