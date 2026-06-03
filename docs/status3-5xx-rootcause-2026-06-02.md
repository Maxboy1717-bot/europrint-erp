# EuroPrint ERP — 5xx Root Cause va DDL Tuzatish Rejasi
**Sana:** 2026-06-02 | **Branch:** chore/schema-convergence | **Holat:** READ-ONLY tahlil

---

## JAMI STATISTIKA

| Toifa | Son | Endpointlar |
|---|---|---|
| 503 SERVICE_UNAVAILABLE | 8 ta | mes/shifts, mes/maintenance, wms/transactions, finance/gl, finance/ratios, erp/capacity, pp/bom, pos-v2/inventory-counts |
| 200 ok=false (soft 500) | 5 ta | erp/production-facts, erp/production-plans, erp/daily-reports, erp/downtime-logs, erp/orders |
| 200 + NULL fields | 2 ta | hr/departments, hr/positions |
| **JAMI buzuq** | **15 ta** | |

**Muammo turlari:**
- A: Jadval DB'da yo'q (CREATE kerak) — 1 ta
- B: Ustun yo'q yoki noto'g'ri nom (ALTER TABLE) — 7 ta jadval, 15+ ustun
- C: FK tur drift uuid↔int (ehtiyotkorlik bilan) — 2 ta
- D: Null-guard yo'q (kod tuzatish) — 3 ta
- E: HR name=null — Drizzle schema `departments` table=`departments`, name ustuni bor — boshqa sabab

---

## HAR XATO TO'LIQ TAHLILI

---

### #1 — GET /api/mes/shifts (503)

**Root cause:** `mes_shift_handovers.incoming_supervisor` ustuni DB'da yo'q.

**Kod fayli:** `apps/api/src/modules/mes/infrastructure/repositories/mes-shifts-stats.repo.ts:165-177`

**Muammoli SQL:**
```sql
SELECT sh.*,
       COALESCE(e_out.first_name,'') || ' ' || COALESCE(e_out.last_name,'') AS outgoing_supervisor_name,
       COALESCE(e_in.first_name,'') || ' ' || COALESCE(e_in.last_name,'') AS incoming_supervisor_name
FROM mes_shift_handovers sh
LEFT JOIN employees e_out ON e_out.id = sh.outgoing_supervisor
LEFT JOIN employees e_in  ON e_in.id  = sh.incoming_supervisor
WHERE ...
```

**Xato:** `column mes_shift_handovers.incoming_supervisor does not exist`

**DB haqiqiy:** Avvalgi audit (xato1-katalog) ga ko'ra `mes_shift_handovers` da `received_by` ustuni bor (ekvivalent), lekin `incoming_supervisor` yo'q.

**Tuzatish turi:** B (ustun qo'shish)

**Qo'shimcha:** `shiftHandover()` INSERT ham xuddi shu ustunni ishlatadi (satr 25):
```sql
INSERT INTO mes_shift_handovers (outgoing_supervisor, incoming_supervisor, notes, issues, handover_time)
```

**Ikki variant tuzatish:**
1. DDL: `ALTER TABLE mes_shift_handovers ADD COLUMN IF NOT EXISTS incoming_supervisor INTEGER;`
2. Kod: `sh.incoming_supervisor` → `sh.received_by` (agar DB'da `received_by` bor bo'lsa)

**TAVSIYA:** DDL — chunki kod INSERT ham shu ustun nomini ishlatadi, nomni o'zgartirish ko'proq fayl o'zgartiradi.

---

### #2 — GET /api/mes/maintenance (503)

**Root cause:** `mes_maintenance_requests.assigned_to` va `work_center_id` ustunlari DB'da yo'q.

**Kod fayli:**
- `apps/api/src/modules/mes/infrastructure/repositories/mes-shifts-stats.repo.ts:179-191` (getMaintenanceRequests)
- `apps/api/src/modules/mes/infrastructure/repositories/mes-maintenance.repo.ts:35-46` (updateMaintenanceRequest)

**Muammoli SQL:**
```sql
SELECT mr.*,
       COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS assigned_to_name,
       wc.name AS work_center_name
FROM mes_maintenance_requests mr
LEFT JOIN employees e  ON e.id  = mr.assigned_to
LEFT JOIN work_centers wc ON wc.id = mr.work_center_id
```

**DB haqiqiy:** `mes_maintenance_requests` da `requested_by`, `resolved_by` bor; `assigned_to` va `work_center_id` YO'Q.

**Tuzatish turi:** B (2 ustun qo'shish)

---

### #3 — GET /api/wms/transactions (503)

**Root cause:** Ikki muammo birgalikda:

**3a) `wms_transactions.deleted_at` DB'da yo'q**

**Kod fayllari:**
- `apps/api/src/modules/wms/infrastructure/repositories/wms-extended.repository.ts:58` — `WHERE t.deleted_at IS NULL`
- `apps/api/src/modules/wms/infrastructure/repositories/wms-crud.repository.ts:32` — `SET deleted_at = NOW()`
- `apps/api/src/modules/wms/infrastructure/repositories/inventory-materials.repository.ts:70` — `AND t.deleted_at IS NULL`

**3b) `mm_materials.id` UUID ↔ `wms_transactions.material_id` integer**

**Kod fayli:** `apps/api/src/modules/wms/infrastructure/repositories/wms-extended.repository.ts:55`
```sql
LEFT JOIN mm_materials m ON m.id = t.material_id
```
Agar `mm_materials.id` = UUID, `t.material_id` = integer → `operator does not exist: uuid = integer`

**Tuzatish turi:** B+C

---

### #4 — GET /api/finance/gl (503)

**Root cause:** `gl_journal_lines` jadvali DB'da yo'q.

**Kod fayli:** `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-invoice.repo.ts:240`
```sql
LEFT JOIN gl_journal_lines gjl ON gjl.entry_id = gje.id
```

**DB holati:**
- `gl_journal_entries` — DB'da BOR (avvalgi audit tasdiqladi, 10 ustun)
- `gl_journal_lines` — DB'da YO'Q

**Tuzatish turi:** A (jadval yaratish)

**Izoh:** `gl_journal_entries` mavjud lekin bo'sh — xato `gl_journal_lines` yo'qligidan kelib chiqadi. Jadval yaratilgandan keyin endpoint ishlaydi (bo'sh natija qaytaradi).

---

### #5 — GET /api/finance/ratios (503)

**Root cause:** `gl_journal_lines` jadvali DB'da yo'q + `fetchFinancialRatiosGl` ushbu jadval orqali ishlaydi.

**Kod fayli:** `apps/api/src/modules/finance/infrastructure/repositories/drizzle-finance-planning.repo.ts:162-165`
```sql
FROM gl_journal_lines jl
JOIN gl_accounts a ON a.id = jl.account_id
JOIN gl_journal_entries e ON e.id = jl.entry_id
WHERE TO_CHAR(e.entry_date, 'YYYY-MM') = $1
```

**Xato ketma-ketligi:**
1. `gl_journal_lines` yo'q → `ERROR: relation "gl_journal_lines" does not exist`
2. `fetchFinancialRatiosGl()` throws
3. `FinancialRatiosService.computeForPeriod()` → `return Err('Ichki server xatosi')`
4. Lekin controller `unwrapOrThrow` qilmaydi — qaysi controller?

**Tekshirish kerak:** finance/ratios controller `FinancialRatiosService` chaqiradigan controller ni topish kerak.

**Tuzatish turi:** A (gl_journal_lines yaratish) — #4 bilan birgalikda hal bo'ladi.

---

### #6 — GET /api/erp/capacity (503)

**Root cause:** `mes_sessions.work_center_id` turi UUID, `work_centers.id` turi INTEGER — JOIN type mismatch.

**Kod fayli:** `apps/api/src/modules/erp/erp-reports.repository.ts:86`
```sql
SELECT wc.id, wc.name, wc.hours_per_day AS capacity_per_hour,
       COUNT(ms.id) FILTER (WHERE ms.status = 'active') AS active_sessions
FROM work_centers wc LEFT JOIN mes_sessions ms ON ms.work_center_id = wc.id
```

**PostgreSQL xato:** `ERROR: operator does not exist: uuid = integer`

**Tuzatish turi:** C (FK tur muvofiqlashtirish — ehtiyotkorlik bilan)

**Ehtiyotkorlik:** `mes_sessions.work_center_id` ustunini `integer`ga o'zgartirish kerak bo'lsa, mavjud ma'lumotlar yo'qolishi mumkin. `mes_sessions` bo'sh bo'lsa — xavfsiz.

**Muqobil yechim (xavfsiz):** JOIN ni `wc.id::text = ms.work_center_id::text` qilib cast qilish.

---

### #7 — GET /api/pp/bom (503)

**Root cause:** `GetBomsHandler.execute()` CQRS query orqali ishlaydi. Handler `safeCall` yo'q — agar `bom_headers` jadval yo'q yoki `material_cards` JOIN xato bo'lsa, uncaught exception `undefined.message` ga aylanadi.

**Kod fayli:** `apps/api/src/modules/pp/application/queries/get-boms.handler.ts:25-27`
```typescript
const [countRows, items] = await Promise.all([
  exec(sql`SELECT COUNT(*)::int AS count FROM bom_headers`),
  exec(sql`SELECT bh.*, mc.xom_ashyo AS product_name FROM bom_headers bh LEFT JOIN material_cards mc ON bh.product_id = mc.id ORDER BY bh.created_at DESC LIMIT ${limit} OFFSET ${offset}`),
]);
const rawTotal = Number(countRows[0]?.count ?? 0);
```

**Muammo:** `exec` async function — agar DB error bo'lsa, `Promise.all` rejects. `GetBomsHandler.execute()` da try-catch yo'q. `queryBus.execute()` uncaught error → NestJS 500/503.

**Qo'shimcha tekshiruv:** `bom_headers.product_id` turi qanday? Agar UUID bo'lsa va `material_cards.id` = integer bo'lsa, JOIN muvaffaqiyatsiz.

**Tuzatish turi:** D (null-guard / try-catch qo'shish)

**Qisqacha tuzatish:**
```typescript
async execute(query: GetBomsQuery): Promise<PaginatedResult<Row>> {
  try {
    // ... existing code
  } catch (e) {
    this.logger.error(`GetBomsHandler failed: ${String(e)}`);
    return { items: [], total: 0, page: 1, limit: 10 };
  }
}
```

---

### #8 — GET /api/pos-v2/inventory-counts (503)

**Root cause:** `inventory_counts` jadval DB'da YO'Q yoki ustun drift.

**Kod fayli:** `apps/api/src/modules/pos-v2/infrastructure/repositories/drizzle-pos-v2.repo.ts:58-59`
```typescript
const countsRows = await db.select().from(inventoryCounts)...
```

`inventoryCounts` → `inventory_counts` Drizzle schema-dan import qilingan (schema-pos-ext.ts:43).

**DB holati:** `inventory_counts` jadval avvalgi auditda `migrations-drift.ts`da "ADD COLUMN" ko'rsatmalari bor — ya'ni jadval BOR lekin ustunlar drift.

**Drift ustunlar (migrations-drift.ts:624-629):**
- `counted_by` — YO'Q
- `updated_at` — YO'Q
- `material_id` — YO'Q
- `counted_qty` — YO'Q
- `system_qty` — YO'Q
- `started_by` — YO'Q (Drizzle da mavjud)

**Tuzatish turi:** B (ustunlar qo'shish yoki migrations-drift ni ishlatish)

---

### #9 — GET /api/erp/production-facts (200 ok=false)

**Root cause:** `material_cards.name` ustuni DB'da yo'q, lekin kod `mc.xom_ashyo AS product_name` ishlatadi — bu TO'G'RI.

**Tekshiruv:** `apps/api/src/modules/erp/erp-reports.repository.ts:35`
```sql
SELECT pf.*, mc.xom_ashyo AS product_name, wc.name AS work_center_name
FROM erp_production_facts pf
LEFT JOIN material_cards mc ON mc.id = pf.product_id
LEFT JOIN work_centers wc ON wc.id = pf.work_center_id
ORDER BY pf.fact_date DESC
```

**Haqiqiy muammo:** `erp_production_facts.product_id` turi nima? `work_centers.id` integer, `mes_sessions.work_center_id` UUID — xuddi shu pattern bo'lishi mumkin.

**DB holati (xato2-ustun-nom-drift dan):** `erp_production_facts` ustunlari: `id, shift_date, fact_date, order_id, machine_id, produced_qty, defect_qty, created_at` — `product_id` va `work_center_id` YO'Q.

**Tuzatish turi:** B (ustunlar qo'shish)

---

### #10 — GET /api/erp/production-plans (200 ok=false)

**Root cause:** `erp_production_plans.product_id` ustuni DB'da yo'q.

**Kod fayli:** `apps/api/src/modules/erp/erp-reports.repository.ts:43`
```sql
SELECT pp.*, mc.xom_ashyo AS product_name
FROM erp_production_plans pp
LEFT JOIN material_cards mc ON mc.id = pp.product_id
ORDER BY pp.plan_date DESC
```

**Tuzatish turi:** B

---

### #11 — GET /api/erp/daily-reports (200 ok=false)

**Root cause:** `erp_daily_reports.work_center_id` DB'da yo'q.

**DB haqiqiy ustunlar:** `id, report_date, department_id, data, created_at`

**Kod fayli:** `apps/api/src/modules/erp/erp-reports.repository.ts:18`
```sql
SELECT dr.*, wc.name AS work_center_name
FROM erp_daily_reports dr
LEFT JOIN work_centers wc ON wc.id = dr.work_center_id
ORDER BY dr.report_date DESC
```

**Muammo:** `work_center_id` — `erp_daily_reports` jadvalida bu ustun yo'q. LEFT JOIN `NULL` qaytaradi, lekin `dr.*` da `work_center_id` yo'q bo'lsa PostgreSQL 42703 xatosi beradi.

**Tuzatish turi:** B (ustun qo'shish)

---

### #12 — GET /api/erp/downtime-logs (200 ok=false)

**Root cause:** `erp_downtime_logs.work_center_id` va `.reported_by` DB'da yo'q.

**DB haqiqiy ustunlar:** `id, machine_id, reason, started_at, ended_at, duration_min, created_at`

**Kod fayli:** `apps/api/src/modules/erp/erp-reports.repository.ts:60`
```sql
SELECT dl.*, wc.name AS work_center_name, (u.first_name || ' ' || u.last_name) AS reported_by_name
FROM erp_downtime_logs dl
LEFT JOIN work_centers wc ON wc.id = dl.work_center_id
LEFT JOIN users u ON u.id = dl.reported_by
ORDER BY dl.started_at DESC
```

**Tuzatish turi:** B (2 ustun qo'shish)

---

### #13 — GET /api/erp/orders (200 ok=false)

**Root cause:** `production_orders` → `material_cards` JOIN da ustun drift.

**Kod:** `apps/api/src/modules/erp/erp.repository.ts` (xato2 hujjatidan ma'lum)

`production_orders.customer_name` DB'da yo'q (DB: `id, order_number, product_id, planned_quantity`), `due_date` yo'q (DB: `planned_end_date`).

**Tuzatish turi:** B

---

### #14 — GET /api/hr/departments — name=null

**Root cause:** `departments` jadvali (schema: `schema-hr-lms.ts:167`) → `name text NOT NULL`. DB'da `departments` jadvalida ma'lumot yo'q yoki `name` ustuni NULL.

**Tekshiruv:** `hr-compat-a.repository.ts:241-257`
```typescript
const rows = await db.select({
  id:         hrDepartments.id,
  name:       hrDepartments.name,   // departments.name
  code:       hrDepartments.code,
  ...
}).from(hrDepartments)
```

`hrDepartments` = `canonicalDepartments` = `departments` table.

**Ehtimoliy sabab:** DB'da `departments` jadvali bor (avvalgi audit schema-hr-lms da aniqlandi) lekin u BO'SH — keyin `name=null` emas, balki `data=[]` bo'ladi.

**YOKI:** FE'da `data.name` o'rniga `data[0]?.name` kutayapti — bu FE muammosi.

**STATUS-1 hisobotida:** `name=null` degani ma'lumot bor lekin `name` ustuni NULL — bu esa `departments` jadvalida `name` ustuni o'rniga `name_uz/name_ru` ustunlari bor ehtimoli.

**Tuzatish turi:** E (tekshirish kerak — DB'da `departments.name` bor yoki yo'q)

---

### #15 — GET /api/hr/positions — name=null

**Root cause:** `positions` jadvalida `title` ustuni bor, kod `hrPositions.title` ni `name` sifatida qaytaradi:
```typescript
name: hrPositions.title,  // hr-compat-a.repository.ts:266
```

Bu to'g'ri. Agar `name=null` bo'lsa — `positions.title` NULL. Yoki FE muammosi.

**Tuzatish turi:** E (tekshirish)

---

## GURUHLANGAN TUZATISH REJASI

### A GURUH — CREATE TABLE (jadval yo'q)

| Jadval | Endpoint(lar) | Sabab |
|---|---|---|
| `gl_journal_lines` | GET /api/finance/gl, GET /api/finance/ratios | GL entries va ratio hisoblash uchun kerak |

---

### B GURUH — ALTER TABLE ADD COLUMN (ustun qo'shish)

| Jadval | Kerak ustun | Turi | Endpoint(lar) |
|---|---|---|---|
| `mes_shift_handovers` | `incoming_supervisor` | INTEGER | GET /api/mes/shifts |
| `mes_maintenance_requests` | `assigned_to` | INTEGER | GET /api/mes/maintenance |
| `mes_maintenance_requests` | `work_center_id` | INTEGER | GET /api/mes/maintenance |
| `wms_transactions` | `deleted_at` | TIMESTAMPTZ | GET /api/wms/transactions |
| `erp_production_facts` | `product_id` | INTEGER | GET /api/erp/production-facts |
| `erp_production_facts` | `work_center_id` | INTEGER | GET /api/erp/production-facts |
| `erp_production_plans` | `product_id` | INTEGER | GET /api/erp/production-plans |
| `erp_daily_reports` | `work_center_id` | INTEGER | GET /api/erp/daily-reports |
| `erp_downtime_logs` | `work_center_id` | INTEGER | GET /api/erp/downtime-logs |
| `erp_downtime_logs` | `reported_by` | INTEGER | GET /api/erp/downtime-logs |

---

### C GURUH — FK TUR DRIFT (uuid↔int)

| Jadval | Ustun | Hozir | Kerak | Xavf |
|---|---|---|---|---|
| `mes_sessions` | `work_center_id` | UUID | INTEGER | MEDIUM — `mes_sessions` bo'sh bo'lsa xavfsiz |
| `wms_transactions` | `material_id` | INTEGER | UUID yoki `mm_materials.id` ni integer ga o'zgartir | HIGH — data yo'qolishi mumkin |

**mm_materials ID muammosi:** `mm_materials.id` = UUID, lekin `wms_transactions.material_id` = integer. Ikkita variant:
1. `mm_materials.id` ni serial integer ga o'zgartirish (mavjud 0 qatordan ko'p bo'lsa xatarli)
2. `wms_transactions.material_id` ni UUID ga o'zgartirish

---

### D GURUH — KOD TUZATISH (null-guard / try-catch)

| Fayl | Muammo | Tuzatish |
|---|---|---|
| `pp/application/queries/get-boms.handler.ts:23` | try-catch yo'q → uncaught exception 503 | `execute()` ni try-catch bilan o'rab ol |
| `erp/erp-reports.repository.ts:86` | UUID↔int JOIN — catch allaqachon bor | Muqobil: `wc.id::text = ms.work_center_id::text` |

---

### E GURUH — TEKSHIRISH KERAK (HR name=null)

| Endpoint | Muammo | Tekshirish |
|---|---|---|
| GET /api/hr/departments | `name=null` | DB'da `departments` jadvalida ma'lumot bormi? `name` ustuni NULL'mi? |
| GET /api/hr/positions | `name=null` | DB'da `positions.title` NULL'mi? |

**Sabab:** DB bo'sh bo'lsa `data=[]` bo'ladi, `name=null` emas. Ehtimol FE da `data[0]?.name` null.

---

## TO'LIQ IDEMPOTENT DDL SKRIPT (Bosqich 0.2)

```sql
-- ============================================================
-- EuroPrint ERP — Bosqich 0.2 DB Drift Tuzatish
-- Sana: 2026-06-02 | Idempotent (qayta-qayta ishlasa xavfsiz)
-- ============================================================

-- ===== A GURUH: JADVAL YARATISH =====

-- gl_journal_lines: GL yozuvlari satrlar jadvali
-- gl_journal_entries (parent) DB'da allaqachon bor
CREATE TABLE IF NOT EXISTS gl_journal_lines (
  id            SERIAL PRIMARY KEY,
  entry_id      INTEGER NOT NULL REFERENCES gl_journal_entries(id) ON DELETE CASCADE,
  account_id    INTEGER NOT NULL REFERENCES gl_accounts(id),
  debit         NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit        NUMERIC(18,2) NOT NULL DEFAULT 0,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gl_journal_lines_entry_id ON gl_journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_gl_journal_lines_account_id ON gl_journal_lines(account_id);

-- ===== B GURUH: USTUN QO'SHISH (ADD ONLY) =====

-- 1. mes_shift_handovers: incoming_supervisor qo'shish
ALTER TABLE mes_shift_handovers
  ADD COLUMN IF NOT EXISTS incoming_supervisor INTEGER;

-- 2. mes_maintenance_requests: assigned_to + work_center_id qo'shish
ALTER TABLE mes_maintenance_requests
  ADD COLUMN IF NOT EXISTS assigned_to INTEGER,
  ADD COLUMN IF NOT EXISTS work_center_id INTEGER;

-- 3. wms_transactions: soft-delete qo'llab-quvvatlash
ALTER TABLE wms_transactions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER;

CREATE INDEX IF NOT EXISTS idx_wms_transactions_deleted_at
  ON wms_transactions(deleted_at) WHERE deleted_at IS NULL;

-- 4. erp_production_facts: product_id va work_center_id qo'shish
ALTER TABLE erp_production_facts
  ADD COLUMN IF NOT EXISTS product_id INTEGER,
  ADD COLUMN IF NOT EXISTS work_center_id INTEGER;

-- 5. erp_production_plans: product_id qo'shish
ALTER TABLE erp_production_plans
  ADD COLUMN IF NOT EXISTS product_id INTEGER;

-- 6. erp_daily_reports: work_center_id qo'shish
ALTER TABLE erp_daily_reports
  ADD COLUMN IF NOT EXISTS work_center_id INTEGER,
  ADD COLUMN IF NOT EXISTS shift VARCHAR(50),
  ADD COLUMN IF NOT EXISTS planned_qty NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_qty NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 7. erp_downtime_logs: work_center_id va reported_by qo'shish
ALTER TABLE erp_downtime_logs
  ADD COLUMN IF NOT EXISTS work_center_id INTEGER,
  ADD COLUMN IF NOT EXISTS reported_by INTEGER,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ===== C GURUH: FK TUR DRIFT (EHTIYOTKORLIK BILAN) =====
-- Bu operatsiyalar to'g'ridan-to'g'ri bajarilmaydi — ma'lumot yo'qolish xavfi bor.
-- Muqobil yechim: kod darajasida cast qilish.

-- erp/capacity uchun MUQOBIL (ALTER emas, kod tuzatish):
-- mes_sessions.work_center_id (UUID) ↔ work_centers.id (INTEGER)
-- SQL level cast:
-- wc.id::text = ms.work_center_id::text  -- PostgreSQL uchun
-- YOKI: mes_sessions.work_center_id INT ga o'zgartirish (agar jadval bo'sh bo'lsa):
-- ALTER TABLE mes_sessions ALTER COLUMN work_center_id TYPE INTEGER USING NULL;

-- wms_transactions.material_id (INTEGER) ↔ mm_materials.id (UUID)
-- MUQOBIL: mm_materials subquery orqali integer→uuid bridge:
-- LEFT JOIN mm_materials m ON m.id::text = t.material_id::text  -- agar mm_materials.id = uuid

-- ===== B.2 GURUH: inventory_counts DRIFT TUZATISH =====
-- (pos-v2/inventory-counts 503 uchun)
ALTER TABLE inventory_counts
  ADD COLUMN IF NOT EXISTS counted_by INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS material_id TEXT,
  ADD COLUMN IF NOT EXISTS counted_qty NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS system_qty NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS started_by TEXT;

ALTER TABLE inventory_count_lines
  ADD COLUMN IF NOT EXISTS stock_item_id UUID,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS item_name TEXT,
  ADD COLUMN IF NOT EXISTS system_quantity NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS unit TEXT;
```

---

## KOD TUZATISH REJALARI

### Kod tuzatish #1: GetBomsHandler try-catch

**Fayl:** `apps/api/src/modules/pp/application/queries/get-boms.handler.ts`

```typescript
async execute(query: GetBomsQuery): Promise<PaginatedResult<Row>> {
  try {
    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;
    const offset = (page - 1) * limit;
    const [countRows, items] = await Promise.all([
      exec(sql`SELECT COUNT(*)::int AS count FROM bom_headers`),
      exec(sql`SELECT bh.*, mc.xom_ashyo AS product_name FROM bom_headers bh LEFT JOIN material_cards mc ON bh.product_id::text = mc.id::text ORDER BY bh.created_at DESC LIMIT ${limit} OFFSET ${offset}`),
    ]);
    const rawTotal = Number(countRows[0]?.count ?? 0);
    const total = Number.isFinite(rawTotal) ? rawTotal : 0;
    return { items, total, page, limit };
  } catch (e) {
    this.logger.error(`GetBomsHandler xato: ${String(e)}`);
    return { items: [], total: 0, page: 1, limit: 10 };
  }
}
```

### Kod tuzatish #2: erp/capacity UUID cast

**Fayl:** `apps/api/src/modules/erp/erp-reports.repository.ts:86`

O'zgartirish (ALTER TABLE o'rniga):
```sql
-- ESkI (503):
FROM work_centers wc LEFT JOIN mes_sessions ms ON ms.work_center_id = wc.id

-- YANGI (xavfsiz cast):
FROM work_centers wc LEFT JOIN mes_sessions ms ON ms.work_center_id::text = wc.id::text
```

### Kod tuzatish #3: wms/transactions material_id cast

**Fayl:** `apps/api/src/modules/wms/infrastructure/repositories/wms-extended.repository.ts:55`

```sql
-- ESKI (503 agar type mismatch):
LEFT JOIN mm_materials m ON m.id = t.material_id

-- YANGI (xavfsiz cast):
LEFT JOIN mm_materials m ON m.id::text = t.material_id::text
```

---

## PRIORITY JADVALI

| Priority | # | Endpoint | Xato turi | Tuzatish | Vaqt |
|---|---|---|---|---|---|
| P0 🔴 | 4 | GET /api/finance/gl | gl_journal_lines yo'q | CREATE TABLE gl_journal_lines | 5 daqiqa |
| P0 🔴 | 5 | GET /api/finance/ratios | gl_journal_lines yo'q | P0 #4 bilan birgalikda hal bo'ladi | — |
| P0 🔴 | 7 | GET /api/pp/bom | uncaught exception | try-catch qo'shish | 5 daqiqa |
| P1 🟠 | 1 | GET /api/mes/shifts | incoming_supervisor yo'q | ALTER TABLE | 2 daqiqa |
| P1 🟠 | 2 | GET /api/mes/maintenance | assigned_to, work_center_id yo'q | ALTER TABLE | 2 daqiqa |
| P1 🟠 | 3 | GET /api/wms/transactions | deleted_at yo'q + UUID drift | ALTER TABLE + cast | 5 daqiqa |
| P1 🟠 | 6 | GET /api/erp/capacity | UUID↔int JOIN | Kod: `::text` cast | 2 daqiqa |
| P1 🟠 | 8 | GET /api/pos-v2/inventory-counts | inventory_counts ustun drift | ALTER TABLE (migrations-drift dan) | 3 daqiqa |
| P2 🟡 | 9,10 | GET /api/erp/production-facts/plans | product_id, work_center_id yo'q | ALTER TABLE | 3 daqiqa |
| P2 🟡 | 11 | GET /api/erp/daily-reports | work_center_id yo'q | ALTER TABLE | 2 daqiqa |
| P2 🟡 | 12 | GET /api/erp/downtime-logs | work_center_id, reported_by yo'q | ALTER TABLE | 2 daqiqa |
| P3 ⚪ | 13 | GET /api/erp/orders | production_orders drift | ALTER TABLE | 3 daqiqa |
| P3 ⚪ | 14,15 | GET /api/hr/departments/positions | name=null | DB tekshiruv kerak | — |

---

## BOSQICH 0.2 BAJARISH TARTIBI

1. **DDL skript ishlatish** (yuqoridagi SQL) — ~15 daqiqa
2. **GetBomsHandler try-catch** — 5 daqiqa kod
3. **erp/capacity `::text` cast** — 2 daqiqa kod
4. **wms/transactions material_id cast** — 2 daqiqa kod
5. **HR departments/positions** — DB'da data borligini tekshir, keyin qaror
6. **Backend restart va STATUS-2 probe**

**Jami kutiladigan natija:** 503 8 ta → 0 ta; ok=false 5 ta → 0-2 ta

---

## QUYIDAGI TEKSHIRUVLAR KERAK (Bosqich 0.2 oldidan)

```sql
-- 1. mes_shift_handovers haqiqiy ustunlari:
\d mes_shift_handovers

-- 2. mes_maintenance_requests haqiqiy ustunlari:
\d mes_maintenance_requests

-- 3. mm_materials.id turi (UUID yoki integer):
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name='mm_materials' AND column_name='id';

-- 4. mes_sessions.work_center_id turi:
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name='mes_sessions' AND column_name='work_center_id';

-- 5. erp_production_facts haqiqiy ustunlari:
\d erp_production_facts

-- 6. departments jadvalida ma'lumot bormi:
SELECT id, name FROM departments LIMIT 5;

-- 7. positions.title NULL'mi:
SELECT id, title FROM positions WHERE title IS NULL LIMIT 5;
```

---

## ESLATMALAR

1. **gl_journal_lines** yaratishda `gl_accounts` va `gl_journal_entries` JADVALLAR DB'da mavjud bo'lishi kerak. Avvalgi audit `gl_journal_entries` mavjud deb tasdiqlagan.

2. **wms_transactions.material_id vs mm_materials.id** type drift — agar `mm_materials` 0 qatordan ko'p bo'lsa, ALTER Table o'rniga kod darajasida `::text` cast ishlatish tavsiya qilinadi.

3. **mes_sessions.work_center_id** UUID — agar jadval bo'sh bo'lsa, `ALTER COLUMN TYPE INTEGER USING NULL` xavfsiz. Bo'sh emasligini tekshir.

4. **inventory_counts** drift — bu jadval allaqachon `migrations-drift.ts`da qamrab olingan. Drift migration-larni ishlatish yetarli.

5. **HR departments/positions name=null** — DB bo'sh yoki NULL tufayli. FE muammosi ham bo'lishi mumkin — backend `/api/hr/departments` `{ data: [], total: 0 }` qaytarsa, bu muvaffaqiyatli. FE da `data[0]?.name` emas, balki ro'yxat ko'rsatilishi kerak.

---

*Tayyorlangan: 2026-06-02 | Holat: READ-ONLY tahlil | Bajarish uchun egasi ruxsati kerak*
