/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

import { db, runQuery } from '@shared/db';
export * from './schema';
export { db, rawSql, runQuery, ddlRun } from './schema';
export * from './schema-business';

// schema-compat-1: CRM + HR compat stubs (stub = identity fn, same Drizzle table)
export {
  crmLeads, crmDeals, crmContacts, crmCompanies, crmPipelines, crmStages,
  candidates, vacancies, hrCandidateFunnels, hrFunnelHistory, hrReferencesChecks,
  hrToolTestResults, hrOnboardingPlans, hrEmployeeOnboardings, hrJobDescriptions,
  hrJobOffers, hrMotivationPlans, hrProductivityInterviews,
} from './schema-compat-1';

// schema-compat-2: Finance / Payroll / Sales compat stubs
export {
  payrollPeriods, payrollRows, leaveRequests, positionPermissions,
  glDocuments, accounts, salesInvoices, documentSequences,
  salesOrders, sdLeads, purchaseOrderItems,
  warehouseZones, warehouseStock,
  posMovements, posMovementTypes,
} from './schema-compat-2';

// schema-compat-3: MRO / Production / Security compat stubs
export {
  mroInventory, productionOrders, routings, routingOperations, bomHeaders, bomItems,
  workCenters, downtimeEvents, downtimeReasonCodes, machineCrews, equipmentMaintenance,
  qcReclamations, qcBraks, marketingCampaigns, marketingLeads,
  productCategories, websiteBanners, websiteSettings, securityAccess, securityAttendance,
} from './schema-compat-3';

// schema-compat-4: Logistics / IoT / Design / eCommerce compat stubs
export {
  logisticsRoutes, iotSensors, designLibraryItems, hitlApprovals, customerOrders,
  customerAccounts, publicProducts, websitePages, portfolioItems,
  modules, tests, assignments, courses,
  mmDeliveries, sdOrders, productionSessions,
  stockTransferLines,
} from './schema-compat-4';

// schema-compat-5: Finance payments + WMS stock complete schemas
export {
  customer_payments, wms_stock, salaryHistory,
} from './schema-compat-5';

// schema-ai: AI tables
export {
  aiExamAttempts, aiInsights, aiPlanningPlans, aiPlanningConfig,
  aiReservationRequests, aiReservationBatches, aiHrInterviews,
} from './schema-ai';

// schema-ai-agents: Sprint-5 AI Decision Log
export { aiDecisionLog } from './schema-ai-agents';
export type { AiDecisionLogRow, AiDecisionLogInsert } from './schema-ai-agents';

// schema-aisha: AIsha voice assistant (conversations, tool calls, audit, approvals)
export {
  aishaConversations, aishaToolCalls, aishaVoiceAudit, aishaPendingApprovals,
} from './schema-aisha';

// schema-forecast: Talab prognozi (TZ-06/07/08)
export { forecast_series } from './schema-forecast';

// schema-qc-spc: QC/SPC p-chart nuqtalari (TZ-D11)
export { control_chart_point } from './schema-qc-spc';
export { overtime_policy, employee_separation } from './schema-hr-overtime';

// schema-misc-app-a: App-level stubs (users, org_departments, employees, etc.)
export {
  appUsers, hrEmployees,
  hrDepartments, hrPositions,
  orgDepartments, employeeOrgDepartments,
  shiftSchedules, leaveRequestsApp,
} from './schema-misc-app-a';

// schema-admin-ext: Admin-module specific tables (audit log full schema, alerts)
export { audit_logs_ext, system_alerts } from './schema-admin-ext';

// schema-pp: PP module canonical tables (extracted from infra per P3-27)
export { ppWorkCenters } from './schema-pp';

// schema-kanban: Kanban tables (including canonical kanbanBoards / kanbanColumns / kanbanCards)
export {
  kanbanBoards, kanbanColumns, kanbanCards,
  kanbanFlows, kanbanRobots, kanbanChecklists, kanbanChecklistItems,
  kanbanCardComments, kanbanCardWatchers,
  kanbanNotifications, kanbanTemplates, kanbanTimeTracks,
  kanbanTags, kanbanCardTags, kanbanResults, kanbanResultFiles,
  kanbanObservers, kanbanCoExecutors, kanbanFiles,
  kanbanWipOverrides, kanbanColumnSla,
} from './schema-kanban';

// schema-ext: Extended/stub tables for Drizzle builder usage
export {
  stocks, current_stock, ideal_rasm_targets, order_status_logs,
  pos_damage_qc_links, pos_barcode_print_queue, employee_issuance_log,
  pos_inventory_count_lines, inventory_barcode_assignments, pos_barcode_map,
  lessons, certificates_table, courses_table,
  hr_interview_questions, hr_applications, gl_lines,
  sd_customer_contacts, sd_customer_documents, sd_customer_competitors, sd_sales_orders,
  kanban_columns, kanban_cards, questionnaire_templates,
  recruitment_bot_attempts, bot_candidates, hr_sick_reports,
  pos_movements_archive, hr_documents_archive,
  mm_goods_receipt_items, mm_goods_issue_items,
  mm_goods_issues_ext, mm_goods_receipts_ext,
  mm_purchase_order_items, mm_materials_ext, mm_vendors_ext,
  tech_cards, papka_orders_tech,
  boms_int, routings_int, production_orders_int, routing_operations_int,
  pos_movements_legacy, hr_documents_legacy,
  wms_alerts, gamification_totals, hr_brand_settings,
  three_way_match_results, purchase_orders_legacy, materials_legacy,
  mm_purchase_requisition_items, employee_assets, asset_items_ext,
  // WMS Extended (genuinely new tables)
  wms_warehouses, wms_transfers, wms_internal_requests, wms_inventory_counts,
  // MM Extended
  mm_goods_receipt_lines, mm_purchase_orders_int,
  mm_materials_int,
  // Finance Core (new tables not in other schemas)
  income_expense_transactions, stock_moves, raw_materials,
  expense_reports, fi_invoices,
  // SD Extended
  sd_customer_interactions, sd_customer_complaints,
  sd_payments, sd_quotations, sd_rentals, sd_price_formulas,
  // Waste
  waste_records, waste_targets,
  // AI Report (new)
  ai_report_runs,
  // QC Extended
  qc_standards, qc_final_inspections, qc_in_process_inspections,
  // LMS Extended (new tables)
  lms_test_attempts, lms_certificates,
  lms_modules, lms_exams,
  // lms_exam_attempts: aiExamAttempts in schema-ai.ts is the live canonical (uuid PK)
  lms_knowledge, lms_achievements, lms_user_achievements, lms_tests_ext,
  // MES Extended
  mes_maintenance_requests, mes_maintenance_tasks, mes_production_sessions, mes_shift_stats,
  equipment, machine_tasks,
  // HR Extended (new tables)
  hr_leave_balances, attendance_records,
  pip_progress, disciplinary_actions, employee_org_departments,
  employee_transfers_ext, employee_files, employee_ratings, employee_rating_goals,
  employee_badges_ext, employee_daily_reports, employee_daily_kpi,
  employee_inventory_ledger, employee_liability_cases,
  employee_360_responses,
  employee_benefits, employee_contracts, succession_plans,
  hr_application_responses, hr_candidate_funnels,
  hr_capital_courses,
  adaptation_feedback,
  // Finance Extended (budget_lines comes from export * from './schema' above)
  budgets, advances,
  fp_cycles, payroll_entries, finance_invoices, finance_invoice_lines,
  // IoT Extended
  iot_sensor_readings, iot_alerts,
  // Security
  raci_matrix,
  // CRM Extended (new tables, different from existing crm_ tables)
  crm_leads, crm_deals, crm_contacts,
  // POS Extended (pos_printer_configs olib tashlandi 2026-07-02 — G9-4/Q-46 dublikat pgTable;
  // kanonik = posPrinterConfig 'pos_printer_config', lib/db pos-schema-v2.ts)
  pos_categories, pos_products, pos_orders, pos_order_items, pos_movements,
  // KPI & Goals
  kpi_definitions, kpi_values, goals,
  // Gamification Extended
  assessment_skips, enps_survey_responses_ext,
  // Vendor Performance (vendor_performance olib tashlandi 2026-07-02 — dead/orfan, Q-46;
  // qarang schema-ext-b-3.ts izohi va vendor-rating-unified-view-2026-07-02.sql)
  erp_purchase_requisitions,
  // Warehouse Rental
  warehouse_rental_records, warehouse_rental_settings, warehouse_access_grants,
  warehouse_stock, warehouse_batches, warehouse_transactions, warehouse_transfers,
  internal_requests, goods_receipts, inventory_counts, stock_reservations,
  department_warehouse_map,
  // Camera & Safety Extended
  camera_employee_reports, camera_logs,
  face_embeddings, zone_tracking_logs, hr_tz2_security_alerts,
  // HR Shifts & Attendance
  shift_swap_requests, attendance_logs,
  // Plans & Documents
  weekly_plans, dokla_ext, rasporyazhenie_ext,
  // ERP/MES stats
  erp_daily_reports, erp_production_facts, erp_downtime_logs, erp_production_plans,
  erp_shift_calendars, erp_mrp_runs, erp_mrp_results,
  erp_employee_work_centers, erp_employees,
  // Customs & Other
  customs_declarations,
  exception_logs, design_order_revisions,
  wms_exit_logs, wms_production_supply,
  // AI Interview
  ai_interview_sessions,
} from './schema-ext';

// schema-sprint2: Sprint 2 new tables
export {
  supplier_price_tiers, inventory_policy, material_recommendation,
  mps_periods, pp_mrp_runs, pp_mrp_run_lines,
  product_learning_curves, pp_routing_operations,
} from './schema-sprint2';

// schema-chat: Consolidated canonical chat tables (single source of truth)
export {
  chat_messages, chat_members, chat_rooms,
  chat_reactions, chat_polls, chat_poll_votes,
  chatStarredMessages, chat_starred_messages,
  chatUserPresence, chat_user_presence,
  chatMessages, chatMembers, chatRooms, chatReactions, chatPolls, chatPollVotes,
  chatMessageTasks, chat_message_tasks, chatMessageHiddenFor, chatRoomTags, chatRoomNotes,
} from './schema-chat';

// schema-hr-tz2: HR Territory/Camera Attendance + Inspection tables (HR-03/04)
// + hr_referrals (P1.26.1) + hr_mentorship_pairings (P1.15.1)
export {
  hr_tz2_territory_logs,
  hr_tz2_attendance_photos,
  hr_tz2_daily_attendance,
  hr_tz2_room_reference_photos,
  hr_tz2_ai_room_analysis,
  hr_referrals,
  hr_mentorship_pairings,
} from './schema-hr-tz2';

// schema-outbox: Domain events outbox table (PA0-6)
export { domain_events } from './schema-outbox';

// schema-cc-document-hashes: CC document PDF integrity hash (Q-35, owner 2026-07-11,
// CC-COMPLETE-FRESH-ANALYSIS item #12/#45/#50 "document_hashes" half; schema-only draft,
// no dispatcher wired yet)
export { document_hashes } from './schema-cc-document-hashes';

// schema-document-control: cross-module document-leak-prevention layer (Q-28/owner 2026-07-13).
// Single canonical document_access_log (view/print/copy/export). STEP 3.1.
export { document_access_log, DOCUMENT_ACCESS_ACTIONS, SENSITIVITY_TIERS } from './schema-document-control';
export type { DocumentAccessLogRow, DocumentAccessLogInsert, DocumentAccessAction, SensitivityTier } from './schema-document-control';

// schema-erp-documents: "erkin hujjatlar" free-form documents (Phase A1, owner 2026-07-13).
// Consumes the document-control layer above (same tiers, logged, download-blocked, watermarked).
export { erp_documents } from './schema-erp-documents';
export type { ErpDocumentRow, ErpDocumentInsert } from './schema-erp-documents';

// schema-erp-spreadsheets: "Jadval" spreadsheets (Phase B, owner 2026-07-13). Consumes the
// document-control layer (same tiers, logged, download-blocked, watermarked, CC-surfaced).
export { erp_spreadsheets } from './schema-erp-spreadsheets';
export type { ErpSpreadsheetRow, ErpSpreadsheetInsert } from './schema-erp-spreadsheets';
