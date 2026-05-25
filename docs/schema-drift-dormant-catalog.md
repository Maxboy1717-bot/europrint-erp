# Schema Drift — Dormant Catalog
Generated: 2026-05-21T07:00:09.941Z

Bu jadval va ustunlar live kod tomonidan **`db.select/insert/update/delete` qilinmaydi**.
Schema'da drift bor, lekin 503 manbai EMAS. Faqat hujjatlash uchun — tegmaslik kerak.

## Drizzle-only (kod ta'rifi bor, DB'da yo'q, live emas)

Total: 76

- `ai_bottleneck_analysis` — schema/ai-analytics-schema.ts
- `ai_demand_forecast` — schema/ai-analytics-schema.ts
- `ai_rush_orders` — schema/ai-analytics-schema.ts
- `ai_shift_recommendations` — schema/ai-analytics-schema.ts
- `aisha_conversations` — db/schema-aisha.ts
- `aisha_pending_approvals` — db/schema-aisha.ts
- `aisha_tool_calls` — db/schema-aisha.ts
- `aisha_voice_audit` — db/schema-aisha.ts
- `asset_insurance` — pp/pp-enhanced.ts
- `asset_maintenance_records` — pp/pp-enhanced.ts
- `chat_user_presence` — db/schema-chat.ts
- `control_chart_point` — db/schema-qc-spc.ts
- `course_modules` — schema/lms.ts
- `crm_contact_companies` — schema/crm-contacts.ts
- `customer_order_items` — schema/ecommerce-schema.ts
- `deals` — db/schema-core.ts
- `employee_separation` — db/schema-hr-overtime.ts
- `employee_write_off_act_lines` — schema/pos-schema-v2.ts
- `employee_write_off_acts` — schema/pos-schema-v2.ts
- `enps_survey_responses` — db/schema-business-a-1.ts
- `face_encodings` — schema/attendance.ts
- `finance_invoice_lines` — db/schema-ext-b-3.ts
- `finance_invoices` — db/schema-ext-b-3.ts
- `fp_cycles` — db/schema-ext-b-3.ts
- `hr_motivation_plans` — schema/hr-recruiter.ts
- `hr_vacancy_profiles` — schema/hr-recruiter.ts
- `hr_weekly_statistics` — schema/hr-recruiter.ts
- `leads` — db/schema-core.ts
- `lms_achievements` — db/schema-ext-c-1.ts
- `lms_assignments` — db/schema-ext-c-1.ts
- `lms_knowledge` — db/schema-ext-c-1.ts
- `lms_questions` — db/schema-business-c-1.ts
- `lms_tests_ext` — db/schema-ext-c-1.ts
- `lms_user_achievements` — db/schema-ext-c-1.ts
- `mes_shift_stats` — db/schema-ext-b-2.ts
- `mro_work_orders` — db/schema-business-a-2-mro.ts
- `orders_registry` — schema/orders-registry-schema.ts
- `ow_contracts` — schema/order-workflow-schema.ts
- `ow_credit_limits` — schema/order-workflow-schema.ts
- `ow_deliveries` — schema/order-workflow-schema.ts
- `ow_document_workflow_instances` — schema/order-workflow-schema.ts
- `ow_fg_transfers` — schema/order-workflow-schema.ts
- `ow_order_lines` — schema/order-workflow-schema.ts
- `ow_order_samples` — schema/order-workflow-schema.ts
- `ow_order_surveys` — schema/order-workflow-schema.ts
- `ow_packaging_records` — schema/order-workflow-schema.ts
- `ow_pallet_recoveries` — schema/order-workflow-schema.ts
- `ow_production_plans` — schema/order-workflow-schema.ts
- `ow_qc_results` — schema/order-workflow-schema.ts
- `ow_rework_events` — schema/order-workflow-schema.ts
- `ow_shipping_requests` — schema/order-workflow-schema.ts
- `ow_tech_cards` — schema/order-workflow-schema.ts
- `ow_work_orders` — schema/order-workflow-schema.ts
- `payroll_deductions` — db/schema-business-b-1.ts
- `pip_progress` — db/schema-ext-c-1.ts
- `pos_categories` — db/schema-ext-b-2.ts
- `pos_order_items` — db/schema-ext-b-2.ts
- `pos_orders` — db/schema-ext-b-2.ts
- `pos_printer_config` — schema/pos-schema-v2.ts, db/schema-business-b-1.ts
- `pos_printer_configs` — db/schema-ext-b-2.ts
- `pos_serial_number_items` — schema/pos-schema-v2.ts
- `pos_telegram_routes` — schema/pos-schema.ts
- `pos_warehouse_access` — schema/pos-schema.ts, db/schema-pos-ext.ts
- `product_favorites` — schema/ecommerce-schema.ts
- `production_material_allocs` — schema/pos-schema-v2.ts
- `public_categories` — schema/ecommerce-schema.ts
- `raci_matrix` — db/schema-ext-b-2.ts
- `role_movement_permissions` — schema/pos-schema.ts
- `skill_requirements` — schema/skills.ts
- `test_attempts` — schema/lms.ts
- `test_questions` — schema/lms.ts
- `transfer_request_lines` — db/schema-pos-ext.ts
- `transfer_requests` — db/schema-pos-ext.ts
- `user_panels` — db/schema-hr-lms.ts
- `website_chat_logs` — schema/ecommerce-schema.ts
- `website_reviews` — schema/ecommerce-schema.ts

## DB-only (DB'da jadval bor, Drizzle'da ta'rif yo'q, live emas)

Total: 40

- `RUBRIKA VA VAZNLAR: {rubrika_json}`
- `TOPSHIRIQ: {savol_matni}`
- `XODIM JAVOBI: {xodim_javobi}'::text`
- `YO''RIQNOMA: {yo''riqnoma_matni}`
- `agent_cron_state`
- `cron_status`
- `employee_balances`
- `employee_referrals`
- `finance_payments`
- `fine_rules`
- `hr_health_alerts`
- `hr_onboarding_milestones`
- `hr_onboarding_processes`
- `hr_user_blocks`
- `hr_v2_daily_reports`
- `integration_shifts`
- `iot_devices`
- `kanban_card_watchers`
- `kanban_checklist_items`
- `kanban_checklists`
- `kanban_files`
- `kanban_notifications`
- `kanban_result_files`
- `kanban_results`
- `kanban_templates`
- `label_print_history`
- `material_lots_view`
- `material_supplier_ratings`
- `mes_operations`
- `mm_driver_expenses`
- `mm_drivers`
- `pos_movements_legacy_view`
- `pp_orders`
- `pp_routing`
- `pp_work_centers`
- `qc_ai_trend`
- `qc_defects_extended`
- `sd_deliveries`
- `sd_invoices`
- `warehouse_kpi_cache`

## Ustun drifti (live emas)

Total: 260 jadval

| Jadval | Drift soni |
|---|---:|
| `abc_analysis` | 27 |
| `employee_productivity` | 22 |
| `daily_attendance_summary` | 19 |
| `ai_cv_screenings` | 19 |
| `employee_ideas` | 19 |
| `employment_contracts` | 18 |
| `payroll_work_evidence` | 18 |
| `job_templates` | 18 |
| `employee_strengths_weaknesses` | 16 |
| `exit_interviews` | 16 |
| `operator_daily_stats` | 16 |
| `qc_parameter_definitions` | 15 |
| `role_menus` | 14 |
| `qc_material_tests` | 13 |
| `employee_passports` | 12 |
| `hr_job_descriptions` | 12 |
| `material_kits` | 12 |
| `purchase_requisitions` | 12 |
| `crm_documents` | 11 |
| `bonus_payments` | 11 |
| `employee_performance_metrics` | 11 |
| `employee_transfer_history` | 10 |
| `payroll_ai_recommendations` | 10 |
| `sick_leaves` | 10 |
| `performance_goals` | 10 |
| `safety_trainings` | 10 |
| `document_signatures` | 10 |
| `billing_documents` | 10 |
| `quotations` | 10 |
| `ai_finance_insights` | 9 |
| `budget_controls` | 9 |
| `cash_advances` | 9 |
| `employee_fines` | 9 |
| `ai_exam_attempts` | 9 |
| `camera_dashboard_stats` | 8 |
| `operator_performance_summary` | 8 |
| `ai_material_insights` | 8 |
| `discipline_appeals` | 7 |
| `overtime_payments` | 7 |
| `face_recognition_logs` | 7 |
| `position_required_courses` | 7 |
| `machine_status_logs` | 7 |
| `consumption_suggestions` | 7 |
| `sensor_readings` | 7 |
| `cycle_count_results` | 7 |
| `stock_movement_gl_postings` | 7 |
| `business_trips` | 6 |
| `employee_comparison_logs` | 6 |
| `camera_detections` | 6 |
| `employee_zone_tracking` | 6 |
| ... va yana 210 jadval | |

## Kelajak refactor uchun

Quyidagi hollarda bu ro'yxatga qaytib qarang:
- Yangi endpoint qo'shilganda jadval/ustun "dormant" ekanligini tasdiqlang
- Live bo'lishi ehtimoli bor jadvallarni avval `_audit_out/live_usage.json` orqali tekshiring
- DB-only jadvallar uchun Drizzle modeli zarur bo'lsa, `lib/db/src/schema/` ichida yangi fayl yarating
