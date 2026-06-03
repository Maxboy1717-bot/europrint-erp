# EuroPrint ERP — 500/503 Xato Katalogi
Sana: 2026-06-02 | Muhit: localhost:3030 | Branch: chore/schema-convergence
Token: admin / Admin123! (super_admin roli)

---

## JAMI STATISTIKA

- Tekshirilgan endpoint soni: ~90
- Haqiqiy 503 (hard fail): 6
- Soft 500 (HTTP 200, ok:false): 4
- **Jami buzuq: 10**
- A guruh (Jadval yo'q): 1
- B guruh (Ustun yo'q/noto'g'ri nom): 6
- C guruh (FK tur drift uuid↔int): 3
- D guruh (Kod xato): 0

---

## XATO JADVALI

| # | Endpoint | HTTP | Haqiqiy xato | Guruh | Pri |
|---|---|---|---|---|---|
| 1 | GET /api/finance/gl | 503 | `gl_journal_lines` jadvali DB'da yo'q | A | P0 |
| 2 | GET /api/finance/ratios | 503 | `gl_journal_lines` jadvali DB'da yo'q | A | P0 |
| 3 | GET /api/mes/shifts | 503 | `mes_shift_handovers.incoming_supervisor` ustuni yo'q (DB'da `received_by`) | B | P0 |
| 4 | GET /api/mes/maintenance | 503 | `mes_maintenance_requests.assigned_to` + `work_center_id` yo'q (DB'da `equipment_id`, `requested_by`) | B | P0 |
| 5 | GET /api/erp/capacity | 503 | `mes_sessions.work_center_id` = UUID, `work_centers.id` = integer — JOIN TYPE MISMATCH | C | P0 |
| 6 | GET /api/wms/transactions | 503 | (a) `wms_transactions.deleted_at` yo'q + (b) `mm_materials.id`=UUID ↔ `material_id`=integer | B+C | P0 |
| 7 | GET /api/erp/production-facts | 200 (ok:false) | `material_cards.name` yo'q — DB'da `xom_ashyo` | B | P1 |
| 8 | GET /api/erp/production-plans | 200 (ok:false) | `material_cards.name` yo'q — DB'da `xom_ashyo` | B | P1 |
| 9 | GET /api/erp/daily-reports | 200 (ok:false) | `erp_daily_reports.work_center_id` yo'q — DB'da faqat `report_date`, `department_id`, `data` | B | P1 |
| 10 | GET /api/erp/downtime-logs | 200 (ok:false) | `erp_downtime_logs.work_center_id` va `reported_by` yo'q — DB'da `machine_id` + `ended_at`, `duration_min` | B | P1 |

---

## A GURUH — JADVAL UMUMAN YO'Q (CREATE kerak)

| Jadval | Endpoint(lar) | Kod fayli |
|---|---|---|
| `gl_journal_lines` | GET /api/finance/gl, GET /api/finance/ratios | `drizzle-finance-invoice.repo.ts`, `drizzle-finance-planning.repo.ts` |

**Izoh:** `gl_journal_entries` DB'da bor (10 ustun), lekin `gl_journal_lines` (JOIN kaliti sifatida kod ishlatmoqda) umuman yo'q. `gl_lines` bor — bu alohida jadval (gl_document_id → gl_documents).

---

## B GURUH — USTUN YO'Q YOKI NOTO'G'RI NOM

| Jadval | Kod so'ragan ustun | DB'da haqiqiy ustun | Endpoint(lar) |
|---|---|---|---|
| `material_cards` | `.name` | `.xom_ashyo` | GET /erp/production-facts, /erp/production-plans |
| `erp_daily_reports` | `.work_center_id` | — (mavjud emas) | GET /erp/daily-reports |
| `erp_downtime_logs` | `.work_center_id` | — (mavjud emas; `.machine_id` bor) | GET /erp/downtime-logs |
| `erp_downtime_logs` | `.reported_by` | — (mavjud emas) | GET /erp/downtime-logs |
| `mes_shift_handovers` | `.incoming_supervisor` | `.received_by` (ekvivalent) | GET /mes/shifts |
| `mes_maintenance_requests` | `.assigned_to` | `.requested_by`, `.resolved_by` | GET /mes/maintenance |
| `mes_maintenance_requests` | `.work_center_id` | `.equipment_id` (almashtirish kerak) | GET /mes/maintenance |
| `wms_transactions` | `.deleted_at` | — (mavjud emas) | GET /wms/transactions |

---

## C GURUH — FK TUR DRIFT (uuid↔int)

| Jadval | Ustun | DB turi | Bog'liq jadval | Bog'liq ustun turi | Endpoint(lar) |
|---|---|---|---|---|---|
| `mes_sessions` | `work_center_id` | **uuid** | `work_centers` | `.id` = **integer** | GET /erp/capacity |
| `wms_transactions` | `material_id` | **integer** | `mm_materials` | `.id` = **uuid** | GET /wms/transactions |

**Izoh:** `erp/capacity` SQL xatosi: `ERROR: operator does not exist: uuid = integer` — PostgreSQL JOIN imkonsiz.

---

## ANIQ SQL XATOLARI (Server loglaridan olingan)

### 1. GET /api/erp/production-facts (soft 500)
```sql
-- Muammo: mc.name yo'q (xom_ashyo bor)
SELECT pf.*, mc.name AS product_name, wc.name AS work_center_name 
FROM erp_production_facts pf 
LEFT JOIN material_cards mc ON mc.id = pf.product_id 
LEFT JOIN work_centers wc ON wc.id = pf.work_center_id 
ORDER BY pf.fact_date DESC LIMIT $1 OFFSET $2
```
**Fayl:** `apps/api/src/modules/erp/erp-reports.repository.ts:35`

### 2. GET /api/erp/daily-reports (soft 500)
```sql
-- Muammo: dr.work_center_id yo'q (erp_daily_reports jadvalida)
SELECT dr.*, wc.name AS work_center_name 
FROM erp_daily_reports dr 
LEFT JOIN work_centers wc ON wc.id = dr.work_center_id 
ORDER BY dr.report_date DESC LIMIT $1 OFFSET $2
```
**Fayl:** `apps/api/src/modules/erp/erp-reports.repository.ts:17`

### 3. GET /api/erp/downtime-logs (soft 500)
```sql
-- Muammo: dl.work_center_id va dl.reported_by yo'q
SELECT dl.*, wc.name AS work_center_name, (u.first_name || ' ' || u.last_name) AS reported_by_name 
FROM erp_downtime_logs dl 
LEFT JOIN work_centers wc ON wc.id = dl.work_center_id 
LEFT JOIN users u ON u.id = dl.reported_by 
ORDER BY dl.started_at DESC LIMIT $1 OFFSET $2
```
**Fayl:** `apps/api/src/modules/erp/erp-reports.repository.ts:60`

### 4. GET /api/erp/capacity (503)
```sql
-- Muammo: mes_sessions.work_center_id uuid ↔ work_centers.id integer
SELECT wc.id, wc.name, wc.hours_per_day AS capacity_per_hour, ...
FROM work_centers wc 
LEFT JOIN mes_sessions ms ON ms.work_center_id = wc.id  -- UUID = integer => ERROR
GROUP BY wc.id, wc.name, wc.hours_per_day ORDER BY wc.name
```
**Fayl:** `apps/api/src/modules/erp/erp-reports.repository.ts:84` (getCapacity metodi)

### 5. GET /api/mes/shifts (503)
```sql
-- Muammo: incoming_supervisor ustuni yo'q (received_by bor)
SELECT sh.*, COALESCE(e_out.first_name,'') || ' ' || COALESCE(e_out.last_name,'') AS outgoing_supervisor_name,
       COALESCE(e_in.first_name,'') || ' ' || COALESCE(e_in.last_name,'') AS incoming_supervisor_name
FROM mes_shift_handovers sh
LEFT JOIN employees e_out ON e_out.id = sh.outgoing_supervisor
LEFT JOIN employees e_in  ON e_in.id  = sh.incoming_supervisor  -- ustun yo'q!
...
```
**Fayl:** `apps/api/src/modules/mes/infrastructure/repositories/mes-shifts-stats.repo.ts:164`

### 6. GET /api/mes/maintenance (503)
```sql
-- Muammo: assigned_to va work_center_id yo'q
SELECT mr.*, COALESCE(e.first_name,'') || ' ' || ... AS assigned_to_name, wc.name AS work_center_name
FROM mes_maintenance_requests mr
LEFT JOIN employees e  ON e.id  = mr.assigned_to    -- ustun yo'q
LEFT JOIN work_centers wc ON wc.id = mr.work_center_id  -- ustun yo'q
...
```
**Fayl:** `apps/api/src/modules/mes/infrastructure/repositories/mes-shifts-stats.repo.ts:179`

### 7. GET /api/wms/transactions (503)
```sql
-- Muammo 1: t.deleted_at yo'q; Muammo 2: m.id UUID ↔ t.material_id integer
SELECT t.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name, e.full_name AS created_by_name
FROM wms_transactions t
LEFT JOIN mm_materials m ON m.id = t.material_id  -- uuid=integer TYPE MISMATCH
LEFT JOIN wms_warehouses w ON w.id = t.warehouse_id
LEFT JOIN employees e ON e.id = t.created_by
WHERE t.deleted_at IS NULL  -- ustun yo'q!
...
```

### 8. GET /api/finance/gl + /api/finance/ratios (503)
```sql
-- Muammo: gl_journal_lines jadvali umuman yo'q
FROM gl_journal_lines jl
JOIN gl_accounts a ON a.id = jl.account_id
JOIN gl_journal_entries e ON e.id = jl.entry_id
WHERE TO_CHAR(e.entry_date, 'YYYY-MM') = $period
```
**Fayllar:** `drizzle-finance-invoice.repo.ts` (finance/gl), `drizzle-finance-planning.repo.ts` (finance/ratios)

---

## DB HOLATI (Mavjud vs Kutilgan)

### material_cards haqiqiy ustunlar
```
id, kod, xom_ashyo (≠ name!), xom_ashyo_ru, unit_of_measure, category,
format_a, format_b, grammage, current_stock, reserved_stock, available_stock,
min_stock, max_stock, reorder_point, unit_price, currency, ...
```
**Kod `mc.name` deb murojaaat qiladi — bu ustun YO'Q**

### erp_daily_reports haqiqiy ustunlar
```
id, report_date, department_id, data (jsonb), created_at
```
**Kod `dr.work_center_id` deb murojaaat qiladi — bu ustun YO'Q**

### erp_downtime_logs haqiqiy ustunlar
```
id, machine_id, reason, started_at, ended_at, duration_min, created_at
```
**Kod `work_center_id`, `reported_by` ishlatadi — bular YO'Q**

### mes_shift_handovers haqiqiy ustunlar
```
id, from_shift_id, to_shift_id, handover_date, department, machine_status,
pending_tasks, quality_issues, safety_notes, material_status,
handed_over_by, received_by, signature_data, status, created_at,
outgoing_supervisor, issues, handover_time, pending_tasks_count
```
**Kod `incoming_supervisor` ishlatadi — bu ustun YO'Q (DB'da `received_by`)**

### mes_maintenance_requests haqiqiy ustunlar
```
id, title, equipment_id, requested_by, status, priority,
description, resolved_at, resolved_by, notes, created_at, updated_at
```
**Kod `assigned_to`, `work_center_id` ishlatadi — bular YO'Q**

---

## TUZATISH REJASI (Bosqich 0.2)

### DDL Tuzatishlar (CREATE/ALTER TABLE)

```sql
-- 1. gl_journal_lines jadvali yaratish (yoki gl_lines bilan rename ifodalash)
CREATE TABLE IF NOT EXISTS gl_journal_lines (
  id          SERIAL PRIMARY KEY,
  entry_id    INTEGER NOT NULL REFERENCES gl_journal_entries(id),
  account_id  INTEGER NOT NULL,
  debit       NUMERIC(18,4) NOT NULL DEFAULT 0,
  credit      NUMERIC(18,4) NOT NULL DEFAULT 0,
  description TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_gl_journal_lines_entry_id ON gl_journal_lines(entry_id);

-- 2. wms_transactions - deleted_at qo'shish
ALTER TABLE wms_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 3. mes_shift_handovers - incoming_supervisor qo'shish (received_by alias)
ALTER TABLE mes_shift_handovers ADD COLUMN IF NOT EXISTS incoming_supervisor INTEGER;
-- Eski ma'lumotni ko'chirish:
UPDATE mes_shift_handovers SET incoming_supervisor = received_by WHERE incoming_supervisor IS NULL;

-- 4. mes_maintenance_requests - assigned_to + work_center_id qo'shish
ALTER TABLE mes_maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to INTEGER;
ALTER TABLE mes_maintenance_requests ADD COLUMN IF NOT EXISTS work_center_id INTEGER;
UPDATE mes_maintenance_requests SET assigned_to = requested_by WHERE assigned_to IS NULL;
```

### Kod Tuzatishlar

```typescript
// 1. erp-reports.repository.ts:35 - mc.name → mc.xom_ashyo
// O'zgartirish:
sql`... mc.xom_ashyo AS product_name ...`
// Fayl: apps/api/src/modules/erp/erp-reports.repository.ts

// 2. erp-reports.repository.ts:17 - erp_daily_reports.work_center_id yo'q
// Yechim: LEFT JOIN ni olib tashlab, department_id bilan ishlash:
sql`SELECT dr.* FROM erp_daily_reports dr ORDER BY dr.report_date DESC ...`

// 3. erp-reports.repository.ts:60 - work_center_id, reported_by yo'q
// Yechim: machine_id → work_center_id (noto'g'ri JOIN olib tashlash)
sql`SELECT dl.* FROM erp_downtime_logs dl ORDER BY dl.started_at DESC ...`

// 4. erp-reports.repository.ts:84 - uuid↔int mismatch
// Yechim: mes_sessions.work_center_id::text::int yoki JOIN olib tashlash

// 5. wms-transactions.repo - material_id JOIN mm_materials
// mm_materials.id UUID, wms_transactions.material_id int => MISMATCH
// Yechim: material_cards jadvalidan foydalanish (material_cards.id = integer)
// sql`LEFT JOIN material_cards mc ON mc.id = t.material_id` (emas mm_materials)
```

---

## QO'SHIMCHA TEKSHIRILGAN (OK yoki 404)

| Endpoint | Status | Holat |
|---|---|---|
| GET /api/sd/customers | 200 | OK |
| GET /api/sd/orders | 200 | OK |
| GET /api/crm/leads | 200 | OK |
| GET /api/crm/deals | 200 | OK |
| GET /api/hr/departments | 200 | OK |
| GET /api/hr/positions | 200 | OK |
| GET /api/hr/employees | 200 | OK |
| GET /api/qc/inspections | 200 | OK |
| GET /api/qc/reclamations | 200 | OK |
| GET /api/marketing/nps | 200 | OK |
| GET /api/marketing/campaigns | 200 | OK |
| GET /api/design/orders | 200 | OK |
| GET /api/design/statistics | 200 | OK |
| GET /api/inventory/materials | 200 | OK |
| GET /api/wms/warehouses | 200 | OK |
| GET /api/wms/stock | 200 | OK |
| GET /api/wms/inventory | 200 | OK |
| GET /api/wms/movements | 200 | OK |
| GET /api/finance/accounts | 200 | OK |
| GET /api/finance/transactions | 200 | OK |
| GET /api/finance/budgets | 200 | OK |
| GET /api/finance/gl/trial-balance | 200 | OK |
| GET /api/finance/invoices | 200 | OK |
| GET /api/finance/cash-flow | 200 | OK |
| GET /api/pp/production-orders | 200 | OK |
| GET /api/pp/routing | 200 | OK |
| GET /api/pp/work-centers | 200 | OK (bo'sh []) |
| GET /api/pp/crp | 200 | OK (bo'sh natija) |
| GET /api/mes/production-sessions | 200 | OK |
| GET /api/mes/oee | 200 | OK |
| GET /api/mes/papka-orders | 200 | OK |
| GET /api/erp/work-centers | 200 | OK (bo'sh []) |
| GET /api/erp/employee-work-centers | 200 | OK |
| GET /api/erp/shift-calendars | 200 | OK |
| GET /api/erp/work-centers/capacity | 200 | OK (data:null) |
| GET /api/hr/payroll | 200 | OK |
| GET /api/hr/attendance | 200 | OK |
| GET /api/hr/leave-requests | 200 | OK |
| GET /api/hr-v2/pip | 200 | OK |
| GET /api/hr-v2/enps | 200 | OK |
| GET /api/hr-v2/reception | 200 | OK |
| GET /api/crm/pipeline | 200 | OK |
| GET /api/crm/companies | 200 | OK |
| GET /api/crm/contacts | 200 | OK |
| GET /api/pos/stock | 200 | OK (bo'sh) |
| GET /api/pos/transactions | 200 | OK |

---

*Tayyorlandi: 2026-06-02 | Metod: jonli HTTP probe + psql schema tekshiruvi + kod tahlili*
