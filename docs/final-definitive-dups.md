# DEFINITIVE DUPLIKATLAR — 2026-05-21 yakuniy holat
DB jadval: 924, ustun: 12174

## 1. DB JADVAL DUPLIKATLARI

Topildi: **37** ta haqiqiy juftlik (Jaccard ≥ 0.6, har biri ≥ 8 ustun).

### CANON tavsiyasi:

| # | Jadval A | Jadval B | Jaccard | CANON | DELETE |
|---|---|---|---:|---|---|
| 1 | `pos_transactions` (17) | `retail_pos_transactions` (19) | 0.89 | `pos_transactions` | `retail_pos_transactions` |
| 2 | `pos_products` (12) | `retail_pos_products` (14) | 0.86 | `pos_products` | `retail_pos_products` |
| 3 | `crm_invoice_stages` (9) | `crm_lead_stages` (11) | 0.82 | `crm_invoice_stages` | `crm_lead_stages` |
| 4 | `cost_centers` (13) | `profit_centers` (10) | 0.77 | `cost_centers` | `profit_centers` |
| 5 | `ap_aging_buckets` (10) | `ar_aging_buckets` (11) | 0.75 | `ap_aging_buckets` | `ar_aging_buckets` |
| 6 | `kanban_time_tracks` (10) | `task_time_entries` (9) | 0.73 | `kanban_time_tracks` | `task_time_entries` |
| 7 | `ai_finance_insights` (21) | `ai_material_insights` (18) | 0.7 | `ai_finance_insights` | `ai_material_insights` |
| 8 | `downtime_reason_codes` (9) | `skill_catalog` (8) | 0.7 | `downtime_reason_codes` | `skill_catalog` |
| 9 | `skill_catalog` (8) | `unit_of_measures` (9) | 0.7 | `skill_catalog` | `unit_of_measures` |
| 10 | `wms_internal_requests` (8) | `wms_transfers` (9) | 0.7 | `wms_internal_requests` | `wms_transfers` |
| 11 | `ai_report_categories` (12) | `company_functions` (10) | 0.69 | `ai_report_categories` | `company_functions` |
| 12 | `batch_lots` (26) | `material_lots_view` (26) | 0.68 | `batch_lots` | `material_lots_view` |
| 13 | `badge_catalog` (12) | `skill_catalog` (8) | 0.67 | `badge_catalog` | `skill_catalog` |
| 14 | `customer_contacts` (11) | `sd_contacts` (9) | 0.67 | `sd_contacts` | `customer_contacts` |
| 15 | `downtime_reason_codes` (9) | `strategic_categories` (11) | 0.67 | `downtime_reason_codes` | `strategic_categories` |
| 16 | `finance_categories` (14) | `strategic_categories` (11) | 0.67 | `finance_categories` | `strategic_categories` |
| 17 | `fine_rules` (12) | `skill_catalog` (8) | 0.67 | `fine_rules` | `skill_catalog` |
| 18 | `skill_catalog` (8) | `violation_catalog` (12) | 0.67 | `skill_catalog` | `violation_catalog` |
| 19 | `campaigns` (12) | `marketing_campaigns` (16) | 0.65 | `campaigns` | `marketing_campaigns` |
| 20 | `ai_report_categories` (12) | `strategic_categories` (11) | 0.64 | `ai_report_categories` | `strategic_categories` |
| 21 | `camera_quality_defects` (9) | `camera_safety_violations` (9) | 0.64 | `camera_quality_defects` | `camera_safety_violations` |
| 22 | `campaigns` (12) | `enps_surveys` (11) | 0.64 | `campaigns` | `enps_surveys` |
| 23 | `downtime_reason_codes` (9) | `unit_of_measures` (9) | 0.64 | `downtime_reason_codes` | `unit_of_measures` |
| 24 | `products` (10) | `skill_catalog` (8) | 0.64 | `products` | `skill_catalog` |
| 25 | `profit_centers` (10) | `skill_catalog` (8) | 0.64 | `profit_centers` | `skill_catalog` |
| 26 | `asset_inventory` (22) | `asset_items` (22) | 0.63 | `asset_inventory` | `asset_items` |
| 27 | `customer_interactions` (15) | `sd_customer_interactions` (16) | 0.63 | `sd_customer_interactions` | `customer_interactions` |
| 28 | `company_functions` (10) | `strategic_categories` (11) | 0.62 | `company_functions` | `strategic_categories` |
| 29 | `customer_payments` (18) | `invoice_payments` (16) | 0.62 | `customer_payments` | `invoice_payments` |
| 30 | `customer_contacts` (11) | `sd_customer_contacts` (18) | 0.61 | `sd_customer_contacts` | `customer_contacts` |
| 31 | `sales_invoices` (21) | `sd_invoices` (16) | 0.61 | `sd_invoices` | `sales_invoices` |
| 32 | `bom_headers` (15) | `routings` (17) | 0.6 | `bom_headers` | `routings` |
| 33 | `fine_rules` (12) | `violation_catalog` (12) | 0.6 | `fine_rules` | `violation_catalog` |
| 34 | `process_chains` (8) | `skill_catalog` (8) | 0.6 | `process_chains` | `skill_catalog` |
| 35 | `process_chains` (8) | `skill_categories` (8) | 0.6 | `process_chains` | `skill_categories` |
| 36 | `rpt_debitorlar` (12) | `rpt_kreditorlar` (12) | 0.6 | `rpt_debitorlar` | `rpt_kreditorlar` |
| 37 | `skill_catalog` (8) | `skill_categories` (8) | 0.6 | `skill_catalog` | `skill_categories` |

## 2. USTUN MASTER DATA NOMZODLARI

Bu ustunlar 30+ jadvalda ishlatiladi. Yagona master jadval kerak yoki standart FK kerak.

| Ustun | Jadval soni | Tavsiya |
|---|---:|---|
| `title` | 101 | POLYMORPHIC — har jadvalda o'z mazmunida (e.g. lavozim nomi, hujjat nomi). KEEP |
| `category` | 66 | CANDIDATE — yagona `master_categories(id, name, scope)` jadvali yarat |
| `currency` | 62 | CANDIDATE — yagona `currencies(code, name, symbol)` jadvali yarat (UZS/USD/EUR/RUB) |
| `quantity` | 62 | POLYMORPHIC — har joyda o'z birligi. KEEP |
| `warehouse_id` | 61 | FK to `warehouses` — TO'G'RI (FK constraint qo'sh) |
| `type` | 53 | POLYMORPHIC — enum, har jadvalda o'z values. KEEP |
| `completed_at` | 51 | TIMESTAMP — KEEP (state machine) |
| `unit` | 49 | CANDIDATE — yagona `units(code, name)` jadvali (kg/m/qty) |
| `reason` | 49 | TEXT free-form. KEEP |
| `order_id` | 48 | AMBIGUOUS FK — sd_orders.id yoki design_orders.id? Konsolidatsiya kerak |
| `approved_by` | 47 | FK to users — TO'G'RI |
| `material_id` | 46 | FK to material_cards — TO'G'RI canon |
| `code` | 45 | POLYMORPHIC. KEEP |
| `customer_id` | 42 | FK to sd_customers — TO'G'RI |
| `approved_at` | 41 | TIMESTAMP — KEEP |
| `start_date` | 40 | DATE. KEEP |
| `priority` | 40 | enum/integer. KEEP |
| `amount` | 37 | numeric. KEEP |
| `material_card_id` | 36 | ⚠ RENAME → `material_id` (36 jadval, `material_id` 46 jadval canon) |
| `end_date` | 34 | DATE. KEEP |
| `title_ru` | 34 | POLYMORPHIC. KEEP |
| `department_id` | 32 | FK to org_departments — TO'G'RI |
| `severity` | 31 | enum. KEEP |
| `product_id` | 31 | AMBIGUOUS — sd_products yoki crm_products? Konsolidatsiya kerak |

## 3. USTUN NOMI + TIPI BIR XIL — TO'LIQ DUPLIKAT

Bu ustunlar bir nechta jadvalda, bir xil tip — yagona master'da yashashi kerak.

| Ustun | Tip | Jadval soni |
|---|---|---:|
| `warehouse_id` | integer | 56 |
| `material_id` | integer | 42 |
| `order_id` | integer | 41 |
| `customer_id` | integer | 40 |
| `material_card_id` | integer | 36 |
| `department_id` | integer | 32 |
| `position_id` | integer | 26 |
| `org_function_id` | integer | 26 |
| `product_id` | integer | 26 |
| `work_center_id` | integer | 25 |
| `org_department_id` | integer | 22 |
| `manager_id` | integer | 19 |
| `session_id` | integer | 18 |
| `equipment_id` | integer | 17 |
| `vendor_id` | integer | 16 |
| `candidate_id` | integer | 16 |
| `papka_order_id` | integer | 16 |
| `vacancy_id` | integer | 15 |
| `course_id` | integer | 15 |
| `production_order_id` | integer | 15 |
| `operator_id` | integer | 15 |
| `created_by_id` | integer | 14 |
| `document_id` | integer | 13 |
| `camera_id` | integer | 13 |
| `sales_order_id` | integer | 12 |
| `telegram_chat_id` | integer | 12 |
| `entity_id` | integer | 11 |
| `movement_id` | integer | 11 |
| `category_id` | integer | 10 |
| `machine_id` | integer | 10 |

## 4. DRIZZLE pgTable DUPLIKATLAR (BE schema)

Jami: **293** ta jadval bir nechta faylda ta'riflangan.

Eslatma: `lib/db/src/schema/*` — CANON. `apps/api/src/shared/db/*` — `stub(pgTable())` arxitektura by design.

### TOP 25 dup
| Jadval | Soni | Eng katta canon (ustun) | Boshqa fayllar |
|---|---:|---|---|
| `pos_movements` | 5 | `schema/pos-schema-v2.ts` (32 ust) | `schema/pos-schema.ts` (18)<br>`db/schema-ext-a-2.ts` (14)<br>`db/schema-pos-ext.ts` (14)<br>`db/schema-ext-b-2.ts` (7) |
| `attendance` | 4 | `schema/attendance.ts` (17 ust) | `db/schema-business-c-2-hr-payroll.ts` (12)<br>`schema/hr-personal-core.ts` (8)<br>`db/schema-hr-lms.ts` (8) |
| `questionnaire_templates` | 4 | `schema/hr-architecture-additions.ts` (8 ust) | `schema/recruitment.ts` (8)<br>`schema/hr-questionnaire.ts` (7)<br>`db/schema-ext-a-1.ts` (5) |
| `questionnaire_questions` | 4 | `schema/recruitment.ts` (10 ust) | `schema/hr-architecture-additions.ts` (8)<br>`schema/hr-questionnaire.ts` (8)<br>`db/schema-business-c-1.ts` (8) |
| `inventory_counts` | 4 | `schema/mm-inventory.ts` (15 ust) | `db/schema-pos-ext.ts` (10)<br>`db/schema-finance-extended.ts` (7)<br>`db/schema-ext-c-3.ts` (6) |
| `adaptation_programs` | 3 | `schema/adaptation.ts` (10 ust) | `schema/hr-compensation.ts` (7)<br>`db/schema-business-c-2-hr-safety.ts` (6) |
| `adaptation_records` | 3 | `schema/adaptation.ts` (19 ust) | `schema/hr-performance-core.ts` (15)<br>`db/schema-business-c-2-hr-safety.ts` (7) |
| `employee_360_assessments` | 3 | `schema/assessment.ts` (16 ust) | `db/schema-business-c-2-hr-payroll.ts` (13)<br>`schema/hr-safety.ts` (8) |
| `succession_plans` | 3 | `schema/assessment.ts` (11 ust) | `schema/hr-safety.ts` (8)<br>`db/schema-ext-c-2.ts` (7) |
| `attendance_records` | 3 | `schema/attendance.ts` (10 ust) | `db/schema-ext-b-2.ts` (8)<br>`schema/hr-safety.ts` (7) |
| `audit_logs` | 3 | `core/core-ai-reports.ts` (15 ust) | `db/schema-rbac.ts` (15)<br>`db/schema-core.ts` (9) |
| `users` | 3 | `core/core-users.ts` (44 ust) | `schema/users.ts` (17)<br>`db/schema-core.ts` (13) |
| `notifications` | 3 | `db/schema-business-a-1.ts` (10 ust) | `core/core-users.ts` (9)<br>`db/schema-misc.ts` (9) |
| `discipline_records` | 3 | `schema/discipline.ts` (27 ust) | `db/schema-business-a-1.ts` (25)<br>`schema/hr-personal-core.ts` (6) |
| `employee_files` | 3 | `schema/employees.ts` (10 ust) | `db/schema-ext-c-2.ts` (6)<br>`schema/hr-compensation.ts` (4) |
| `customer_payments` | 3 | `db/schema-compat-5.ts` (18 ust) | `schema/fi-ap-core.ts` (13)<br>`db/schema-finance-extended.ts` (7) |
| `budget_lines` | 3 | `schema/fi-budgets.ts` (8 ust) | `db/schema-ext-b-2.ts` (7)<br>`db/schema-finance-budgets.ts` (6) |
| `accounting_periods` | 3 | `db/schema-business-b-1.ts` (7 ust) | `db/schema-finance-extended.ts` (7)<br>`schema/fi-gl.ts` (5) |
| `income_expense_transactions` | 3 | `schema/fi-kassa.ts` (12 ust) | `db/schema-ext-b-1.ts` (8)<br>`db/schema-finance-extended.ts` (6) |
| `job_templates` | 3 | `schema/hr-questionnaire.ts` (23 ust) | `schema/hr-architecture-additions.ts` (14)<br>`schema/recruitment.ts` (11) |
| `ai_cv_screenings` | 3 | `schema/hr-performance-ext.ts` (20 ust) | `schema/hr-architecture-additions.ts` (15)<br>`schema/recruitment.ts` (14) |
| `salary_history` | 3 | `schema/payroll.ts` (31 ust) | `db/schema-business-c-2-hr-payroll.ts` (10)<br>`schema/hr-employees-docs.ts` (8) |
| `leave_requests` | 3 | `schema/leave.ts` (23 ust) | `db/schema-hr-lms.ts` (15)<br>`schema/hr-employees-docs.ts` (11) |
| `employee_daily_kpi` | 3 | `schema/hr-performance-ext.ts` (20 ust) | `schema/kpi.ts` (13)<br>`db/schema-ext-c-2.ts` (5) |
| `ai_interview_sessions` | 3 | `schema/recruitment.ts` (15 ust) | `schema/hr-performance-ext.ts` (14)<br>`db/schema-ext-c-3.ts` (8) |

## 5. YAKUNIY HISOB

| Daraja | Topildi | Bajarish |
|---|---:|---|
| DB jadval semantik dup | 37 | Manual review, har juftlik uchun canon tanlash |
| Master data nomzod ustunlar | 24 | Yangi master jadval yarat (category, currency, unit) |
| _id ustun dup (5+ jadval) | 30 | FK constraint qo'sh + standartlash |
| Drizzle pgTable dup | 293 | Arxitektura — `lib/db` canon, `shared/db` stub |
