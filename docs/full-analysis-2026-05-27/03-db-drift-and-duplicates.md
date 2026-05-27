# 03 — DB Drift, Duplicates & Runtime Risk Assessment

**Audit date:** 2026-05-27
**Auditor:** forensic-agent (read-only)
**Source data:** `_drift_report_fresh.txt` (generated 2026-05-21), `apps/api/src/shared/db/invariants/migrations-drift.ts` (1151 entries, generated 2026-05-21), migration files 0000–0016, direct schema file inspection.

---

## 1. Overview Statistics

| Metric | Count |
|--------|-------|
| Drizzle pgTable unique names (all sources) | 957 |
| Live DB tables + views | 951 |
| Tables only in Drizzle (missing from DB) | 73 |
| Tables only in DB (no Drizzle definition) | ~20 |
| Tables in both | ~878 |
| Tables with column drift (Drizzle has cols DB lacks) | 177 |
| Missing columns (Drizzle→DB) | 527 |
| Drift migration entries (ADD COLUMN + CREATE TABLE) | 1,151 |

The `migrations-drift.ts` invariant file is the active remediation mechanism: it fires on every server boot and applies all 1,151 idempotent SQL statements. This is the system's live safety net against drift.

---

## 2. Drift Matrix — Key Tables

| Table | Drizzle file | In DB (migration)? | In Drizzle? | Drifted columns (Drizzle has, DB lacks) | Runtime risk |
|-------|-------------|-------------------|-------------|----------------------------------------|-------------|
| users | `lib/db/src/schema/users.ts` | Yes (0000) | Yes | password_hash, is_active, last_login_at, failed_login_attempts, locked_until were added by migration 0015. Schema now ~aligned | **LOW** — auth fields added by 0015 |
| employees | `lib/db/src/schema/employees.ts` | Yes (0000) | Yes | tenant_id, employment_type, date_of_birth, role, total_points, face_embedding_updated_at | **MEDIUM** — tenant_id added by mig 0016; other columns may cause INSERT issues if NOT NULL |
| departments | `lib/db/src/schema/departments.ts` | Yes (0000) | Yes | tenant_id | **LOW** — tenant_id added by drift runner |
| attendance | `lib/db/src/schema/attendance.ts` | Yes (0000) | Yes | tenant_id; check_in_time/check_out_time type mismatch (Drizzle:timestamp, DB:TIME) | **HIGH** — type mismatch causes runtime cast errors on timestamp insert |
| daily_attendance_summary | `lib/db/src/schema/attendance.ts` | Yes (exists in DB) | Yes | attendance_date, total_employees, present_count, absent_count, late_count, on_leave_count, sick_leave_count, business_trip_count, department_id (ALL missing) | **HIGH** — table exists but all columns drifted; any INSERT will fail |
| salary_history | `lib/db/src/schema/payroll.ts` | Yes (0000) | Yes | tenant_id, amount, currency, created_by | **MEDIUM** — nullable columns, drift runner adds them |
| payroll_calculations | `lib/db/src/schema/fi-payroll-calc.ts` | Yes (in DB) | Yes | None known | **LOW (dormant)** — no service queries this table |
| pos_transactions | `lib/db/src/schema/fi-payroll-ext.ts` | No (not in mig 0000) | Yes | N/A — entire table may be absent | **LOW (dormant)** — no service queries `pos_transactions`; POS uses `retail_pos_transactions` |
| retail_pos_transactions | `lib/db/src/schema/pos-retail.ts` | Yes (0000 line 1119) | Yes | None known | **LOW** — active table, well-aligned |
| material_cards | `lib/db/src/schema/mm-material-cards.ts` | Yes (in DB via materials table or dedicated) | Yes | barcode | **MEDIUM** — barcode used in barcode scanning feature |
| current_stock | `apps/api/src/shared/db/schema-ext-a-1.ts` | Yes (in DB) | Yes | material_card_id (DB has this as different name) | **HIGH** — see §3 |
| lms_lessons | `lib/db/src/schema/lms-extended.ts` | NO | Yes | N/A — entire table absent | **HIGH** — queried by drizzle-lms-misc.repo.ts |
| lms_events | `apps/api/src/shared/db/schema-misc-app-b.ts` | NO | Yes | N/A | **MEDIUM** — listed as missing, need to verify query frequency |
| lms_sessions | `apps/api/src/shared/db/schema-misc-app-b.ts` | NO | Yes | N/A | **MEDIUM** |
| lms_exams | `lib/db/src/schema/lms-extended.ts` | Yes (0000 line 4303) | Yes | None known | **LOW** |
| lms_modules | `lib/db/src/schema/lms-extended.ts` | Yes (0000 line 4321) | Yes | None known | **LOW** |
| lms_certificates | `lib/db/src/schema/lms-extended.ts` | Yes (0000 line 3644) | Yes | None known | **LOW** |
| crm_companies | `lib/db/src/schema/crm-contacts.ts` | Yes (0000) | Yes | tenant_id, customer_code, customer_type, first_name, customer_category, abc_score, source, payment_terms_days, company_type, phones, banking_details, assigned_by_id, parent_company_id, segment, is_blocked (18 columns) | **HIGH** — many NOT NULL absent columns; drift runner handles but not guaranteed |
| crm_leads | `lib/db/src/schema/crm-contacts.ts` | Yes (0000) | Yes | tenant_id, name, source_id, source_description, phones, assigned_by_id, date_create, utm_source, budget, opportunity_amount, source_score, call_status, last_activity_at | **MEDIUM** |
| crm_deals | `lib/db/src/schema/crm-pipelines.ts` | Yes (in DB) | Yes | tenant_id, name, expected_amount, assigned_to | **MEDIUM** |
| crm_invoices | `lib/db/src/schema/crm-proposals.ts` | Drizzle-only → drift runner creates it | Yes | title, deal_id, issue_date, payment_method, bank_details, description, document_path, assigned_by_id | **MEDIUM** — drift runner CREATE TABLE but column set may differ |
| payroll (legacy table) | migration 0000 line 375 | Yes | Partial | employee_id renamed to employee_id_legacy; new integer employee_id added | **HIGH** — migration 0015 did rename but Drizzle schema not updated to match |
| ow_work_orders | `lib/db/src/schema/order-workflow-schema.ts` | NO | Yes | N/A — entire module (16 tables) absent | **HIGH** — if any route calls these, 500 error |
| ow_tech_cards | same | NO | Yes | N/A | **HIGH** |
| ow_contracts | same | NO | Yes | N/A | **HIGH** |
| ow_order_lines | same | NO | Yes | N/A | **HIGH** |
| pos_inventory_passport | migration 0016 only | Yes (via mig 0016) | NO Drizzle | N/A — migration-only | **MEDIUM** — can only be queried via raw SQL |
| kanban_flows | `apps/api/src/shared/db/schema-kanban.ts` | NO | Yes | N/A | **HIGH** — drift report confirms absent |
| kanban_robots | same | NO | Yes | N/A | **HIGH** |
| task_card_tags | `lib/db/src/schema/kanban/kanban-extended.ts` | NO | Yes | N/A | **HIGH** |
| task_checklists | same | NO | Yes | N/A | **HIGH** |
| task_co_executors | same | NO | Yes | N/A | **HIGH** |
| task_files | same | NO | Yes | N/A | **HIGH** |
| task_notifications | same | NO | Yes | N/A | **HIGH** |
| task_observers | same | NO | Yes | N/A | **HIGH** |
| task_result_files | same | NO | Yes | N/A | **HIGH** |
| task_results | same | NO | Yes | N/A | **HIGH** |
| task_tags | same | NO | Yes | N/A | **HIGH** |
| task_templates | same | NO | Yes | N/A | **HIGH** |
| task_time_entries | same | NO | Yes | N/A | **HIGH** |
| task_time_tracks | same | NO | Yes | N/A | **HIGH** |
| test_attempts | `lib/db/src/schema/lms.ts` | NO | Yes | N/A | **MEDIUM** |
| test_questions | same | NO | Yes | N/A | **MEDIUM** |
| course_modules | `lib/db/src/schema/lms.ts` | NO | Yes | N/A | **MEDIUM** |
| crm_contact_companies | `lib/db/src/schema/crm-contacts.ts` | NO | Yes | N/A | **LOW** — CRM extension table |
| customer_interactions | `lib/db/src/schema/crm-pipelines.ts` | NO | Yes | N/A | **MEDIUM** |
| orders_registry | `lib/db/src/schema/orders-registry-schema.ts` | NO | Yes | N/A | **LOW** |
| warehouse_rolls | migration 0012 | Yes | NO Drizzle | N/A — migration-only | **LOW** — raw SQL access |
| rpt_kassa_transactions | migration 0003 | Yes | NO Drizzle | N/A | **LOW** — cron-written |
| rpt_ombor_qoldiq | migration 0003 | Yes | NO Drizzle | N/A | **LOW** |
| rpt_debitorlar | migration 0003 | Yes | NO Drizzle | N/A | **LOW** |
| hr_daily_reports | migration 0010 | Yes | Partial | — | **LOW** |
| purchase_requests | migration 0012 | Yes | NO Drizzle | N/A | **LOW** |

---

## 3. Known Problem Patterns (Deep Investigation)

### 3.1 `material_card_id` vs `material_id` — The Naming Conflict

This is the single most pervasive naming inconsistency in the codebase.

**Root cause:** `material_cards` has a `serial` integer PK. The Drizzle JavaScript property name is `materialCardId` in some files and `materialId` in others, but **the DB column name** used is always `"material_id"` in the value argument of `varchar('material_id')` or `integer('material_id')`.

**Occurrences found (grep results):**

| File | JS property | DB column string | References |
|------|------------|-----------------|------------|
| `mm-material-cards.ts:125` | `materialCardId` | `"material_id"` | FK → material_cards |
| `mm-material-cards.ts:159` | `materialCardId` | `"material_id"` | FK → material_cards |
| `mm-material-cards.ts:188` | `materialCardId` | `"material_id"` | FK → material_cards |
| `mm-batch-mgmt.ts:35` | `materialCardId` | `"material_id"` | FK → material_cards |
| `mm-inventory.ts:245` | `materialCardId` | `"material_id"` | FK → material_cards |
| `mm-purchase.ts:117` | `materialCardId` | `"material_id"` | FK → material_cards |
| `fi-payroll-ext.ts:158` | `materialCardId` | `"material_id"` | FK → material_cards |
| `qc-schema.ts:74` | `materialCardId` | `"material_id"` | FK → material_cards |
| `qc-schema.ts:297` | `materialCardId` | `"material_id"` | FK → material_cards |
| `wms-schema.ts:175` | `materialCardId` | `"material_id"` | FK → material_cards (integer type) |
| `wms-schema.ts:247` | `materialCardId` | `"material_id"` | FK → material_cards (integer type) |
| `wms-schema.ts:297` | `materialCardId` | `"material_id"` | FK → material_cards (varchar type) |
| `pos-schema-v2.ts:150,206,224,...` | `materialCardId` | `"material_id"` | FK → material_cards (integer type, 12 occurrences) |
| `pos-schema-extensions.ts:58,93,...` | `materialCardId` | `"material_id"` | 5 occurrences |
| `schema-ext-a-1.ts:45` | `material_card_id` | `"material_card_id"` | **DIFFERENT** — uses `material_card_id` not `material_id` |

**The conflict:** Every Drizzle table uses DB column name `"material_id"` to reference `material_cards.id`, except `schema-ext-a-1.ts` (the `current_stock` table) which uses `"material_card_id"`. The drift report confirms `current_stock: material_card_id` is missing from the live DB, which means the live DB has `material_id` not `material_card_id` for this table.

**Additional complication:** `material_id` sometimes references `material_cards.id` (integer FK to the PK of material_cards) and sometimes references `raw_materials.id` (a different table). The column name `material_id` is reused for two different semantic FKs:

| Usage | Table | References |
|-------|-------|-----------|
| `material_id` → material_cards.id | mm-material-cards, pos-schema-v2, pos-schema-extensions, fi-payroll-ext, qc-schema | material_cards PK (serial) |
| `material_id` → raw_materials.id | mm-batch-mgmt:133, mm-batch-mgmt:166, mm-batch-mgmt:209, mm-inventory:20, mm-inventory:129 | raw_materials PK (varchar) |
| `raw_material_id` → raw_materials.id | mm-purchase:35, pp-production:536 | Correctly named |
| `material_id` untyped (no FK) | mm-mro:90, mm-inventory:87, mm-inventory:198 | Loose reference |

**Runtime risk: HIGH** — Any query joining on `material_id` without careful attention to which table it references will silently pull wrong rows or fail on type mismatch (integer vs varchar PKs).

---

### 3.2 `tenant_id` Scoping — Which Tables Have It

The multi-tenancy rollout (Phase 2, migration `0016_add_tenant_id_to_hr_tables.sql`) targets a specific set of tables. Here is the complete picture:

**Tables with `tenant_id` in Drizzle schema:**

| Table | File | Added via |
|-------|------|-----------|
| employees | employees.ts | Drizzle schema + migration 0016 |
| departments | departments.ts | Drizzle schema + drift runner |
| attendance | attendance.ts | Drizzle schema + migration 0016 |
| salary_history | payroll.ts | Drizzle schema + migration 0016 |
| leave_requests | leave.ts | Drizzle schema + migration 0016 |
| discipline_records | discipline.ts | Drizzle schema + migration 0016 |
| candidates | recruitment.ts | Drizzle schema + migration 0016 |
| vacancies | recruitment.ts | Drizzle schema + migration 0016 |
| aisha_conversations | aisha-schema.ts | Drizzle schema + migration 0016 |
| aisha_tool_calls | aisha-schema.ts | Drizzle schema + migration 0016 |
| payroll_periods | fi-gl.ts | Drizzle schema + migration 0016 |
| crm_leads | crm-contacts.ts | Drizzle schema, drift runner |
| crm_companies | crm-contacts.ts | Drizzle schema, drift runner |
| crm_deals | crm-pipelines.ts | Drizzle schema, drift runner |
| crm_contacts | crm-contacts.ts | Drizzle schema, drift runner |
| sd_orders / sales_orders | sd-orders.ts | Drizzle schema, drift runner |
| sales_invoices | sd-billing.ts | Drizzle schema, drift runner |
| purchase_orders | mm-procurement.ts | Drizzle schema, drift runner |
| aisha_voice_audit | aisha-schema.ts | Drizzle schema |
| saas_tenants | saas-schema.ts | Core identity table |
| security_ops | security-ops-schema.ts | Drizzle schema |

**Tables notably MISSING `tenant_id` (single-tenant risk):**

| Table | Risk |
|-------|------|
| users | HIGH — central auth table has no tenant scope |
| positions | HIGH — position definitions not tenant-scoped |
| payroll_calculations | LOW (dormant) |
| material_cards | MEDIUM — inventory is tenant-shared |
| warehouses | MEDIUM — warehouse definitions not scoped |
| kanban_tasks / kanban_cards | HIGH — task board data not tenant-isolated |
| pos_movements | HIGH — stock movements not scoped |
| courses, lms_exams | MEDIUM — training content not scoped |
| crm_pipelines, crm_stages | MEDIUM — pipeline config not scoped |
| gl_documents, accounts | HIGH — GL records not tenant-scoped |

**UNVERIFIED:** Whether `TenantContext` middleware is actually enforced in the request pipeline. The `DEFAULT 1` on all `tenant_id` columns suggests single-tenant operation currently. The SAAS schema (`saas_tenants`) exists but may not be actively used.

---

### 3.3 Dormant Tables

#### `payroll_calculations`
- **Schema:** `lib/db/src/schema/fi-payroll-calc.ts:100`
- **In DB:** Yes (present in drift report as existing table)
- **Service usage:** `grep -r payrollCalculations apps/api/src/` — **no matches**. Completely unused.
- **Risk:** If a route is accidentally wired to this table, it would fail because `employee_id` references `users.id` (not `employees.id`), which is inconsistent with the rest of the payroll system.
- **Verdict:** Dormant / orphan table. No runtime risk currently, but FK is semantically wrong.

#### `pos_transactions`
- **Schema:** `lib/db/src/schema/fi-payroll-ext.ts:228`
- **In DB:** Unverified (not in migration 0000, may exist from earlier migration)
- **Service usage:** `grep -r "pos_transactions" apps/api/src/` — only appears in stub controller comments and `migrations-drift.ts` metadata. The active POS module uses `retail_pos_transactions`.
- **Verdict:** Dormant. The naming creates confusion with the active `retail_pos_transactions` table.

---

### 3.4 `lms_*` Prefixed Tables — DB vs Drizzle

| Table | In migration 0000 | In Drizzle (lib/db) | Used by code | Risk |
|-------|------------------|---------------------|-------------|------|
| lms_courses | Line 360 | As `courses` (no lms_ prefix) | Yes | Naming mismatch — DB has `lms_courses`, Drizzle defines `courses` |
| lms_enrollments | Line 367 | Partial (enrollment model) | Yes | Similar |
| lms_events | NO | Yes (schema-misc-app-b.ts) | Unclear | **HIGH** |
| lms_sessions | NO | Yes (schema-misc-app-b.ts) | Unclear | **HIGH** |
| lms_test_attempts | Line 1370 | As `lms_exam_attempts` (renamed) | Yes | Name mismatch |
| lms_tests | Line 1370 area | As `tests` in lms-schema.ts | Yes | Mismatch |
| lms_questions | YES (via drift runner) | As `test_questions` (different name) | Yes | **HIGH** — drift runner creates `lms_questions` with different column set than Drizzle `test_questions` |
| lms_exams | Line 4303 | `lms_exams` in lms-extended.ts | Yes | Aligned |
| lms_modules | Line 4321 | `lms_modules` in lms-extended.ts | Yes | Aligned |
| lms_lessons | NO (absent) | `lms_lessons` in lms-extended.ts | Yes (drizzle-lms-misc.repo.ts) | **CRITICAL** |
| lms_certificates | Line 3644 | `lms_certificates` in lms-extended.ts | Yes | Aligned |
| lms_assignments | Via drift runner | Referenced in drift report as having wrong columns | Partial | **MEDIUM** |

**Critical finding:** `lms_lessons` is defined in Drizzle (`lms-extended.ts:46`) and queried by `drizzle-lms-misc.repo.ts`, but it does not exist in any migration file and is not in the live DB. Any attempt to insert or select lessons will throw a `relation "lms_lessons" does not exist` error. The drift runner does NOT create this table (it was added via the `[dup-fix]` block for `lms_questions`, `lms_assignments`, etc. but `lms_lessons` is absent from that block too).

**Column naming collision:** The drift runner creates `lms_questions` with columns `(id, test_id, question_text, options, correct_option, score, created_at, updated_at)`, but the Drizzle `test_questions` table (lib/db/src/schema/lms.ts) defines `(id, test_id, question_text, question_type, options, correct_answer, explanation, weight, sort_order, created_at)`. Different column names for the same semantic data in two different tables.

---

## 4. Duplicate Table Detection

### 4.1 True Duplicates (Same DB Table Name, Multiple pgTable Definitions)

From grep analysis, there are **no tables where two `pgTable()` calls use the exact same string table name** within `lib/db/src/schema/`. The deduplication within lib/db appears to have been completed.

However, there are cross-layer duplicates between `lib/db` and `apps/api/src/shared/db`:

| Table Name | lib/db definition | apps/api definition | Classification |
|------------|------------------|--------------------|----|
| courses | `lms-schema.ts:52` | `schema-ext-a-1.ts:92` (stub) | **Bug** — stub uses different minimal columns |
| certificates | `hr-questionnaire.ts` | `schema-ext-a-1.ts:85` (stub) | **Bug** — stub `certificates_table` has only 3 columns |
| attendance | `attendance.ts:12` | `schema-business-c-1.ts` (API re-export, binary file) | Legitimate re-export |
| crm_leads | `crm-contacts.ts:21` | `schema-compat-1b.ts` (binary, likely re-export) | Likely re-export |

The `schema-ext-a-1.ts` stubs are documented with `// TODO: X not found in lib/db` comments, which is outdated — the tables do exist in lib/db. These stubs are API shims that were created when the canonical lib/db definition wasn't wired correctly. They are now dead code but harmless if not imported.

### 4.2 Homonym Tables (Same Logical Concept, Different Names)

| Concept | Table A | Table B | Issue |
|---------|---------|---------|-------|
| POS transactions | `pos_transactions` (fi-payroll-ext) | `retail_pos_transactions` (pos-retail) | A is dormant, B is active |
| LMS tests | `tests` (lms-schema.ts) | `lms_tests` (migration 0000) | Name mismatch; DB has lms_tests, Drizzle has tests |
| LMS questions | `test_questions` (lms.ts) | `lms_questions` (drift runner) | Two tables for same concept, different schema |
| Vendors | `vendors` (mm-procurement) | `mm_vendors` (migration 0000) | DB may have both; mm_vendors is a stub |
| Purchase orders | `purchase_orders` (mm-procurement) | `mm_purchase_orders` (migration 0000) | Naming inconsistency |
| Goods receipts | `goods_receipts` (mm-procurement) | `mm_goods_receipts` (migration 0000) | Same |
| Material cards | `material_cards` (mm-material-cards.ts) | `materials` (migration 0000 line 1015) | DB `materials` is a stub; `material_cards` is the canonical table |

### 4.3 Domain Separation (Legitimate Multi-file Same Domain)

These are intentional and not bugs:

| Domain | Files |
|--------|-------|
| HR | hr-schema.ts, hr-extended.ts, hr-compensation.ts, hr-personal.ts, hr-personal-core.ts, hr-performance.ts, hr-performance-core.ts, hr-performance-ext.ts, hr-safety.ts, hr-overtime-schema.ts, hr-missing-schema.ts, hr-questionnaire.ts, hr-recruiter.ts, hr-recruitment.ts, hr-employees-docs.ts, hr-transfers.ts, hr-goals.ts, hr-tz2-schema.ts, hr-v2-schema.ts, hr-architecture-additions.ts |
| Finance | fi-schema.ts, fi-gl.ts, fi-ap-ar.ts, fi-ap-core.ts, fi-banking.ts, fi-budgets.ts, fi-expenses.ts, fi-financial-reports.ts, fi-kassa.ts, fi-payroll-calc.ts, fi-payroll-ext.ts, fi-advanced.ts |
| Materials | mm-schema.ts, mm-materials.ts, mm-material-cards.ts, mm-batch-mgmt.ts, mm-inventory.ts, mm-logistics.ts, mm-mro.ts, mm-procurement.ts, mm-purchase.ts, mm-raw-materials.ts, mm-advanced.ts |
| Sales/SD | sd-schema.ts, sd-core.ts, sd-orders.ts, sd-order-items.ts, sd-billing.ts, sd-delivery.ts, sd-extended.ts, sd-customer-relations.ts, sd-europrint-schema.ts |
| POS | pos-schema.ts, pos-schema-v2.ts, pos-schema-extensions.ts, pos-retail.ts |

---

## 5. Runtime Risk Assessment — Severity Matrix

### CRITICAL (will cause 500 on any request touching these tables)

| Table | Issue | Fix required |
|-------|-------|-------------|
| `lms_lessons` | Absent from DB entirely; queried by drizzle-lms-misc.repo.ts | Run CREATE TABLE migration |
| `ow_work_orders` (and 15 other ow_* tables) | Entire Order Workflow module absent from DB | Create all 16 tables or disable routes |

### HIGH (likely causes errors on specific operations)

| Table | Issue |
|-------|-------|
| `attendance` | `check_in_time` type is TIME in DB but Drizzle inserts timestamps; CAST may fail for some values |
| `daily_attendance_summary` | All columns missing from DB; any INSERT fails |
| `current_stock` | `material_card_id` column name mismatch — DB likely has `material_id` |
| `kanban_flows`, `kanban_robots` | Absent from DB; any write fails |
| `task_*` tables (12 tables) | All absent from DB per drift report |
| `crm_companies` | 18 columns missing; if any NOT NULL column is missing from DB schema, INSERTs fail |
| `payroll` (legacy) | `employee_id` renamed to `employee_id_legacy`, new integer `employee_id` added as NULL; any code still using old UUID logic breaks |

### MEDIUM (causes errors only under specific conditions)

| Table | Issue |
|-------|-------|
| `lms_events`, `lms_sessions` | Absent from DB; risk depends on query frequency |
| `employees` | Missing `employment_type`, `role`, `total_points` — nullable, so INSERTs won't fail but SELECT will return NULL for these |
| `material_cards` | Missing `barcode` column; barcode scan feature will fail |
| `crm_leads` | 13 columns missing — nullable drift, SELECT returns NULL |
| `lms_questions` vs `test_questions` | Two parallel schemas; queries against the wrong one will fail or return wrong data |
| `course_modules` | Absent from DB (Drizzle-only) |

### LOW (dormant or read-only impact)

| Table | Issue |
|-------|-------|
| `payroll_calculations` | No service queries it; dormant |
| `pos_transactions` | No service queries it (uses retail_pos_transactions instead) |
| `pos_inventory_passport` | Migration-only, no Drizzle schema; can only be accessed via raw SQL |
| `warehouse_rolls` | Migration-only, no Drizzle schema |
| `rpt_*` tables | Cron-written snapshot tables, no interactive queries |
| Schema stubs in `schema-ext-a-1.ts` | Outdated TODO stubs; not actively imported |

---

## 6. Migration Journal vs Applied Migrations — Discrepancy

The Drizzle journal (`apps/api/drizzle/meta/_journal.json`) only lists migration `0000_volatile_ender_wiggin`. Migrations 0001–0016 exist as SQL files but are **not registered in the journal**.

This means:
1. `drizzle-kit migrate` would see only 0000 as applied and try to generate new migrations from the current Drizzle state (potentially destructive).
2. The actual DB state includes changes from 0001–0016 applied via manual/scripted execution or via the `migrations-drift.ts` invariant runner.
3. The gap between journal state and actual DB state makes `drizzle-kit push` dangerous — it would try to re-apply all schema changes.

**Recommendation:** Either register all migrations in the journal, or fully migrate to the `migrations-drift.ts` invariant runner as the sole migration mechanism and stop using `drizzle-kit migrate`.

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Tables completely absent from DB (Drizzle-only) | 73 | HIGH for actively queried ones |
| Tables absent from Drizzle (migration-only) | ~5 | LOW — not type-safe |
| Tables with column drift | 177 | MEDIUM |
| Total missing columns | 527 | MEDIUM |
| `material_id` vs `material_card_id` naming conflicts | 40+ call sites | HIGH |
| Tables missing `tenant_id` (multi-tenancy gap) | ~15 core tables | MEDIUM |
| Dormant tables (exist but never queried) | 2 confirmed | LOW |
| True duplicate table definitions (same name, different schema) | 2 (courses, certificates stubs) | LOW |
| Homonym table pairs (same concept, different names) | 7 pairs | MEDIUM |

## Gaps Table

| Gap | Description | Impact |
|-----|-------------|--------|
| Journal desync | Drizzle journal only shows migration 0000; 0001–0016 are unapplied from Drizzle's perspective | drizzle-kit commands are unreliable |
| lms_lessons absent | Not in DB, not in drift runner CREATE TABLE list | CRITICAL for LMS lesson delivery |
| ow_* module | 16 tables defined, none in DB | CRITICAL if Order Workflow routes are active |
| attendance type mismatch | check_in/check_out are TIME in DB, timestamp in Drizzle | HIGH on attendance writes |
| material_id semantics | Same column name, two different FKs (material_cards vs raw_materials) | HIGH — silent data corruption risk |
| tenant_id on users/positions/GL | Core tables not tenant-scoped despite multi-tenancy rollout | HIGH for multi-tenant scenarios |
| pos_transactions naming | Dormant table with same-concept name as active retail_pos_transactions | MEDIUM — developer confusion |

## Open Questions / UNVERIFIED

1. Does the `migrations-drift.ts` invariant runner actually execute on every boot? If so, are the 1,151 ADD COLUMN statements idempotent on a cold DB?
2. What is the exact column set of `current_stock` in the live DB — `material_id` or `material_card_id`?
3. Is `lms_lessons` queried in the current production environment, or are lessons served differently (e.g., via `lms_modules`)?
4. Do any of the `ow_*` routes have active frontend pages wired to them, or are they planned-only?
5. Has the `payroll.employee_id_legacy` UUID column been orphaned — are there application-level joins still referencing the old UUID column?
6. Is `saas_tenants` / `TenantContext` middleware actually active in the current deployment, or is multi-tenancy deferred?
7. Is `mm_vendors` a separate table from `vendors` in the live DB, or does `mm_vendors` get remapped to `vendors` at the query layer?
