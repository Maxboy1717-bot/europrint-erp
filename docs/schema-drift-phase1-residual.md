# Phase 1 — Live drift residual (manual review required)
Generated: 2026-05-21T07:05:31.187Z

Phase 3 (ADD COLUMN / CREATE TABLE) tugaganidan keyin qolgan drift.
Bu masalalar **avtomatik fix qilinmaydi** — ma'lumot konversiyasi yoki repo-side handler kerak.

## Drift toifalari

- type-mismatch (live): 518 ustun, 229 jadval
- nullable-mismatch (live): 224 ustun, 101 jadval
- missing-in-drizzle (live): 756 ustun, 191 jadval

## 1. Type-mismatch — eng dardli 30 ta jadval

| Jadval | Live fayl | Drift soni | Misol |
|---|---:|---:|---|
| `production_orders` | 25 | 10 | bom_id: varchar→integer, routing_id: varchar→integer, sales_order_id: varchar→integer |
| `asset_items` | 2 | 9 | id: uuid→integer, asset_code: text→character varying, category: text→character varying |
| `design_orders` | 3 | 9 | deal_id: varchar→integer, papka_order_id: varchar→integer, client_name: text→character varying |
| `material_barcodes` | 1 | 8 | barcode_id: varchar→integer, material_card_id: varchar→integer, warehouse_id: varchar→integer |
| `invoices` | 10 | 8 | id: uuid→integer, invoice_number: text→character varying, sales_order_id: uuid→integer |
| `stock_transfers` | 4 | 7 | to_warehouse_id: varchar→integer, from_bin_id: varchar→integer, to_bin_id: varchar→integer |
| `kanban_cards` | 10 | 6 | board_id: varchar→integer, column_id: varchar→integer, project_id: varchar→integer |
| `papka_orders` | 2 | 6 | id: varchar→integer, bom_id: varchar→integer, product_id: varchar→integer |
| `chat_messages` | 6 | 6 | id: varchar→integer, room_id: varchar→integer, sender_id: text→integer |
| `expense_requests` | 1 | 5 | requested_by: varchar→integer, budget_line_id: varchar→integer, approval_request_id: varchar→integer |
| `advance_payments` | 1 | 5 | vendor_id: varchar→integer, employee_id: varchar→integer, purchase_order_id: varchar→integer |
| `stock_reservations` | 3 | 5 | material_card_id: varchar→integer, warehouse_id: varchar→integer, order_id: varchar→integer |
| `material_movements` | 2 | 5 | session_id: varchar→integer, order_id: varchar→integer, kit_id: varchar→integer |
| `material_batches` | 1 | 5 | material_card_id: varchar→integer, warehouse_id: varchar→integer, bin_id: varchar→integer |
| `vendor_invoices` | 2 | 5 | vendor_id: varchar→integer, purchase_order_id: varchar→integer, goods_receipt_id: varchar→integer |
| `mro_requests` | 2 | 5 | item_id: varchar→integer, equipment_id: varchar→integer, requested_by: varchar→integer |
| `goods_receipts` | 3 | 5 | supplier_id: varchar→integer, warehouse_id: varchar→integer, purchase_order_id: varchar→integer |
| `machine_tasks` | 1 | 5 | equipment_id: varchar→integer, papka_order_id: varchar→integer, routing_operation_id: varchar→integer |
| `qc_defects` | 2 | 5 | id: uuid→integer, inspection_id: uuid→integer, defect_code: text→character varying |
| `asset_disposals` | 1 | 4 | id: uuid→integer, asset_id: uuid→integer, disposal_date: timestamp→character varying |
| `calendar_events` | 2 | 4 | target_departments: text→ARRAY, target_positions: text→ARRAY, created_by: varchar→integer |
| `crm_contacts` | 5 | 4 | last_name: text→character varying, phone: text→character varying, email: text→character varying |
| `gl_documents` | 4 | 4 | document_type: text→character varying, posting_date: date→character varying, reference_type: text→character varying |
| `gl_lines` | 2 | 4 | gl_document_id: varchar→integer, account_id: varchar→integer, cost_center_id: varchar→integer |
| `camera_alerts` | 2 | 4 | camera_id: varchar→integer, camera_event_id: varchar→integer, acknowledged_by_id: varchar→integer |
| `mm_deliveries` | 2 | 4 | order_id: varchar→integer, customer_id: varchar→integer, vehicle_id: varchar→integer |
| `three_way_match_results` | 3 | 4 | invoice_id: varchar→integer, purchase_order_id: varchar→integer, goods_receipt_id: varchar→integer |
| `qc_final_inspections` | 2 | 4 | papka_order_id: varchar→integer, inspected_by: varchar→integer, status: text→character varying |
| `sd_orders` | 2 | 4 | quotation_id: varchar→integer, customer_id: varchar→integer, manager_id: varchar→integer |
| `sales_orders` | 38 | 4 | delivery_date: varchar→timestamp with time zone, order_number: text→character varying, customer_name: text→character varying |

### Eng keng tarqalgan type-drift naqshlari

| Drizzle tip | DB tip | Sodir bo'lgan |
|---|---|---:|
| `varchar` | `integer` | 335 |
| `text` | `character varying` | 90 |
| `uuid` | `integer` | 23 |
| `text` | `integer` | 15 |
| `date` | `character varying` | 10 |
| `text` | `ARRAY` | 8 |
| `integer` | `character varying` | 4 |
| `timestamp` | `character varying` | 3 |
| `numericMoney` | `double precision` | 3 |
| `text` | `numeric` | 2 |
| `serial` | `uuid` | 2 |
| `text` | `jsonb` | 2 |
| `varchar` | `time without time zone` | 2 |
| `varchar` | `date` | 2 |
| `date` | `text` | 2 |

### Bartaraf strategiyasi

- **`varchar → integer`** (FK ustunlari): repo to'g'ridan-to'g'ri raw SQL bilan COALESCE/CAST qo'shsin, yoki Drizzle modelni `integer` ga o'zgartirsin
- **`date → character varying`**: ko'pi parametrlangan ISO string saqlash. Drizzle'da `text` ga o'zgartirish xavfsiz
- **`text → numeric`**: pulli ustunlar, real konversiya kerak — `numeric_money` VO orqali
- **`uuid → integer`**: ID column drift — kelajakda PK type unify migration kerak

## 2. Nullable-mismatch — eng kritik 20 ta jadval

Drizzle `notNull()` deydi, DB esa `NULL` ga ruxsat beradi. INSERT vaqtida fail bo'lishi mumkin.

| Jadval | Live fayl | Drift soni | Misol |
|---|---:|---:|---|
| `employees` | 114 | 8 | employee_code, first_name, last_name |
| `employee_liability_cases` | 6 | 8 | case_number, user_id, material_card_id |
| `qc_reclamations` | 5 | 6 | reclamation_number, client_name, claim_date |
| `sales_orders` | 38 | 6 | document_number, pricing_date, order_number |
| `invoices` | 10 | 6 | invoice_number, customer_name, subtotal |
| `qc_inspections` | 8 | 6 | reference_id, reference_type, inspector_id |
| `stock_reservations` | 3 | 5 | material_card_id, warehouse_id, production_order_id |
| `pos_movement_lines` | 16 | 5 | product_id, product_name, stock_item_id |
| `stock_items` | 10 | 5 | sku, name, quantity |
| `attendance` | 10 | 4 | employee_id, attendance_date, user_id |
| `crm_comments` | 1 | 4 | entity_type, entity_id, content |
| `discipline_records` | 9 | 4 | violation_date, issued_date, user_id |
| `pos_material_requests` | 4 | 4 | request_number, department_code, target_warehouse_id |
| `design_orders` | 3 | 4 | order_number, client_name, product_type |
| `production_orders` | 25 | 4 | created_by, product_name, quantity |
| `shift_assignments` | 2 | 4 | employee_id, shift_type_id, assignment_date |
| `forecast_series` | 1 | 4 | material_id, period, forecast_qty |
| `salary_history` | 6 | 3 | employee_id, salary_period_start, salary_period_end |
| `leave_requests` | 3 | 3 | reason, employee_id, days_requested |
| `pip_plans` | 3 | 3 | employee_id, start_date, end_date |

### Bartaraf
- DB ustunini NOT NULL ga aylantirish (data backfill talab qilinadi) **YOKI**
- Drizzle ustun ta'rifidan `.notNull()` olib tashlash

## 3. Missing-in-Drizzle — silent feature gap (10 ta jadval)

DB'da ustun bor, Drizzle modeli bilmaydi. Kod raw SQL ishlatsa, working. ORM orqali — silently miss bo'ladi.

| Jadval | Live fayl | DB-da bor lekin Drizzle-da yo'q | Misol |
|---|---:|---:|---|
| `crm_deals` | 18 | 21 | stage_semantic_id, value, customer_id |
| `daily_financial_metrics` | 1 | 21 | cash_balance, bank_balance, total_liquidity |
| `sd_customers` | 11 | 16 | inn, address, customer_code |
| `vacancies` | 9 | 14 | experience_years_ru, education_level_ru, technical_skills |
| `cc_documents` | 11 | 13 | branch_id, basket_state, basket_owner_user_id |
| `payroll_calculations` | 1 | 13 | work_days, base_pay, gross_pay |
| `crm_companies` | 8 | 12 | inn, phone, email |
| `crm_activities` | 6 | 12 | owner_type_id, owner_id, type_id |
| `adaptation_feedback` | 2 | 12 | scheduled_date, completed_date, conducted_by |
| `kanban_cards` | 10 | 12 | owner_user_id, due_date, parent_card_id |

## To'liq ma'lumot

- Per-column manba: `_audit_out/mismatch_report.json`
- Live usage: `_audit_out/live_usage.json`
- Canon map: `docs/schema-canon-map.md` (Phase 2)
- Dormant: `docs/schema-drift-dormant-catalog.md` (Phase 4)
