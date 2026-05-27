# Schema Convergence Ledger (v2 — column-type aware)

Generated 2026-05-27. 174 duplicated tables.

| verdict | count | meaning |
|---|---|---|
| CLEAN | 4 | safe stub→re-export (lib/db ⊇ stub, compatible types) |
| RECONCILE | 126 | column type conflict / missing col — fix lib/db or consumers first |
| PK-CONFLICT | 38 | uuid ↔ integer id — hard, per-table |
| NO-LIB-CANON | 6 | no lib/db def — different strategy |

## CLEAN (4)

| table | consumers | id types | conflicts / missing | api def files |
|---|---|---|---|---|
| order_costings | 1 | number | — | schema-finance-extended.ts |
| approval_requests | 3 | number | — | schema-compat-4.ts |
| cfo_config | 7 | number | — | schema-finance-extended.ts |
| entries | 64 | number | — | schema-finance-extended.ts |

## RECONCILE (126)

| table | consumers | id types | conflicts / missing | api def files |
|---|---|---|---|---|
| employee_badges | 0 | number | +employee_id?, +badge_id?, +badge_code?, +awarded_by?, +awarded_at? | schema-business-c-1.ts |
| enps_responses | 0 | number | +survey_id?, +employee_id?, +created_at? | schema-business-c-2-misc.ts |
| hr_documents | 0 | number | content:string≠json, +employee_id?, +document_type?, +pdf_url?, +initiated_by?, +created_at? | schema-ext-a-2.ts |
| sensor_devices | 0 | number | +device_code?, +location?, +type?, +last_reading_at?, +thresholds?, +created_at? | schema-misc-iot.ts |
| adaptation_programs | 1 | number | +program_name?, +duration_days?, +is_active?, +created_at? | schema-business-c-2-hr-safety.ts |
| adaptation_records | 1 | number | +employee_id?, +program_id?, +started_at?, +completed_at?, +created_at? | schema-business-c-2-hr-safety.ts |
| advance_payments | 1 | number | +employee_id?, +request_date?, +document_id?, +approved_at?, +created_at? | schema-business-b-1.ts |
| ai_usage_logs | 1 | number | userId:string≠number | schema-compat-4.ts |
| ap_aging_buckets | 1 | number | +vendor_id?, +current_amount?, +days_31_60?, +days_61_90?, +days_91_120?, +over_120? | schema-business-b-2.ts |
| ar_aging_buckets | 1 | number | +customer_id?, +customer_type?, +current_amount?, +days_31_60?, +days_61_90?, +days_91_120? | schema-business-b-2.ts |
| bom_headers | 1 | number | productId:string≠number | schema-compat-3.ts |
| crm_comments | 1 | number | +lead_id?, +deal_id?, +text?, +author_id?, +created_at?, +updated_at? | schema-business-b-2.ts |
| crm_custom_fields | 1 | number | +entity_type?, +field_name?, +field_label?, +field_type?, +is_required?, +is_active? | schema-business-b-2.ts |
| crm_pipelines | 1 | number | +createdAt? | schema-compat-1a.ts |
| crm_robots | 1 | number | +trigger_type?, +action_type?, +config?, +is_active?, +created_at? | schema-business-b-2.ts |
| crm_stages | 1 | number | +createdAt? | schema-compat-1a.ts |
| customer_orders | 1 | number | +deletedAt? | schema-compat-4.ts |
| equipment_maintenance | 1 | number | workCenterId:string≠number, +scheduledAt?, +completedAt?, +updatedAt?, +deletedAt? | schema-compat-3.ts |
| expense_requests | 1 | number | +title?, +description?, +requested_by?, +comments?, +created_at?, +updated_at? | schema-business-b-1.ts |
| finance_categories | 1 | number | parentId:number≠string | schema-finance-extended.ts |
| hr_motivation_plans | 1 | number | targets:string≠json, +startDate?, +endDate? | schema-compat-1b.ts |
| hr_productivity_interviews | 1 | number | productivityInterview:string≠json, referenceCheck:string≠json | schema-compat-1b.ts |
| hr_tz2_territory_logs | 1 | string | +employee_id?, +event_type?, +camera_id?, +face_confidence?, +room_code?, +created_at? | schema-hr-tz2.ts |
| income_expense_transactions | 1 | number | categoryId:number≠string | schema-finance-extended.ts |
| invoice_payments | 1 | number | vendorId:number≠string, paymentDate:date≠string | schema-finance-extended.ts |
| iot_alerts | 1 | number | +created_at?, +resolved_at? | schema-misc-app-b.ts |
| machine_crews | 1 | number | workCenterId:string≠number, employeeId:string≠number | schema-compat-3.ts |
| mm_deliveries | 1 | number | +purchaseOrderId?, +vendorId? | schema-compat-4.ts |
| order_costing_lines | 1 | number | orderCostingId:number≠string | schema-finance-extended.ts |
| portfolio_items | 1 | number | +deletedAt? | schema-compat-4.ts |
| ppe_compliance | 1 | number | +employee_id?, +ppe_type?, +issue_date?, +expiry_date?, +is_compliant?, +created_at? | schema-business-c-2-hr-safety.ts |
| product_categories | 1 | number | +updatedAt? | schema-compat-3.ts |
| purchase_order_items | 1 | number | materialId:string≠number | schema-compat-2.ts |
| routing_operations | 1 | number | workCenterId:string≠number | schema-compat-3.ts |
| rpt_ishlab_chiqarish | 1 | string | reportDate:string≠date | schema-finance-reports.ts |
| rpt_kassa_transactions | 1 | string | reportDate:string≠date | schema-finance-reports.ts |
| rpt_ombor_qoldiq | 1 | string | reportDate:string≠date | schema-finance-reports.ts |
| safety_training_records | 1 | number | +training_id?, +employee_id?, +completed_date?, +expiry_date?, +is_passed?, +certificate_url? | schema-business-c-2-hr-safety.ts |
| sd_orders | 1 | number | +createdBy? | schema-compat-4.ts |
| sensor_readings | 1 | number | +device_id?, +value?, +unit?, +is_anomaly?, +anomaly_reason?, +recorded_at? | schema-misc-iot.ts |
| stock_transfer_lines | 1 | number | transferId:string≠number, +materialId? | schema-compat-4.ts |
| visitor_log | 1 | number | +visitor_name?, +visitor_phone?, +visitor_company?, +host_employee_id?, +badge_number?, +check_in_at? | schema-business-c-2-misc.ts |
| warehouse_stock | 1 | number | warehouseId:number≠string, +materialId? | schema-compat-2.ts |
| warehouse_transactions | 1 | number | warehouseId:number≠string | schema-finance-extended.ts |
| website_banners | 1 | number | +updatedAt? | schema-compat-3.ts |
| website_pages | 1 | number | +deletedAt? | schema-compat-4.ts |
| workflow_route_configs | 1 | number | +document_type?, +is_active?, +created_at? | schema-business-c-2-hr-safety.ts |
| accounting_periods | 2 | number | +is_closed?, +closed_at?, +closed_by?, +created_at? | schema-business-b-1.ts, schema-finance-extended.ts |
| application_responses | 2 | number | +application_id?, +created_at? | schema-misc-app-b.ts |
| camera_alerts | 2 | number | +camera_id?, +camera_event_id?, +alert_type?, +title_ru?, +is_acknowledged?, +is_resolved? | schema-misc-iot.ts |
| crm_proposals | 2 | number | +contact_id?, +amount?, +valid_until?, +created_at?, +updated_at? | schema-business-b-2.ts |
| gamification_points | 2 | number | +employee_id?, +event_type?, +reference_id?, +reason?, +given_by?, +created_at? | schema-business-c-1.ts |
| hazard_zones | 2 | number | +zone_name?, +zone_code?, +department_id?, +hazard_level?, +required_ppe?, +max_occupancy? | schema-business-c-2-hr-safety.ts |
| hr_employee_onboardings | 2 | number | planId:string≠number, weeklyProgress:string≠json, probationScore:string≠number, +endDate? | schema-compat-1b.ts |
| hr_onboarding_plans | 2 | number | tasks:string≠json, departmentId:string≠number | schema-compat-1b.ts |
| hr_tz2_attendance_photos | 2 | string | +employee_id?, +photo_url?, +taken_at?, +room_code?, +analysis_result?, +created_at? | schema-hr-tz2.ts |
| iot_sensors | 2 | number | thresholds:string≠json | schema-compat-4.ts |
| kanban_cards | 2 | number | +board_id?, +column_id?, +related_type?, +related_id?, +sort_order?, +created_at? | schema-kanban.ts |
| mro_budgets | 2 | number | +year?, +month?, +category?, +budget_amount?, +spent_amount?, +notes? | schema-business-b-2.ts |
| offboarding_checklist_items | 2 | number | +case_id?, +item_key?, +order_num? | schema-business-b-1.ts |
| papka_orders | 2 | number | +from_user_id?, +to_user_ids?, +subject?, +body?, +files?, +is_deleted? | schema-business-c-1.ts |
| profit_centers | 2 | number | +name_ru?, +is_active?, +created_at?, +updated_at?, +deleted_at? | schema-business-b-1.ts |
| public_products | 2 | number | +updatedAt?, +deletedAt? | schema-compat-4.ts |
| qc_braks | 2 | number | quantity:string≠number | schema-compat-3.ts |
| qc_standards | 2 | number | +parameters? | schema-misc-qc.ts |
| qc_supplier_quality | 2 | number | +vendorId?, +receiptId?, +materialId?, +batchNumber?, +sampleSize?, +defectsFound? | schema-misc-qc.ts |
| rpt_debitorlar | 2 | string | reportDate:string≠date | schema-finance-reports.ts |
| rpt_kreditorlar | 2 | string | reportDate:string≠date | schema-finance-reports.ts |
| skill_catalog | 2 | number | +name_ru?, +is_active?, +created_at? | schema-business-c-2-misc.ts |
| survey_responses | 2 | number | +survey_id?, +created_at? | schema-misc-app-b.ts |
| three_way_match_results | 2 | number | +invoice_id?, +tolerance_percent?, +status?, +match_details?, +matched_at?, +created_at? | schema-business-b-2.ts |
| user_skills | 2 | number | +skill_id?, +employee_id?, +user_id?, +verified?, +created_at? | schema-misc-app-b.ts |
| vendor_invoices | 2 | number | +vendor_id?, +invoice_no?, +amount?, +match_status?, +po_id?, +gr_id? | schema-business-b-2.ts |
| bom_items | 3 | number | bomId:number≠string, materialId:string≠number | schema-compat-3.ts |
| camera_ai_configs | 3 | number | +camera_id?, +camera_name?, +detection_types?, +alert_threshold?, +is_active?, +created_at? | schema-misc-iot.ts |
| cost_centers | 3 | number | +name_ru?, +description?, +is_active?, +created_at?, +updated_at?, +deleted_at? | schema-business-b-1.ts |
| crm_companies | 3 | number | +website?, +inn?, +credit_limit?, +used_credit?, +created_at?, +deleted_at? | schema-compat-1a.ts |
| crm_invoices | 3 | number | +customer_id?, +amount?, +due_date?, +created_at?, +updated_at? | schema-business-b-2.ts |
| crm_lead_stages | 3 | number | +order_index?, +is_active? | schema-business-b-2.ts |
| hr_conflict_reports | 3 | number | +resolved_at?, +created_at? | schema-business-c-2-hr-payroll.ts |
| hr_funnel_history | 3 | number | funnelId:string≠number | schema-compat-1b.ts |
| hr_health_checkups | 3 | number | +department_id?, +department_name?, +total_employees?, +examined_count?, +last_checkup_date?, +next_checkup_date? | schema-business-c-2-hr-payroll.ts |
| hr_interview_sessions | 3 | number | transcript:json≠string, +candidate_id?, +vacancy_id?, +interviewer_id?, +session_type?, +scheduled_at? | schema-business-c-1.ts |
| kanban_boards | 3 | number | +created_at?, +updated_at?, +deleted_at? | schema-kanban.ts |
| kanban_columns | 3 | number | +board_id?, +sort_order?, +created_at?, +updated_at?, +deleted_at? | schema-kanban.ts |
| payroll_rows | 3 | number | periodId:number≠string | schema-compat-2.ts |
| production_sessions | 3 | number | productionOrderId:string≠number, workCenterId:string≠number | schema-compat-4.ts |
| safety_incidents | 3 | number | +incident_type?, +location_description?, +department_id?, +incident_date?, +investigation_status?, +created_at? | schema-business-c-2-hr-safety.ts |
| sd_contracts | 3 | number | +contract_number?, +order_id?, +order_number?, +customer_id?, +template_type?, +papka_no? | schema-business-c-2-misc.ts |
| broadcasts | 4 | number | +recipients_count?, +success_count?, +failed_count?, +created_at? | schema-misc-app-b.ts |
| employee_org_departments | 4 | number | +user_id?, +org_department_id?, +is_primary?, +assigned_at? | schema-misc-app-a.ts |
| gamification_totals | 4 | number | +employee_id?, +total_points?, +monthly_points?, +quarterly_points?, +badge_count?, +rank? | schema-business-c-1.ts |
| goods_receipts | 4 | number | +purchase_order_id?, +received_by?, +received_at?, +completed_by?, +completed_at?, +created_at? | schema-ext-c-3.ts |
| leave_requests | 4 | number | employeeId:string≠number, startDate:string≠date, endDate:string≠date, approvedBy:string≠number, +employee_id?, +leave_type? | schema-compat-2.ts, schema-misc-app-a.ts |
| org_departments | 4 | number | +name_ru?, +parent_id?, +level?, +head_user_id?, +sort_order?, +is_active? | schema-misc-app-a.ts |
| payroll_periods | 4 | number | +period_name?, +period_start_date?, +period_end_date?, +total_payroll_amount?, +employee_count?, +closed_at? | schema-business-c-2-hr-payroll.ts |
| crm_contacts | 5 | number | +company_id?, +first_name?, +last_name?, +created_at?, +updated_at?, +deleted_at? | schema-compat-1a.ts |
| employee_360_assessments | 5 | number | +employee_id?, +assessment_period?, +assessment_year?, +self_rating?, +manager_rating?, +peer_rating? | schema-business-c-2-hr-payroll.ts |
| gl_documents | 5 | number | metadata:string≠json, createdBy:string≠number | schema-compat-2.ts |
| camera_zones | 6 | number | +camera_id?, +zone_name?, +zone_type?, +is_active?, +created_at?, +event_type? | schema-misc-iot.ts |
| crm_activities | 6 | number | +entity_type?, +entity_id?, +type?, +notes?, +outcome?, +scheduled_at? | schema-business-b-2.ts |
| customer_payments | 6 | number | +payment_number?, +payment_date?, +customer_id?, +sales_invoice_id?, +payment_method?, +bank_account? | schema-compat-5.ts |
| offboarding_cases | 6 | number | +employee_id?, +dismissal_type?, +last_working_day?, +dismiss_order_doc_id?, +total_items?, +completed_items? | schema-business-b-1.ts |
| purchase_invoices | 6 | number | +vendor_id?, +supplier_name?, +invoice_no?, +total_amount?, +paid_amount?, +amount? | schema-business-c-1.ts |
| shift_schedules | 6 | number | +employee_id?, +shift_date?, +shift_type?, +start_time?, +end_time?, +created_at? | schema-business-c-2-hr-safety.ts |
| surveys | 6 | number | +created_at? | schema-misc-app-b.ts |
| system_alerts | 6 | number | +level? | schema-admin-ext.ts |
| hr_candidate_funnels | 7 | number | metadata:string≠json, screeningScore:string≠number | schema-compat-1a.ts |
| rpt_balans | 7 | string | reportDate:string≠date | schema-finance-reports.ts |
| audit_logs | 8 | string | +user_id?, +module?, +entity_id?, +before_value?, +after_value?, +ip_address? | schema-core.ts, schema-rbac.ts |
| crm_deals | 8 | number | metadata:string≠json, +lead_id?, +company_id?, +name?, +expected_amount?, +assigned_to? | schema-compat-1a.ts |
| downtime_events | 8 | number | workCenterId:string≠number, reasonCodeId:string≠number, durationMin:string≠number | schema-manufacturing.ts |
| sales_invoices | 8 | number | +customer_id?, +customer_name?, +invoice_number?, +sales_order_id?, +total_amount?, +paid_amount? | schema-business-c-2-misc.ts |
| camera_events | 9 | number | +camera_id?, +event_type?, +ai_confidence?, +screenshot_url?, +telegram_sent?, +created_at? | schema-misc-iot.ts |
| crm_leads | 9 | number | +customer_id?, +manager_id?, +status_description?, +contact_name?, +contact_phone?, +contact_email? | schema-compat-1a.ts |
| mentorships | 9 | number | +mentor_id?, +mentee_id?, +created_at? | schema-misc-app-b.ts |
| salary_history | 9 | number | createdBy:string≠number, +employee_id?, +salary_period_start?, +salary_period_end?, +base_salary?, +salary_earned? | schema-business-c-2-hr-payroll.ts, schema-compat-5.ts |
| sd_customers | 10 | number | +full_name?, +company?, +created_at?, +updated_at? | schema-business-b-2.ts |
| applications | 12 | number | +status?, +created_at? | schema-misc-app-b.ts |
| certificates | 18 | number | +is_active?, +updated_at? | schema-ext-a-1.ts |
| vacancies | 18 | number | +department_id?, +closing_date? | schema-compat-1a.ts |
| cameras | 19 | number | +name_ru?, +ip_address?, +rtsp_url?, +stream_url?, +work_center_id?, +is_active? | schema-misc-iot.ts |
| candidates | 27 | number | rating:number≠string, +vacancy_id?, +first_name?, +last_name?, +full_name?, +is_archived? | schema-compat-1a.ts |
| skills | 28 | number | +created_at? | schema-misc-app-b.ts |
| courses | 32 | number | instructorId:string≠number, +is_active?, +updated_at? | schema-compat-4.ts, schema-ext-a-1.ts |
| notifications | 54 | number | userId:string≠number | schema-compat-3.ts |

## PK-CONFLICT (38)

| table | consumers | id types | conflicts / missing | api def files |
|---|---|---|---|---|
| ai_planning_config | 0 | string/number | id:string≠number, autoApprovalThreshold:number≠string, maxShiftHours:number≠string, energyOptimizationWeight:number≠string | schema-ai.ts |
| pos_warehouse_access | 0 | string/number | id:string≠number, userId:string≠number, grantedBy:string≠number | schema-pos-ext.ts |
| ai_insights | 1 | string/number | id:string≠number, +planNumber?, +planDate?, +planType?, +status?, +confidenceScore? | schema-ai.ts |
| ai_reservation_requests | 1 | string/number | id:string≠number, quantity:number≠string, +items?, +scheduledAt? | schema-ai.ts |
| calendar_events | 1 | string/number | id:string≠number, startDate:date≠string, endDate:date≠string, +name?, +domain?, +plan? | schema-admin-ext.ts |
| document_sequences | 1 | number/string | id:number≠string | schema-compat-2.ts |
| hr_tz2_ai_room_analysis | 1 | number/string | id:number≠string, +room_code?, +reference_photo_id?, +current_photo_url?, +analyzed_at?, +cleanliness_score? | schema-hr-tz2.ts |
| hr_tz2_room_reference_photos | 1 | number/string | id:number≠string, +room_code?, +room_name?, +department_code?, +photo_url?, +last_updated_at? | schema-hr-tz2.ts |
| marketing_content_posts | 1 | string/number | id:string≠number, +accountName?, +accountId?, +isActive?, +accessToken? | schema-marketing-ext.ts |
| marketing_social_accounts | 1 | string/number | id:string≠number | schema-marketing-ext.ts |
| security_incidents | 1 | string/number | id:string≠number, +title?, +reported_by?, +assigned_to?, +resolved_at?, +resolution_notes? | schema-misc.ts |
| warehouse_zones | 1 | number/string | id:number≠string, warehouseId:number≠string | schema-compat-2.ts |
| asset_items | 2 | number/string | id:number≠string, +assigned_to?, +department_id?, +serial_number?, +purchase_date?, +purchase_price? | schema-business-c-1.ts |
| position_permissions | 2 | number/string | id:string≠number, +tableName?, +recordId?, +action?, +oldValues?, +newValues? | schema-compat-2.ts, schema-rbac.ts |
| design_orders | 3 | number/string | assignedTo:string≠number, files:string≠json, createdBy:string≠number, id:string≠number, deadline:date≠string, +order_number? | schema-compat-4.ts, schema-misc.ts |
| guidelines | 3 | string/number | id:string≠number, createdBy:string≠number, +name?, +filterType?, +config? | schema-admin-ext.ts |
| marketing_campaigns | 3 | number/string | id:number≠string | schema-compat-3.ts |
| marketing_leads | 3 | number/string | id:number≠string | schema-compat-3.ts |
| saas_tenants | 3 | string/number | id:string≠number | schema-admin-ext.ts |
| budget_lines | 4 | string/number | id:string≠number, +category?, +description? | schema-finance-budgets.ts |
| admins | 6 | number/string | id:number≠string, +created_at? | schema-misc-app-b.ts |
| inventory_count_lines | 6 | string/number | id:string≠number, countId:string≠number, +stockItemId?, +sku?, +itemName?, +systemQuantity? | schema-pos-ext.ts |
| qc_reclamations | 6 | number/string | id:string≠number, customerId:string≠number, reportedDate:date≠string, assignedTo:string≠number | schema-compat-3.ts, schema-misc-qc.ts |
| purchase_orders | 7 | string/number | id:string≠number, items:string≠json, +po_number?, +vendor_name?, +vendor_id?, +total_amount? | schema-wms.ts |
| inventory_counts | 9 | number/string | materialId:string≠number, id:string≠number, startedBy:string≠number, approvedBy:string≠number | schema-finance-extended.ts, schema-pos-ext.ts |
| vendors | 12 | number/string | id:string≠number, items:string≠json, +payment_terms?, +is_active?, +created_at?, +po_number? | schema-compat-2.ts, schema-wms.ts |
| routings | 14 | string/number | id:string≠number, steps:string≠json, +work_centers?, +is_active?, +created_by?, +created_at? | schema-manufacturing.ts |
| budgets | 20 | string/number | id:string≠number, createdBy:string≠number | schema-finance-budgets.ts |
| work_centers | 20 | string/number | id:string≠number, capacity:string≠number, certificationLmsCourseId:string≠number | schema-manufacturing.ts, schema-pp.ts |
| deliveries | 24 | string/number | id:string≠number, +sales_order_id?, +delivery_number?, +customer_name?, +delivery_address?, +status? | schema-misc.ts |
| departments | 30 | string/number | id:string≠number, headId:string≠number, parentId:string≠number | schema-hr-lms.ts |
| positions | 30 | string/number | id:string≠number, departmentId:string≠number, minSalary:string≠number, maxSalary:string≠number | schema-hr-lms.ts |
| production_orders | 30 | number/string | productId:string≠number, createdBy:string≠number, id:string≠number, quantity:number≠string, +plannedStart?, +plannedEnd? | schema-compat-3.ts, schema-manufacturing.ts |
| sales_orders | 44 | number/string | customerId:string≠number, id:string≠number, +status?, +totalAmount?, +notes?, +createdBy? | schema-compat-2.ts, schema-core.ts |
| warehouses | 53 | number/string | id:string≠number, +is_free_storage?, +free_storage_days?, +monthly_rate?, +deleted_at?, +deleted_by? | schema-compat-2.ts, schema-wms.ts |
| attendance | 67 | number/string | employeeId:string≠number, date:string≠date, id:string≠number, +employee_id?, +attendance_date?, +check_in_time? | schema-business-c-2-hr-payroll.ts, schema-compat-2.ts, schema-hr-lms.ts, schema-misc-app-b.ts |
| users | 126 | number/string | id:string≠number, +lockUntil?, +password_hash?, +full_name?, +is_active?, +last_login_at? | schema-compat-1a.ts, schema-core.ts, schema-misc-app-a.ts |
| employees | 200 | string/number | id:string≠number, +user_id?, +full_name?, +position?, +department?, +salary_base? | schema-hr-lms.ts, schema-misc-app-a.ts |

## NO-LIB-CANON (6)

| table | consumers | id types | conflicts / missing | api def files |
|---|---|---|---|---|
| lms_courses | 3 | string/number | — | schema-hr-lms.ts, schema-misc-app-b.ts |
| lms_enrollments | 4 | string/number | — | schema-hr-lms.ts, schema-misc-app-b.ts |
| boms | 8 | number/string | — | schema-ext-a-3.ts, schema-manufacturing.ts |
| lms_tests | 40 | number | — | schema-business-c-1.ts, schema-compat-4.ts, schema-misc-app-b.ts |
| invoices | 45 | string/number | — | schema-finance-invoicing.ts, schema-misc-app-b.ts |
| materials | 52 | number/string | — | schema-compat-2.ts, schema-ext-a-2.ts, schema-pos-ext.ts |

