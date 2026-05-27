# Report 03 — Database Drift and Duplicates

**Audit date:** 2026-05-27 (round 2)
**Auditor:** forensic-agent (read-only)
**Primary sources:**
- `_drift_report_fresh.txt` (217 lines, 13 952 B, generated 2026-05-21 15:45)
- `apps/api/src/shared/db/invariants/migrations-drift.ts` (3 302 lines, 1 180 entries, generated 2026-05-21 06:54:58 UTC)
- `apps/api/src/shared/db/invariants.ts` (boot-time runner)
- `apps/api/src/main.ts` lines 85–110 (invokes the runner)
- `lib/db/src/schema/*.ts` (canonical Drizzle definitions)
- `apps/api/src/shared/db/schema-*.ts` (API-side stubs / re-exports)

## Diff vs round 1

Verified with side-by-side reread of `docs/full-analysis-2026-05-27/03-db-drift-and-duplicates.md`. The following round-1 claims have changed in the current code/data:

| Round-1 claim | Round-2 status | Evidence |
|---|---|---|
| `_drift_report_fresh.txt` had 73 missing tables and 527 missing columns | **Confirmed unchanged.** File is byte-for-byte the same (timestamp 2026-05-21 15:45). | `awk` count produces 73 missing-table lines and 527 column entries. |
| `migrations-drift.ts` "1 151 entries, generated 2026-05-21" | **Slightly higher now.** File header still says 1 151, but file contains 1 180 `{ name: ... }` entries (29 additional manual entries appended below the auto-generated block, including the TASK 2…6 FK-type fixes). | `grep -c "^  { name:" → 1180`; tail of file has hand-written `// TASK 2..6` blocks. |
| Round 1 said the FK type for `min_stock_alerts.materialCardId` and `goods_receipt_lines.material_card_id` was wrong (declared `varchar`). | **Both have been fixed in source.** Both columns are now `integer("material_id")` in `lib/db/src/schema/mm-material-cards.ts:126` and `lib/db/src/schema/mm-purchase.ts:119`. The drift runner also has a `goods_receipt_lines.material_id TYPE integer` ALTER. | See §4. |
| Round 1 file path `apps/api/src/shared/db/pos-schema-v2.ts` | **Incorrect path.** No such file. The canonical `pos-schema-v2.ts` is at `lib/db/src/schema/pos-schema-v2.ts` (702 lines). Round 1's actual evidence still resolves to that file. |
| `lms_lessons` flagged round-1 CRITICAL (absent from DB, queried by code) | **No longer in the drift report.** The fresh report does not list `lms_lessons` under missing tables. So either (a) the table now exists in the live DB, or (b) the code no longer queries it. Round 1's claim that the drift runner didn't add it is still true — there is no `lms_lessons CREATE TABLE` in `migrations-drift.ts`. Must have been created by an out-of-band SQL script (e.g. one of the 41 `apps/api/src/shared/db/migrations/*.sql` files). |
| Round 1 listed 16 `ow_*` tables and 12 `task_*` tables as absent | **Confirmed: still absent.** `grep -c "^  ow_" _drift_report_fresh.txt → 16`; `grep -c "^  task_" → 12`. |
| Round 1 said tables with column drift = 177 | **Header of `migrations-drift.ts` still claims 177**, but the fresh drift report itself lists only 135 tables with missing columns. The 177 figure includes tables that were already corrected after the drift file was generated. |
| Round 1 said the `current_stock` table has `material_card_id` while the rest of the codebase uses `material_id` | **Confirmed.** Only `apps/api/src/shared/db/schema-ext-a-1.ts:45` uses `material_card_id`. Drift report still lists `current_stock: material_card_id` as missing column. |
| Round 1 mentioned varchar→serial FK type mismatches as "HIGH" risk | **Vastly more pervasive than round 1 reported.** 126 such mismatches exist in `lib/db/src/schema` alone (108 → `users.id`, 10 → `vendors.id`, 7 → `materialCards.id`, 1 → `departments.id`). See §4. |
| Round 1 found `purchase_order_items.po_id` + `purchase_order_items.purchase_order_id` both present | **Confirmed and broader.** Same table also has both `raw_material_id` AND `material_id` as duplicate FK aliases. The "ADD-ONLY superset" pattern that creates these duplicates is used across at least 28 tables (`grep -c "live-DB superset\|alternate FK alias"`). See §6. |

New findings not in round 1:

- Round 1 only listed 7 homonym table pairs. Round 2 finds **at least 15 cross-layer dual-entity registries** (see §5).
- Round 1 mentioned drift was the runner. Round 2 verifies it is bootstrapped in `apps/api/src/main.ts:103` via `ensureSchemaAdditions()` and runs `[...SCHEMA_MIGRATIONS, ...TRIGGER_MIGRATIONS, ...CRM_MIGRATIONS, ...DRIFT_MIGRATIONS]` on every cold boot.
- Round 2 isolates a separate, parallel migration system: 41 `*.sql` files in `apps/api/src/shared/db/migrations/`, including `drift-fix-01..04c-*.sql` — none of these are wired into the boot runner.

---

## 1. Drift summary

Verified counts from `_drift_report_fresh.txt`:

```
=== SUMMARY ===
Drizzle pgTable (unique names): 957
DB tables+views: 951
Drizzle tables MISSING in DB: 73
Drizzle columns MISSING in DB (on existing tables): 527
```

| Metric | Count | Source |
|---|---|---|
| Total non-blank entries in drift report | 208 | `grep -c "^  " _drift_report_fresh.txt` |
| Missing-table entries | 73 | `awk` between markers, count of `^  ` lines |
| Tables with missing-column entries | 135 | same |
| Sum of missing columns across all 135 tables | 527 | `awk` over comma-separated lists |
| Average missing columns per affected table | 3.90 | 527 / 135 |
| `migrations-drift.ts` total migration objects | 1 180 | `grep -c "^  { name:"` (1 151 auto + 29 manual tail) |
| `migrations-drift.ts` ADD COLUMN statements | 1 021 | `grep -c "ADD COLUMN"` |
| `migrations-drift.ts` CREATE TABLE statements | 317 | `grep -c "CREATE TABLE"` (some are CREATE TABLE within DO blocks) |
| `tenant_id` mentions in drift report | 18 | (17 tables explicitly missing tenant_id + 1 header) |

The header of `migrations-drift.ts` (line 12) advertises:

```
 * Coverage:
 *   - 177 live tables with column drift → ADD COLUMN
 *   - 135 live Drizzle-only tables → CREATE TABLE
 *   - Total entries: 1151
```

The "177 → ADD COLUMN" header is stale; the live drift count is now 135. The "135 Drizzle-only tables → CREATE TABLE" number from the header does not match the 73 absent tables in `_drift_report_fresh.txt`. The discrepancy of 62 means the drift runner attempts to create 62 more tables than the fresh drift report says are missing — probably tables that the runner already created on prior boots (the runner's job is to keep the DB superset of Drizzle definitions; the drift report reflects the post-bootstrap state).

---

## 2. Missing tables

73 tables defined in Drizzle code are absent from the live DB. Grouped by their defining schema file (counts from `awk` over the missing-tables block):

| Schema file | Missing-table count |
|---|---|
| `lib/db/src/schema/order-workflow-schema.ts` | 16 |
| `lib/db/src/schema/kanban/kanban-extended.ts` | 12 |
| `lib/db/src/schema/pos-schema-v2.ts` | 5 |
| `lib/db/src/schema/ecommerce-schema.ts` | 5 |
| `lib/db/src/schema/lms.ts` | 3 |
| `apps/api/src/shared/db/schema-compat-4.ts` | 3 |
| `apps/api/src/shared/db/schema-compat-3.ts` | 3 |
| `apps/api/src/shared/db/schema-ai.ts` | 3 |
| `lib/db/src/schema/pp/pp-enhanced.ts` | 2 |
| `lib/db/src/schema/pos-schema.ts` | 2 |
| `lib/db/src/schema/hr-recruiter.ts` | 2 |
| `lib/db/src/schema/crm-proposals.ts` | 2 |
| `lib/db/src/schema/crm-contacts.ts` | 2 |
| `apps/api/src/shared/db/schema-misc-app-b.ts` | 2 |
| `apps/api/src/shared/db/schema-marketing-ext.ts` | 2 |
| `apps/api/src/shared/db/schema-kanban.ts` | 2 |
| `lib/db/src/schema/strategic-ext-schema.ts` | 1 |
| `lib/db/src/schema/skills.ts` | 1 |
| `lib/db/src/schema/orders-registry-schema.ts` | 1 |
| `lib/db/src/schema/mm-inventory.ts` | 1 |
| `lib/db/src/schema/crm-pipelines.ts` | 1 |
| `apps/api/src/shared/db/schema-ext-a-2.ts` | 1 |
| `apps/api/src/shared/db/schema-admin-ext.ts` | 1 |

### 2.1 Order Workflow module (16 tables, all absent)

`lib/db/src/schema/order-workflow-schema.ts` defines an entire Order Workflow domain whose tables have never been migrated:

```
ow_contracts                   ow_pallet_recoveries
ow_credit_limits               ow_production_plans
ow_deliveries                  ow_qc_results
ow_document_workflow_instances ow_rework_events
ow_fg_transfers                ow_shipping_requests
ow_order_lines                 ow_tech_cards
ow_order_samples               ow_work_orders
ow_order_surveys
ow_packaging_records
```

Severity: any service that imports from `order-workflow-schema.ts` and reaches Postgres will raise `relation "ow_*" does not exist`. The drift runner does not create them.

### 2.2 Kanban-extended (12 tables, all absent)

`lib/db/src/schema/kanban/kanban-extended.ts`:

```
task_card_tags     task_observers     task_tags
task_checklists    task_result_files  task_templates
task_co_executors  task_results       task_time_entries
task_files                            task_time_tracks
task_notifications
```

### 2.3 POS / Ecommerce / LMS / Misc (smaller clusters)

```
pos-schema-v2.ts:  employee_write_off_acts, employee_write_off_act_lines,
                   pos_serial_number_items, pos_stock_reservations,
                   production_material_allocs
pos-schema.ts:     pos_telegram_routes, role_movement_permissions
ecommerce-schema:  customer_order_items, product_favorites, public_categories,
                   website_chat_logs, website_reviews
lms.ts:            course_modules, test_attempts, test_questions
crm-contacts.ts:   crm_contact_companies, customer_contacts
crm-proposals.ts:  crm_invoice_payments, crm_invoice_products
crm-pipelines.ts:  customer_interactions
hr-recruiter.ts:   hr_vacancy_profiles, hr_weekly_statistics
pp/pp-enhanced.ts: asset_insurance, asset_maintenance_records
skills.ts:         skill_requirements
mm-inventory.ts:   ai_material_insights
orders-registry:   orders_registry
strategic-ext:     token_blacklist
```

### 2.4 API-side stubs that drift report flags as missing

These tables are declared in `apps/api/src/shared/db/schema-*.ts` (often as TODO stubs) but the live DB has no such table:

```
schema-admin-ext.ts:        admin_filters
schema-ai.ts:               ai_hr_interviews, ai_planning_plans,
                            ai_reservation_batches
schema-compat-3.ts:         mro_inventory, security_access, security_attendance
schema-compat-4.ts:         design_library_items, hitl_approvals,
                            logistics_routes
schema-ext-a-2.ts:          pos_movements_legacy
schema-kanban.ts:           kanban_flows, kanban_robots
schema-marketing-ext.ts:    marketing_email_templates, marketing_social_posts
schema-misc-app-b.ts:       lms_events, lms_sessions
```

The complete list (73 entries) is reproduced verbatim from `_drift_report_fresh.txt` lines 7–82.

---

## 3. Missing columns on existing tables

135 tables in the live DB are missing one or more columns that Drizzle defines. Total missing columns: **527** (average 3.9 per affected table). The worst-offender tables (10+ missing columns):

| Table | Missing column count | Schema file |
|---|---|---|
| `hr_tool_test_results` | 17 | `lib/db/src/schema/hr-recruiter.ts:209` |
| `sales_orders` | 15 | `lib/db/src/schema/sd-orders.ts:92` |
| `exit_interviews` | 15 | (HR offboarding) |
| `crm_companies` | 15 | `lib/db/src/schema/crm-contacts.ts:228` |
| `abc_analysis` | 15 | (KPI module) |
| `hr_job_descriptions` | 13 | (HR) |
| `employment_contracts` | 13 | (HR core) |
| `crm_leads` | 13 | `lib/db/src/schema/crm-contacts.ts:21` |
| `employee_strengths_weaknesses` | 11 | (HR perf) |
| `sick_leaves` | 10 | (HR) |
| `operator_daily_stats` | 10 | (MES) |
| `hr_motivation_plans` | 10 | (HR recruiter) |
| `employee_productivity` | 10 | (HR perf) |
| `bonus_payments` | 10 | (Payroll) |

### 3.1 Categorisation by root cause

| Pattern | Example tables | Likely root cause |
|---|---|---|
| Multi-tenancy roll-out (Phase 2) | `attendance`, `candidates`, `departments`, `discipline_records`, `employees`, `leave_requests`, `payroll_periods`, `purchase_orders`, `salary_history`, `sales_invoices`, `sales_orders`, `vacancies`, `aisha_conversations`, `aisha_tool_calls`, `crm_companies`, `crm_contacts`, `crm_deals`, `crm_leads` | `tenant_id integer DEFAULT 1` column added to Drizzle but not yet in live DB |
| HR feature expansion | `employees` (+ `employment_type, date_of_birth, role, total_points, face_embedding_updated_at`), `cash_advances`, `bonus_payments`, `business_trips`, `sick_leaves`, `employee_passports`, `employee_productivity`, `employee_fines` | Drizzle-side gradual HR schema extensions never reached DDL |
| CRM convergence | `crm_companies` (15), `crm_contacts` (9), `crm_leads` (13), `crm_deals` (4), `crm_invoices` (8), `crm_lead_stages` (2), `crm_pipelines` (1), `crm_stages` (1) | The Drizzle convergence "ADD-ONLY" blocks (`Legacy / live-DB superset columns (ADD-ONLY convergence 2026-05-27)`) define columns the live DB does not yet have |
| LMS module | `lms_assignments` (4), `lms_exam_attempts` (6), `lms_questions` (4), `lms_support_tickets` (2), `lms_tests` (2), `courses` (3) | LMS extension drift |
| MM / Materials | `bom_items.material_id, scrap_percent`, `material_cards.barcode`, `materials.unit, unit_price`, `mm_deliveries.purchase_order_id, vendor_id`, `mm_goods_receipts.po_id`, `purchase_order_items.description`, `qc_braks.production_order_id, material_id, status` | Live DB lacks ADD-ONLY drift columns introduced in mm-* files |
| Sales / Delivery | `sales_orders` (15 cols), `sales_invoices` (7 cols), `sd_orders.created_by`, `sd_contracts.papka_no`, `sd_customers.manager_id, is_blocked, crm_company_id` | Sales schema convergence |
| AI / IoT | `ai_cv_screenings` (9), `ai_insights` (5), `ai_interview_messages` (4), `ai_planning_config` (5), `ai_reservation_requests` (3), `ai_usage_logs.module/action/cost`, `iot_sensors.device_code/status/thresholds`, `sensor_devices` (4), `sensor_readings` (2) | AI/IoT feature expansion |
| Misc audit/system | `exception_logs` (8), `document_signatures.signature_hash, ip_address`, `audit_logs.module` (via migrations-drift), `system_settings` (5 cols) | Operational telemetry not in DB |

### 3.2 Representative high-impact rows (verbatim from `_drift_report_fresh.txt`)

```
crm_companies: tenant_id, customer_code, customer_type, first_name,
  customer_category, abc_score, source, payment_terms_days, company_type,
  phones, banking_details, assigned_by_id, parent_company_id, segment,
  is_blocked
crm_leads: tenant_id, name, source_id, source_description, phones,
  assigned_by_id, date_create, utm_source, budget, opportunity_amount,
  source_score, call_status, last_activity_at
crm_contacts: tenant_id, name, phones, post, assigned_by_id, date_create,
  source_id, whatsapp_number, last_contacted_at
employees: tenant_id, employment_type, date_of_birth, role, total_points,
  face_embedding_updated_at
attendance: tenant_id
sales_orders: tenant_id, document_type, sales_org, order_date,
  overall_status, delivery_status, billing_status, quotation_id,
  module_status, master_status, pp_queued_at, fg_warehouse_entry_at,
  storage_days, tech_bom_approved, net_value
daily_attendance_summary: attendance_date, total_employees, present_count,
  absent_count, late_count, on_leave_count, sick_leave_count,
  business_trip_count, department_id
current_stock: material_card_id
material_cards: barcode
qc_braks: production_order_id, material_id, status
purchase_orders: tenant_id
sales_invoices: tenant_id, customer_name, status, gl_document_id, due_date,
  notes, total_amount
salary_history: tenant_id, amount, currency, created_by
```

`daily_attendance_summary` is the most extreme case — the table exists in the DB but is missing 9 of its column definitions. Round 1 marked this HIGH; still HIGH.

The full list of 135 affected tables is in `_drift_report_fresh.txt` lines 84–217. The drift runner produces 1 021 `ADD COLUMN IF NOT EXISTS` statements covering most of these; the column types it picks default to `TEXT` / `VARCHAR` / `INTEGER` / `NUMERIC` / `JSONB` based on the Drizzle declaration, but several are imprecise.

---

## 4. FK type mismatches

The codebase uses `serial` integer PKs for `users`, `vendors`, `materialCards`, `departments`, `purchaseOrders`, and `positions`. Many child tables still declare their FK column as `varchar`, producing both a Drizzle type-inference lie and (when migrated) a live-DB schema where the JOIN compares text against integer.

### 4.1 Counts (lib/db/src/schema only)

```
varchar(...).references(() => users.id          → 108 occurrences
varchar(...).references(() => vendors.id        →  10 occurrences
varchar(...).references(() => materialCards.id  →   7 occurrences
varchar(...).references(() => departments.id    →   1 occurrence
                                          TOTAL: 126
```

### 4.2 Exact rows for `varchar → materialCards.id`

```
lib/db/src/schema/fi-payroll-ext.ts:158
  materialCardId: varchar("material_id").references(() => materialCards.id,
                          { onDelete: "set null" })

lib/db/src/schema/mm-batch-mgmt.ts:35
  materialCardId: varchar("material_id").references(() => materialCards.id,
                          { onDelete: "set null" })

lib/db/src/schema/mm-inventory.ts:245
  materialCardId: varchar("material_id").references(() => materialCards.id,
                          { onDelete: "set null" })

lib/db/src/schema/qc-schema.ts:74
  materialCardId: varchar("material_id").references(() => materialCards.id,
                          { onDelete: "set null" })

lib/db/src/schema/qc-schema.ts:297
  materialCardId: varchar("material_id").references(() => materialCards.id,
                          { onDelete: "set null" })

lib/db/src/schema/wms-schema.ts:466
  materialCardId: varchar("material_id").references(() => materialCards.id,
                          { onDelete: "set null" })

lib/db/src/schema/wms-schema.ts:506
  materialCardId: varchar("material_id").references(() => materialCards.id,
                          { onDelete: "set null" })
```

Each of these violates `materialCards.id = serial("id").primaryKey()` (integer). The drift runner has hand-written tail entries (lines 3273–3302 of `migrations-drift.ts`) that ALTER three specific tables to integer, but the seven rows above are not covered by those ALTERs — only `consumption_suggestions`, `material_batches`, `goods_receipt_lines`, `min_stock_alerts` were fixed. The remaining `varchar` references are dormant landmines.

### 4.3 Round-1 specific cases — verification

**`min_stock_alerts.materialCardId`** (round-1 claim: varchar→serial bug)

`lib/db/src/schema/mm-material-cards.ts:126`:

```ts
// FK type fix: materialCards.id is serial (integer), was incorrectly declared varchar
materialCardId: integer("material_id")
  .references(() => materialCards.id, { onDelete: "cascade" }).notNull(),
```

Source is fixed (integer). The comment confirms it was once varchar. The live DB may still hold the varchar column — `migrations-drift.ts:3263` (around there) only ALTERs `min_stock_alerts.acknowledged_by`, not `min_stock_alerts.material_id`. Searching for `min_stock_alerts.material_id TYPE` in the drift file returns no result. So the source-code FK type fix is **not propagated to the live DB**.

**`goods_receipt_lines.material_card_id`** (round-1 claim: bug)

`lib/db/src/schema/mm-purchase.ts:119`:

```ts
// FK type fix: materialCards.id is serial (integer), was incorrectly declared varchar
materialCardId: integer("material_id")
  .references(() => materialCards.id, { onDelete: "set null" })
```

Source fixed; column name is `material_id` (not `material_card_id`). The drift runner explicitly ALTERs this on boot:

```
// TASK 2: goods_receipt_lines.material_id varchar→integer
ALTER TABLE IF EXISTS goods_receipt_lines
  ALTER COLUMN material_id TYPE INTEGER USING material_id::INTEGER
```
(`apps/api/src/shared/db/invariants/migrations-drift.ts:3283`)

So this specific case is genuinely fixed (Drizzle + live-DB on boot). The pattern of "Drizzle declares integer, live DB still has varchar until boot runs" remains the system-wide risk shape.

### 4.4 Other type fixes wired into the drift runner

From `apps/api/src/shared/db/invariants/migrations-drift.ts:3263–3302`:

```
min_stock_alerts.acknowledged_by   varchar → INTEGER  (FK users.id)
consumption_suggestions.material_id varchar → INTEGER (FK material_cards.id)
consumption_suggestions.approved_by varchar → INTEGER (FK users.id)
material_batches.material_id        varchar → INTEGER (FK material_cards.id)
goods_receipt_lines.material_id     varchar → INTEGER (FK material_cards.id)
goods_receipts.supplier_id          varchar → INTEGER (FK vendors.id)
bom_items.component_id              DROP FK, varchar → INTEGER, ADD FK → material_cards.id
production_order_components.raw_material_id  DROP FK products, varchar → INTEGER, ADD FK → material_cards.id
production_facts_sm72.operator_id   ADD FK users.id (no type fix)
```

These 9 lines are the system's complete hand-curated FK-type correction set. Compare with the 126 varchar→integer mismatches in the source — only 6 are corrected in the live DB by boot-time ALTER. The other 120 sources remain.

### 4.5 `warehouses.id` — varchar vs integer cross-layer

`lib/db/src/schema/wms-schema.ts:19`:
```ts
id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::varchar`),
```

`apps/api/src/shared/db/schema-compat-2.ts:157`:
```ts
export const warehouses = pgTable('warehouses', {
  id: integer('id').primaryKey(),
  ...
});
```

`apps/api/src/shared/db/schema-wms.ts:25` also redeclares `warehouses`. The canonical lib/db version says UUID-as-varchar; the API stubs say integer. Both modules end up on the consumer barrel via `apps/api/src/shared/db/index.ts`. Depending on which import path is hit first, services will get conflicting type signatures.

---

## 5. Dual-entity registries

The pattern is: the same logical entity has two (or more) `pgTable()` declarations under different file paths, often with overlapping but non-identical column sets.

### 5.1 Same DB table name, multiple definitions

| DB table name | Definition 1 | Definition 2 | Definition 3 | Risk |
|---|---|---|---|---|
| `users` | `lib/db/src/schema/users.ts:13` (canonical, 40+ cols, serial PK) | `apps/api/src/shared/db/schema-misc-app-a.ts:19` `appUsers` (15-col stub) | `apps/api/src/shared/db/schema-compat-1a.ts:9` (stub) | Both stubs declare `id: integer('id').primaryKey()` instead of `serial`. Any code importing the stubs sees a different shape than the canonical. |
| `employees` | `lib/db/src/schema/employees.ts:14` | `apps/api/src/shared/db/schema-misc-app-a.ts:37` `hrEmployees` | — | snake_case vs camelCase columns; the API stub uses snake_case while canonical uses camelCase |
| `leave_requests` | `lib/db/src/schema/leave.ts:12` `leaveRequests` | `apps/api/src/shared/db/schema-misc-app-a.ts:80` `leaveRequestsApp` | `apps/api/src/shared/db/schema-compat-2.ts:42` `leaveRequests` | Three competing definitions, different `employee_id` type (varchar/text/integer) |
| `attendance` | `lib/db/src/schema/attendance.ts:12` | `apps/api/src/shared/db/schema-misc-app-b.ts:13` `hrAttendance` | `apps/api/src/shared/db/schema-compat-2.ts:30` + `schema-business-c-2-hr-payroll.ts:44` `hr_attendance` | 4 parallel definitions — one of the highest-traffic tables |
| `vendors` | `lib/db/src/schema/mm-raw-materials.ts:169` (serial PK) | `apps/api/src/shared/db/schema-compat-2.ts:145` (`integer` PK) | `apps/api/src/shared/db/schema-wms.ts:98` | 3 definitions, PK type ambiguous |
| `warehouses` | `lib/db/src/schema/wms-schema.ts:18` (`varchar(50)` PK with UUID default) | `apps/api/src/shared/db/schema-compat-2.ts:157` (`integer` PK) | `apps/api/src/shared/db/schema-wms.ts:25` | Type mismatch (UUID vs integer) — see §4.5 |
| `crm_companies` | `lib/db/src/schema/crm-contacts.ts:228` (full schema, integer PK + 50+ cols incl. convergence block) | `apps/api/src/shared/db/schema-compat-1a.ts:79` (12-col stub) | — | Stub uses different field aliasing: `inn: text('stir')`, `website: text('websites')`, `created_at: ts('date_create')` — a SELECT through the stub returns rows from different physical columns than expected |
| `sales_invoices` | `lib/db/src/schema/sd-orders.ts:19` | `apps/api/src/shared/db/schema-business-c-2-misc.ts:13` | — | |
| `salary_history` | `lib/db/src/schema/payroll.ts:11` | `apps/api/src/shared/db/schema-compat-5.ts:42` | `apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts:14` | 3 definitions |
| `payroll_periods` | `lib/db/src/schema/fi-gl.ts:255` | `apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts:29` `payroll_periods_hr` | — | Same DB table, two TS bindings |
| `payroll_rows` | `lib/db/src/schema/fi-gl.ts:297` | `apps/api/src/shared/db/schema-compat-2.ts:18` | — | |
| `qc_braks` | `lib/db/src/schema/qc-schema.ts:257` | `apps/api/src/shared/db/schema-compat-3.ts:125` | — | |
| `sd_customers` | `lib/db/src/schema/sd-europrint-schema.ts:20` | `apps/api/src/shared/db/schema-business-b-2.ts:212` | — | Stub uses `full_name` while canonical uses split first/last |
| `goods_receipts` | `lib/db/src/schema/mm-purchase.ts:70` | `apps/api/src/shared/db/schema-ext-c-3.ts:36` | — | |
| `sales_orders` | `lib/db/src/schema/sd-orders.ts:92` | `apps/api/src/shared/db/schema-compat-2.ts:108` | — | Round 1 understated this dual-definition |

### 5.2 Same-concept tables under different DB names

| Concept | Table A | Table B | Issue |
|---|---|---|---|
| POS transactions | `pos_transactions` (lib/db/src/schema/fi-payroll-ext.ts:228) | `retail_pos_transactions` (lib/db/src/schema/pos-retail.ts:43) | A is dormant per round 1 (no service queries it), B is active |
| Movement-historical | `pos_movements` (lib/db/src/schema/pos-schema-v2.ts:69) | `pos_movements_legacy` (apps/api/src/shared/db/schema-ext-a-2.ts:153, *MISSING* from DB) + `pos_movements_archive` (schema-ext-a-1.ts:203) + `pos_movements_legacy_view` (schema-db-only-generated.ts:646) | 4 parallel POS movement entities, drift report says `pos_movements_legacy` is absent from DB |
| Customers/CRM | `crm_companies` (lib/db) + `crm_companies` (schema-compat-1a) | `sd_customers` (sd-europrint-schema + schema-business-b-2) + `customer_accounts` (ecommerce-schema:55) | 4 different "customer" registries in 4 places |
| Invoices | `invoicesTable` (schema-misc-app-b.ts:123, DB table `invoices`) | `fi_invoices` (schema-business-b-2.ts:61) | `crm_invoices` (lib/db + schema-business-b-2) | `salesInvoices` (sd-orders.ts + schema-business-c-2-misc.ts) | At least 4 invoice-domain tables exist; consumers must pick by hand |
| Products | `products` (lib/db/src/schema/pp/pp-production.ts:96) | `posProducts` (fi-payroll-ext.ts:259, `pos_products`) | `retailPosProducts` (pos-retail.ts:13, `retail_pos_products`) | 3 product tables — `pos_products` joined to `material_cards`, `retail_pos_products` joined to `material_cards` differently |
| Vendors / Suppliers | `vendors` (mm-raw-materials.ts:169) | `mm_vendors` (apps/api/src/shared/db/schema-misc-qc.ts:122) | Round-1 footnote confirmed; round 2 finds `mm_vendors` is a separate stub still active |
| Purchase orders | `purchaseOrders` (lib/db, `purchase_orders`) | `mm_purchase_orders` (apps/api/src/shared/db/schema-business-b-1.ts:160) | DB has both names independently per stub layout |
| Materials | `materialCards` (lib/db, `material_cards`) | `rawMaterials` (lib/db, `raw_materials`) | Two semantically-overlapping master-data tables; `materialCards.rawMaterialId` references `rawMaterials.id`. The `material_id` column in child tables refers to one or the other depending on the file (see §7) |
| Leave | `leaveRequests` (3 definitions, table `leave_requests`) | `hr_leave_requests` (schema-business-c-2-hr-safety.ts:78, separate physical table) | Two physically different tables for the same semantic concept |
| LMS tests | `tests` (lms-schema.ts) | `lms_tests` (live DB via migration 0000 + drift runner) | Round-1 finding still valid; drift runner creates `lms_tests` with different column set than Drizzle's `tests` |
| LMS questions | `test_questions` (lms.ts, MISSING from DB) | `lms_questions` (live DB via drift runner) | Round-1 finding still valid; `test_questions` still absent per drift report |

### 5.3 hr_employees vs employees

There is no `hr_employees` table in either Drizzle or the live DB. The closest pattern is `apps/api/src/shared/db/schema-misc-app-a.ts:37`, which exports a Drizzle binding called `hrEmployees` that points to the live DB table `employees`. The round-1 phrasing "`users` vs `hr_employees`" is therefore misleading — the real dual-entity pair is **`users` vs `employees`** (two different tables, both serial PK, often joined on `users.employee_id = employees.id`). This is by design, not a bug.

---

## 6. Duplicate FK columns within a table

The "ADD-ONLY superset" convergence pattern adds new columns alongside the old ones rather than replacing. The result: a single table has two columns that point to the same parent table.

### 6.1 `purchase_order_items` — canonical case (round-1 finding)

`lib/db/src/schema/mm-purchase.ts:31–51`:

```ts
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  poId: integer("po_id").references(() => purchaseOrders.id,
                                    { onDelete: "cascade" }).notNull(),
  rawMaterialId: integer("raw_material_id").references(() => rawMaterials.id,
                                                       { onDelete: "cascade" }).notNull(),
  quantity: numericMoney("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  unitPrice: numericMoney("unit_price").notNull(),
  totalPrice: numericMoney("total_price").notNull(),
  // --- live-DB superset columns (schema-convergence A5; ADD-ONLY) ---
  purchaseOrderId: integer("purchase_order_id"),   // alternate FK alias of po_id (legacy column)
  materialId: integer("material_id"),              // alternate FK alias of raw_material_id (legacy column)
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, ...);
```

Both `po_id` AND `purchase_order_id` exist; both `raw_material_id` AND `material_id` exist. Only `po_id` and `raw_material_id` have `.references()`. Writers must pick one and remember which.

### 6.2 `mm_deliveries` — multi-axis duplication

`lib/db/src/schema/mm-logistics.ts:204–247`:

```ts
orderNo:        varchar("order_no", { length: 50 }),
orderId:        varchar("order_id"),
...
salesOrderId:   varchar("sales_order_id"),
...
purchaseOrderId: integer("purchase_order_id"),
...
status:         varchar("status", ...) DEFAULT 'planned',
deliveryStatus: varchar("delivery_status", ...) // SD-style status (alongside `status`)
```

Three parallel order-ref columns + two parallel status columns.

### 6.3 `qc_braks` — three duplicate-FK columns

`lib/db/src/schema/qc-schema.ts:257–279`:

```ts
papkaOrderId:      varchar("papka_order_id").references(() => papkaOrders.id, ...),
equipmentId:       varchar("equipment_id"),
operatorId:        varchar("operator_id").references(() => users.id, ...),
// ── ADD-ONLY: live DB superset columns ──
productionOrderId: varchar("production_order_id"),   // parallel "order" ref
materialId:        varchar("material_id"),           // material ref (parallel to equipmentId)
status:            varchar("status", { length: 30 }),
createdBy:         integer("created_by").references(() => users.id, ...),  // parallel author ref (operatorId/createdBy)
```

### 6.4 The pattern overall

`grep -c "live-DB superset\|alternate FK alias\|legacy column\|ADD-ONLY"` in `lib/db/src/schema` returns ~40 hits across ~28 distinct files. Each ADD-ONLY block typically introduces 2–10 additional columns that the live DB already has, but most of those columns shadow an existing canonical column. Specific other examples discovered:

- `crm-contacts.ts:71` `crm_leads`: ADD-ONLY block declares `customerId`, `managerId`, `status` shadowing existing fields
- `crm-contacts.ts:169` `crm_contacts`: ADD-ONLY block adds `firstName/email/phone` in addition to existing equivalents
- `crm-contacts.ts:314` `crm_companies`: ADD-ONLY block adds `inn/phone/email` etc.
- `core-schema.ts:34,57,107`: contact_settings, system_settings, calendar_events each have ADD-ONLY blocks
- `admin-assets.ts:29,87,114`: 3 separate tables with ADD-ONLY drift columns
- `ecommerce-schema.ts:38,69,107,138`: public_products, customerAccounts, customer_orders, customer_order_items
- `pos-schema-v2.ts:122` `posMovements`: ADD-ONLY block adds `movementTypeId`, `bulim`, `supplierName`, `documentNumber`, `productId`, `type`, `quantity`, `referenceId`, `warehouseId`, `direction`, `documentRef`, `completedBy` (12 cols)
- `mm-inventory.ts:185`: `quantity` aliased as `required_quantity` legacy

The system depends on application code remembering which column to write to. There are no DB-side CHECK constraints enforcing that the duplicate columns agree.

---

## 7. material_card_id vs material_id collision

This is the most pervasive naming collision in the schema.

### 7.1 Raw counts (lib/db + apps/api, excluding invariants/migrations and indexes)

```
DB column literal "material_id"      → 92 occurrences across 15 files
DB column literal "material_card_id" →  1 occurrence (schema-ext-a-1.ts:45)
```

By Drizzle column-type prefix:

```
varchar("material_id")  → 23 occurrences
integer("material_id")  → 58 occurrences
text("material_id")     → 1 (lib/db/src/schema/order-workflow-schema.ts:149)
```

### 7.2 Two semantic FKs share the name `material_id`

| Drizzle property | DB column | Referenced PK | Files |
|---|---|---|---|
| `materialCardId` | `"material_id"` (integer) | `materialCards.id` (serial) | `mm-material-cards.ts:126,162,193`, `mm-purchase.ts:119`, `pos-schema-v2.ts:150,206,224,243,291,306,338,370,393,441,484,509` (12 occurrences in pos-schema-v2 alone), `pos-schema-extensions.ts:58,93,108,127,190`, `wms-schema.ts:175,247` |
| `materialCardId` | `"material_id"` (varchar) | `materialCards.id` (serial) — TYPE MISMATCH | `fi-payroll-ext.ts:158`, `mm-batch-mgmt.ts:35`, `mm-inventory.ts:245`, `qc-schema.ts:74,297`, `wms-schema.ts:466,506` |
| `materialId` | `"material_id"` (varchar) | `rawMaterials.id` (serial) — TYPE MISMATCH on different parent | `mm-batch-mgmt.ts:133,166,209`, `mm-inventory.ts:20`, `pp/pp-enhanced.ts:91,177` |
| `materialId` | `"material_id"` (integer) | `rawMaterials.id` (serial) | `mm-inventory.ts:129` |
| `materialId` | `"material_id"` (integer) | no FK declaration | `mm-inventory.ts:87`, `mm-purchase.ts:42`, `mm-raw-materials.ts:121`, `pp/pp-production.ts:337`, `hr-goals.ts:137` |
| `materialId` | `"material_id"` (varchar) | no FK declaration | `mm-inventory.ts:198`, `mm-mro.ts:90`, `qc-schema.ts:273`, `sd-delivery.ts:81,184`, `sd-order-items.ts:187` (references `products.id`) |
| `materialCardId` | `"material_card_id"` (integer) — UNIQUE NAMING | none / different name | (none in lib/db) |
| `material_card_id` | `"material_card_id"` (integer) | implicit `material_cards(id)` | `apps/api/src/shared/db/schema-ext-a-1.ts:45` (the `current_stock` table) |
| `createdMaterialCardId` | `"created_material_card_id"` (integer) | no FK | `pos-schema-v2.ts:578` |

### 7.3 The downstream collision

The DB column literal `material_id` denotes:

1. an integer FK to `material_cards.id` (most common in MM, POS, WMS, QC, FI)
2. a varchar FK to `material_cards.id` (varchar → serial type mismatch — 7 source locations)
3. an integer FK to `raw_materials.id` (MM batch management)
4. a varchar FK to `raw_materials.id` (4 source locations, also type mismatch)
5. an integer FK to `products.id` (in `pp-production.ts:678`)
6. a varchar FK to `products.id` (in sd-delivery, sd-order-items)
7. an untyped integer with no `.references()` (loose column)

A query like `JOIN material_cards mc ON mc.id = child.material_id` will silently produce wrong rows if `child.material_id` was actually populated from a `raw_materials.id` value (different sequence, different namespace). Without a DB-level FK constraint, Postgres has no way to catch this.

### 7.4 The lone `material_card_id` outlier

`apps/api/src/shared/db/schema-ext-a-1.ts:43–49`:

```ts
// TODO: current_stock not found in lib/db — kept as local stub
export const current_stock = pgTable('current_stock', {
  id:               serial('id').primaryKey(),
  material_card_id: integer('material_card_id').notNull(),
  warehouse_id:     integer('warehouse_id'),
  quantity_on_hand: numeric('quantity_on_hand', { precision: 15, scale: 4 }).default('0'),
  last_movement_at: timestamp('last_movement_at'),
});
```

The drift report contains:

```
current_stock: material_card_id
```

i.e., the live `current_stock` DB table has no `material_card_id` column. The stub uses a name nothing else in the codebase uses. The DB likely has `material_id` (matching the global convention). The drift runner has neither an ADD COLUMN nor a RENAME for this — so the stub is broken at runtime, and reads/writes through it will fail.

Two ad-hoc raw-SQL files in `apps/api/src/shared/db/migrations/` reference `material_card_id` on the `warehouse_stock` and `current_stock` tables:

- `pos-monitor-fix-all.sql:70` `material_card_id INTEGER REFERENCES material_cards(id) ON DELETE CASCADE`
- `pos-warehouse-integration.sql:113` `INSERT INTO warehouse_stock (warehouse_id, material_card_id, ...) SELECT ... mc.id ...`
- `warehouse-pos-integration.sql:44` `mc.id AS material_card_id`

These SQL files imply that `warehouse_stock` in some past version had `material_card_id`. But the canonical Drizzle `warehouseStock` (`lib/db/src/schema/wms-schema.ts:297`) declares `varchar("material_id")`. The naming has oscillated.

---

## 8. Migration drift mechanism

### 8.1 The boot-time runner

`apps/api/src/main.ts:85–110` wires invariants into `bootstrap()`:

```ts
configureBlockedMethods(app);
configureCsrfOriginCheck(app, logger);
configureLoginRateLimit(app);
configureAppMiddleware(app);
const fastify = app.getHttpAdapter().getInstance() as RawFastify;
configureSwagger(app, fastify, port, logger);
configureHealthRoutes(fastify);

// TZ-D06: SD schema additions (version column, idempotency table)
try {
  await ensureDbInvariants();
  logger.log('DB invariantlar muvaffaqiyatli tekshirildi');
} catch (e: unknown) {
  logger.warn(`DB invariantlar tekshiruvida xato: ${String(e)}`);
}

// TZ-D16: DB CHECK constraintlarini tekshirish va qo'llash
try {
  await ensureSchemaAdditions();
  logger.log('Schema additions muvaffaqiyatli qo\'llandi');
} catch (e: unknown) {
  logger.warn(`Schema additions xato: ${String(e)}`);
}
```

`apps/api/src/shared/db/invariants.ts:68–92`:

```ts
export async function ensureSchemaAdditions(): Promise<void> {
  const migrations = [
    ...SCHEMA_MIGRATIONS,
    ...TRIGGER_MIGRATIONS,
    ...CRM_MIGRATIONS,
    ...DRIFT_MIGRATIONS,
  ];
  for (const m of migrations) {
    try {
      if (typeof m.sql !== 'string' ||
          !m.sql.match(/^\s*(CREATE|ALTER|DROP|INSERT|WITH|DO|COMMENT|GRANT|SET)\s/i)) {
        throw new Error(`PA-S4c: invariant DDL rejected: ${String(m.sql).slice(0, 50)}`);
      }
      await db.execute(sql.raw(m.sql));
      logger.log(`Schema addition OK: ${m.name}`);
    } catch (err) {
      logger.warn(`Schema addition o'tkazildi: ${m.name} — ${String(err)}`);
    }
  }
}
```

### 8.2 The four constituent migration sets

| File | Purpose | Approx entries |
|---|---|---|
| `apps/api/src/shared/db/invariants/migrations-schema.ts` | Hand-curated schema additions (CREATE TABLE for `domain_events`, `sd_advance_idempotency_keys`, version columns, etc.) | ~30 |
| `apps/api/src/shared/db/invariants/migrations-triggers.ts` | CREATE FUNCTION / CREATE TRIGGER definitions | ~15 |
| `apps/api/src/shared/db/invariants/migrations-crm.ts` | CRM-specific tables/columns | ~20 |
| `apps/api/src/shared/db/invariants/migrations-drift.ts` | Auto-generated ADD COLUMN / CREATE TABLE for drift | **1 180** |

Total on every boot: ~1 245 idempotent DDL statements.

### 8.3 The dual-mechanism problem

`apps/api/drizzle/` holds 17 SQL files (`0000_volatile_ender_wiggin.sql` through `0016_pos_inventory_passport.sql`). `apps/api/drizzle/meta/_journal.json` only registers `0000`:

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    { "idx": 0, "version": "7", "when": 1777031803281,
      "tag": "0000_volatile_ender_wiggin", "breakpoints": true }
  ]
}
```

So `drizzle-kit migrate` sees only migration 0000 as applied. Migrations 0001–0016 must be applied out-of-band (or are duplicated by `migrations-drift.ts`).

Additionally, `apps/api/src/shared/db/migrations/` contains 41 hand-written `.sql` files (`drift-fix-01..04c-*.sql`, `drop-dormant-tables.sql`, `aisha-tables.sql`, etc.) that no code path executes — they are dead files unless an operator runs `psql -f` manually.

### 8.4 Result

There are **three** parallel migration mechanisms with no shared journal:

1. `drizzle-kit migrate` (registers only `0000` in the journal)
2. The 17 SQL files in `apps/api/drizzle/` (applied by some unknown process)
3. The boot-time `ensureSchemaAdditions()` runner with 1 245 DDL statements

And a **fourth dead set**:

4. 41 `.sql` files under `apps/api/src/shared/db/migrations/` (`drift-fix-*.sql`, `aisha-tables.sql`, etc.) that are not wired into any runner — they must be executed manually.

Running `drizzle-kit push` against the current schema would attempt to re-create everything that's already been added via mechanisms 2–4, almost certainly breaking the DB.

The `migrations-drift.ts` runner is the de-facto live truth: it idempotently ADDs columns and CREATEs tables to bring the DB to the Drizzle-defined superset on every boot. But it is auto-generated against a snapshot from 2026-05-21 — any Drizzle changes after that date will not be reflected until someone re-runs the generator.

---

## 9. Findings summary

1. **[CRITICAL] 16 `ow_*` tables completely absent from DB** — `lib/db/src/schema/order-workflow-schema.ts` defines an entire Order Workflow domain; not one of its tables exists in the live DB. Any service that issues SQL through these Drizzle handles will throw `relation does not exist`. The drift runner does not create them.

2. **[CRITICAL] 12 `task_*` tables absent** — `lib/db/src/schema/kanban/kanban-extended.ts` defines the kanban extension; none of the 12 `task_*` tables (`task_checklists`, `task_results`, etc.) exist in the DB. Same failure mode.

3. **[HIGH] 73 tables total absent from DB** — see §2. Some are dormant (POS legacy, AI stubs), but the OW + task_* clusters alone account for 28 of those 73 and are high-impact.

4. **[HIGH] FK type mismatch surface area is 126 occurrences in lib/db alone** — every `varchar("...").references(() => users.id|vendors.id|materialCards.id|departments.id)` violates the parent's `serial` integer PK. Only 9 specific cases are corrected by the drift runner's hand-written TASK 2–6 tail block (§4.4). The other 120 are landmines: when a drift-runner ADD COLUMN guesses the type (it defaults to VARCHAR), the live DB will end up with `varchar` columns that cannot enforce the FK constraint to the integer PK.

5. **[HIGH] `current_stock.material_card_id` is the only place in the codebase that uses `material_card_id`** — drift report confirms the column does not exist in the live DB, so the table is broken when accessed via the canonical Drizzle binding at `apps/api/src/shared/db/schema-ext-a-1.ts:43`. Naming convention everywhere else is `material_id`.

6. **[HIGH] `material_id` is dangerously overloaded** — same DB column literal means 7 different things across 30+ files (FK to `material_cards`, FK to `raw_materials`, FK to `products`, sometimes varchar sometimes integer, sometimes with `.references()` and sometimes without). No DB-level FK enforces correctness. Silent JOIN corruption is possible.

7. **[HIGH] At least 4 parallel `attendance` table definitions** — `lib/db/src/schema/attendance.ts:12`, `apps/api/src/shared/db/schema-misc-app-b.ts:13`, `apps/api/src/shared/db/schema-compat-2.ts:30`, `apps/api/src/shared/db/schema-business-c-2-hr-payroll.ts:44`. Each declares overlapping but different column sets pointing at the same physical table. Consumer behaviour depends on which barrel exports the binding currently in scope.

8. **[HIGH] At least 15 cross-layer dual-entity registries** — `users`, `employees`, `leave_requests`, `attendance`, `vendors`, `warehouses` (PK type conflict), `crm_companies`, `sales_invoices`, `salary_history`, `payroll_periods`, `payroll_rows`, `qc_braks`, `sd_customers`, `goods_receipts`, `sales_orders`. Each has 2–3 parallel `pgTable(...)` declarations.

9. **[HIGH] 527 missing columns across 135 tables, average 3.9 per table** — `daily_attendance_summary` is missing 9/9 listed columns (most extreme), `crm_companies/leads/contacts` collectively missing 37 columns, sales/HR tables missing 10–17 each.

10. **[MEDIUM] `purchase_order_items` and at least 28 other tables have duplicate FK columns** — the ADD-ONLY superset convergence pattern adds new columns alongside the old (`po_id` + `purchase_order_id`, `raw_material_id` + `material_id`, `status` + `delivery_status`, etc.). Application code must remember which column is canonical. No DB constraint enforces agreement.

11. **[MEDIUM] `tenant_id` column missing from 17 tables in the live DB** — multi-tenancy Phase 2 is partial. The `drift-fix-01-tenant-id.sql` file would add them, but is not wired into any runner. The drift runner does not specifically add `tenant_id` as `NOT NULL DEFAULT 1` (it would add `INTEGER` without default). Until a tenant_id column exists in the DB, all writes against the tenant-id-aware Drizzle tables will succeed only because the column doesn't exist in the DB (Postgres silently ignores fields absent from the table).

12. **[MEDIUM] Drizzle journal desync** — `apps/api/drizzle/meta/_journal.json` lists only `0000_volatile_ender_wiggin`, but 17 migration SQL files exist. `drizzle-kit migrate` and `drizzle-kit push` are unsafe to run; they would either fail or recreate already-applied state.

13. **[MEDIUM] 4 parallel migration mechanisms** — `drizzle-kit migrate` (journal-tracked, only 0000), the 17 unregistered SQL files in `apps/api/drizzle/`, the boot-time `ensureSchemaAdditions()` runner (1 245 idempotent statements), and 41 hand-written `.sql` files in `apps/api/src/shared/db/migrations/` that are not wired anywhere. There is no single source of truth for "what DDL has been applied".

14. **[MEDIUM] `migrations-drift.ts` header is stale** — claims 1 151 entries, file actually contains 1 180. Claims 177 column-drift tables and 135 missing tables; current `_drift_report_fresh.txt` says 135 column-drift tables and 73 missing tables. The drift snapshot was generated on 2026-05-21; any Drizzle change after that date is invisible to the runner.

15. **[MEDIUM] `lms_lessons` no longer in drift report** — round 1 marked this CRITICAL (absent from DB, queried by code). The fresh drift report does not list it, so it must have been created by an out-of-band script. But there's no `lms_lessons CREATE TABLE` in `migrations-drift.ts` — so on a fresh DB bootstrap, the boot runner alone will not create it. The hidden dependency on a manual SQL file is fragile.

16. **[MEDIUM] `warehouses` PK type ambiguity** — `lib/db/src/schema/wms-schema.ts:19` declares `varchar(50) UUID PK`; `apps/api/src/shared/db/schema-compat-2.ts:157` declares `integer PK`. Both bindings reach consumer code via the barrel. Whichever import path is hit first wins.

17. **[LOW] Dormant tables `pos_transactions` and `payroll_calculations`** — still confirmed dormant per round 1. No service queries them; their FK definitions (`payroll_calculations.employee_id → users.id` instead of `employees.id`) are inconsistent with the rest of the payroll domain. Risk only if a developer accidentally wires a route to them.

18. **[LOW] `apps/api/src/shared/db/schema-ext-a-1.ts` TODO stubs are outdated** — multiple `// TODO: X not found in lib/db — kept as local stub` comments are wrong: `current_stock`, `certificates`, `courses` etc. all exist in lib/db. The stubs are dead code if not imported, but `current_stock` IS still imported by some consumers (because lib/db has no `current_stock` table — only `material_cards`/`warehouseStock`).

---

**End of report.**
