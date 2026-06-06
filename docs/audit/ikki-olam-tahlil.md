# Two-Worlds Canonical Table Analysis — STEP A (Read-Only)
> Generated: 2026-06-06 | Inline analysis, no subagents.  
> All row counts from live DB (`europrint`@127.0.0.1:5432).  
> All writer/reader claims backed by file:line grep on live code.  
> **STOP after this document — owner must approve before STEP B migration.**

---

## LEGEND
- **CANONICAL** = recommended single source of truth  
- **VIEW** = alias over another table (zero cost to keep)  
- **LEGACY** = has active writers but should be migrated to CANONICAL  
- **DISTINCT DOMAIN** = not a duplicate — serves a genuinely different sub-domain  
- **DEAD** = no active writers, no data, can be dropped safely  
- Risk: 🟢 Low | 🟡 Medium | 🔴 High (money / FK web / schema mismatch)

---

## WORLD 1 — ORDER

### Tables

| Table | Type | Rows | Writers (file:line) | Readers (file:line) | FK children | Verdict |
|---|---|---|---|---|---|---|
| `sales_orders` | BASE TABLE | **12** | `drizzle-sales-order.repo.ts:38–180` (INSERT+UPDATE), `drizzle-sd-orders.repo.ts` | MES, SD, QC, PP, AI, CRM (many) | `sales_order_items`, `sd_order_departments`, `ow_cliches`, `ow_molds`, `ow_tech_cards`, `ow_cliches`, `ow_material_requirements`, `ow_shipping_requests` (7 FK) | **CANONICAL** ✅ |
| `sd_sales_orders` | **VIEW** | 12 (same data) | — (VIEW) | `sd-payments.repository.ts`, `drizzle-quotation.repo.ts`, SD controllers | (VIEW, inherits) | **KEEP as alias VIEW** |
| `papka_orders` | BASE TABLE | 0 | `legacy-warehouse.helpers.ts:65,84`, `queries-technology.ts:145,178` | `mes-shifts-stats.repo.ts` (via `mes_papka_orders` VIEW) | none significant | **DISTINCT DOMAIN** — MES production folders (tech routing), not sales. KEEP. |
| `orders_registry` | BASE TABLE | 0 | `orders-registry.service.ts:36` (INSERT) | `orders-registry.service.ts:27` (SELECT) | none | **DISTINCT DOMAIN** — internal document/decree registry. KEEP. |
| `customer_orders` | BASE TABLE | 0 | `ecommerce.repository.ts` (SELECT, stats, list) | `ai-decision-log.service.ts:245`, `ai-alerts.service.ts:118` | `customer_order_items` | **DISTINCT DOMAIN** — e-commerce B2C orders, different schema. KEEP. |
| `sap_sales_orders` | BASE TABLE | 0 | `sap.repository.ts:43` (UPDATE only, no INSERT found) | `sap.repository.ts:21,34` (SELECT); code comment: "may not exist → fallback to canonical sales_orders" | none | **SAP STAGING** — integration staging table. KEEP for SAP integration. |
| `ow_orders` | **NOT IN DB** | — | `sprint4-migration.service.ts:32` (`ALTER TABLE ow_orders` — silently fails since table absent) | none | — | **DEAD CODE** — table never created in DB. ALTER fails silently. Code reference is stale. |
| `sd_orders` | **NOT IN DB** | — | none | none | — | **DEAD** — table never created in DB. No active references. |

### Schema notes
- `sd_sales_orders` = `SELECT id, order_number, customer_id, status, … (50+ cols) FROM sales_orders` — perfect pass-through VIEW.
- `ow_orders` — only reference is in `sprint4-migration.service.ts` which does `ALTER TABLE ow_orders ADD COLUMN …` wrapped in `.catch()`. Table doesn't exist so this silently fails on every boot.

### Recommendation — ORDER world
**STATUS: ALREADY RESOLVED.** `sales_orders` is canonical. `sd_sales_orders` is already a VIEW alias. No data migration needed.

Action items for STEP B:
1. **Clean up** `sprint4-migration.service.ts` — the `ALTER TABLE ow_orders` block is dead code (table absent); remove the method or guard with `IF EXISTS` to stop the silent boot-time error.
2. No other ORDER migration needed.

**Risk: 🟢 Low** (VIEW already in place; dead code cleanup only)

---

## WORLD 2 — GL (General Ledger)

### Tables

| Table | Type | Rows | Writers (file:line) | Readers (file:line) | FK children | Verdict |
|---|---|---|---|---|---|---|
| `entries` | BASE TABLE | 0 | `drizzle-gl-posting.repo.ts:43,85` (Finance DDD repo), `gl-posting-log.repository.ts:147` (POS→GL promotion) | `finance-ai.repository.ts:8`, `reports-hub.repo.ts:27` | none found | **CANONICAL** ✅ |
| `gl_journal_entries` | BASE TABLE | 0 | `drizzle-finance-invoice.repo.ts:202` (INSERT INTO gl_journal_entries), `drizzle-hr-payroll.repo.ts:97` (db.insert(gl_journal_entries)) | `cfo.service.ts:56,66,115,176,214`, `drizzle-finance-budget.repo.ts:83`, `drizzle-finance-ops.repo.ts:193,206,220,257`, `drizzle-finance-report.repo.ts:63`, `drizzle-finance-planning.repo.ts:164` | `gl_lines` (via `gl_document_id`) | **LEGACY — ACTIVE WRITERS** 🔴 |
| `gl_lines` | BASE TABLE | 0 | `queries-remaining-b.ts:210` (db.insert(gl_lines) — compat helper) | `drizzle-finance-accounting.repo.ts:35` (COUNT check) | none | **LEGACY** (linked to gl_journal_entries) |
| `pos_gl_posting_log` | BASE TABLE | 0 | `gl-posting-log.repository.ts:17` (db.insert(glPostingLog)) | `gl-posting-log.repository.ts:24,37`, `pos-movement-status.service.ts:206,222` | none | **POS STAGING** — different purpose (POS movement → pending Finance review → promote to entries). KEEP. |

### Schema comparison

| Column | `entries` (canonical) | `gl_journal_entries` (legacy) |
|---|---|---|
| PK | `id` INTEGER | `id` INTEGER |
| `entry_number` | ✅ VARCHAR | ❌ absent |
| `entry_date` | ✅ VARCHAR | ❌ absent |
| `document_type` | ✅ VARCHAR | ✅ TEXT |
| `document_id` | ✅ INTEGER | ✅ INTEGER |
| `debit_account_id` | ✅ INTEGER (FK → accounts) | ❌ absent |
| `credit_account_id` | ✅ INTEGER (FK → accounts) | ❌ absent |
| `debit_account` | ✅ TEXT (denorm) | ✅ TEXT (raw code only) |
| `credit_account` | ✅ TEXT (denorm) | ✅ TEXT (raw code only) |
| `amount` | ✅ NUMERIC | ✅ NUMERIC |
| `currency` | ❌ absent | ✅ TEXT |
| `description` | ✅ TEXT | ✅ TEXT |
| `created_by` | ✅ INTEGER | ❌ absent |
| `posted_by` | ✅ UUID | ❌ absent |
| `reference_id/type` | ✅ uuid/text | ❌ absent |

`gl_lines` is a separate header/line format (SAP-style):
`gl_document_id` (FK to gl_journal_entries), `line_number`, `account_id` (FK), `cost_center_id`, `profit_center_id`, `debit_amount`, `credit_amount`.

### Key finding — schema mismatch
`gl_journal_entries` stores account codes as raw TEXT, no FK to `accounts`. `entries` requires `debit_account_id`/`credit_account_id` (INTEGER FK to `accounts`). Migration of each legacy write requires:
1. Generate an `entry_number`
2. Resolve debit/credit TEXT codes → account IDs via JOIN `accounts`
3. Handle the `currency` field (absent in `entries`) — add column or discard

### Recommendation — GL world
**STATUS: DEFERRED — high risk, owner must approve schema-alignment plan.**

Why deferred now (both tables 0 rows, but code migration is complex):
- `drizzle-finance-invoice.repo.ts:202` → needs to call `DrizzleGlPostingRepository.insertJournal()` or `insertEntry()` instead of raw SQL into `gl_journal_entries`
- `drizzle-hr-payroll.repo.ts:97` → same: needs to use `GL_POSTING_REPO.insertJournal()`
- All CFO/finance SELECT queries (5+ files) on `gl_journal_entries` need to be ported to `entries`
- `gl_lines` compat insert in `queries-remaining-b.ts:210` → retire

Action for STEP B (after owner approves):
1. Add `currency` column to `entries` (or decide to drop currency tracking)
2. Reroute `drizzle-finance-invoice.repo.ts:202` → `insertJournal()`
3. Reroute `drizzle-hr-payroll.repo.ts:97` → `insertJournal()`
4. Port all `SELECT … FROM gl_journal_entries` reads to `entries`
5. Retire `gl_journal_entries` + `gl_lines` (keep as empty tables until all reads are migrated)

**Risk: 🔴 High** (money, schema mismatch, active writers in finance+payroll)
**Prerequisite:** Owner approves `entries` as canonical AND approves adding `currency` to `entries`.

---

## WORLD 3 — MATERIAL

### Tables

| Table | Type | Rows | Writers (file:line) | Readers (file:line) | FK children | Verdict |
|---|---|---|---|---|---|---|
| `material_cards` | BASE TABLE | **21** | `resources.service.ts:75`, `warehouse-catalog.service.ts:53`, `erp.repository.ts:37,134`, `pos-barcode-ext.repository.ts:21`, `procurement-request.service.ts:266`, `warehouse-config.service.ts:121,168,189`, `pos-warehouse-integration-movement.service.ts:154` | POS, WMS, MM, SD, HR, MES (many) | `bom_items`, `employee_balances`, `employee_liability_cases`, `label_print_history`, `low_stock_alerts`, `material_card_suggestions`, `material_layer_config`, `material_price_history`, `material_supplier_ratings`, `pos_material_requests`, `production_order_components` (11 FK) | **CANONICAL for EuroPrint printing domain** ✅ |
| `materials` | BASE TABLE | 0 | `drizzle-material.repo.ts:107,131` (INSERT + UPDATE) | `forecast-weekly.job.ts:194` (`FROM materials WHERE is_active=true`), `mm-dashboard.controller.ts` | none | **MM/AI domain** — used by MM module + AI forecast. 0 rows → AI forecast **never runs** (returns empty materials list). |
| `mm_materials` | **VIEW** | 0 | — (VIEW) | MM controllers | (VIEW over materials) | **VIEW alias** over `materials` — keep or drop with `materials` |
| `raw_materials` | BASE TABLE | 0 | **No writers found** | `drizzle-finance-accounting.repo.ts:138,142`, `mm-materials-extras.repository.ts:22,23` | none | **READ-ONLY reference dictionary** — manufacturing input lookup. KEEP (different concept). |

### Schema comparison

| | `material_cards` (canonical) | `materials` |
|---|---|---|
| PK | INTEGER | UUID |
| Name | `xom_ashyo` (uz), `xom_ashyo_ru` | `name` |
| Code | `kod` | `material_code`, `code` |
| Category | `category` (varchar) | `category` (text) |
| Unit | `unit_of_measure` | `unit_of_measure`, `unit` |
| EuroPrint fields | `format_a`, `format_b`, `grammage`, `current_stock`, `reserved_stock` | ❌ absent |
| Barcode | `barcode` | `barcode`, `sku` |
| Cost | `unit_price` | `unit_cost`, `unit_price` |

These schemas are **incompatible** (UUID vs INTEGER PK, different column names). They cannot be trivially merged.

### Critical issue
`forecast-weekly.job.ts:194` queries `FROM materials WHERE is_active = true` to build the forecast job list. Since `materials` has 0 rows, the AI forecast system **never enqueues any jobs** and always logs "0 ta material uchun forecast job'lari queue'ga qo'shildi". The forecast is dead because it reads the wrong table.

### Recommendation — MATERIAL world
**STATUS: SAFE TO FIX with owner approval.**

- `material_cards` (21 rows, 11 FK children) = **CANONICAL** ✅ — only this should be used
- Change `forecast-weekly.job.ts:194` to query `material_cards` instead of `materials` → fixes AI forecast immediately
- `materials` (0 rows, 0 FK children after forecast fix) → **RETIRE**: can be dropped once `drizzle-material.repo.ts` is re-targeted to `material_cards`
- `mm_materials` VIEW → drops automatically with `materials`, or can be dropped first
- `raw_materials` (0 rows, read-only) → KEEP as manufacturing input reference

**Risk: 🟡 Medium**
- `drizzle-material.repo.ts` needs to be re-targeted to `material_cards` (column renames: `material_code`→`kod`, `name`→`xom_ashyo`, UUID PK → INTEGER PK)
- `forecast-weekly.job.ts` query change is **🟢 Low risk** (just a FROM clause change)

---

## WORLD 4 — STOCK

### Tables

| Table | Type | Rows | Writers (file:line) | Readers (file:line) | FK children | Verdict |
|---|---|---|---|---|---|---|
| `warehouse_stock` | BASE TABLE | **25** | `pos-warehouse-integration-movement.service.ts:126,136`, `pos-wms-sync.helpers.ts:93,106`, `procurement-request.service.ts:280,287`, `warehouse-config.service.ts:113,168,180`, `pos-employee-balance.repository.ts:92,106`, `quarantine-workflow.repository.ts:65,78` | `pos-movement-status.service.ts`, WMS controllers, `current_stock` VIEW | none found | **CANONICAL for POS operations** ✅ |
| `current_stock` | **VIEW** | 25 (same) | — (VIEW) | MM, WMS, SD controllers | (VIEW) | **KEEP** — useful read alias with renamed columns |
| `stocks` | BASE TABLE | 0 | `queries-wms.ts:13,50` (db.insert/update), `drizzle-wms.repo.ts:51` (db.insert) | WMS barcode scan flow | none | **WMS BATCH RECEIPT** — has `expiry_date`, `batch_number`, `received_at` (batch/lot tracking). Different purpose from `warehouse_stock`. |
| `wms_stock` | BASE TABLE | 0 | `drizzle-wms.repo.ts:232` (UPDATE only), `wms-crud.repository.ts:109,124` (UPDATE only) | WMS CRUD controllers | none | **PROTOTYPE/DEAD** — schema has only `qty`, `batch_no`, `notes` with no `material_id` or `warehouse_id` columns. Never seeded. |
| `wms_stock_levels` | BASE TABLE | 0 | no writers found | `wms-extended.repository.ts` (SELECT) | none | **DEAD** — no writers, no rows |
| `stock_ledger` | BASE TABLE | 0 | via `pos_stock_ledger` VIEW (`stock-ledger.repository.ts:32`) | `stock-ledger.service.ts` | none | **POS LEDGER** — event journal (qty_change, balance_after), different concept from balance table. KEEP. |
| `pos_stock_ledger` | **VIEW** | 0 | — (VIEW over stock_ledger) | `stock-ledger.repository.ts` imports as `posStockLedger = pgTable('pos_stock_ledger')` ⚠️ | (VIEW) | Drizzle schema mismatch: code declares it as pgTable but it's a VIEW in DB |

### Schema comparison

| Column | `warehouse_stock` (canonical) | `stocks` | `wms_stock` |
|---|---|---|---|
| `warehouse_id` | ✅ INTEGER | ✅ INTEGER | ❌ absent |
| `material_id` | ✅ INTEGER | ✅ INTEGER | ❌ absent |
| `quantity` | ✅ NUMERIC | ✅ NUMERIC | `qty` NUMERIC |
| `reserved_quantity` | ✅ | ✅ | ❌ absent |
| `available_quantity` | ✅ (derived) | ❌ | ❌ |
| `bin_location_id` | ✅ | ❌ | ❌ |
| `batch_number` | ❌ | ✅ | `batch_no` VARCHAR |
| `expiry_date` | ❌ | ✅ | ❌ |
| `received_at` | ❌ | ✅ | ❌ |

### Key finding
`wms_stock` is a PROTOTYPE table with no `material_id`/`warehouse_id` columns — it cannot track what material is where. Code only UPDATEs it (never INSERT), so it was never usable. Candidate for DROP.

`stocks` serves a DISTINCT PURPOSE: WMS batch receipt tracking (lot/expiry dates). The WMS receive flow writes here. Should NOT be merged into `warehouse_stock` unless EuroPrint wants to add batch tracking to POS operations.

### Recommendation — STOCK world
- `warehouse_stock` (25 rows) = **CANONICAL for POS balance** ✅ — no migration needed
- `current_stock` VIEW = KEEP (used by FE and other modules)
- `stocks` = **DISTINCT** — WMS batch receipt tracking (owner: is this still in use or dead prototype?)
- `wms_stock` = **DROP CANDIDATE** (no material_id/warehouse_id, no INSERT writers, 0 rows)
- `wms_stock_levels` = **DROP CANDIDATE** (no writers, 0 rows)
- `stock_ledger` = KEEP (POS event ledger — different concept)
- `pos_stock_ledger` VIEW = ⚠️ Drizzle schema mismatch: `posStockLedger = pgTable('pos_stock_ledger')` but DB object is a VIEW. The code INSERT would fail at runtime. Needs fix.

**Risk: 🟢 Low** (`wms_stock`/`wms_stock_levels` safe to drop — no FKs, no data)

---

## WORLD 5 — ATTENDANCE

### Tables

| Table | Type | Rows | Writers (file:line) | Readers (file:line) | FK children | Verdict |
|---|---|---|---|---|---|---|
| `attendance` | BASE TABLE | 0 | `drizzle-attendance.repo.ts:54,61` (INSERT check-in, UPDATE check-out) | `drizzle-attendance.repo.ts:38-46` (SELECT + count), `late-arrival.service.ts`, cron jobs | none | **CANONICAL for HR attendance** ✅ |
| `attendance_records` | BASE TABLE | 0 | `legacy-attendance.helpers.ts:97` (INSERT) | `legacy.service.ts` | none | **LEGACY RAW EVENT LOG** — RFID card events (`rfid_card`, `event_type`, `face_confidence`). Raw biometric stream, not processed attendance. KEEP but separate concept. |
| `attendance_logs` | BASE TABLE | 0 | `employees-compat-financials.service.ts:195`, `manager.repo.ts:201,212` (Telegram bot) | finance/HR compat | none | **COMPAT/TELEGRAM WRITER** — should eventually write to `attendance` instead. Low risk. |
| `hr_tz2_daily_attendance` | BASE TABLE | 0 | `territory-log.repository.ts:219,228,239` | `territory-log.service.ts` | none | **TZ-2 TERRITORY ZONE** — specialized zone-based attendance for territory tracking. Distinct sub-feature. KEEP. |
| `hr_ai_attendance` | BASE TABLE | 0 | `iot-agent.service.ts:60` (INSERT) | IoT agent | none | **AI CAMERA EVENTS** — raw face-recognition capture log. Feed into `attendance`. KEEP as source event log. |
| `daily_attendance_summary` | BASE TABLE | 0 | no writers found | `absence-block.cron.ts`, `daily-report-deadline.cron.ts` | none | **AGGREGATION** — daily rollup. KEEP if used by crons. |
| `security_attendance` | BASE TABLE | 0 | no writers found | security module | none | **SECURITY DOMAIN** — access control system. KEEP. |

### Schema comparison: `attendance` vs `attendance_records`

| | `attendance` (canonical) | `attendance_records` (legacy event log) |
|---|---|---|
| `employee_id` | ✅ INTEGER | ✅ INTEGER |
| `user_id` | ✅ INTEGER | ✅ INTEGER |
| `date` | ✅ VARCHAR (also `attendance_date` DATE) | ✅ DATE |
| `check_in`/`check_out` | ✅ TIMESTAMPTZ | ✅ (check_in/check_out TIMESTAMP) |
| `status` | ✅ VARCHAR | ✅ TEXT |
| `late_minutes`, `overtime_minutes` | ✅ | ❌ |
| `rfid_card` | ❌ | ✅ VARCHAR |
| `event_type` | ❌ | ✅ VARCHAR (entry/exit events) |
| `face_confidence` | ❌ | ✅ NUMERIC |
| `location_id` | ❌ | ✅ INTEGER |

These tables serve different purposes in the same workflow: `attendance_records` = raw biometric events (every door entry/exit), `attendance` = processed daily attendance records (derived from events).

### Recommendation — ATTENDANCE world
- `attendance` = **CANONICAL** ✅ — no migration needed
- `attendance_records` = **KEEP** as raw event stream (different concept — feeds into `attendance`)
- `attendance_logs` = **MIGRATE**: reroute `employees-compat-financials.service.ts` and `manager.repo.ts` to write to `attendance` instead. Medium effort.
- `hr_tz2_daily_attendance` = **KEEP** — TZ-2 feature specific
- `hr_ai_attendance` = **KEEP** — raw AI camera events
- `daily_attendance_summary` = **KEEP** — aggregation table
- `security_attendance` = **KEEP** — different domain

**Risk: 🟢 Low for `attendance_logs` migration** (2 writers, simple schema mapping)

---

## SUMMARY TABLE — OWNER APPROVAL REQUIRED

| World | Canonical | STEP B Action | Risk | Priority |
|---|---|---|---|---|
| **ORDER** | `sales_orders` ✅ | Cleanup `sprint4-migration.service.ts` dead `ALTER TABLE ow_orders` | 🟢 Low | P3 |
| **GL** | `entries` | Reroute invoice+payroll writers + port CFO reads. Add `currency` to `entries` first. | 🔴 High | LAST |
| **MATERIAL** | `material_cards` | Fix `forecast-weekly.job.ts` query (FROM materials → material_cards). Retire `materials`/`mm_materials`. | 🟡 Medium | P1 |
| **STOCK** | `warehouse_stock` | Drop `wms_stock` + `wms_stock_levels` (dead). Decide on `stocks` (batch receipt). Fix `pos_stock_ledger` Drizzle mismatch. | 🟢 Low | P2 |
| **ATTENDANCE** | `attendance` | Migrate `attendance_logs` writers (2 files) → `attendance`. | 🟢 Low | P3 |

### Recommended STEP B order (safest first):
1. **MATERIAL** — fix AI forecast (high business value, low risk, 1 line change)
2. **STOCK** — drop dead tables, fix Drizzle mismatch (housekeeping)
3. **ORDER** — cleanup dead sprint4-migration code
4. **ATTENDANCE** — migrate 2 compat writers
5. **GL** — last, requires schema design approval (add `currency` to `entries`)

---

## OPEN DECISIONS FOR OWNER

**D1 (MATERIAL):** Should `forecast-weekly.job.ts` query `material_cards` (21 rows, EuroPrint catalog) instead of `materials` (0 rows)? If yes, AI forecast starts working immediately.

**D2 (MATERIAL):** After fixing forecast, should `materials` + `mm_materials` be retired/dropped? Confirm `drizzle-material.repo.ts` (MM module) is not used in production flows.

**D3 (STOCK):** Is `stocks` table (WMS batch receipt, 0 rows) still in active use, or is it a dead prototype? If dead → drop. If live → document its purpose vs `warehouse_stock`.

**D4 (GL):** Approve `entries` as canonical + approve adding `currency` column to `entries` before GL writer migration begins. This unblocks the GL world merge.

**D5 (STOCK):** The `posStockLedger` Drizzle schema (`pgTable('pos_stock_ledger', …)`) maps to a DB VIEW, not a base table. Drizzle INSERT into a VIEW would either fail or silently go to `stock_ledger`. Fix: change the Drizzle schema to reference `stock_ledger` directly, or add `WITH CHECK OPTION` to the VIEW. Low risk (0 rows, stock ledger path not yet triggered in prod).
