# Chuqur Duplikat Tahlili
Generated: 2026-05-21T13:41:34.331Z

## Umumiy statistika

- DB jadvallari: **945**
- DB ustunlari: **12377**
- Drizzle jadval ta'rif dublikatlari: **293**
- Semantik jadval dublikatlari (DB level): **666**
- Endpoint path dublikatlari: **40**
- Semantik endpoint dublikatlari (3+ same noun): **30**
- Sidebar similar URL: **18**
- Multi-route FE sahifalar: **30**

## 1. DB JADVAL — Semantik dublikatlar (TOP 30)

Bir xil biznes-konseptni saqlovchi jadvallar.

| Jadval A | Jadval B | Sabab | Jaccard | A ust | B ust |
|---|---|---|---:|---:|---:|
| `_archive_departments_2026_05_21` | `departments` | column-overlap | 1 | 24 | 24 |
| `_archive_positions_2026_05_21` | `positions` | column-overlap | 1 | 28 | 28 |
| `kanban_files` | `task_files` | name-similar | 1 | 9 | 9 |
| `kanban_result_files` | `task_result_files` | name-similar | 1 | 7 | 7 |
| `kanban_results` | `task_results` | name-similar | 1 | 6 | 6 |
| `kanban_tags` | `task_tags` | name-similar | 1 | 5 | 5 |
| `kanban_time_tracks` | `task_time_tracks` | name-similar | 1 | 10 | 10 |
| `pos_transactions` | `retail_pos_transactions` | column-overlap | 0.89 | 17 | 19 |
| `crm_invoice_products` | `crm_proposal_products` | column-overlap | 0.86 | 13 | 13 |
| `pos_products` | `retail_pos_products` | column-overlap | 0.86 | 12 | 14 |
| `crm_invoice_payments` | `finance_payments` | column-overlap | 0.82 | 10 | 10 |
| `kanban_co_executors` | `task_co_executors` | name-similar | 0.8 | 4 | 5 |
| `kanban_notifications` | `task_notifications` | name-similar | 0.8 | 9 | 9 |
| `kanban_observers` | `task_observers` | name-similar | 0.8 | 4 | 5 |
| `invoices` | `sd_invoices` | name-similar | 0.79 | 18 | 16 |
| `cost_centers` | `profit_centers` | name-similar | 0.77 | 13 | 10 |
| `kanban_templates` | `task_templates` | name-similar | 0.77 | 11 | 12 |
| `ap_aging_buckets` | `ar_aging_buckets` | name-similar | 0.75 | 10 | 11 |
| `kanban_card_tags` | `task_card_tags` | name-similar | 0.75 | 4 | 3 |
| `ai_finance_insights` | `ai_material_insights` | column-overlap | 0.7 | 21 | 18 |
| `ai_report_categories` | `company_functions` | column-overlap | 0.69 | 12 | 10 |
| `batch_lots` | `material_lots_view` | column-overlap | 0.68 | 26 | 26 |
| `badge_catalog` | `skill_catalog` | name-similar | 0.67 | 12 | 8 |
| `customer_contacts` | `sd_contacts` | name-similar | 0.67 | 11 | 9 |
| `employee_daily_reports` | `erp_daily_reports` | name-similar | 0.67 | 5 | 5 |
| `finance_categories` | `strategic_categories` | name-similar | 0.67 | 14 | 11 |
| `kanban_checklists` | `task_checklists` | name-similar | 0.67 | 5 | 5 |
| `skill_catalog` | `violation_catalog` | name-similar | 0.67 | 8 | 12 |
| `campaigns` | `marketing_campaigns` | name-similar | 0.65 | 12 | 16 |
| `ai_report_categories` | `strategic_categories` | column-overlap | 0.64 | 12 | 11 |

## 2. CROSS-TABLE ko'p tarqalgan ustunlar (master data nomzodlari)

Ko'p jadvalda bir xil ustun nomi — yagona master data jadvaliga ajratish kerak.

| Ustun | Jadval soni | Namuna |
|---|---:|---|
| `title` | 106 | `_archive_positions_2026_05_21`, `adaptation_programs`, `agent_alerts`, `ai_alerts`, `ai_finance_insights` |
| `category` | 66 | `abc_thresholds`, `agent_modules_registry`, `ai_insights`, `ai_prompts`, `asset_items` |
| `currency` | 64 | `advance_payments`, `approval_requests`, `bank_accounts`, `billing_documents`, `bonus_payments` |
| `quantity` | 63 | `ai_material_batches`, `barcode_movements`, `batch_lot_movements`, `batch_lots`, `batches` |
| `name_ru` | 62 | `_archive_departments_2026_05_21`, `_archive_positions_2026_05_21`, `achievements`, `agent_modules_registry`, `ai_report_categories` |
| `warehouse_id` | 61 | `ai_material_batches`, `ai_material_insights`, `batch_lots`, `batches`, `current_stock` |
| `type` | 54 | `attendance_logs`, `calendar_events`, `campaigns`, `cc_notifications`, `chat_rooms` |
| `completed_at` | 51 | `adaptation_records`, `ai_exam_attempts`, `ai_interview_sessions`, `ai_interviews`, `ai_report_runs` |
| `unit` | 49 | `ai_material_batches`, `ai_reservation_requests`, `batch_lots`, `batches`, `bom_items` |
| `order_id` | 49 | `ai_reservation_requests`, `customer_complaints`, `defect_reports`, `design_order_revisions`, `designs` |
| `reason` | 49 | `assessment_skips`, `asset_disposals`, `asset_transfers`, `audit_logs`, `batch_lot_movements` |
| `code` | 47 | `_archive_departments_2026_05_21`, `_archive_positions_2026_05_21`, `achievements`, `agent_modules_registry`, `ai_report_categories` |
| `approved_by` | 47 | `advances`, `ai_production_plans`, `approval_requests`, `asset_disposals`, `attendance` |
| `material_id` | 46 | `ai_material_batches`, `ai_material_insights`, `batch_lots`, `billing_items`, `delivery_items` |
| `customer_id` | 44 | `ar_aging_buckets`, `billing_documents`, `credit_check_logs`, `crm_deals`, `crm_invoices` |
| `approved_at` | 41 | `advance_payments`, `ai_production_plans`, `approval_requests`, `approval_workflow_approvals`, `budgets` |
| `priority` | 41 | `ai_finance_insights`, `ai_material_insights`, `ai_reservation_requests`, `ai_tasks`, `ai_tasks_queue` |
| `start_date` | 40 | `accounting_periods`, `adaptation_records`, `assignments`, `budgets`, `business_trips` |
| `amount` | 40 | `advance_payments`, `advances`, `approval_requests`, `bonus_payments`, `budget_lines` |
| `material_card_id` | 36 | `consumption_suggestions`, `current_stock`, `cycle_count_results`, `employee_balances`, `employee_inventory_ledger` |
| `end_date` | 34 | `accounting_periods`, `adaptation_records`, `assignments`, `budgets`, `business_trips` |
| `title_ru` | 34 | `adaptation_programs`, `ai_alerts`, `ai_finance_insights`, `ai_material_insights`, `ai_report_insights` |
| `sort_order` | 33 | `_archive_departments_2026_05_21`, `_archive_positions_2026_05_21`, `agent_modules_registry`, `ai_report_definitions`, `cc_rejection_reasons` |
| `department_id` | 33 | `_archive_positions_2026_05_21`, `adaptation_programs`, `applications`, `approval_matrix_config`, `asset_inventory` |
| `description_ru` | 32 | `_archive_departments_2026_05_21`, `_archive_positions_2026_05_21`, `achievements`, `adaptation_programs`, `ai_finance_insights` |
| `product_id` | 32 | `batch_lots`, `batches`, `bom_headers`, `cost_structure`, `crm_deal_products` |
| `severity` | 31 | `agent_alerts`, `ai_alerts`, `ai_insights`, `ai_report_insights`, `camera_alerts` |
| `due_date` | 30 | `adaptation_milestones`, `ai_tasks`, `chat_message_tasks`, `company_plan_items`, `creditor_debts` |
| `started_at` | 30 | `adaptation_records`, `ai_exam_attempts`, `ai_interview_sessions`, `ai_interview_sessions_ext`, `ai_interviews` |
| `total_amount` | 30 | `budgets`, `crm_invoices`, `crm_proposals`, `employee_inventory_ledger`, `expense_reports` |

## 3. DRIZZLE pgTable dublikatlari (TOP 40)

Bir jadval bir nechta fayl ichida ta'riflangan — qaysi biri canon?

| Jadval | Ta'rif | Fayllar |
|---|---:|---|
| `pos_movements` | 5 | `pos-schema-v2.ts` (32 ust) / `pos-schema.ts` (18 ust) / `schema-ext-a-2.ts` (14 ust) / `schema-ext-b-2.ts` (7 ust) / `schema-pos-ext.ts` (14 ust) |
| `attendance` | 4 | `attendance.ts` (17 ust) / `hr-personal-core.ts` (8 ust) / `schema-business-c-2-hr-payroll.ts` (12 ust) / `schema-hr-lms.ts` (8 ust) |
| `questionnaire_templates` | 4 | `hr-architecture-additions.ts` (8 ust) / `hr-questionnaire.ts` (7 ust) / `recruitment.ts` (8 ust) / `schema-ext-a-1.ts` (5 ust) |
| `questionnaire_questions` | 4 | `hr-architecture-additions.ts` (8 ust) / `hr-questionnaire.ts` (8 ust) / `recruitment.ts` (10 ust) / `schema-business-c-1.ts` (8 ust) |
| `inventory_counts` | 4 | `mm-inventory.ts` (15 ust) / `schema-ext-c-3.ts` (6 ust) / `schema-finance-extended.ts` (7 ust) / `schema-pos-ext.ts` (10 ust) |
| `adaptation_programs` | 3 | `adaptation.ts` (10 ust) / `hr-compensation.ts` (7 ust) / `schema-business-c-2-hr-safety.ts` (6 ust) |
| `adaptation_records` | 3 | `adaptation.ts` (19 ust) / `hr-performance-core.ts` (15 ust) / `schema-business-c-2-hr-safety.ts` (7 ust) |
| `employee_360_assessments` | 3 | `assessment.ts` (16 ust) / `hr-safety.ts` (8 ust) / `schema-business-c-2-hr-payroll.ts` (13 ust) |
| `succession_plans` | 3 | `assessment.ts` (11 ust) / `hr-safety.ts` (8 ust) / `schema-ext-c-2.ts` (7 ust) |
| `attendance_records` | 3 | `attendance.ts` (10 ust) / `hr-safety.ts` (7 ust) / `schema-ext-b-2.ts` (8 ust) |
| `audit_logs` | 3 | `core-ai-reports.ts` (15 ust) / `schema-core.ts` (9 ust) / `schema-rbac.ts` (15 ust) |
| `users` | 3 | `core-users.ts` (44 ust) / `users.ts` (17 ust) / `schema-core.ts` (13 ust) |
| `notifications` | 3 | `core-users.ts` (9 ust) / `schema-business-a-1.ts` (10 ust) / `schema-misc.ts` (9 ust) |
| `discipline_records` | 3 | `discipline.ts` (27 ust) / `hr-personal-core.ts` (6 ust) / `schema-business-a-1.ts` (25 ust) |
| `employee_files` | 3 | `employees.ts` (10 ust) / `hr-compensation.ts` (4 ust) / `schema-ext-c-2.ts` (6 ust) |
| `customer_payments` | 3 | `fi-ap-core.ts` (13 ust) / `schema-compat-5.ts` (18 ust) / `schema-finance-extended.ts` (7 ust) |
| `budget_lines` | 3 | `fi-budgets.ts` (8 ust) / `schema-ext-b-2.ts` (7 ust) / `schema-finance-budgets.ts` (6 ust) |
| `accounting_periods` | 3 | `fi-gl.ts` (5 ust) / `schema-business-b-1.ts` (7 ust) / `schema-finance-extended.ts` (7 ust) |
| `income_expense_transactions` | 3 | `fi-kassa.ts` (12 ust) / `schema-ext-b-1.ts` (8 ust) / `schema-finance-extended.ts` (6 ust) |
| `job_templates` | 3 | `hr-architecture-additions.ts` (14 ust) / `hr-questionnaire.ts` (23 ust) / `recruitment.ts` (11 ust) |
| `ai_cv_screenings` | 3 | `hr-architecture-additions.ts` (15 ust) / `hr-performance-ext.ts` (20 ust) / `recruitment.ts` (14 ust) |
| `salary_history` | 3 | `hr-employees-docs.ts` (8 ust) / `payroll.ts` (31 ust) / `schema-business-c-2-hr-payroll.ts` (10 ust) |
| `leave_requests` | 3 | `hr-employees-docs.ts` (11 ust) / `leave.ts` (23 ust) / `schema-hr-lms.ts` (15 ust) |
| `employee_daily_kpi` | 3 | `hr-performance-ext.ts` (20 ust) / `kpi.ts` (13 ust) / `schema-ext-c-2.ts` (5 ust) |
| `ai_interview_sessions` | 3 | `hr-performance-ext.ts` (14 ust) / `recruitment.ts` (15 ust) / `schema-ext-c-3.ts` (8 ust) |
| `employee_ratings` | 3 | `hr-performance-ext.ts` (25 ust) / `kpi.ts` (14 ust) / `schema-ext-c-2.ts` (6 ust) |
| `employee_skills` | 3 | `hr-performance-ext.ts` (20 ust) / `skills.ts` (12 ust) / `schema-business-c-3.ts` (10 ust) |
| `certificates` | 3 | `hr-questionnaire.ts` (6 ust) / `lms.ts` (10 ust) / `schema-ext-a-1.ts` (3 ust) |
| `shift_swap_requests` | 3 | `hr-safety.ts` (12 ust) / `shifts.ts` (11 ust) / `schema-ext-c-2.ts` (6 ust) |
| `safety_incidents` | 3 | `hr-safety.ts` (10 ust) / `safety.ts` (25 ust) / `schema-business-c-2-hr-safety.ts` (11 ust) |
| `ppe_compliance` | 3 | `hr-safety.ts` (6 ust) / `safety.ts` (10 ust) / `schema-business-c-2-hr-safety.ts` (7 ust) |
| `hazard_zones` | 3 | `hr-safety.ts` (10 ust) / `safety.ts` (12 ust) / `schema-business-c-2-hr-safety.ts` (11 ust) |
| `hr_documents` | 3 | `hr-v2-schema.ts` (12 ust) / `schema-business-a-1.ts` (16 ust) / `schema-ext-a-2.ts` (10 ust) |
| `kanban_boards` | 3 | `kanban-core.ts` (6 ust) / `kanban-schema.ts` (6 ust) / `schema-kanban.ts` (7 ust) |
| `kanban_columns` | 3 | `kanban-core.ts` (8 ust) / `kanban-schema.ts` (8 ust) / `schema-kanban.ts` (8 ust) |
| `kanban_cards` | 3 | `kanban-core.ts` (15 ust) / `kanban-schema.ts` (15 ust) / `schema-kanban.ts` (12 ust) |
| `courses` | 3 | `lms-schema.ts` (10 ust) / `lms.ts` (18 ust) / `schema-ext-a-1.ts` (3 ust) |
| `lessons` | 3 | `lms-schema.ts` (8 ust) / `lms.ts` (13 ust) / `schema-ext-a-1.ts` (4 ust) |
| `stock_reservations` | 3 | `mm-batch-mgmt.ts` (21 ust) / `pos-schema-v2.ts` (15 ust) / `schema-ext-c-3.ts` (8 ust) |
| `pos_movement_lines` | 3 | `pos-schema-v2.ts` (16 ust) / `pos-schema.ts` (14 ust) / `schema-pos-ext.ts` (11 ust) |

## 4. ENDPOINT path dublikatlari (TOP 30)

Bir xil URL — turli controller faylda ta'riflangan. To'qnashuv xavfi.

| Path | Joylar | Fayllar |
|---|---:|---|
| `/camera-alerts` | 9 | camera-alerts.controller.ts, camera-alerts.controller.ts, camera-alerts.controller.ts, camera-alerts.controller.ts, camera-alerts.controller.ts, camera-alerts.controller.ts, camera-alerts.controller.ts, camera-alerts.controller.ts, camera-alerts.controller.ts |
| `/micro-modules` | 6 | lms-misc.controller.ts, lms-misc.controller.ts, lms-misc.controller.ts, lms-misc.controller.ts, lms-misc.controller.ts, lms-misc.controller.ts |
| `/warehouses` | 4 | resources.controller.ts, resources.controller.ts, resources.controller.ts, resources.controller.ts |
| `/employee-kpi` | 3 | employee-kpi-compat.controller.ts, employee-kpi-compat.controller.ts, employee-kpi-compat.controller.ts |
| `/warehouses/:id` | 2 | resources.controller.ts, resources.controller.ts |
| `/hr-v2/daily-reports/employee/:id` | 2 | daily-report.controller.ts, daily-report.controller.ts |
| `/hr/offboarding/cases` | 2 | hr-offboarding.controller.ts, hr-dashboard-stubs.controller.ts |
| `/hr/onboarding-checklists` | 2 | onboarding-checklists.controller.ts, hr-dashboard-stubs.controller.ts |
| `/hr/adaptation/:id` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/alumni/:id` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/daily-reports` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/daily-reports/department` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/daily-reports/my` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/offboarding/questions` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/fp-cycle` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/hrc-tests/employee` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/hrc-tests/public` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/hrc-tests/stats` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/360/reviewable` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/birthdays/settings` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/birthdays/settings/:id` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/ai-interview/session` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/ai-interview/session/:id/review` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/documents/employee` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/documents/my` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/documents/pending` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/employee-corp` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/employees/operator-stats` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/enps/surveys/results` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |
| `/hr/abc-analysis/:id/calculate` | 2 | hr-dashboard-stubs.controller.ts, hr-dashboard.controller.ts |

## 5. ENDPOINT semantik dublikat (3+ same noun)

Bir xil ob'ekt nomi turli URL prefix'larda — yagona endpoint kerak.

| Noun | URL soni | URL'lar (top 5) |
|---|---:|---|
| `stats` | 49 | `/ai-agents/audit/stats`, `/hr-map/stats`, `/telegram/admin/stats`, `/warehouse/batches/stats`, `/analytics/stats` |
| `dashboard` | 25 | `/ai-hr/dashboard`, `/ai-planning/dashboard`, `/ai-reservation/dashboard`, `/insights/dashboard`, `/approval-workflow/dashboard` |
| `summary` | 18 | `/cc/baskets/summary`, `/asset-management/assets/summary`, `/design/dashboard/summary`, `/director/summary`, `/finance-extended/income-expense/summary` |
| `history` | 14 | `/approval-workflow/history`, `/warehouse/label/history`, `/crm/history`, `/director/approvals/history`, `/director/company-state/history` |
| `orders` | 14 | `/design/orders`, `/erp/orders`, `/erp/orders/:id`, `/iot/tablet/orders`, `/mes/orders` |
| `employees` | 13 | `/chat/employees`, `/employees`, `/employees/:id`, `/hr-map/employees`, `/analytics/leaderboard/employees` |
| `movements` | 12 | `/pos/wh/movements`, `/warehouse/movements`, `/pos/movements`, `/pos/movements/:id`, `/pos/inventory/movements` |
| `alerts` | 11 | `/admin/system/alerts/:id`, `/agents/alerts`, `/pos/wh/alerts`, `/director/alerts`, `/hr/inspection/alerts` |
| `employee` | 11 | `/hr-v2/career-path/employee/:id`, `/hr-v2/daily-reports/employee/:id`, `/hr-v2/daily-reports/employee`, `/assets/employee`, `/assets/employee/:idId` |
| `warehouses` | 10 | `/warehouses`, `/warehouses/:id`, `/pos/mini-app/warehouses`, `/pos/wms/warehouses`, `/pos/wh-features/user/:idId/warehouses` |
| `sessions` | 9 | `/cc/ai/sessions/:id`, `/analytics/engagement/sessions`, `/hr-v2/ai-interview/sessions`, `/hr-v2/ai-interview/sessions/:id`, `/hr/hrc-tests/sessions` |
| `today` | 8 | `/chat/birthdays/today`, `/crm/activities/today`, `/crm/followup-activities/today`, `/finance-extended/daily-metrics/today`, `/hr/attendance/late-arrivals/today` |
| `pending` | 8 | `/cc/baskets/pending`, `/approval-workflow/pending`, `/hr-v2/workflow/pending`, `/director/approvals/pending`, `/finance/advances/pending` |
| `invoices` | 8 | `/crm/invoices`, `/crm-bitrix/invoices`, `/finance/invoices`, `/finance/invoices/:idId`, `/legacy/fi/invoices` |
| `stock` | 8 | `/pos/wh/stock`, `/pos/wms/warehouse/:idId/stock`, `/pos/reports/stock`, `/pos/stock`, `/pos/stock/:idId/:idId` |
| `leads` | 8 | `/crm/ai/leads`, `/crm/leads`, `/crm/leads/:id`, `/marketing/exhibitions/:id/leads`, `/marketing/leads` |
| `materials` | 7 | `/warehouse/materials`, `/accounting/materials`, `/mm/materials`, `/mm/materials/:id`, `/pos/mini-app/materials` |
| `funnel` | 7 | `/crm/funnel`, `/analytics/funnel`, `/hr/recruitment/references-check/funnel/:idId`, `/hr/recruitment/funnel`, `/hr/recruitment/funnel/:id` |
| `inventory-counts` | 7 | `/finance-extended/inventory-counts`, `/pos/inventory-counts`, `/pos-v2/inventory-counts`, `/pos-v2/inventory-counts/:id`, `/wms/inventory-counts` |
| `status` | 6 | `/admin/queues/status`, `/ai/automation/status`, `/gpt/status`, `/cc/pin/status`, `/hr-v2/telegram-bots/status` |
| `overdue` | 6 | `/agents/finance/overdue`, `/ap/overdue`, `/ar/overdue`, `/kanban/cards/overdue`, `/kanban/reports/overdue` |
| `tasks` | 6 | `/ai-hr/tasks/:id`, `/crm/tasks`, `/strategic/tasks`, `/strategic/tasks/:id`, `/mes/tasks` |
| `requests` | 6 | `/ai-reservation/requests`, `/approval-workflow/:id/:idId/requests`, `/integration/requests`, `/integration/mro/requests`, `/pos/requests` |
| `documents` | 6 | `/cc/documents/:id`, `/hr-v2/workflow/employee/:idId/documents`, `/hr/documents`, `/hr/employees/:idId/documents`, `/hr/employees/:idId/documents/:idId` |
| `assets` | 6 | `/asset-management/assets`, `/asset-management/assets/:id`, `/employees/:id/assets`, `/assets`, `/assets/:id` |
| `contacts` | 6 | `/crm/companies/:idId/contacts/:idId`, `/crm/companies/:id/contacts`, `/crm/contacts`, `/crm/contacts/:id`, `/marketing/leads/:id/contacts` |
| `courses` | 6 | `/analytics/leaderboard/courses`, `/hr/courses`, `/courses`, `/courses/:id`, `/lms/courses` |
| `equipment` | 6 | `/integration/equipment`, `/integration/mro/equipment`, `/iot/tablet/equipment`, `/mro/equipment`, `/equipment` |
| `items` | 6 | `/integration/items`, `/integration/mro/items`, `/kanban/checklists/:id/items`, `/iot-enhanced/material-kits/:id/items`, `/iot/material-kits/:id/items` |
| `cards` | 6 | `/kanban/boards/:idId/cards`, `/kanban/cards`, `/materials/cards`, `/materials/cards/:id`, `/technology/cards` |

## 6. SIDEBAR similar URL (oxirgi keyword bo'yicha)

| Keyword | URL soni | URL'lar |
|---|---:|---|
| `dashboard` | 10 | `sd/dashboard`, `marketing/dashboard`, `design/dashboard`, `qc/dashboard`, `pp/dashboard`, `mm/dashboard`, `cfo/dashboard`, `ai-hr/dashboard`, `mro/dashboard`, `iot/dashboard` |
| `sales` | 2 | `sales`, `erp/sales` |
| `settings` | 4 | `sd/settings`, `marketing/settings`, `qc/settings`, `settings` |
| `analytics` | 2 | `marketing/analytics`, `analytics` |
| `orders` | 2 | `design/orders`, `production/orders` |
| `approval` | 4 | `design/approval`, `qc/approval`, `tech/approval`, `finance/approval` |
| `dashboard-home` | 2 | `qc/dashboard-home`, `mes/dashboard-home` |
| `tests` | 3 | `qc/tests`, `hr-capital/tests`, `tests` |
| `certificates` | 2 | `qc/certificates`, `certificates` |
| `reports` | 4 | `qc/reports`, `warehouse/reports`, `wms/reports`, `finance/reports` |
| `materials` | 2 | `inventory/materials`, `accounting/materials` |
| `integrations` | 2 | `warehouse/integrations`, `integrations` |
| `assets` | 2 | `assets`, `hr/assets` |
| `onboarding` | 2 | `hr/onboarding`, `saas/onboarding` |
| `courses` | 2 | `courses`, `hr-capital/courses` |
| `monitoring` | 2 | `camera/monitoring`, `saas/monitoring` |
| `strategic` | 2 | `europrint/strategic`, `agents/strategic` |
| `coordination` | 2 | `coordination?tab=baskets`, `coordination?tab=councils` |

## 7. FE PAGE multi-route (1 sahifa, ko'p URL)

| Sahifa | URL soni | URL'lar |
|---|---:|---|
| `TechPPExtended` | 12 | `/tech/material-alternatives`, `/tech/machine-selection`, `/tech/time-cost`, `/tech/cost-optimization`, `/tech/client-requirements`, `/tech/change-history`, `/tech/parallel-orders`, `/pp/parallel-processes`, `/pp/what-if`, `/pp/delivery-calculator`, `/pp/energy-optimization`, `/pp/realtime-progress` |
| `DesignExtended` | 8 | `/design/ai-review`, `/design/3d-mockup`, `/design/brand-guidelines`, `/design/comparison`, `/design/templates`, `/design/tools`, `/design/costing`, `/design/library` |
| `StubPage` | 8 | `/auth`, `/export`, `/gpt`, `/micro-modules`, `/modules`, `/pos/printer-config`, `/sap`, `/v2/pos/printer-config` |
| `LogisticsDashboard` | 7 | `/logistics`, `/logistics/transport`, `/logistics/route-planning`, `/logistics/gps`, `/logistics/fuel`, `/logistics/drivers`, `/logistics/vehicle-schedule` |
| `DirectorExtended` | 6 | `/director/ai-summary`, `/director/problem-points`, `/director/production`, `/director/hr-stats`, `/director/finance`, `/director/kpis` |
| `FinanceExtended` | 6 | `/fi/cost-centers`, `/fi/transfer-pricing`, `/fi/tax-management`, `/fi/tax-calendar`, `/fi/audit-log`, `/fi/risk-ai` |
| `LMSExtended` | 6 | `/lms/course-author`, `/lms/operator-certification`, `/lms/learning-budget`, `/lms/leaderboard`, `/lms/micro-learning`, `/lms/gamification` |
| `SaaSExtended` | 6 | `/saas/tenant-management`, `/saas/onboarding`, `/saas/licensing`, `/saas/module-control`, `/saas/monitoring`, `/saas/error-log` |
| `SecurityExtended` | 6 | `/security/zone-access`, `/security/ppe`, `/security/hazmat`, `/security/evacuation`, `/security/visitors`, `/security/rating` |
| `IoTExtended` | 5 | `/iot/sensor-monitoring`, `/iot/predictive-maintenance`, `/iot/digital-twin`, `/iot/alerts`, `/iot-enhanced` |
| `MarketingExtended` | 5 | `/marketing/analytics`, `/marketing/seo`, `/marketing/ab-testing`, `/marketing/competitors`, `/marketing/nps-churn` |
| `MESExtended` | 5 | `/mes/oee-monitor`, `/mes/zone-management`, `/mes/maintenance-request`, `/mes/machine-norms`, `/mes/smena-handover` |
| `QCExtended` | 5 | `/qc/lab`, `/qc/iso`, `/qc/ai-analysis`, `/qc/reports`, `/qc/settings` |
| `SDSalesManagement` | 5 | `/sd/sales-management`, `/sd/invoices`, `/sd/forecast`, `/sd/analytics`, `/sd/commission` |
| `WMSExtended` | 5 | `/wms/production-balance`, `/wms/transfer`, `/wms/lot-traceability`, `/wms/internal-requests`, `/wms/kpi` |
| `agents/AgentsHub` | 3 | `/agents`, `/agents/:id`, `/ai` |
| `AiCrmPage` | 3 | `/ai/crm`, `/ai-crm`, `/ai/marketing` |
| `LessonPlayer` | 3 | `/courses/:id/lessons`, `/courses/:id/lessons/:lessonId`, `/video-progress` |
| `MMExtended` | 3 | `/mm/check-bot`, `/mm/creditor-debts`, `/mm/supplier-portal` |
| `MROExtended` | 3 | `/mro/expense-control`, `/mro/uniforms`, `/mro/sanitation` |
| `SDExtended` | 3 | `/sd/manager-panel`, `/sd/warehouse-rental`, `/sd/advance-control` |
| `AIProductionPlanning` | 2 | `/ai-production-planning`, `/ai-planning` |
| `Analytics` | 2 | `/analytics`, `/insights` |
| `AttendanceMonitorPage` | 2 | `/attendance-monitor`, `/daily-attendance` |
| `BarcodeWarehouse` | 2 | `/warehouse/barcode-ops`, `/barcode-warehouse` |
| `CameraAIAnalytics` | 2 | `/europrint/camera-ai-analytics`, `/ai-camera` |
| `Courses` | 2 | `/courses`, `/lessons` |
| `Customer360Page` | 2 | `/crm/customer/:id`, `/360` |
| `EmployeeProfile` | 2 | `/erp/employee/:id`, `/employees/:id` |
| `GLDocuments` | 2 | `/accounting/gl-documents`, `/gl` |
