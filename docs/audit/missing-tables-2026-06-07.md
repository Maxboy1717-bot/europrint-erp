# Missing Tables — DDL-Needed List
> Generated: 2026-06-07  
> Source: status-catalog-2026-06-07.md PART B + PART C  
> Gate: Q-35 — CREATE TABLE requires owner `APPROVED:` comment before migration is run.  
> Action: Owner reviews, approves desired tables, agent writes migration.

---

## PART B — Tables needed (no schema exists, raw SQL crashes on missing table)

### 1. `zno`
| | |
|---|---|
| **Endpoints** | POST /api/hr/zno · GET /api/hr/zno · PATCH /api/hr/zno/:id/approve · PATCH /api/hr/zno/:id/reject · PATCH /api/hr/zno/:id |
| **Feature** | ZNO — departmental payment request form (Заявка на наличные/оплату). Director-facing approval workflow. |
| **Source file** | `modules/director/presentation/zno.controller.ts` · `modules/director/infrastructure/repositories/zno.repository.ts` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, department_id INT REFERENCES departments(id), submitted_by INT REFERENCES employees(id), submitter_name TEXT, amount NUMERIC(14,2), purpose TEXT, payment_date DATE, status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()` |

---

### 2. `zvs`
| | |
|---|---|
| **Endpoints** | POST /api/hr/zvs · GET /api/hr/zvs · PATCH /api/hr/zvs/:id/approve · PATCH /api/hr/zvs/:id/reject |
| **Feature** | ZVS — weekly budget allocation request (Заявка на выделение средств). Weekly planning cycle. |
| **Source file** | `modules/director/presentation/zvs.controller.ts` · `modules/director/infrastructure/repositories/zvs.repository.ts` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, department_id INT REFERENCES departments(id), submitted_by INT REFERENCES employees(id), submitter_name TEXT, amount NUMERIC(14,2), purpose TEXT, priority TEXT, week_date DATE, level TEXT, status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()` |

---

### 3. `micro_modules`
| | |
|---|---|
| **Endpoints** | GET /api/micro-modules · POST /api/micro-modules · POST /api/micro-modules/:id/view · PATCH /api/micro-modules/:id/view |
| **Feature** | LMS micro-learning modules: short video/text units attached to a course, with per-employee view-tracking. |
| **Source file** | `modules/lms/presentation/lms-misc.controller.ts` · `modules/lms/infrastructure/repositories/drizzle-lms-misc.repo.ts` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, title TEXT NOT NULL, title_ru TEXT, course_id INT REFERENCES courses(id) ON DELETE CASCADE, description TEXT, sort_order INT DEFAULT 0, is_active BOOL DEFAULT true, created_by INT REFERENCES employees(id), created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()` |

---

### 4. `micro_module_views`
| | |
|---|---|
| **Endpoints** | (same as micro_modules — recorded on POST/PATCH /api/micro-modules/:id/view) |
| **Feature** | Tracks which employee viewed which micro-module; upsert pattern (ON CONFLICT DO UPDATE viewed_at). |
| **Source file** | `modules/lms/infrastructure/repositories/drizzle-lms-misc.repo.ts:30` |
| **Proposed schema** | `micro_module_id INT REFERENCES micro_modules(id) ON DELETE CASCADE, employee_id INT REFERENCES employees(id) ON DELETE CASCADE, viewed_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (micro_module_id, employee_id)` |

---

### 5. `mes_sos_events`
| | |
|---|---|
| **Endpoints** | POST /api/mes/sos · GET /api/mes/sos/history |
| **Feature** | Production SOS/emergency events: operator triggers SOS during session, records reason and work center. |
| **Source file** | `modules/mes/infrastructure/repositories/mes-maintenance.repo.ts:71` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, session_id INT REFERENCES production_sessions(id), employee_id INT REFERENCES employees(id), reason TEXT, work_center_id INT REFERENCES work_centers(id), resolved_at TIMESTAMPTZ, resolved_by INT REFERENCES employees(id), created_at TIMESTAMPTZ DEFAULT now()` |

---

### 6. `mes_downtime_events`
> ⚠️ NOTE: `downtime_events` table (without `mes_` prefix) **already has a Drizzle schema** at  
> `apps/api/src/shared/db/schema-manufacturing.ts:149` and is referenced by prod-agent, aisha,  
> legacy-iot. If owner wants `mes_downtime_events` as a separate table, that is a new requirement.  
> Current code uses `downtime_events` (no prefix). This entry is listed per task spec; **verify  
> whether `mes_downtime_events` = renamed `downtime_events` or an additional table.**

| | |
|---|---|
| **Endpoints** | GET /api/mes/downtime-events · POST /api/mes/downtime-events · GET /api/mes/downtime-events/:sessionId |
| **Feature** | Machine/equipment downtime logging during production sessions. |
| **Source file** | `modules/mes/presentation/mes-maintenance.controller.ts:125-145` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, session_id INT REFERENCES production_sessions(id), work_center_id INT REFERENCES work_centers(id), reason_id INT, started_at TIMESTAMPTZ NOT NULL, ended_at TIMESTAMPTZ, duration_minutes INT, recorded_by INT REFERENCES employees(id), created_at TIMESTAMPTZ DEFAULT now()` |

---

### 7. `mes_material_consumption`
| | |
|---|---|
| **Endpoints** | POST /api/mes/material-consumption (mes-shifts-stats controller) |
| **Feature** | Records raw material consumed during a production session (quantity, batch number). |
| **Source file** | `modules/mes/infrastructure/repositories/mes-shifts-stats.repo.ts:133` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, session_id INT REFERENCES production_sessions(id), material_id INT REFERENCES material_cards(id), quantity NUMERIC(14,4) NOT NULL, batch_number TEXT, unit_of_measure TEXT, recorded_by INT REFERENCES employees(id), recorded_at TIMESTAMPTZ DEFAULT now()` |

---

### 8. `qc_approvals`
| | |
|---|---|
| **Endpoints** | PATCH /api/qc/approve/qc/:orderId · POST /api/qc/approve/qc/:orderId · PATCH /api/qc/approve/finance/:orderId · POST /api/qc/approve/finance/:orderId |
| **Feature** | Audit log for QC approval decisions — records approver, timestamp, result, and notes. Currently approvals are implicit status changes with no approval record. |
| **Source file** | `modules/qc/presentation/qc-defects.controller.ts:169-205` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, order_id INT NOT NULL, approval_type TEXT NOT NULL CHECK (approval_type IN ('qc','finance')), approved_by INT REFERENCES employees(id), status TEXT NOT NULL CHECK (status IN ('approved','rejected','conditional')), notes TEXT, approved_at TIMESTAMPTZ DEFAULT now()` |

---

### 9. `mm_vendor_ratings`
| | |
|---|---|
| **Endpoints** | GET /api/mm/dashboard (vendor-performance section) |
| **Feature** | Vendor quality/delivery/price scoring — one row per evaluation event. Dashboard aggregates with AVG. |
| **Source file** | `modules/mm/infrastructure/repositories/mm-dashboard.repository.ts:30` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, vendor_id INT REFERENCES mm_vendors(id) ON DELETE CASCADE, quality_score NUMERIC(4,2), delivery_score NUMERIC(4,2), price_score NUMERIC(4,2), purchase_order_id INT REFERENCES mm_purchase_orders(id), rater_id INT REFERENCES employees(id), notes TEXT, rated_at TIMESTAMPTZ DEFAULT now()` |

---

### 10. `mm_mrp_results`
| | |
|---|---|
| **Endpoints** | GET /api/mm/dashboard/mrp-results · GET /api/mm/dashboard (POST recalculates and upserts) |
| **Feature** | MRP calculation output: per-material required/available/shortage/suggested-order quantities. Upserted on recalc trigger. |
| **Source file** | `modules/mm/infrastructure/repositories/mm-dashboard.repository.ts:39-48` |
| **Proposed schema** | `material_id INT PRIMARY KEY REFERENCES material_cards(id), required_qty NUMERIC(14,4) NOT NULL DEFAULT 0, available_qty NUMERIC(14,4) NOT NULL DEFAULT 0, shortage_qty NUMERIC(14,4) NOT NULL DEFAULT 0, suggested_order_qty NUMERIC(14,4) NOT NULL DEFAULT 0, calculated_at TIMESTAMPTZ DEFAULT now()` |
| **Note** | `erp_mrp_results` is a SEPARATE table used by `/api/erp/orders/mrp-results`; `mm_mrp_results` is the MM-module-specific version. Both are missing. |

---

### 11. `mm_purchase_order_lines`
| | |
|---|---|
| **Endpoints** | GET /api/mm/dashboard (vendor pricing history per material) · GET /api/wms/inventory/materials/:id |
| **Feature** | Individual line items on MM purchase orders with material, quantity and unit price. Different from `mm_purchase_order_items` (which tracks goods-receipt line items). |
| **Source file** | `modules/mm/infrastructure/repositories/mm-dashboard.repository.ts:101` · `modules/wms/infrastructure/repositories/inventory-materials.repository.ts:62` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, purchase_order_id INT REFERENCES mm_purchase_orders(id) ON DELETE CASCADE, material_id INT REFERENCES material_cards(id), quantity NUMERIC(14,4) NOT NULL, unit_price NUMERIC(14,4), currency TEXT DEFAULT 'UZS', created_at TIMESTAMPTZ DEFAULT now()` |
| **Note** | `mm_purchase_order_items` already exists (migrations-drift.ts:2141) and handles goods-receipt items. `mm_purchase_order_lines` is the pre-receipt order line — they may be intended as one table. Owner should confirm whether to merge or keep separate. |

---

### 12. `employee_business_trips`
| | |
|---|---|
| **Endpoints** | GET /api/employees/:id/business-trips · POST /api/employees/:id/business-trips |
| **Feature** | Employee travel / business trip tracking (destination, dates, purpose, status). |
| **Source file** | `modules/compatibility/employees-compat-sub.controller.ts:115-118` · `modules/compatibility/employees-compat-financials.service.ts:92,156` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE, destination TEXT NOT NULL, purpose TEXT, start_date DATE NOT NULL, end_date DATE NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','completed','cancelled')), approved_by INT REFERENCES employees(id), created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()` |

---

### 13. `hr_referrals`
> ⚠️ Drizzle schema EXISTS at `apps/api/src/shared/db/schema-hr-tz2.ts:163` — pgTable is defined.  
> Table may be missing from live DB only (not migrated). Check `\dt hr_referrals` in psql.

| | |
|---|---|
| **Endpoints** | GET /api/hr/gsd/referrals · GET /api/hr/gsd/referrals/boomerang · POST /api/hr/gsd/referrals · PATCH /api/hr/gsd/referrals/:id |
| **Feature** | Employee referral program — who referred which candidate, status, reward tracking. |
| **Source file** | `modules/hr/presentation/hr-gsd.controller.ts:70-156` · `modules/hr/presentation/hr-gsd.repository.ts` |
| **Note** | Migration needed if table absent in live DB; Drizzle schema already written. |

---

### 14. `hr_mentorship_pairings`
> ⚠️ Drizzle schema EXISTS at `apps/api/src/shared/db/schema-hr-tz2.ts:190`.  
> Check live DB — may only need migration, not schema authoring.

| | |
|---|---|
| **Endpoints** | GET /api/hr/gsd/mentorship-pairings · POST /api/hr/gsd/mentorship-pairings · PATCH /api/hr/gsd/mentorship-pairings/:id |
| **Feature** | Mentor–mentee assignment: pairs an experienced employee (mentor) with a new hire (mentee), optionally linked to an LMS course. |
| **Source file** | `modules/hr/presentation/hr-gsd.controller.ts:174-206` · `modules/hr/presentation/hr-gsd.repository.ts:212` |

---

### 15. `councils` (coordination)
| | |
|---|---|
| **Endpoints** | GET /api/coordination/councils |
| **Feature** | Coordination councils list — currently returns hardcoded empty/stub data. |
| **Source file** | `modules/director/presentation/coordination.controller.ts:38` |
| **Proposed schema** | `id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, chairperson_id INT REFERENCES employees(id), meeting_schedule TEXT, is_active BOOL DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()` |

---

## PART C — FK type-drift (add to migration backlog)

### C1. `exhibitions.id` (varchar) ↔ `exhibition_leads.exhibition_id` (int)

| | |
|---|---|
| **Tables** | `exhibitions` (id = varchar/text) and `exhibition_leads` (exhibition_id = int) |
| **Evidence** | `marketing-analytics-stubs.controller.ts:405`: `WHERE exhibition_id::text=${id}` — explicit cast to make type-mismatched join work |
| **Affected endpoints** | GET /api/marketing/exhibitions/:id/leads · POST /api/marketing/exhibitions/:id/leads |
| **Fix options** | A) Migrate `exhibitions.id` to SERIAL/INT (preferred — int PK is standard); B) Change `exhibition_leads.exhibition_id` to TEXT. Option A requires updating all references. |
| **Note** | Neither `exhibitions` nor `exhibition_leads` has a Drizzle schema. Both tables are raw SQL only. Fix requires DDL + data migration. |

### C2. `inbox` FK type-drift
| | |
|---|---|
| **Status** | ⚠️ **NOT CONFIRMED** in codebase review. No `inbox` table found. `basket_state = 'inbox'` is a column value on `cc_documents`, not a separate table. |
| **Action** | Owner to clarify: which specific table pair has this drift? Possibly refers to `cc_documents` or a CRM inbox table not yet in the codebase. |

---

## Summary table

| # | Table | Has Drizzle schema | Has migration | Priority |
|---|---|---|---|---|
| 1 | `zno` | ❌ | ❌ | High — director workflow broken |
| 2 | `zvs` | ❌ | ❌ | High — director workflow broken |
| 3 | `micro_modules` | ❌ | ❌ | Medium — LMS feature |
| 4 | `micro_module_views` | ❌ | ❌ | Medium — depends on #3 |
| 5 | `mes_sos_events` | ❌ | ❌ | Medium — production safety log |
| 6 | `mes_downtime_events` | ⚠️ `downtime_events` exists | partial | Low — confirm rename vs new |
| 7 | `mes_material_consumption` | ❌ | ❌ | Medium — production traceability |
| 8 | `qc_approvals` | ❌ | ❌ | Low — audit log, not blocking |
| 9 | `mm_vendor_ratings` | ❌ | ❌ | Medium — dashboard data |
| 10 | `mm_mrp_results` | ❌ | ❌ | Medium — MRP feature |
| 11 | `mm_purchase_order_lines` | ❌ | ❌ | Medium — confirm vs items merge |
| 12 | `employee_business_trips` | ❌ | ❌ | Low — HR compat feature |
| 13 | `hr_referrals` | ✅ | ❌ | Medium — migration only needed |
| 14 | `hr_mentorship_pairings` | ✅ | ❌ | Medium — migration only needed |
| 15 | `councils` | ❌ | ❌ | Low — coordination stub |
| C1 | FK: exhibitions↔leads | ❌ | ❌ | Medium — type cast workaround active |
| C2 | FK: inbox (unconfirmed) | ❓ | ❓ | Owner to clarify |
