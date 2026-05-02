# FK Migration — UUID/INT mismatch tuzatish

ARCHITECTURE.md Bo'lim D — 12 ta `varchar→int` FK ni additiv tarzda tuzatish.

## Maqsad

Loyihada 295 ta `::int` cast bor (audit:problems), chunki ba'zi FK ustunlar varchar
bo'lib, integer PK ga reference qilmoqda. Bu:
- ❌ Indeks ishlatilmaydi (seq scan)
- ❌ FK constraint yo'q (referential integrity yo'q)
- ❌ Type safety yo'q (TS run-time'da xato berishi mumkin)

## Strategiya: Additiv parallel ustun

Modullarni buzmaslik uchun migration 4 bosqichda:

### 1️⃣ Migration 0008 — Parallel `_int` ustun qo'shish (qilingan)

```bash
psql "$DATABASE_URL" -f drizzle/0008_fk_int_parallel_columns.sql
```

Natija:
- `customer_orders.customer_id_int` (NULLABLE INTEGER)
- `public_products.category_id_int`, `erp_product_id_int`
- `sd_leads.manager_id_int` (agar varchar bo'lsa)
- `sd_payments.customer_id_int`
- `sales_invoices.order_id_int`, `gl_document_id_int`
- `sales_orders.tech_approved_by_int`, `created_by_int`, `changed_by_int`
- `crm_deals.assigned_to_int`, `crm_leads.assigned_to_int`

Mavjud yozuvlar avtomatik backfill qilinadi (`_safe_text_to_int`).

`tr_customer_orders_sync_int` va `tr_public_products_sync_int` trigger'lari
har INSERT/UPDATE'da yangi ustunni avtomatik to'ldiradi.

### 2️⃣ Repository migration — `useIntFkColumns()` switch

Har repository da:
```typescript
import { useIntFkColumns, fkColumnName } from '@common/db/fk-switch';

const colName = fkColumnName('customer_id'); // 'customer_id' yoki 'customer_id_int'
```

Yoki Drizzle bilan parallel column'larni schema'ga qo'shing:
```typescript
export const customerOrders = pgTable("customer_orders", {
  // ...
  customerId: varchar("customer_id"),      // legacy
  customerIdInt: integer("customer_id_int"), // yangi
});
```

Repository read'lari `useIntFkColumns()` qaytarsa yangi ustunni o'qiydi.

### 3️⃣ Soak — 1 hafta

Production'da:
```
FK_USE_INT_COLUMNS=true
```

Hamma query'lar yangi ustundan o'qiydi. Trigger eski ustunni avtomatik sync qiladi.

Audit:
```bash
pnpm audit:api      # ::int cast soni kamayganmi?
pnpm audit:problems # Raw SQL kamayganmi?
```

### 4️⃣ Migration 0009 — Eski ustunlarni DROP

```bash
mv drizzle/0009_fk_int_finalize.sql.template drizzle/0009_fk_int_finalize.sql
psql "$DATABASE_URL" -f drizzle/0009_fk_int_finalize.sql
```

Natija:
- Eski varchar ustunlar DROP
- `_int` ustunlari eski nomga RENAME
- FK constraint qo'shiladi
- Trigger va helper funksiya o'chiriladi

## Rollback rejasi

Har bosqichda:
1. **Replit Checkpoint** olib qo'ying (har migration'dan oldin)
2. Agar 0008 xato bo'lsa: faqat yangi `_int` ustunlarni DROP qilish (eski kod ishlamay qolmaydi)
3. Agar repository read xato bo'lsa: `FK_USE_INT_COLUMNS=false` qaytaring
4. Agar 0009 xato bo'lsa: Checkpoint dan oldingi DB ga qaytish

## Tekshiruv

Har bosqichdan keyin:

```sql
-- Backfill to'liqligi
SELECT
  COUNT(*) AS total,
  COUNT(customer_id) AS varchar_filled,
  COUNT(customer_id_int) AS int_filled,
  COUNT(*) FILTER (WHERE customer_id IS NOT NULL AND customer_id_int IS NULL) AS unmapped
FROM customer_orders;
```

`unmapped` = 0 bo'lishi shart. Agar > 0 — backfill xatosi (raqam emas qiymat).

## Eslatma — `gl_document_id`

`gl_documents.id` ba'zan UUID, ba'zan integer (loyiha tarixiga qarab).
Migration 0008 avtomatik tekshiradi va faqat integer bo'lsa parallel ustun qo'shadi.
UUID bo'lsa — `gl_document_id` varchar qoladi (to'g'ri).
