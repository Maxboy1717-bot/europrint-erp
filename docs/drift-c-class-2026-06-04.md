# Column-drift C-class report — DDL / owner-gated (2026-06-04)

STAGE B.1 (CODE-only drift) fixed all **class A** (real column exists → rename) and the safe
parts. This file lists what is **NOT** code-fixable: a query references a column/table that
**genuinely does not exist** (class C — needs DDL), or the rename is **ambiguous** (needs an
owner decision), or it is the **uuid two-worlds** issue (class B). Nothing here was changed.

Source: 2 read-only drift subagents (information_schema-verified) + my spot-checks. Re-confirm
each against the live DB before any DDL (Q-35 owner-gated).

---

## A. Missing COLUMNS (need ALTER ADD, or repoint the query to an existing column)

| file:line | table.column (missing) | candidate resolution |
|-----------|------------------------|----------------------|
| queries-mm-goods.ts:33,57,88,34,112 | `mm_goods_receipts.delivery_note`, `.updated_at` | add cols OR drop from query (mm_goods_receipts canonical shape has neither) |
| queries-mm-goods.ts:128,139,164,188 | `mm_goods_issues.cost_center`, `.work_order_id`, `.updated_at` | add cols OR drop from query |
| pp-planning.repository.ts:37 | `pp_routing_operations.status`, `.planned_duration`, `.updated_at` | add cols (updateOperation dead without them) |
| production.repository.ts:89 | `production_orders.operator_id` | ⚠️ **AMBIGUOUS** — real cols are `responsible_manager_id` / `shift_supervisor_id`; owner picks which the 360-card "operator" means (NOT guessed). `bom_header_id`→`bom_id` is clean but the query stays blocked on operator_id. |
| design-lab-join.service.ts:76 | `sales_orders.design_status`, `.lab_status` | real cols `design_flag`/`master_status`/`sample_flag` exist — semantic remap (owner confirms mapping) — Trigger-5 silently never fires today |
| goods-receipt.repository.ts (POS):70-97,137-158 | `goods_receipts.movement_id`, `.supplier_tin`, `.waybill_number`, `.contract_number`, `.currency` | add cols OR trim query (grn_number/received_date/total_amount/approved_by are clean A-renames but moot while these C cols remain) |
| employee-ledger.repository.ts:24,35,53,62 / pos-lifecycle-block.repository.ts:22 / pos-mini-app.repository.ts:29,30 | `material_cards.is_consumable`, `.min_interval_days`, `.max_qty_per_issue`, `.is_indivisible` | add cols (pos-barcode.repository already works around with `FALSE AS …` literals — adopt that, or add real cols). Lifecycle issuance-throttle dead until then. |
| employee-ledger.repository.ts:79 | `employee_liability_cases.total_liability`, `.currency` | `total_liability`→`assessed_value`/`amount` (semantic, owner confirms); currency add-or-drop |
| pos-department.guard.ts:52 / pos-mini-app.repository.ts:52 | `warehouse_access_grants.is_active`, `.expires_at` | add cols. `wag.user_id`→`employee_id` is a clean A-rename but the guard/getWarehouses stay blocked on is_active. Guard currently fail-CLOSED (safe). |

## B. Missing TABLES (need CREATE, or repoint to an existing canonical table)

| file:line | missing table | candidate resolution |
|-----------|---------------|----------------------|
| wms-analytics.service.ts:70,131 / wms-eoq.service.ts:143 | `pos_inventory_movements` | repoint to existing `warehouse_transactions` / `pos_movements`, OR create |
| abc-xyz.service.ts:106,135 | `goods_movement` | repoint to `warehouse_transactions`, OR create |
| pos-fifo.service.ts:38,63,118,138 | `pos_materials`, `pos_batches`, `pos_stock_balances` | repoint to `material_cards` / `warehouse_stock` / batch tables, OR create (FIFO allocation dead) |
| drizzle-finance-invoice.repo.ts:182 | `fi_payments` | create the payment table, OR repoint to existing payments — **invoice payment not saved** (money) |
| drizzle-finance-invoice.repo.ts:202-240 | `gl_journal_entries` (WRONG SHAPE: source_type/source_id/entry_date/total_debit/total_credit) + `gl_journal_lines` (missing) | ⭐ **two-GL-worlds**: the canonical `gl_documents`/`gl_lines` path (drizzle-finance-accounting.repo) is CLEAN. Repoint finance-invoice GL to gl_documents/gl_lines instead of the drifted gl_journal_entries. |
| drizzle-lms-misc.repo.ts:23,30 | `micro_modules`, `micro_module_views` | create, OR keep `/micro-modules` as the EPComingSoon stub it already is (CLAUDE.md F4) |

## C. LMS structural (column exists but wrong relationship)
- `lessons.course_id` (drizzle-lms-misc.repo.ts:72-88, drizzle-lms-exams.repo.ts:22): live `lessons` has `module_id` (lesson→lms_modules→courses), not course_id → needs a 2-hop join rewrite, not a rename.
- `mentors.is_active`/`.rating` (drizzle-lms-misc.repo.ts:63): absent; `specialization`→`expertise` is a clean A (could be done), but is_active/rating need cols.
- `lms_exam_attempts.attempt_number` (drizzle-lms-tests.repo.ts:196): absent.
- `hr_health_checkups.checkup_type`/`.notes` (hr-compat-a.repository.ts:181): absent — Drizzle silently drops them on insert (2 FE fields lost, no crash).

## D. class B — type drift (uuid ╳ integer = the two-order-worlds problem)
- `sales.repository.ts:54,72` getCommissionCalculations/getLeaderboard: `sales_orders o ON o.assigned_to = e.id` — `sales_orders.assigned_to` is **uuid**, `employees.id` (and `users.id`) is **integer** → `uuid = integer` operator error; NOT castable. This is the uuid order-world at the column level → DEFER to the ANALYSIS-1 / owner uuid decision (no clean fix; do not guess the join path).

---

**Note:** items marked "clean A-rename but moot" had their A-part deliberately NOT edited, because
the same query still fails on a C column in the same statement — editing the A-part alone would be
busywork that does not make the endpoint work. They become 1-line fixes once the owner resolves the
C column/table.
