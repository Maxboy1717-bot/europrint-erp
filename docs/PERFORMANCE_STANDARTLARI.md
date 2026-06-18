# EUROPRINT ERP — PERFORMANCE STANDARTLARI

> **Tizim tezligi va ishlash unumdorligi qoidalari.**
> Sekin tizim = foydalanuvchi ishlamaydi. Maqsad: real zavod temp ulanadi.
> Qoida: har ro'yxat so'rovi = 1 SQL. N+1 = bug.
> Bog'liq: [STANDARTLAR.md](../STANDARTLAR.md) §8 · [XAVF_REESTRI.md](XAVF_REESTRI.md) R-12

---

## 1. JAVOB VAQTI MAQSADLARI

| So'rov turi | Maqsad (P95) | Maksimum (P99) | Agar oshsa |
|-------------|-------------|---------------|-----------|
| `GET` yakka ob'ekt | < 50ms | < 150ms | EXPLAIN ANALYZE |
| `GET` ro'yxat (< 1000 qator) | < 100ms | < 300ms | Index tekshir |
| `GET` ro'yxat (> 1000 qator) | < 200ms | < 500ms | Pagination + index |
| `POST` yaratish | < 200ms | < 500ms | Tranzaksiya tekshir |
| `PATCH` yangilash | < 150ms | < 400ms | |
| `DELETE` o'chirish | < 100ms | < 300ms | |
| Hisobot (aggregate) | < 500ms | < 2000ms | Materialized view |

---

## 2. N+1 QUERY — ASOSIY XAT (QATIY TAQIQ)

```typescript
// ❌ N+1 XATO — 1 ro'yxat + N ta qo'shimcha so'rov:
const employees = await repo.findAll(); // → 1 SQL
const result = await Promise.all(
  employees.map(emp => repo.getOrgFunction(emp.org_function_id)) // → N SQL!
);
// 100 xodim → 101 SQL → 5-10 sekund timeout!

// ✅ TO'G'RI — 1 SQL + JOIN:
const employees = await db
  .select({
    id: hr_employees.id,
    full_name: hr_employees.full_name,
    org_function_name: org_functions.name,
  })
  .from(hr_employees)
  .leftJoin(org_functions, eq(hr_employees.org_function_id, org_functions.id))
  .where(isNull(hr_employees.deleted_at))
  .limit(20);
// 100 xodim → 1 SQL → 20ms
```

```typescript
// ❌ N+1 XATO — loop ichida DB:
for (const order of orders) {
  const items = await db.select().from(sales_order_items)
    .where(eq(sales_order_items.sales_order_id, order.id));
  order.items = items;
}

// ✅ TO'G'RI — bitta IN so'rov:
const orderIds = orders.map(o => o.id);
const allItems = await db.select().from(sales_order_items)
  .where(inArray(sales_order_items.sales_order_id, orderIds));
// items ni orderlar bo'yicha guruhlash (JS da, DB emas):
const itemsByOrder = allItems.reduce((acc, item) => {
  (acc[item.sales_order_id] ||= []).push(item);
  return acc;
}, {} as Record<number, typeof allItems>);
orders.forEach(o => { o.items = itemsByOrder[o.id] ?? []; });
```

---

## 3. PAGINATION — MAJBURIY QOIDALAR

```typescript
// ✅ Har ro'yxat endpointda pagination MAJBURIY:
@Get()
async findAll(@Query() query: PaginationQueryDto) {
  return this.service.findAll(query); // page, limit, total qaytarsin
}

// PaginationQueryDto (standart):
export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)  // ❗ MAKS 100 — cheksiz so'rov taqiq
  @Transform(({ value }) => Math.min(parseInt(value) || 20, 100))
  limit?: number = 20;
}

// Repository da:
const offset = (page - 1) * limit;
const [data, countResult] = await Promise.all([
  db.select().from(table).limit(limit).offset(offset),
  db.select({ count: count() }).from(table),
]);
const total = Number(countResult[0].count);

return {
  data,
  meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
};
```

---

## 4. INDEX STANDARTLARI

```sql
-- MAJBURIY indexlar (har yangi jadval yaratishda):

-- 1. Har FK ustun → index:
CREATE INDEX idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX idx_sales_order_items_order_id ON sales_order_items(sales_order_id);
CREATE INDEX idx_hr_employees_org_function_id ON hr_employees(org_function_id);

-- 2. Soft delete filter → deleted_at index:
CREATE INDEX idx_hr_employees_deleted_at ON hr_employees(deleted_at)
  WHERE deleted_at IS NULL; -- partial index (faqat faollar)

-- 3. Qidiruv maydoni → index:
CREATE INDEX idx_hr_employees_full_name ON hr_employees
  USING gin(to_tsvector('russian', full_name)); -- FTS

-- 4. Saralash maydoni → index:
CREATE INDEX idx_sales_orders_created_at ON sales_orders(created_at DESC);

-- 5. Unique biznes kalit:
CREATE UNIQUE INDEX idx_material_cards_code ON material_cards(code);

-- TEKSHIRISH — indexsiz FK topish:
SELECT
  tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON ...
LEFT JOIN pg_indexes ON ... -- indexsiz bo'lsa = muammo
```

---

## 5. QUERY OPTIMIZATSIYA (EXPLAIN ANALYZE)

```sql
-- Har qanday sekin query (> 100ms) uchun:
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT e.id, e.full_name, f.name as function_name
FROM hr_employees e
LEFT JOIN org_functions f ON f.id = e.org_function_id
WHERE e.deleted_at IS NULL
ORDER BY e.created_at DESC
LIMIT 20;

-- Nima izlash:
-- "Seq Scan" katta jadvalda → BAD (index kerak)
-- "Index Scan" → GOOD
-- "Nested Loop" katta N bilan → N+1 ehtimoli
-- "Hash Join" → JOIN uchun yaxshi
-- actual rows >> estimated rows → statistika eskirgan → ANALYZE [table]
```

---

## 6. DB ULANISH POOLING

```typescript
// drizzle.service.ts (mavjud):
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,           // maksimum ulanish
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

// Qoidalar:
// - Har modul bir xil DrizzleService ishlatadi (singleton)
// - Har request uchun yangi ulanish ochma (pool ishlatiladi)
// - Transaction ichida ulanishni ushlab tur (db.transaction())
// - Long-running query (> 5s) → timeout bilan o'chirish
```

---

## 7. KATTA JADVALLAR UCHUN STRATEGIYA

```typescript
// Katta jadvallar (> 10,000 qator): sales_orders, warehouse_stock, entries

// 1. Har doim WHERE va LIMIT:
db.select().from(sales_orders)
  .where(and(
    gte(sales_orders.created_at, fromDate),
    lte(sales_orders.created_at, toDate),
    isNull(sales_orders.deleted_at),
  ))
  .limit(100);

// ❌ TAQIQ — katta jadvalda limitisiz:
db.select().from(entries); // → timeout + memory out

// 2. Hisobot so'rovlar — Materialized View yoki fon task:
// - Kunlik moliya hisoboti → cron job (tun) + cache
// - OEE hisob → MES session tugaganda hisoblash (event listener)
// - Maosh summasi → PayrollPeriod.close() da oldindan hisob

// 3. Cursor-based pagination (katta set uchun):
// offset-based: offset=1000 → DB 1001 qator o'qiydi (slow)
// cursor-based: WHERE id > lastId LIMIT 20 (tez)
const employees = await db.select()
  .from(hr_employees)
  .where(
    and(
      isNull(hr_employees.deleted_at),
      cursor ? gt(hr_employees.id, cursor) : undefined,
    )
  )
  .orderBy(asc(hr_employees.id))
  .limit(20);
```

---

## 8. FRONTEND PERFORMANCE QOIDALARI

```typescript
// ✅ TO'G'RI — Tanstack Query bilan kerakli data:
const { data } = useQuery({
  queryKey: ['employees', { page, limit, search }],
  queryFn: () => fetchEmployees({ page, limit, search }),
  staleTime: 30_000, // 30 sekund kesh
  placeholderData: keepPreviousData, // sahifa almashuv flicker yo'q
});

// ❌ TAQIQ — kerak bo'lganda qayta fetch:
useEffect(() => {
  fetchAllEmployees().then(setEmployees); // pagination yo'q!
}, []);

// Skeleton loading (foydalanuvchi flicker ko'rmasin):
if (isLoading) return <EPSkeleton rows={5} />;

// Ro'yxat virtualizatsiya (1000+ element uchun):
// react-window yoki tanstack-virtual ishlatish
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## 9. PERFORMANCE TEKSHIRUV

```bash
# 1. Sekin so'rovlar (PG da):
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- 100ms dan sekin
ORDER BY mean_exec_time DESC
LIMIT 20;

# 2. Indexsiz FK:
node scripts/check-missing-indexes.mjs

# 3. FE bundle hajmi:
pnpm --filter erp-dashboard run build -- --analyze
# → 500KB dan katta chunk = code splitting kerak

# 4. Load test (k6 yoki autocannon):
autocannon -c 50 -d 10 http://127.0.0.1:3030/api/hr/employees
# → P99 < 500ms bo'lishi kerak (50 concurrent user)
```

---

*EuroPrint ERP · Performance Standartlari · Versiya: 2026-06-18*
