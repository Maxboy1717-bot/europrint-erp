# EUROPRINT ERP — DRIZZLE ORM STANDARTLARI

> **Drizzle ORM qanday ishlatiladi. Schema tuzilmasi, query pattern, migration.**
> DB operatsiyalar uchun Drizzle standart. Raw SQL = TAQIQ (Drizzle parameterized).
> Bog'liq: [STANDARTLAR.md](../STANDARTLAR.md) §3 · [PERFORMANCE_STANDARTLARI.md](PERFORMANCE_STANDARTLARI.md) · [MIGRATION_TARTIB.md](migration/MIGRATION_TARTIB.md)

---

## 1. SCHEMA FAYL TUZILMASI

```
apps/api/src/shared/db/
  schema-core.ts          ← KANONIK jadvallar (asosiy, barcha import shu)
  schema-compat.ts        ← V1 compat shims (deprecated, o'chiriladi)
  schema-compat-2.ts      ← V1 compat shims 2 (deprecated, o'chiriladi)
  schema-barrel.ts        ← Barcha export (index)
  drizzle.service.ts      ← DrizzleService provider
  index.ts                ← Re-export
```

```typescript
// ✅ TO'G'RI import:
import { hr_employees, org_functions, sales_orders } from '@shared/db';
// YOKI to'g'ridan:
import { hr_employees } from '../../shared/db/schema-core';

// ❌ TAQIQ — compat import (deprecated):
import { hrEmployees } from '../../shared/db/schema-compat'; // camelCase = eski
```

---

## 2. JADVAL DEFINITION PATTERN

```typescript
// schema-core.ts da yangi jadval:
import {
  pgTable, serial, text, integer, boolean, numeric,
  timestamp, varchar, index, uniqueIndex
} from 'drizzle-orm/pg-core';

export const hr_employees = pgTable('hr_employees', {
  // ─── PK ────────────────────────────────────────────────────
  id: serial('id').primaryKey(),

  // ─── FK ────────────────────────────────────────────────────
  org_function_id: integer('org_function_id')
    .notNull()
    .references(() => org_functions.id),

  // ─── Matn maydonlar ────────────────────────────────────────
  full_name: text('full_name').notNull(),
  email: text('email').unique(),
  phone: varchar('phone', { length: 20 }),

  // ─── Raqamlar ──────────────────────────────────────────────
  base_salary: numeric('base_salary', { precision: 18, scale: 2 }).notNull(),
  // numeric: pul uchun (float emas!) — PERFORMANCE §1 qoidasi

  // ─── Boolean ───────────────────────────────────────────────
  is_active: boolean('is_active').default(true).notNull(),

  // ─── Enum ──────────────────────────────────────────────────
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  // 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'

  // ─── Audit (MAJBURIY master data uchun) ────────────────────
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow().notNull(),
  created_by: integer('created_by').references(() => users.id),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),

}, (table) => ({
  // ─── Indexlar ──────────────────────────────────────────────
  orgFunctionIdx: index('idx_hr_employees_org_function_id')
    .on(table.org_function_id),
  deletedAtIdx: index('idx_hr_employees_deleted_at')
    .on(table.deleted_at),
  activeIdx: index('idx_hr_employees_active')
    .on(table.deleted_at)
    .where(sql`deleted_at IS NULL`), // partial index
}));

// Type inference (DTO o'rniga ishlatish mumkin):
export type HrEmployee = typeof hr_employees.$inferSelect;
export type NewHrEmployee = typeof hr_employees.$inferInsert;
```

---

## 3. QUERY PATTERNS

### SELECT (O'qish):
```typescript
import { db } from '@shared/db';
import { hr_employees, org_functions } from '@shared/db';
import { eq, isNull, like, and, or, inArray, gte, lte, count, asc, desc } from 'drizzle-orm';

// Yakka ob'ekt (ID bo'yicha):
const employee = await db
  .select()
  .from(hr_employees)
  .where(and(
    eq(hr_employees.id, id),
    isNull(hr_employees.deleted_at),     // soft delete filter
  ))
  .limit(1)
  .then(rows => rows[0] ?? null);

// JOIN bilan ro'yxat (N+1 YO'Q!):
const employees = await db
  .select({
    id: hr_employees.id,
    full_name: hr_employees.full_name,
    org_function_name: org_functions.name,
    razryad_coefficient: razryad_levels.coefficient,
  })
  .from(hr_employees)
  .leftJoin(org_functions, eq(hr_employees.org_function_id, org_functions.id))
  .leftJoin(razryad_levels, eq(hr_employees.razryad_level_id, razryad_levels.id))
  .where(and(
    isNull(hr_employees.deleted_at),
    search ? like(hr_employees.full_name, `%${search}%`) : undefined,
  ))
  .orderBy(desc(hr_employees.created_at))
  .limit(limit)
  .offset((page - 1) * limit);

// Total count (pagination uchun):
const [{ total }] = await db
  .select({ total: count() })
  .from(hr_employees)
  .where(isNull(hr_employees.deleted_at));

// IN query (N+1 o'rniga):
const items = await db
  .select()
  .from(sales_order_items)
  .where(inArray(sales_order_items.sales_order_id, orderIds));
```

### INSERT (Yaratish):
```typescript
// Bitta yaratish + returning:
const [newEmployee] = await db
  .insert(hr_employees)
  .values({
    full_name: 'Ali Valiev',
    org_function_id: 5,
    base_salary: '5000000',   // numeric → string (Drizzle)
    created_by: userId,
  })
  .returning();                // yaratilgan qatorni qaytaradi

// Conflict handling (upsert):
await db
  .insert(unit_of_measures)
  .values({ code: 'PCS', name_uz: 'Dona' })
  .onConflictDoNothing();      // seed uchun

// Ko'p yaratish:
await db.insert(sales_order_items).values([
  { sales_order_id: orderId, material_id: 1, quantity: 100 },
  { sales_order_id: orderId, material_id: 2, quantity: 50 },
]);
```

### UPDATE (Yangilash):
```typescript
// Yangilash + returning:
const [updated] = await db
  .update(hr_employees)
  .set({
    full_name: dto.full_name,
    updated_at: new Date(),    // MAJBURIY yangilash
  })
  .where(and(
    eq(hr_employees.id, id),
    isNull(hr_employees.deleted_at),
  ))
  .returning();

if (!updated) return Err(AppErr('HR_NOT_FOUND', 'Xodim topilmadi'));
```

### SOFT DELETE (O'chirish):
```typescript
// ✅ TO'G'RI — soft delete:
await db
  .update(hr_employees)
  .set({
    deleted_at: new Date(),
    deleted_by: userId,
  })
  .where(eq(hr_employees.id, id));

// ❌ TAQIQ — hard delete (master data uchun):
await db.delete(hr_employees).where(eq(hr_employees.id, id));
// WHY: FK constraint → boshqa jadvaldagi bog'liq ma'lumot buziladi
```

---

## 4. TRANZAKSIYA PATTERN

```typescript
// ✅ TO'G'RI — atomik operatsiya:
const result = await db.transaction(async (tx) => {
  // a) Asosiy yozuv:
  const [order] = await tx
    .insert(sales_orders)
    .values(orderData)
    .returning();

  // b) Bog'liq yozuvlar:
  await tx.insert(sales_order_items).values(
    items.map(item => ({ ...item, sales_order_id: order.id }))
  );

  // c) Outbox (event delivery kafolati):
  await tx.insert(domain_events).values({
    event_type: 'sales_order.created',
    aggregate_id: order.id,
    payload: JSON.stringify(new SalesOrderCreatedEvent(order.id)),
    status: 'PENDING',
  });

  return order;
});

// Rollback: tranzaksiya ichida throw → ROLLBACK avtomatik
// (NestJS Result<T> bilan: return Err emas, throw kerak tranzaksiya ichida)
throw new Error('Xato yuz berdi'); // → ROLLBACK
```

---

## 5. VIEW DEFINITION

```typescript
// VIEW yaratish (migration SQL da):
// CREATE VIEW current_stock AS
//   SELECT material_id, SUM(quantity) as quantity
//   FROM warehouse_transactions GROUP BY material_id;

// Drizzle da VIEW ni import qilish:
import { pgView } from 'drizzle-orm/pg-core';
export const current_stock = pgView('current_stock', {
  material_id: integer('material_id'),
  quantity: numeric('quantity'),
});

// VIEW dan O'QISH (FAQAT):
const stock = await db
  .select()
  .from(current_stock)
  .where(eq(current_stock.material_id, materialId));

// ❌ TAQIQ — VIEW ga YOZISH:
await db.insert(current_stock).values(...); // → runtime crash!
await db.update(current_stock).set(...);    // → runtime crash!
```

---

## 6. MIGRATION WORKFLOW

```
1. SQL fayl yoz:
   docs/migration/d[N]-[tavsif].sql
   Misol: docs/migration/d6-add-razryad-to-employees.sql

2. Fayl ichida:
   -- APPROVED: owner (2026-06-18)
   -- Idempotent (IF NOT EXISTS)
   ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS razryad_level_id INTEGER;

3. Owner tasdiqlaydi (Q-35).

4. Qo'llash:
   psql $DATABASE_URL < docs/migration/d6-add-razryad-to-employees.sql

5. Drizzle schema yangilash:
   schema-core.ts → razryad_level_id ustun qo'sh

6. Tekshiruv:
   npx tsc -p apps/api/tsconfig.json --noEmit

7. Commit (ALOHIDA migration + kod):
   git add docs/migration/d6-*.sql
   git commit -m "chore(db): add razryad_level_id to hr_employees"
   git add apps/api/src/shared/db/schema-core.ts
   git commit -m "feat(hr): add razryad_level support"
```

---

## 7. KANONIK JADVAL NOMLARI (Drizzle)

| DB Jadval | Drizzle Export | Eslatma |
|-----------|---------------|---------|
| `hr_employees` | `hr_employees` | Kanonik |
| `org_functions` | `org_functions` | Kanonik (FK hub=29) |
| `sales_orders` | `sales_orders` | Kanonik (orders emas!) |
| `warehouse_stock` | `warehouse_stock` | Kanonik (stocks emas!) |
| `entries` | `entries` | GL (SAP#76: gl_journal_entries TAQIQ) |
| `technology_cards` | `technology_cards` | Kanonik (tech_cards emas!) |
| `material_cards` | `material_cards` | Kanonik |
| `current_stock` | `current_stock` | VIEW (yozish TAQIQ) |
| `mes_shift_handovers` | `mes_shift_handovers` | VIEW (yozish TAQIQ) |

---

## 8. TAQIQ PATTERNLAR

```typescript
// ❌ TAQIQ 1 — raw SQL string interpolation (SQL injection):
await db.execute(sql`SELECT * FROM users WHERE name = '${userInput}'`);
// ✅ TO'G'RI:
await db.execute(sql`SELECT * FROM users WHERE name = ${userInput}`);

// ❌ TAQIQ 2 — N+1:
for (const emp of employees) {
  emp.function = await db.select().from(org_functions)
    .where(eq(org_functions.id, emp.org_function_id));
}
// ✅ TO'G'RI: JOIN bilan bir so'rov

// ❌ TAQIQ 3 — limitisiz katta jadval:
await db.select().from(sales_orders); // → potensial 100k qator
// ✅ TO'G'RI:
await db.select().from(sales_orders).limit(20).offset(0);

// ❌ TAQIQ 4 — schema-compat import:
import { salesOrders } from './schema-compat-2'; // camelCase = eski!
// ✅ TO'G'RI:
import { sales_orders } from './schema-core'; // snake_case = kanonik

// ❌ TAQIQ 5 — pul uchun float:
profit: real('profit') // → floating point error!
// ✅ TO'G'RI:
profit: numeric('profit', { precision: 18, scale: 2 })
```

---

*EuroPrint ERP · Drizzle ORM Standartlari · Versiya: 2026-06-18*
