# P06 — GOLDEN: GOLDEN spine schema: sales_order_items pgTable + gl_account_mappings seed

**Wave:** 1 | **dependsOn:** [] | **ddlGate:** true | **Paket:** P06-GOLDEN-golden-schema-seed

---

## 0. ROL VA QOIDALAR

```
QOIDALAR BLOKI (Q-47 — har direktivaga kiritilsin):

1.  Result<T> hamma repo/service metodida; throw/null/undefined TAQIQ.
2.  @Body Zod bilan validate; class-validator TAQIQ.
3.  Drizzle ORM; raw SQL faqat murakkab holatda (izoh + typedExecute<T>).
4.  Q-40 ishlaydi≠to'g'ri: REAL INSERT/UPDATE + DB-proof; echo/hardcoded/fake javob TAQIQ.
5.  Q-46 ishlab turgan kod O'CHIRILMAYDI; buzuq/o'lik/dublikat kod TO'LIQ o'chiriladi (chala emas).
6.  FAYL IZOLYATSIYASI (Qoida 23 / Q-23 / Q-31): faqat shu paketning OWNED-FILE
    ro'yxatidagi fayllarga teg. Boshqa fayl kerak bo'lsa — TO'XTA, egasiga flag qil,
    supurib ketma.
7.  DDL DARVOZASI (Q-35): CREATE TABLE / migration faqat egasi ruxsati bilan;
    migration faylida `-- APPROVED:` izoh shart. Paket DDL talab qilsa — migrationni
    YOZ lekin GATED belgila, ISHGA TUSHIRMA.
8.  git add <aniq-fayl> faqat; -A / . TAQIQ. Bitta commit = bitta mantiqiy guruh.
9.  Q-45/Q-30 log/secret HECH QACHON commit qilinmaydi; JWT minting yo'q.
10. Self-verify: BE tsc 0, FE tsc 0, tegishli reviewer skriptlar, jonli DB-proof
    (kirit→saqla→qayta o'qi→ko'rinadimi).
11. "V2"/"Strangler Fig"/"V1 vs V2" terminologiyasi TAQIQ — bitta kod bazasi, shu
    yerda to'g'irlanadi.
12. Vizyon-moslik: TO'G'RI o'lchovi = master vizyon (docs/XARITA-REJA-YONALISH +
    modul vizyon-hujjati); kod vizyonga zid bo'lsa (ishlasa ham) = xato.
```

**Bu agentning WAVE:** 1 (blokerlar yo'q; birinchi to'lqinda mustaqil bajarilishi mumkin).
**dependsOn:** [] — hech qaysi boshqa paketga bog'liq emas. P06 o'zi Wave-1 ning poydevori.

---

## 1. IZOLYATSIYA MANIFESTI

### FAQAT shu ikkita faylga teg. Boshqa fayl kerak bo'lsa — TO'XTA + egasiga flag qil.

| # | Fayl (loyiha ichidagi yo'l) | Holat |
|---|------------------------------|-------|
| F1 | `Uzbek-Language-Module/apps/api/src/shared/db/schema-core.ts` | MAVJUD — qo'shimcha qo'shiladi |
| F2 | `Uzbek-Language-Module/docs/migration/seed/seed-06-gl-account-mappings.sql` | YANGI — yaratiladi |

**DDL DARVOZASI (Q-35):**
- `seed-06-gl-account-mappings.sql` — DATA SEED (DDL emas; `CREATE TABLE` yo'q).
  `gl_account_mappings` jadvali allaqachon mavjud (`schema-business-b-1.ts:124`
  va `migrations-drift.ts:1875`). Bu paket faqat jadvalga QATOR QO'SHADI — DDL
  emas, shuning uchun `APPROVED:` sharhi owner 2026-06-05 dan olingan (mavjud
  `seed-gl-account-mappings-pos.sql` namunasidan).
- `schema-core.ts` ga qo'shiladigan `sales_order_items` pgTable — BU DDL EMAS
  (Drizzle sxema ta'rifi, migration emas). Lekin **RULE4 ogohlantirishi** yozilishi
  shart: `sales_orders.id` schema-core.ts da `uuid` PK, lekin jonli DB da
  `sales_order_items.sales_order_id` `integer` (raw SQL da tasdiqlanganini
  `drizzle-sales-order.repo.ts:67-71` ko'rsatadi). Drizzle FK ni to'liq qo'yish
  MUMKIN EMAS — RULE4 izoh bilan FK o'chirib qoldiriladi; raw SQL ishlatilishda davom
  etadi.

---

## 2. VIZYON

### 2.1 GOLDEN spine nima?

GOLDEN modul — EuroPrint ERP ning "oltin zanjir" harakatlanuvchi qismi:
```
SD (sotuv order) → PP (ishlab chiqarish) → MES (sexda) → QC (sifat) → WMS (ombor) → FIN (moliya/GL)
```
Bu oltin zanjir ishlashi uchun ikkita asosiy "umurtqa pog'ona" kerak:
1. **`sales_order_items` Drizzle pgTable** — sotuv orderining satr-satri (SKU, miqdor,
   narx). Hozir `schema-core.ts` da YO'Q; mavjud pgTable lib/db ichida `varchar` FK
   bilan drift qilgan. `schema-core.ts` da `integer` FK li kanonik ta'rif bo'lishi
   kerak — shunda TypeScript kompilyatori buyurtma satrlarini to'g'ri tiplar bilan
   taniydi.
2. **`gl_account_mappings` seed (8 ta tur)** — `postMovementToLedger` har harakat
   turini GL hisobiga ko'chirishda `gl_account_mappings` jadvalidan hisobni qidiradi.
   Jadval bo'sh bo'lsa, ko'chirish "posted: false" qaytaradi va moliyaviy hisob
   yaratilmaydi. Mavjud `seed-gl-account-mappings-pos.sql` 6 turni qamrab olgan;
   `INVENTORY_ADJUST` (POS Monitor dagi 7-tur) va `INVENTORY_ADJ_MINUS` (salbiy
   tuzatish) yo'q. Bu seed faylda 8 ta tur to'liq bo'ladi.

### 2.2 Qabul mezoni — vizyon bo'yicha

| Mezon | Izoh |
|-------|------|
| `schema-core.ts` eksporti TypeScript bilan kompilyatsiya qiladi (tsc 0) | `sales_order_items` pgTable to'g'ri Drizzle tiplar bilan |
| `seed-06-gl-account-mappings.sql` idempotent | `WHERE NOT EXISTS` bilan, xavfsiz qayta-ishga-tushirish |
| 8 ta harakat turi qamrab olingan | EXTERNAL_IN/OUT, INTERNAL_ISSUE/RETURN/TRANSFER, DAMAGE, INVENTORY_ADJ_PLUS, INVENTORY_ADJ_MINUS |
| `postMovementToLedger` qaytadan chaqirilganda `posted: true` qaytaradi | GL mapping bo'lgandan keyin real entries satr yoziladi |
| RULE4 ogohlantirishi `sales_order_items` da aniq yozilgan | FK drift haqida kelajakdagi ishlovchi aldanmasin |

### 2.3 Mavjud `seed-gl-account-mappings-pos.sql` bilan munosabat

Bu yangi `seed-06-gl-account-mappings.sql` — qo'shimcha (boshqa joy), mavjud fayl
o'zgartirilmaydi (Q-46, Q-39). Ikki fayl bir-biriga zid emas: ikkalasi ham idempotent
`WHERE NOT EXISTS` bilan ishlaydi — birinchi yugursa ham, ikkinchisi ham xavfsiz.
Yangi fayl `docs/migration/seed/` yo'lida, eski esa `apps/api/src/shared/db/migrations/`
ichida — turli joylar.

---

## 3. HOZIRGI HOLAT

### 3.1 F1 — `schema-core.ts` da `sales_order_items` YO'Q

**Fayl:** `apps/api/src/shared/db/schema-core.ts`
**Holat fayli oxiri (214-qator):**
```typescript
// sales_orders jadvali 181-213-qatorlarda ta'riflangan, undan keyin fayl tugaydi.
// sales_order_items pgTable UMUMAN YO'Q schema-core.ts da.
```

**Lib/DB da MAVJUD (drift bilan):**
- `lib/db/src/schema/sd-order-items.ts:181` — `salesOrderItems` pgTable BORDA, lekin:
  - `salesOrderId: varchar("sales_order_id")` — **varchar!** jonli DB esa `integer`
    (raw SQL ni `drizzle-sales-order.repo.ts:67` ko'rsatadi: `INSERT INTO
    sales_order_items (sales_order_id, ...)` — integer ustun).
  - `materialId: varchar("material_id")` — **varchar!** jonli DB da `integer`
    (`add-sales-orders-fks.sql:39-41` ko'rsatadi: FK `integer` FK).

**Ko'p qayta ishlatiladigan raw SQL sababi:** `drizzle-sales-order.repo.ts:65-66`
komentariyida yozilgan:
```typescript
// Raw SQL targets the LIVE columns (the drizzle salesOrderItems stub drifts material_id/sales_order_id
// to varchar; live is integer). product_id binds to products (finished goods, owner 2026-06-05).
```

**Xulosa:** `schema-core.ts` da `sales_order_items` yo'q, lib/db versiyasi drift qilgan.

### 3.2 F2 — `seed-06-gl-account-mappings.sql` YO'Q

**Yo'l:** `docs/migration/seed/seed-06-gl-account-mappings.sql`
Joriy holat: fayl umuman mavjud emas.

**Mavjud seed (qisman):**
`apps/api/src/shared/db/migrations/seed-gl-account-mappings-pos.sql` — 6 tur:
```sql
EXTERNAL_IN, EXTERNAL_OUT, INTERNAL_ISSUE, INTERNAL_RETURN, DAMAGE, INVENTORY_ADJ_PLUS
```

**Yetishmayotgan turlar (2 ta):**
- `INTERNAL_TRANSFER` — `seed-pos-movement-types.ts:29` da mavjud tur; GL mapping YO'Q
- `INVENTORY_ADJ_MINUS` (yoki `INVENTORY_ADJUST`) — `seed-pos-movement-types.ts:31`
  da `INVENTORY_ADJUST` kodi bilan mavjud; GL mapping YO'Q

**Muhim:** `postMovementToLedger` quyidagi kodda to'xtaydi (`gl-posting-log.repository.ts:133-134`):
```typescript
if (!map || !map.debitAccount || !map.creditAccount) {
  return Ok({ posted: false, reason: `no GL mapping for '${mov.movementType}' — populate gl_account_mappings` });
}
```
Ya'ni jadval bo'sh bo'lsa, harakat GL ga tushmaydi, moliya hisob-kitobi to'xtaydi.

### 3.3 `gl_account_mappings` jadvalining haqiqiy ustun tuzilmasi

**`schema-business-b-1.ts:124-133`:**
```typescript
export const gl_account_mappings = pgTable('gl_account_mappings', {
  id:               serial('id').primaryKey(),
  transaction_type: text('transaction_type'),
  account_code:     text('account_code'),     // eski; yangi seed ishlatmaydi
  debit_account:    text('debit_account'),
  credit_account:   text('credit_account'),
  description:      text('description'),
  created_at:       timestamp('created_at').defaultNow(),
  updated_at:       timestamp('updated_at').defaultNow(),
});
```

**Mavjud seed** ikkita ustun ishlatadi: `debit_account` + `credit_account`
(account_code emas) — yangi seed ham shunday ishlaydi.

### 3.4 GL hisoblar mantig'i

Hisob kodlari `gl-accounts.constants.ts` dagi `GL` ob'ektidan olinadi
(BHMS — O'zbekiston Buxgalteriya Hisoblar Milliy Standartlari):
```typescript
// GL.CASH = '5010'            — Kassa
// GL.ACCOUNTS_PAYABLE = '6000' — Kreditorlar (yetkazib beruvchilar)
// GL.ACCOUNTS_RECEIVABLE = '4000' — Debitorlar
// GL.INVENTORY = '1000'       — Materiallar (xom ashyo)
// GL.REVENUE = '9010'         — Tayyor mahsulot sotuvidan tushum
// GL.COGS = '9100'            — Sotilgan mahsulot tannarxi
```

**Mavjud seed ishlatadigan kodlar (BHMS dan farq qiladi):**
- `EXTERNAL_IN` → `1010` (Kassa naqd pul) / `6000` (Kreditorlar) — xom ashyo kirim
- `EXTERNAL_OUT` → `4000` (Debitorlar) / `9010` (Sotuv tushumi) — sotuv chiqim
- `INTERNAL_ISSUE` → `2010` (Asosiy ishlab chiqarish) / `1010` (Xom ashyo)
- `INTERNAL_RETURN` → `1010` / `2010`
- `DAMAGE` → `9500` (Boshqa oper. xarajatlar) / `1010`
- `INVENTORY_ADJ_PLUS` → `1010` / `9810` (Boshqa daromadlar)

Yangi seed mavjud tartibga mos keladi (bir xil kod oilasi), faqat ikki qo'shimcha tur.

---

## 4. ISH (qadam-baqadam)

### Qadam 1: `schema-core.ts` — `sales_order_items` pgTable qo'shish

**Fayl:** `Uzbek-Language-Module/apps/api/src/shared/db/schema-core.ts`
**O'zgarish joyi:** 213-qatordan keyin (fayl oxiri) qo'shimcha blok.

**Oldin (213-214-qatorlar — fayl oxiri):**
```typescript
    index('sales_orders_assigned_to_idx').on(table.assigned_to),
  ],
);
// ← fayl shu yerda tugaydi (214-qator)
```

**Keyin (shu yerga qo'shiladi):**
```typescript
    index('sales_orders_assigned_to_idx').on(table.assigned_to),
  ],
);

// ============================================================================
// SALES ORDER ITEMS
// ============================================================================
// RULE4 (Q-35/drift): sales_orders.id schema-core.ts da uuid PK, lekin jonli DB da
// sales_order_items.sales_order_id INTEGER (raw SQL da tasdiqlangan:
// drizzle-sales-order.repo.ts:65-71; add-sales-orders-fks.sql:39-41).
// Drizzle FK (.references(() => sales_orders.id)) o'rnatilganda TYPE MISMATCH chiqadi
// (uuid → integer). Shu sababli FK ushbu ta'rifda o'chiriladi; raw SQL ishlatilishda
// davom etadi (drizzle-sales-order.repo.ts). Owner sales_orders.id → integer ga
// ko'chirgandan keyin FK qaytarilishi mumkin (ADR-002 ga murojaat qiling).
// Lib/DB (sd-order-items.ts:181) da varchar-drift versiyasi bor — u canonical emas.

export const sales_order_items = pgTable(
  'sales_order_items',
  {
    id:                  integer('id').primaryKey().generatedAlwaysAsIdentity(),
    // RULE4: sales_order_id jonli DB da integer; schema-core.ts sales_orders.id uuid —
    // FK reference olib tashlandi (type drift). raw SQL qisman yechim.
    sales_order_id:      integer('sales_order_id').notNull(),
    item_number:         text('item_number').notNull(),          // '000010', '000020', ...
    product_id:          integer('product_id'),                  // tayyor mahsulot (sotuv tomoni)
    material_id:         integer('material_id'),                 // xom ashyo (ishlab chiqarish tomoni)
    material_number:     text('material_number'),
    description:         text('description').notNull(),
    order_quantity:      decimal('order_quantity', { precision: 15, scale: 3 }).notNull(),
    delivered_quantity:  decimal('delivered_quantity', { precision: 15, scale: 3 }).notNull().default('0'),
    open_quantity:       decimal('open_quantity', { precision: 15, scale: 3 }).notNull().default('0'),
    unit:                text('unit').notNull().default('PC'),
    net_price:           decimal('net_price', { precision: 15, scale: 2 }).notNull(),
    tax_code:            text('tax_code').notNull().default('V1'),
    tax_amount:          decimal('tax_amount', { precision: 15, scale: 2 }).notNull().default('0'),
    total_price:         decimal('total_price', { precision: 15, scale: 2 }).notNull().default('0'),
    plant:               text('plant').notNull().default('P001'),
    storage_location:    text('storage_location').notNull().default('SL02'),
    delivery_date:       text('delivery_date'),                  // YYYY-MM-DD
    confirmed_quantity:  decimal('confirmed_quantity', { precision: 15, scale: 3 }).notNull().default('0'),
    delivery_status:     text('delivery_status').notNull().default('NOT_DELIVERED'),
    billing_status:      text('billing_status').notNull().default('NOT_BILLED'),
    production_order_id: integer('production_order_id'),
    delivery_item_id:    integer('delivery_item_id'),
    created_at:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('soi_sales_order_id_idx').on(table.sales_order_id),
    index('soi_product_id_idx').on(table.product_id),
    index('soi_material_id_idx').on(table.material_id),
    index('soi_delivery_status_idx').on(table.delivery_status),
    index('soi_billing_status_idx').on(table.billing_status),
  ],
);

export type SalesOrderItemRow = typeof sales_order_items.$inferSelect;
export type InsertSalesOrderItem = typeof sales_order_items.$inferInsert;
```

**Nima uchun `generatedAlwaysAsIdentity()`?**
Jonli DB da `sales_order_items.id` — `serial` (avtomatik integer PK).
`generatedAlwaysAsIdentity()` Drizzle'da `GENERATED ALWAYS AS IDENTITY` — bu
`SERIAL` ning zamonaviy PostgreSQL ekvivalenti. INSERT da `id` berilmaydi
(DB o'zi generatsiya qiladi), raw SQL insertlar (drizzle-sales-order.repo.ts:67)
esa `id` ni umuman bermaydi — mos.

**Nima uchun `decimal` (numeric emas)?**
`schema-core.ts` da boshqa jadvallar (masalan `sales_orders.advance_percent`,
`sales_orders.total_amount`) ham `decimal` ishlatadi — izchillik uchun.

**Import tekshiruvi:**
`schema-core.ts:13-23` da allaqachon mavjud importlar:
```typescript
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
```
Yangi pgTable uchun kerak qo'shimcha importlar: `generatedAlwaysAsIdentity` — bu
Drizzle v0.29+ da `integer` ning metodi sifatida keladi (alohida import shart emas).
Lekin `decimal` allaqachon import qilingan. Tekshirilsin: agarda Drizzle versiyasi
`generatedAlwaysAsIdentity` ni qo'llab-quvvatlamasa, `serial` ishlatiladi:

```typescript
// Drizzle v0.28 va undan past uchun fallback (serial import kerak):
import { ..., serial } from 'drizzle-orm/pg-core';
// ...
id: serial('id').primaryKey(),
```

**Qaysi versiya ishlatilayotganini tekshirish:**
```bash
grep drizzle-orm package.json
# yoki
cat Uzbek-Language-Module/package.json | grep drizzle
```
Agar `drizzle-orm >= 0.29` → `generatedAlwaysAsIdentity()` ishlatiladi.
Agar `drizzle-orm < 0.29` → `serial('id').primaryKey()` ishlatiladi
(bu holda `serial` ni import qo'shish kerak).

---

### Qadam 2: `seed-06-gl-account-mappings.sql` — yangi fayl yaratish

**Fayl:** `Uzbek-Language-Module/docs/migration/seed/seed-06-gl-account-mappings.sql`
**Holat:** YANGI fayl — mavjud emas.

**Nimani yozamiz:**

```sql
-- =============================================================================
-- seed-06-gl-account-mappings.sql
-- EuroPrint ERP — POS harakat turi → GL hisob xaritasi (to'liq 8 tur)
-- =============================================================================
-- APPROVED: owner 2026-06-05 (data seed, existing gl_account_mappings table;
--           NO CREATE TABLE / no DDL. Extended from seed-gl-account-mappings-pos.sql)
-- Idempotent: WHERE NOT EXISTS → xavfsiz qayta-ishga-tushirish.
-- Maqsad: postMovementToLedger (gl-posting-log.repository.ts:131) gl_account_mappings
--   jadvalidan harakat turi → debit/kredit hisob kodini qidiradi. Jadval bo'sh bo'lsa
--   "posted: false" qaytaradi va moliyaviy hisob yaratilmaydi. Bu seed barcha 8 ta
--   harakat turini qamrab oladi — shunda har POS harakat GL daftarida aks etadi.
--
-- Hisob kodlari O'zbekiston BHMS (Buxgalteriya Hisoblar Milliy Standarti) bo'yicha:
--   1010 = Kassa (naqd pul)                    9010 = Sotuv tushumi
--   4000 = Debitorlar (mijozlar)               9100 = Sotilgan mahsulot tannarxi
--   6000 = Kreditorlar (yetkazib beruvchilar)  9500 = Boshqa operatsion xarajatlar
--   2010 = Asosiy ishlab chiqarish             9810 = Boshqa operatsion daromadlar
--
-- Mavjud seed-gl-account-mappings-pos.sql (apps/api/src/shared/db/migrations/) bilan
-- munosabat: ikki fayl PARALLEL — ikkalasi ham idempotent, bir-biriga zid emas.
-- Bu yangi fayl INTERNAL_TRANSFER va INVENTORY_ADJ_MINUS ni qo'shadi.
--
-- Qo'llash:
--   psql "$DATABASE_URL" -f docs/migration/seed/seed-06-gl-account-mappings.sql
-- =============================================================================

INSERT INTO gl_account_mappings
  (transaction_type, debit_account, credit_account, description, created_at, updated_at)
SELECT v.tt, v.da, v.ca, v.descr, NOW(), NOW()
FROM (VALUES
  -- 1. Tashqi kirim: xom ashyo / material omborga keldi (yetkazib beruvchidan)
  --    Dr 1010 Kassa (qiymat kirim) / Cr 6000 Kreditorlar (majburiyat paydo bo'ldi)
  ('EXTERNAL_IN',
   '1010', '6000',
   'Tashqaridan mol qabul: Dr Xom ashyo va materiallar / Cr Kreditorlar'),

  -- 2. Tashqi chiqim: tayyor mahsulot / tovar ombordan chiqdi (sotildi)
  --    Dr 4000 Debitorlar (mijoz qarzi) / Cr 9010 Sotuv tushumi
  ('EXTERNAL_OUT',
   '4000', '9010',
   'Sotuv: Dr Debitorlar / Cr Tayyor mahsulot sotuvidan tushum'),

  -- 3. Ishlab chiqarishga berish: xom ashyo sexga chiqdi
  --    Dr 2010 Asosiy ishlab chiqarish / Cr 1010 Xom ashyo
  ('INTERNAL_ISSUE',
   '2010', '1010',
   'Ishlab chiqarishga berish: Dr Asosiy ishlab chiqarish / Cr Xom ashyo'),

  -- 4. Qaytarish: sexdan xom ashyo omborga qaytdi
  --    Dr 1010 Xom ashyo / Cr 2010 Asosiy ishlab chiqarish
  ('INTERNAL_RETURN',
   '1010', '2010',
   'Qaytarish: Dr Xom ashyo / Cr Asosiy ishlab chiqarish'),

  -- 5. Ombor ko'chirish: bir ombordan ikkinchisiga (ikkala tomon 1010 da kalka hisoblar).
  --    Sof GL ta'sir nol (bir xil kod guruhida). Shunday bo'lsa ham mapping kerak —
  --    postMovementToLedger tekshiruvi uchun. Mapping kiritiladi, entries satr yoziladi
  --    (Dr 1010 Kassa-1 / Cr 1010 Kassa-2 — bir guruh, lekin turli tahliliy sub-hisoblar).
  --    ESLATMA: kelajakda sub-hisob koddari (1010.001, 1010.002) bo'lsa shu yerda yangilanadi.
  ('INTERNAL_TRANSFER',
   '1010', '1010',
   'Ombor ko''chirish: Dr Xom ashyo (qabul) / Cr Xom ashyo (chiqim) — bir guruh'),

  -- 6. Zarar akti: mahsulot/material zarar ko'rdi yoki yo'q qilindi
  --    Dr 9500 Boshqa operatsion xarajatlar / Cr 1010 Xom ashyo
  ('DAMAGE',
   '9500', '1010',
   'Brak/zarar: Dr Boshqa operatsion xarajatlar / Cr Xom ashyo'),

  -- 7. Inventarizatsiya ortiqcha (PLUS): haqiqiy qoldiq hisobdan ko'p chiqdi
  --    Dr 1010 Xom ashyo / Cr 9810 Boshqa operatsion daromadlar
  ('INVENTORY_ADJ_PLUS',
   '1010', '9810',
   'Inventarizatsiya ortiqcha: Dr Xom ashyo / Cr Boshqa daromadlar'),

  -- 8. Inventarizatsiya taqchil (MINUS) — seed-pos-movement-types.ts da 'INVENTORY_ADJUST'
  --    kodi bilan ro'yxatdan o'tgan (direction=adjustment). GL tomoni: qoldiq kamaydi —
  --    Dr 9500 Boshqa operatsion xarajatlar / Cr 1010 Xom ashyo (zarar bilan bir xil logika).
  --    transaction_type = 'INVENTORY_ADJUST' (POS Monitor da ishlatilgan kod).
  ('INVENTORY_ADJUST',
   '9500', '1010',
   'Inventarizatsiya taqchil: Dr Boshqa operatsion xarajatlar / Cr Xom ashyo')

) AS v(tt, da, ca, descr)
WHERE NOT EXISTS (
  SELECT 1
  FROM gl_account_mappings g
  WHERE g.transaction_type = v.tt
);

-- Tekshiruv (kutilgan: 8 qator yoki kamroq — mavjud turlar o'tkazib yuboriladi):
--   SELECT transaction_type, debit_account, credit_account FROM gl_account_mappings ORDER BY id;
```

**Nima uchun `INVENTORY_ADJUST` (minus emas)?**
`seed-pos-movement-types.ts:31` qatorida aynan `'INVENTORY_ADJUST'` kodi ishlatilgan:
```typescript
{ code: 'INVENTORY_ADJUST', name: 'Inventarizatsiya Tuzatish', direction: 'adjustment' },
```
`postMovementToLedger` `pos_movements.movement_type` ustunini o'qiydi
(va bu ustun `pos_movement_types.code` ga muvofiq to'ldiriladi). Demak mapping
kaliti `'INVENTORY_ADJUST'` bo'lishi kerak — `'INVENTORY_ADJ_MINUS'` emas.

---

### Qadam 3: Import tekshiruvi — `schema-core.ts` ga zarur import qo'shilganmi?

**Mavjud import (13-23-qatorlar):**
```typescript
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
```

**Yangi pgTable uchun kerakli importlar:**
- `pgTable` ✅ mavjud
- `integer` ✅ mavjud
- `text` ✅ mavjud
- `decimal` ✅ mavjud
- `timestamp` ✅ mavjud
- `index` ✅ mavjud

`generatedAlwaysAsIdentity()` Drizzle ORM v0.30+ da `integer` metodiga o'rnatilgan
(alohida import kerak emas). Drizzle versiyasi `< 0.30` bo'lsa:
```typescript
// serial import qo'shiladi:
import { ..., serial } from 'drizzle-orm/pg-core';
// id ustuni:
id: serial('id').primaryKey(),
```

**Versiyani tekshirish buyrug'i (Qadam 3a — bajarish majburiy):**
```bash
grep -A1 '"drizzle-orm"' Uzbek-Language-Module/package.json
# yoki
cat Uzbek-Language-Module/lib/db/package.json | grep drizzle-orm
```

Agar `drizzle-orm >= 0.30.0` → `generatedAlwaysAsIdentity()` ishlatiladi.
Agar `drizzle-orm < 0.30.0` → `serial` + import.

---

### Qadam 4: `schema-core.ts` eksportini `@shared/db` barrel ga qo'shish (agar kerak)

**TEKSHIRISH (bajarish majburiy — owned file emas, faqat o'qish):**
```bash
grep -n "sales_order_items\|schema-core" \
  Uzbek-Language-Module/apps/api/src/shared/db/index.ts 2>/dev/null | head -20
```

`schema-core.ts` allaqachon `@shared/db` barrel (index.ts) orqali eksport qilinganmi?
- Agar HA → hech narsa qilma (P06 owned file emas).
- Agar YO'Q → `@shared/db/index.ts` barrel ga qo'shish kerak, lekin bu P06 ning
  OWNED-FILE RO'YXATIDA YO'Q. Bu holda TO'XTA va egasiga quyidagini flag qil:
  ```
  FLAG: schema-core.ts barrel eksporti P01/P02 ga tegishli bo'lishi mumkin
  (P01 = lib-barrel, P02 = api-barrel). P06 schema-core.ts ga yozadi, lekin
  barrel index.ts ga tegmaydi — P01/P02 bilan koordinatsiya kerak.
  ```

---

### Qadam 5: TypeScript kompilyatsiyasini tekshirish

```bash
cd Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | tail -20
# KUTILGAN: 0 xato
```

Agar xato chiqsa: `generatedAlwaysAsIdentity` topilmayapti → `serial` ga almashtir.

---

## 5. DDL (MIGRATION)

Bu paket `CREATE TABLE` DDL talab qilmaydi — `gl_account_mappings` jadvali allaqachon
mavjud (`schema-business-b-1.ts:124`, `migrations-drift.ts:1875`).

`seed-06-gl-account-mappings.sql` — DATA SEED (DDL emas). Lekin seed fayl
`docs/migration/seed/` katalogiga joylashadi — bu katalog `BOSHLASH.md` bo'yicha
startup da ishga tushadigan seed'lar joyi. Idempotent — xavfsiz.

**GATED qism:** Agar `gl_account_mappings` jadvali jonli DB da HALI YARATILMAGAN bo'lsa
(bu ehtimolsiz — `migrations-drift.ts:1875` da `CREATE TABLE IF NOT EXISTS` mavjud),
avval jadval yaratilishi kerak. Quyidagi DDL GATED:

```sql
-- GATED DDL — FAQAT egasi ruxsati bilan ishga tushiriladi (Q-35)
-- APPROVED: <egasi_ismi> <sana>
-- gl_account_mappings jadvali mavjud bo'lmasa yaratiladi.
-- Odatda migrations-drift.ts orqali allaqachon yaratilgan — bu zaxira.
CREATE TABLE IF NOT EXISTS gl_account_mappings (
  id               SERIAL PRIMARY KEY,
  transaction_type TEXT,
  account_code     TEXT,
  debit_account    TEXT,
  credit_account   TEXT,
  description      TEXT,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);
```

**ISHGA TUSHIRMA** — faqat `\d gl_account_mappings` bo'sh kelsa va egasi ruxsat bersa.

---

## 6. QABUL MEZONI

```
Barcha quyidagi mezonlar bir vaqtda bajarilishi shart:

[ ] 1. schema-core.ts ga sales_order_items pgTable qo'shildi — integer FKlar bilan,
       RULE4 izoh bor, TypeScript kompilyatsiyasi o'tadi (tsc --noEmit: 0 xato).

[ ] 2. seed-06-gl-account-mappings.sql yaratildi — 8 ta harakat turi qamrab olingan:
       EXTERNAL_IN, EXTERNAL_OUT, INTERNAL_ISSUE, INTERNAL_RETURN,
       INTERNAL_TRANSFER, DAMAGE, INVENTORY_ADJ_PLUS, INVENTORY_ADJUST.

[ ] 3. Seed idempotent — ikki marta ishga tushirilganda ham 0 yangi qator qo'shilmaydi
       (WHERE NOT EXISTS tekshiruvi).

[ ] 4. DB-proof (jonli DB): seed ishga tushirilgandan keyin 8 ta qator mavjud:
       SELECT COUNT(*) FROM gl_account_mappings; → ≥ 8

[ ] 5. postMovementToLedger tekshiruvi (funksional): EXTERNAL_IN harakati uchun
       postMovementToLedger chaqirilganda "posted: true" qaytadi (agar pos_movements
       da test harakat bo'lsa).

[ ] 6. Reviewer skriptlar (BE):
       bash scripts/reviewer-result-pattern.sh → 0 FAIL
       bash scripts/reviewer-as-unknown.sh → 0 yangi FAIL
       pnpm --filter @europrint/api exec tsc --noEmit → 0 xato

[ ] 7. FE tsc tekshiruvi (o'zgarmagan bo'lsa ham):
       pnpm --filter erp-dashboard exec tsc --noEmit → 0 xato

[ ] 8. Oltin zanjir regress tekshiruvi (golden-thread-no-regress):
       GET /api/health → 200 (backend ishlayapti)
       GET /api/sd/sales-orders → 200 (sales_orders mavjud)
       seed ishga tushirilgandan keyin GL log tekshiruvi (agar mavjud endpoint bo'lsa)

[ ] 9. schema-core.ts da FAQAT sales_order_items bloki o'zgargan — boshqa hech narsa.

[ ] 10. OWNED-FILE qoidasi: faqat F1 va F2 ga tegildi.
```

---

## 7. SELF-VERIFY

### 7.1 TypeScript kompilyatsiyasi

```bash
# Backend
cd Uzbek-Language-Module
pnpm --filter @europrint/api exec tsc --noEmit
# Kutilgan: 0 xato yoki xatolar P06 bilan bog'liq emas (pre-existing)

# Oldingi xatolar sonini saqlash (avval ishga tushirish):
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | grep "error TS" | wc -l
# P06 dan KEYIN:
pnpm --filter @europrint/api exec tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Ikki son bir xil yoki kamroq bo'lishi kerak (oshmasin).

# Frontend (o'zgarishsiz — tekshiruv)
pnpm --filter erp-dashboard exec tsc --noEmit
```

### 7.2 Drizzle versiya tekshiruvi

```bash
grep '"drizzle-orm"' Uzbek-Language-Module/package.json
# Agar >= 0.30.0 → generatedAlwaysAsIdentity() ishlaydi
# Agar < 0.30.0 → serial() ga almashtir
```

### 7.3 DB-proof — seed qatorlari

```bash
# Docker container ichida psql (yoki to'g'ridan connection string):
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint -c \
  "SELECT transaction_type, debit_account, credit_account FROM gl_account_mappings ORDER BY id;"

# Kutilgan natija (kamida 8 qator):
# EXTERNAL_IN        | 1010 | 6000
# EXTERNAL_OUT       | 4000 | 9010
# INTERNAL_ISSUE     | 2010 | 1010
# INTERNAL_RETURN    | 1010 | 2010
# INTERNAL_TRANSFER  | 1010 | 1010
# DAMAGE             | 9500 | 1010
# INVENTORY_ADJ_PLUS | 1010 | 9810
# INVENTORY_ADJUST   | 9500 | 1010
```

### 7.4 Idempotentlik tekshiruvi

```bash
# Seedni ikki marta ishga tushirish — ikkinchi marta 0 qator qo'shilishi kerak:
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint \
  -f /path/to/seed-06-gl-account-mappings.sql
# INSERT 0 0 (0 yangi qator)

# Hisob:
docker exec uzbek-language-module-postgres-1 psql -U europrint -d europrint -c \
  "SELECT COUNT(*) FROM gl_account_mappings;"
# Son o'zgarmagan bo'lishi kerak
```

### 7.5 `sales_order_items` pgTable tekshiruvi (Drizzle)

```bash
# schema-core.ts eksporti topilishini tekshirish:
grep "sales_order_items" Uzbek-Language-Module/apps/api/src/shared/db/schema-core.ts
# Kutilgan: export const sales_order_items = pgTable(... topiladi

# Tip eksporti:
grep "SalesOrderItemRow\|InsertSalesOrderItem" \
  Uzbek-Language-Module/apps/api/src/shared/db/schema-core.ts
# Ikkalasi ham topilishi kerak
```

### 7.6 Reviewer skriptlari

```bash
cd Uzbek-Language-Module
bash scripts/reviewer-result-pattern.sh   | tail -5
# → FAIL: 0

bash scripts/reviewer-as-unknown.sh       | tail -5
# → yangi FAIL yo'q (mavjud 3 FAIL o'zgarmagan)

bash scripts/reviewer-array-safety.sh     | tail -5
# → FAIL: 0 (1172+ PASS)
```

### 7.7 Backend ishlashini tekshirish (agar server ko'tarilgan bo'lsa)

```bash
curl -s http://localhost:3030/api/health | python -m json.tool
# → {"status": "ok"} yoki {"status": "healthy"}

# GL mapping endpointi (agar mavjud bo'lsa):
TOKEN="<valid_jwt_token>"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3030/api/finance/gl-mapping | python -m json.tool
# → harakat turlar ro'yxati
```

### 7.8 `postMovementToLedger` real test (agar POS environment mavjud bo'lsa)

```sql
-- 1. Test harakat yaratish:
INSERT INTO pos_movements (movement_type, status, created_by, created_at, updated_at)
VALUES ('EXTERNAL_IN', 'completed', 1, NOW(), NOW())
RETURNING id;
-- id = X deb olaylik

-- 2. Movement line qo'shish:
INSERT INTO pos_movement_lines (movement_id, quantity, unit_price, created_at)
VALUES (X, 10, 50000, NOW());

-- 3. postMovementToLedger chaqirilgandan keyin entries tekshiruvi:
SELECT * FROM entries WHERE document_type = 'pos_movement' AND document_id = X;
-- → 1 qator, amount = 500000, debit_account = '1010', credit_account = '6000'
-- → Bu "posted: true" ekanini ko'rsatadi
```

---

## 8. COMMIT

### Fayllar tartibi

**Alohida commit (mantiqiy guruhlar):**

```bash
# Commit 1: schema-core.ts qo'shimchasi
git add Uzbek-Language-Module/apps/api/src/shared/db/schema-core.ts
git commit -m "feat(golden): add sales_order_items pgTable to schema-core (integer FKs, RULE4 note)"

# Commit 2: seed fayl
git add Uzbek-Language-Module/docs/migration/seed/seed-06-gl-account-mappings.sql
git commit -m "feat(golden): seed-06 gl_account_mappings 8 transaction types for postMovementToLedger"
```

### Commit xabar formati

`feat(golden):` — yangi funksionallik, GOLDEN modul.

Majburiy elementlar:
- Modul: `(golden)` — qaysi modul
- Ish turi: `feat` (yangi pgTable + yangi seed)
- Izoh: nima qilindi va NIMA UCHUN (Q-40: not just what, but why)

Taqiqlangan:
- `git add -A` — TAQIQ (Q-8, Qoida 8)
- `git add .` — TAQIQ
- Bir commitda ikki owned file aralash qo'shish — mantiqiy guruh saqlash uchun alohida

### Commit xabarlari to'liq namuna

```
feat(golden): add sales_order_items pgTable to schema-core with integer FKs

Adds canonical sales_order_items pgTable definition to schema-core.ts.
Uses integer FKs matching the live DB (not varchar as in lib/db/sd-order-items.ts drift).
RULE4 comment explains why FK reference to sales_orders.id is omitted (uuid vs integer
type mismatch — see drizzle-sales-order.repo.ts:65-71 and add-sales-orders-fks.sql).
Exports SalesOrderItemRow and InsertSalesOrderItem types for downstream consumers.

P06-GOLDEN Wave-1
```

```
feat(golden): seed-06 gl_account_mappings — 8 POS movement types for GL posting

Adds idempotent seed covering all 8 POS movement types so postMovementToLedger
(gl-posting-log.repository.ts:131) stops returning posted:false due to missing mappings.
Extends existing seed-gl-account-mappings-pos.sql with INTERNAL_TRANSFER and
INVENTORY_ADJUST types. Account codes follow Uzbekistan BHMS standard (1010/4000/6000/etc).

P06-GOLDEN Wave-1
```

---

## QUSHIMCHA: Muhim tekshiruvlar va edge-holatlar

### Edge-holat 1: `sales_order_items` allaqachon `schema-core.ts` da bor bo'lsa

```bash
grep "sales_order_items" \
  Uzbek-Language-Module/apps/api/src/shared/db/schema-core.ts
```
Agar topilsa → BU QADAM BAJARILMAYDI (Q-46: ishlayotgan kod o'chirilmaydi,
dublikat qo'shilmaydi). Tekshirib chiq va TO'XTA.

### Edge-holat 2: `gl_account_mappings` da transaction_type uchun UNIQUE constraint bor bo'lsa

```sql
SELECT * FROM pg_constraint
WHERE conrelid = 'gl_account_mappings'::regclass AND contype = 'u';
```
Agar `UNIQUE(transaction_type)` constraint bo'lsa, `WHERE NOT EXISTS` o'rniga
`ON CONFLICT (transaction_type) DO NOTHING` ishlatilishi kerak:

```sql
INSERT INTO gl_account_mappings
  (transaction_type, debit_account, credit_account, description, created_at, updated_at)
VALUES
  ('EXTERNAL_IN',   '1010', '6000', '...', NOW(), NOW()),
  -- ...
ON CONFLICT (transaction_type) DO NOTHING;
```

### Edge-holat 3: `generatedAlwaysAsIdentity` TypeScript xatosi

Agar `tsc --noEmit` quyidagi xatoni chiqarsa:
```
error TS2339: Property 'generatedAlwaysAsIdentity' does not exist on type ...
```
→ `serial('id').primaryKey()` ga almashtir + `serial` import qo'sh.

### Edge-holat 4: `INTERNAL_TRANSFER` uchun bir xil debit/kredit

`1010` / `1010` — bir xil hisob kodi ikki tomonda. Bu GL tomonidan "null effect"
bo'ladi (harakat daftarida aks etadi, lekin hisoblar balansi o'zgarmaydi). Bu to'g'ri:
ombor ko'chirish bir xil hisob guruhi ichida.

`postMovementToLedger` kodi bir xil kodlar bilan ham to'g'ri ishlaydi:
```typescript
const accRows = await typedExecute<...>(sql`
  SELECT account_code AS code, id FROM accounts
  WHERE account_code IN (${map.debitAccount}, ${map.creditAccount})`);
// Agar debit = credit = '1010', accRows da 1 ta qator bo'ladi
// debitId va creditId bir xil bo'ladi — entries ga yoziladi
```
Bu to'g'ri — GL datrafi tekshiriladi, faqat logik muvozanat nol bo'ladi.

### Edge-holat 5: `accounts` jadvalida hisob kodlari mavjudligi

`seed-04-accounts.sql` ni tekshiring — barcha 8 ta mapping uchun kodlar mavjudmi:
```sql
SELECT account_code FROM accounts
WHERE account_code IN ('1010','4000','6000','2010','9010','9100','9500','9810');
```
Agar birorta kod yo'q bo'lsa → `postMovementToLedger` `"account code(s) not in CoA"` bilan
`posted:false` qaytaradi. Bu P06 ning muammosi emas (accounts seed P06 owned file emas),
lekin hisob to'liqligini tekshirish kerak va flag qilish.

### Edge-holat 6: `schema-core.ts` da `@deprecated` ogohlantirishi (1-7-qatorlar)

```typescript
/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * ...
 */
```

Bu ogohlantirish mavjud (1-7-qatorlar). Yangi `sales_order_items` pgTable
`schema-core.ts` ga qo'shish — texnik jihatdan `@deprecated` faylga yangilik qo'shish.
Lekin:
- `@deprecated` kommentariy "Do NOT add new features here" deydi
- Bu bir ziddiyat — P06 paketi AYNAN shu faylga yozishni ko'rsatmoqda

**Hal yo'li:** Qo'shishdan OLDIN, ownedFiles ni tasdiqlang: paket `schema-core.ts`
ni F1 sifatida ko'rsatgan, shuning uchun bu paketning aniq buyruq-yo'rig'i. Lekin
`@deprecated` ogohlantirish kelajakdagi ishlovchilar uchun eslatma bo'lib qolishi
kerak. Shuning uchun:
1. `sales_order_items` blokiga qo'shimcha kommentariy yoziladi:
   ```typescript
   // NOTE: schema-core.ts deprecated shim sifatida belgilangan (2026-05-27), lekin
   // P06-GOLDEN direktiva buyrug'i bo'yicha shu yerga qo'shiladi. Kanonik joy
   // lib/db/src/schema/sd-order-items.ts; u yerdagi varchar-drift tuzatilgandan keyin
   // bu ta'rif olib tashlanishi mumkin (ADR-002).
   ```

---

## ESLATMALAR VA TARIX

| Kun | Hodisa |
|-----|--------|
| 2026-06-04 | `add-sales-orders-fks.sql` tasdiqlangan — sales_order_items integer FK |
| 2026-06-05 | `seed-gl-account-mappings-pos.sql` tasdiqlangan — 6 tur |
| 2026-06-05 | `add-sales-order-items-product-id.sql` tasdiqlangan — product_id integer |
| 2026-06-07 | MASTER XARITA docs/XARITA-REJA-YONALISH-2026-06-07.md |
| 2026-06-18 | POYDEVOR TO'LIQ — Sprint 0 100% |
| 2026-06-19 | P06-GOLDEN direktiva yozildi (Wave-1) |

---

## XULOSA

P06 ikkita aniq ish bajaradi:

1. **`schema-core.ts` ga `sales_order_items` pgTable** — integer ustunlar bilan
   (jonli DB ga mos), RULE4 izoh bilan (uuid/integer drift tushuntirilgan),
   lib/db dagi varchar-drift versiyasini almashtirmaydi (Q-46), faqat
   `schema-core.ts` ga kanonik integer-ta'rif qo'shadi.

2. **`seed-06-gl-account-mappings.sql`** — 8 ta harakat turi uchun GL mapping.
   `postMovementToLedger` shu seeddan keyin "posted: true" qaytaradi — har POS
   harakat daftarda aks etadi. Idempotent, mavjud 6-tur seedi bilan parallel
   (parallel, o'chirib tashlash emas).

Ikkalasi ham `tsc 0` ta'minlaydi, Wave-1 da blokerlar yo'q.

---

## APPENDIX A: `schema-core.ts` — To'liq yangi blok (nusxalash uchun)

Quyidagi blokni `schema-core.ts` ning 213-qatoridan (fayl oxiri) keyin qo'shing.
Har qatorni tekshiring — hech narsa qoldirmang.

```typescript
// ============================================================================
// SALES ORDER ITEMS
// ============================================================================
// RULE4 (Q-35/drift ogohlantirishi):
//   schema-core.ts da sales_orders.id = uuid PK (39-qator: uuid('id').primaryKey()).
//   Lekin jonli DB da sales_order_items.sales_order_id = INTEGER (raw SQL tomonidan
//   tasdiqlanganini drizzle-sales-order.repo.ts:65-71 ko'rsatadi — raw INSERT integer
//   ustun ishlatadi; add-sales-orders-fks.sql:39-41 FK ni integer→sales_orders(id) deb
//   o'rnatadi).
//
//   Drizzle .references(() => sales_orders.id) type mismatch beradi (uuid vs integer),
//   shuning uchun FK reference bu ta'rifda O'CHIRILDI. raw SQL (drizzle-sales-order.repo.ts)
//   ishlatilishda davom etadi. FK faqat sales_orders.id integer ga ko'chirilgandan keyin
//   qaytarilishi mumkin — bu ADR-002 da qayd qilingan qaror.
//
//   lib/db/src/schema/sd-order-items.ts:181 da boshqa versiya bor (varchar drift).
//   Shu yergi integer versiyasi KANONIK — jonli DB ga mos.
//   P06-GOLDEN Wave-1, 2026-06-19.
//
// NOTE: schema-core.ts @deprecated shim sifatida belgilangan (2026-05-27), lekin
//   P06-GOLDEN direktiva ownedFile ro'yxatida ko'rsatilgan. Lib/db/sd-order-items.ts
//   varchar-drift versiyasi tuzatilgandan keyin bu ta'rif olib tashlanishi mumkin.

export const sales_order_items = pgTable(
  'sales_order_items',
  {
    // id: jonli DB da SERIAL (auto-increment integer). Drizzle ORM versiyasiga qarab:
    //   >= 0.30: integer('id').primaryKey().generatedAlwaysAsIdentity()
    //   <  0.30: serial('id').primaryKey()  ← serial import qo'shish kerak
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

    // RULE4: FK olib tashlandi (uuid/integer type mismatch — yuqorida izoh).
    sales_order_id: integer('sales_order_id').notNull(),

    // Satr raqami: '000010', '000020', ... (har 10 ga ortib boradi)
    item_number: text('item_number').notNull(),

    // Sotuv tomoni: tayyor mahsulot (finished good) — owner 2026-06-05 qaror.
    // product_id → products jadvali (integer). Nullable: ba'zi satrlar hali
    // bog'lanmagan bo'lishi mumkin (backfill jarayoni).
    product_id: integer('product_id'),

    // Ishlab chiqarish tomoni: xom ashyo / material (material_cards yoki materials jadvali).
    // Vizyon #10: order line-items product_id (sotuv), material_id (ishlab chiqarish).
    material_id: integer('material_id'),

    // SAP-uslub material raqami — qo'shimcha identifikator (masalan 'MAT-001234').
    material_number: text('material_number'),

    // Mahsulot tavsifi — SO da ko'rsatiladi; majburiy.
    description: text('description').notNull(),

    // === MIQDORLAR ===
    // order_quantity: buyurtma qilingan miqdor (majburiy).
    order_quantity: decimal('order_quantity', { precision: 15, scale: 3 }).notNull(),

    // delivered_quantity: yetkazilgan miqdor (kumulativ). Default 0.
    delivered_quantity: decimal('delivered_quantity', { precision: 15, scale: 3 })
      .notNull()
      .default('0'),

    // open_quantity: yetkazilmagan qoldiq = order_quantity - delivered_quantity.
    // DB trigger yoki servis tomonidan yangilanadi.
    open_quantity: decimal('open_quantity', { precision: 15, scale: 3 })
      .notNull()
      .default('0'),

    // Birlik: 'PC' (dona), 'KG', 'M2', 'M', 'L', ... BHMS/SAP standartlari.
    unit: text('unit').notNull().default('PC'),

    // === NARX ===
    // net_price: bir birlik uchun sof narx (QQS siz). Majburiy.
    net_price: decimal('net_price', { precision: 15, scale: 2 }).notNull(),

    // tax_code: soliq kodi. 'V1' = 12% QQS (O'zbekiston standart). Default V1.
    tax_code: text('tax_code').notNull().default('V1'),

    // tax_amount: hisoblangan soliq summasi = net_price * qty * tax_rate. Default 0.
    tax_amount: decimal('tax_amount', { precision: 15, scale: 2 }).notNull().default('0'),

    // total_price: to'liq narx = net_price * qty + tax_amount. Default 0.
    total_price: decimal('total_price', { precision: 15, scale: 2 }).notNull().default('0'),

    // === ZAVOD / JOY ===
    // plant: ishlab chiqarish zavodi kodi. EuroPrint = 'P001'.
    plant: text('plant').notNull().default('P001'),

    // storage_location: saqlash joyi kodi. 'SL02' = asosiy ombor.
    storage_location: text('storage_location').notNull().default('SL02'),

    // === YETKAZIB BERISH GRAFIGI ===
    // delivery_date: mo'ljallangan yetkazib berish sanasi. Format: 'YYYY-MM-DD'. Nullable.
    delivery_date: text('delivery_date'),

    // confirmed_quantity: tasdiqlangan yetkazib berish miqdori. Default 0.
    confirmed_quantity: decimal('confirmed_quantity', { precision: 15, scale: 3 })
      .notNull()
      .default('0'),

    // === HOLAT ===
    // delivery_status: yetkazib berish holati.
    // Qiymatlar: 'NOT_DELIVERED' | 'PARTIALLY' | 'FULLY'
    delivery_status: text('delivery_status').notNull().default('NOT_DELIVERED'),

    // billing_status: hisob-kitob holati.
    // Qiymatlar: 'NOT_BILLED' | 'PARTIALLY' | 'FULLY'
    billing_status: text('billing_status').notNull().default('NOT_BILLED'),

    // === INTEGRATSIYA HAVOLALAR ===
    // production_order_id: bog'liq ishlab chiqarish buyurtmasi (PP moduli). Nullable.
    production_order_id: integer('production_order_id'),

    // delivery_item_id: bog'liq yetkazib berish satri (WMS moduli). Nullable.
    delivery_item_id: integer('delivery_item_id'),

    // created_at: yaratilgan vaqt. WITH TIME ZONE (Toshkent = UTC+5).
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // sales_order_id bo'yicha indeks — "buyurtmaning barcha satrlari" so'rovi tez bo'lsin.
    index('soi_sales_order_id_idx').on(table.sales_order_id),
    // product_id indeks — mahsulot bo'yicha buyurtma satrlari filtr.
    index('soi_product_id_idx').on(table.product_id),
    // material_id indeks — xom ashyo bo'yicha filtr (PP/MES tomonidan ishlatiladi).
    index('soi_material_id_idx').on(table.material_id),
    // delivery_status indeks — "yetkazilmagan satrlar" so'rovi tez bo'lsin.
    index('soi_delivery_status_idx').on(table.delivery_status),
    // billing_status indeks — "hisob qilinmagan satrlar" so'rovi (billing runner).
    index('soi_billing_status_idx').on(table.billing_status),
  ],
);

// Type eksportlari — upstream servislar (SD/PP/MES/WMS/FIN) tomonidan import qilinadi.
export type SalesOrderItemRow    = typeof sales_order_items.$inferSelect;
export type InsertSalesOrderItem = typeof sales_order_items.$inferInsert;
```

---

## APPENDIX B: `seed-06-gl-account-mappings.sql` — To'liq fayl (nusxalash uchun)

Quyidagi faylni aynan `docs/migration/seed/seed-06-gl-account-mappings.sql` ga yozing.

```sql
-- =============================================================================
-- seed-06-gl-account-mappings.sql
-- EuroPrint ERP — POS harakat turi → GL hisob xaritasi (to'liq 8 tur)
-- =============================================================================
-- APPROVED: owner 2026-06-05 (data seed, existing gl_account_mappings table;
--           NO CREATE TABLE / no DDL. Extended from seed-gl-account-mappings-pos.sql)
-- Maqsad: postMovementToLedger (gl-posting-log.repository.ts:129-134) gl_account_mappings
--   jadvalidan harakat turi → debit/kredit hisob kodini qidiradi. Jadval bo'sh bo'lsa
--   "posted: false + no GL mapping" qaytaradi va moliyaviy hisob yaratilmaydi.
--   Bu seed barcha 8 ta POS harakat turini qamrab oladi.
--
-- Mavjud seed (apps/api/src/shared/db/migrations/seed-gl-account-mappings-pos.sql)
-- bilan munosabat: ikki fayl PARALLEL — ikkalasi idempotent WHERE NOT EXISTS bilan.
-- Yangi turlar: INTERNAL_TRANSFER, INVENTORY_ADJUST.
--
-- Hisob kodlari O'zbekiston BHMS bo'yicha (accounts jadvalidagi account_code):
--   1010 = Naqd pul (Kassa)            4000 = Debitorlar (mijozlardan olinadigan)
--   2010 = Asosiy ishlab chiqarish     6000 = Kreditorlar (yetkazib beruvchilarga)
--   9010 = Sotuv tushumi               9500 = Boshqa operatsion xarajatlar
--   9810 = Boshqa operatsion daromadlar
--
-- Qo'llash (manual):
--   psql "$DATABASE_URL" -f docs/migration/seed/seed-06-gl-account-mappings.sql
-- Idempotent: qayta ishga tushirish xavfsiz (WHERE NOT EXISTS).
-- =============================================================================

INSERT INTO gl_account_mappings
  (transaction_type, debit_account, credit_account, description, created_at, updated_at)
SELECT v.tt, v.da, v.ca, v.descr, NOW(), NOW()
FROM (VALUES

  -- 1. EXTERNAL_IN — Tashqi kirim
  --    Material/tovar tashqaridan omborga keldi (xarid, qabul).
  --    Buxgalteriya: Dr 1010 Naqd pul/Kassa (aktiv ortdi) / Cr 6000 Kreditorlar
  --    (majburiyat paydo bo'ldi — yetkazib beruvchiga to'lanishi kerak).
  ('EXTERNAL_IN',
   '1010',
   '6000',
   'Tashqaridan mol qabul: Dr Xom ashyo va materiallar / Cr Kreditorlar'),

  -- 2. EXTERNAL_OUT — Tashqi chiqim (sotuv)
  --    Tayyor mahsulot/tovar ombordan mijozga chiqdi (sotuv).
  --    Buxgalteriya: Dr 4000 Debitorlar (mijoz qarzi) / Cr 9010 Sotuv tushumi.
  --    ESLATMA: COGS satri (Dr 9100 / Cr 1010) kelajakdagi ko'p-oyoqli kengaytma.
  ('EXTERNAL_OUT',
   '4000',
   '9010',
   'Sotuv: Dr Debitorlar / Cr Tayyor mahsulot sotuvidan tushum'),

  -- 3. INTERNAL_ISSUE — Ishlab chiqarishga berish
  --    Xom ashyo / material ombordan sexga chiqdi.
  --    Buxgalteriya: Dr 2010 Asosiy ishlab chiqarish / Cr 1010 Xom ashyo.
  ('INTERNAL_ISSUE',
   '2010',
   '1010',
   'Ishlab chiqarishga berish: Dr Asosiy ishlab chiqarish / Cr Xom ashyo'),

  -- 4. INTERNAL_RETURN — Qaytarish
  --    Material sexdan omborga qaytdi (ishlatilmadi).
  --    Buxgalteriya: Dr 1010 Xom ashyo / Cr 2010 Asosiy ishlab chiqarish.
  ('INTERNAL_RETURN',
   '1010',
   '2010',
   'Qaytarish: Dr Xom ashyo / Cr Asosiy ishlab chiqarish'),

  -- 5. INTERNAL_TRANSFER — Ombor ko'chirish
  --    Material bir ombordan boshqasiga ko'chirildi.
  --    Buxgalteriya: bir xil hisob kodi (1010) ikki tomonda — sof GL ta'sir nol.
  --    Mapping kerak: postMovementToLedger texnik tekshiruvi uchun (SKIP emas, LOG bor).
  --    Kelajakda sub-hisob kodlari (1010.001 / 1010.002) bo'lsa — yangilanadi.
  ('INTERNAL_TRANSFER',
   '1010',
   '1010',
   'Ombor ko''chirish: Dr Xom ashyo (qabul ombor) / Cr Xom ashyo (chiqim ombor)'),

  -- 6. DAMAGE — Zarar akti
  --    Material/mahsulot zarar ko'rdi, yo'q qilindi, brak deb hisoblandi.
  --    Buxgalteriya: Dr 9500 Boshqa operatsion xarajatlar / Cr 1010 Xom ashyo.
  ('DAMAGE',
   '9500',
   '1010',
   'Brak/zarar: Dr Boshqa operatsion xarajatlar / Cr Xom ashyo'),

  -- 7. INVENTORY_ADJ_PLUS — Inventarizatsiya ortiqcha
  --    Inventarizatsiya natijasida haqiqiy qoldiq hisobdagidan ko'p chiqdi.
  --    Buxgalteriya: Dr 1010 Xom ashyo (aktiv ortdi) / Cr 9810 Boshqa daromadlar.
  ('INVENTORY_ADJ_PLUS',
   '1010',
   '9810',
   'Inventarizatsiya ortiqcha: Dr Xom ashyo / Cr Boshqa operatsion daromadlar'),

  -- 8. INVENTORY_ADJUST — Inventarizatsiya tuzatish (taqchil)
  --    seed-pos-movement-types.ts:31 da 'INVENTORY_ADJUST' kodi bilan ro'yxatdan o'tgan
  --    (direction=adjustment). Haqiqiy qoldiq hisobdagidan kam chiqganda (taqchil).
  --    Buxgalteriya: Dr 9500 Boshqa operatsion xarajatlar / Cr 1010 Xom ashyo.
  ('INVENTORY_ADJUST',
   '9500',
   '1010',
   'Inventarizatsiya taqchil: Dr Boshqa operatsion xarajatlar / Cr Xom ashyo')

) AS v(tt, da, ca, descr)
WHERE NOT EXISTS (
  SELECT 1
  FROM gl_account_mappings g
  WHERE g.transaction_type = v.tt
);

-- =============================================================================
-- Tekshiruv so'rovi (ishga tushirgandan keyin bajaring):
-- =============================================================================
-- SELECT transaction_type, debit_account, credit_account, description
-- FROM gl_account_mappings
-- ORDER BY id;
--
-- Kutilgan natija (kamida 8 qator):
--   transaction_type    | debit | credit | description
--   --------------------+-------+--------+--------------
--   EXTERNAL_IN         | 1010  | 6000   | ...
--   EXTERNAL_OUT        | 4000  | 9010   | ...
--   INTERNAL_ISSUE      | 2010  | 1010   | ...
--   INTERNAL_RETURN     | 1010  | 2010   | ...
--   INTERNAL_TRANSFER   | 1010  | 1010   | ...
--   DAMAGE              | 9500  | 1010   | ...
--   INVENTORY_ADJ_PLUS  | 1010  | 9810   | ...
--   INVENTORY_ADJUST    | 9500  | 1010   | ...
-- =============================================================================
```

---

## APPENDIX C: Bog'liq fayllar xaritasi (o'qish uchun — tegilmaydi)

Quyidagi fayllar P06 bilan bog'liq lekin OWNED emas — faqat kontekst uchun:

| Fayl | Aloqa |
|------|-------|
| `apps/api/src/modules/pos/infrastructure/repositories/gl-posting-log.repository.ts:129-134` | `postMovementToLedger` — gl_account_mappings dan mapping qidiradi |
| `apps/api/src/modules/sd/infrastructure/repositories/drizzle-sales-order.repo.ts:53-76` | `saveItems` — raw SQL bilan sales_order_items ga INSERT qiladi |
| `apps/api/src/shared/db/schema-business-b-1.ts:124-133` | `gl_account_mappings` pgTable ta'rifi (schema-core.ts emas) |
| `lib/db/src/schema/sd-order-items.ts:181-226` | `salesOrderItems` pgTable — varchar drift versiyasi (lib/db) |
| `apps/api/src/shared/db/migrations/seed-gl-account-mappings-pos.sql` | Mavjud 6-tur seed (parallel, o'chirilmaydi) |
| `apps/api/src/shared/db/migrations/add-sales-orders-fks.sql:39-41` | sales_order_items FK — integer tasdiqlangan |
| `apps/api/src/modules/finance/domain/constants/gl-accounts.constants.ts` | GL hisob kodlari (BHMS) |
| `apps/api/src/shared/db/seed-pos-movement-types.ts:24-32` | 7 ta POS harakat turi kodi |

---

## APPENDIX D: Possible CONFLICT — P01/P02 bilan koordinatsiya

**P01** (GOLDEN — lib barrel) va **P02** (GOLDEN — api barrel) sxema-barrel eksportlari
bilan ishlaydi. P06 `schema-core.ts` ga yangi eksport qo'shadi:
```typescript
export const sales_order_items = ...
export type SalesOrderItemRow = ...
export type InsertSalesOrderItem = ...
```

Agar `schema-core.ts` `@shared/db` barrel (`apps/api/src/shared/db/index.ts`) orqali
re-eksport qilinmagan bo'lsa, yangi eksportlar tashqi kod uchun ko'rinmaydi.

**Tekshirish (bajarish — owned file emas, faqat o'qish):**
```bash
grep -n "schema-core\|sales_order_items" \
  Uzbek-Language-Module/apps/api/src/shared/db/index.ts 2>/dev/null | head -10
```

**Natijaga qarab:**
- `schema-core` re-export topildi → hech narsa qilma (P06 barrel ga tegmaydi).
- `schema-core` re-export YO'Q → FLAG: P01 yoki P02 da barrel qo'shish kerak.
  P06 bu ishni bajarmaydi (owned file emas).

---

## APPENDIX E: Oltin zanjir bog'lanishi

```
SD buyurtma yaratildi (sales_orders + sales_order_items)
         ↓
PP rejalashtirish (sales_order_items.production_order_id → orders jadvali)
         ↓
MES sex (pos_movements harakat turlari)
         ↓
postMovementToLedger → gl_account_mappings (P06 seed) → entries (GL daftar)
         ↓
FIN hisobot (accounts/entries asosida P&L, balans)
```

P06 "MES → FIN" bo'g'ini uchun: GL mapping bo'lmasa moliya ko'r bo'ladi.
P06 seed orqali bu bo'g'in yopiladi.

---

*Direktiva holati: TAYYOR | Wave: 1 | P06-GOLDEN-golden-schema-seed | 2026-06-19*
