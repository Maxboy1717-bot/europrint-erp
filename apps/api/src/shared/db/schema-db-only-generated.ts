/**
 * @module schema-db-only-generated
 * @description Auto-generated Drizzle schemas for tables that exist in DB but were missing from Drizzle.
 * Generated: 2026-05-22T07:33:20.172Z
 * NOTE: Types are best-effort from information_schema. Verify before relying on for migration.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AUDIT RESULT (2026-05-22): lib/db cross-check
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaced with @workspace/db import : 1 table
 *   - departments  → export { departments } from '@workspace/db/schema/core/core-users'
 *
 * Remaining as local pgTable definitions : 89 tables (DB-only)
 * All 89 tables below exist in PostgreSQL but are NOT yet defined in lib/db/src/schema/.
 *
 * DB-only tables (exist in PostgreSQL but not yet in lib/db/src/schema/):
 * TODO: Move each of these to the appropriate lib/db/src/schema/*.ts file,
 *       add to lib/db/src/schema/index.ts barrel, then replace the definition
 *       here with an import from '@workspace/db'.
 *
 *  Suggested target files:
 *   lib/db/src/schema/core/core-ai.ts         ← agent_alerts, agent_cron_state, agent_module_health,
 *                                                agent_modules_registry, agents_audit_log
 *   lib/db/src/schema/hr-recruitment.ts       ← ai_behavioral_scores, ai_interview_links,
 *                                                boomerang_notifications, employee_referrals,
 *                                                hr_question_bank, hr_question_responses
 *   lib/db/src/schema/core/core-audit.ts      ← audit_log, cron_status
 *   lib/db/src/schema/order-workflow-schema.ts ← document_route_steps, document_routes,
 *                                                document_routing_rules, document_workflow_instances,
 *                                                document_workflow_routes
 *   lib/db/src/schema/hr-extended.ts          ← employee_balances, employee_monthly_cards,
 *                                                hr_ai_attendance, hr_employee_goals,
 *                                                hr_employee_one_on_ones, hr_health_alerts,
 *                                                hr_late_arrivals, hr_onboarding_milestones,
 *                                                hr_onboarding_processes, hr_user_blocks
 *   lib/db/src/schema/hr-v2-schema.ts         ← hr_v2_daily_reports, hr_v2_documents
 *   lib/db/src/schema/shifts.ts               ← integration_shifts
 *   lib/db/src/schema/iot-schema.ts           ← iot_devices
 *   lib/db/src/schema/kanban-extended.ts      ← kanban_card_comments, kanban_card_tags,
 *                                                kanban_card_watchers, kanban_checklist_items,
 *                                                kanban_checklists, kanban_co_executors,
 *                                                kanban_files, kanban_notifications,
 *                                                kanban_observers, kanban_result_files,
 *                                                kanban_results, kanban_tags, kanban_templates,
 *                                                kanban_time_tracks
 *   lib/db/src/schema/mm-material-cards.ts    ← label_print_history, low_stock_alerts,
 *                                                material_lots_view, material_price_history,
 *                                                material_supplier_ratings
 *   lib/db/src/schema/master-config.ts        ← master_categories, units
 *   lib/db/src/schema/mes-schema.ts           ← mes_operations, mes_telemetry
 *   lib/db/src/schema/mm-logistics.ts         ← mm_driver_expenses, mm_drivers
 *   lib/db/src/schema/pp-schema.ts            ← operator_hourly_invoices, pp_orders,
 *                                                pp_routing, pp_work_centers
 *   lib/db/src/schema/pos-schema-v2.ts        ← pos_gl_postings, pos_inventory_passport,
 *                                                pos_movements_legacy_view, pos_shift_audit,
 *                                                pos_warehouse_stock_view
 *   lib/db/src/schema/position-permissions.ts ← position_folder_content
 *   lib/db/src/schema/fi-advanced.ts          ← cost_structure, fi_gl_documents,
 *                                                finance_payments, financial_ratios_snapshot,
 *                                                price_tier, standard_cost, variance_report
 *   lib/db/src/schema/hr-performance.ts       ← fine_rules
 *   lib/db/src/schema/mm-procurement.ts       ← purchase_requests, three_way_match_log
 *   lib/db/src/schema/qc-schema.ts            ← qc_ai_trend, qc_defects_extended
 *   lib/db/src/schema/ideal-rasm-schema.ts    ← camera_snapshots, room_reference_comparisons,
 *                                                room_references
 *   lib/db/src/schema/sd-schema.ts            ← sap_sales_orders, sd_invoices
 *   lib/db/src/schema/wms-schema.ts           ← warehouse_employees, warehouse_kpi_cache,
 *                                                warehouse_roll_usage, warehouse_rolls,
 *                                                wms_inventory
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { pgTable, serial, integer, bigint, smallint, text, varchar, char, boolean, timestamp, date, time, numeric, real, doublePrecision, jsonb, json, uuid, customType } from 'drizzle-orm/pg-core';

// ── Promoted to lib/db (agent-schema.ts) — re-export canonical definitions ────
export {
  agentAlerts,
  agentCronState,
  agentModuleHealth,
  agentModulesRegistry,
  agentsAuditLog,
} from '@workspace/db';


export const aiBehavioralScores = pgTable('ai_behavioral_scores', {
  id: integer('id').primaryKey(),
  candidateId: integer('candidate_id').notNull(),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  frameTs: timestamp('frame_ts').notNull(),
  emotion: varchar('emotion', { length: 30 }),
  emotionConfidence: numeric('emotion_confidence', { precision: 4, scale: 3
 }),
  postureScore: numeric('posture_score', { precision: 4, scale: 3
 }),
  attentionScore: numeric('attention_score', { precision: 4, scale: 3
 }),
  audioSentiment: varchar('audio_sentiment', { length: 20 }),
  audioConfidence: numeric('audio_confidence', { precision: 4, scale: 3
 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull(),
});

export const aiInterviewLinks = pgTable('ai_interview_links', {
  id: integer('id').primaryKey(),
  tokenId: varchar('token_id', { length: 64 }).notNull(),
  candidateId: integer('candidate_id').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull(),
});

export const auditLog = pgTable('audit_log', {
  id: integer('id').primaryKey(),
  userId: integer('user_id'),
  action: text('action').notNull(),
  controller: varchar('controller', { length: 100 }),
  method: varchar('method', { length: 100 }),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  ts: timestamp('ts').notNull(),
  telegramUserId: integer('telegram_user_id'),
  entityType: varchar('entity_type'),
  entityId: integer('entity_id'),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ipAddress: text('ip_address'),
  sessionId: varchar('session_id'),
  durationMs: integer('duration_ms'),
  success: boolean('success'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at'),
});

export const boomerangNotifications = pgTable('boomerang_notifications', {
  id: integer('id').primaryKey(),
  vacancyId: integer('vacancy_id').notNull(),
  formerEmployeeId: integer('former_employee_id').notNull(),
  matchScore: numeric('match_score', { precision: 3, scale: 2
 }),
  notifiedAt: timestamp('notified_at').notNull(),
});

export const cameraSnapshots = pgTable('camera_snapshots', {
  id: integer('id').primaryKey(),
  roomId: integer('room_id').notNull(),
  snapshotUrl: text('snapshot_url').notNull(),
  capturedAt: timestamp('captured_at').notNull(),
});

export const costStructure = pgTable('cost_structure', {
  id: uuid('id').primaryKey(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  period: varchar('period', { length: 7 }).notNull(),
  fixedCostUzs: numeric('fixed_cost_uzs', { precision: 18, scale: 4
 }).notNull(),
  variableCostUzs: numeric('variable_cost_uzs', { precision: 18, scale: 4
 }).notNull(),
  sellingPriceUzs: numeric('selling_price_uzs', { precision: 18, scale: 4
 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  productId: integer('product_id'),
  createdBy: integer('created_by'),
});

export const cronStatus = pgTable('cron_status', {
  id: integer('id').primaryKey(),
  jobName: varchar('job_name', { length: 200 }),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  lastStatus: varchar('last_status', { length: 30 }),
  lastError: text('last_error'),
  runCount: integer('run_count'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

// SHIM: re-export canonical `departments` from `@workspace/db/schema/core/core-users`.
// Previous auto-generated pgTable definition (24 cols, integer PK) removed.
// Canon (20 cols, serial PK) covers all columns used by app code; the dropped
// `headId` column has zero references in this codebase.
export { departments } from '@workspace/db/schema/core/core-users';

export const documentRouteSteps = pgTable('document_route_steps', {
  id: integer('id').primaryKey(),
  routeId: integer('route_id').notNull(),
  stepOrder: integer('step_order').notNull(),
  approverUserId: integer('approver_user_id'),
  decision: varchar('decision', { length: 20 }),
  reason: text('reason'),
  decidedAt: timestamp('decided_at'),
  createdAt: timestamp('created_at').notNull(),
});

export const documentRoutes = pgTable('document_routes', {
  id: integer('id').primaryKey(),
  documentId: integer('document_id').notNull(),
  documentType: varchar('document_type', { length: 60 }).notNull(),
  currentStep: integer('current_step').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  initiatedBy: integer('initiated_by').notNull(),
  initiatedAt: timestamp('initiated_at').notNull(),
  completedAt: timestamp('completed_at'),
  isImmutable: boolean('is_immutable').notNull(),
});

export const documentRoutingRules = pgTable('document_routing_rules', {
  id: integer('id').primaryKey(),
  documentType: varchar('document_type', { length: 60 }).notNull(),
  sourceOrgFunctionId: integer('source_org_function_id'),
  targetOrgFunctionId: integer('target_org_function_id'),
  targetOrgDepartmentId: integer('target_org_department_id'),
  stepOrder: integer('step_order').notNull(),
  requiresSignature: boolean('requires_signature').notNull(),
  rejectRequiresReason: boolean('reject_requires_reason').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export const documentWorkflowInstances = pgTable('document_workflow_instances', {
  id: integer('id').primaryKey(),
  documentId: integer('document_id'),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  initiatorId: integer('initiator_id'),
  currentStepIndex: integer('current_step_index'),
  currentApproverId: integer('current_approver_id'),
  status: varchar('status', { length: 30 }),
  stepsHistory: jsonb('steps_history'),
  rejectionReason: text('rejection_reason'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const documentWorkflowRoutes = pgTable('document_workflow_routes', {
  id: integer('id').primaryKey(),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  nameRu: varchar('name_ru', { length: 200 }),
  verticalSteps: jsonb('vertical_steps'),
  horizontalSteps: jsonb('horizontal_steps'),
  approvalTimeoutHours: integer('approval_timeout_hours'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// ── Promoted to lib/db (hr-goals.ts) — re-export canonical definitions ──────
export {
  employeeBalances,
  employeeMonthlyCards,
} from '@workspace/db';

export const employeeReferrals = pgTable('employee_referrals', {
  id: integer('id').primaryKey(),
  referrerUserId: integer('referrer_user_id'),
  candidateId: integer('candidate_id'),
  candidateName: varchar('candidate_name', { length: 200 }),
  vacancyId: integer('vacancy_id'),
  status: varchar('status', { length: 20 }),
  bonusAmount: numeric('bonus_amount', { precision: 12, scale: 2
 }),
  bonusPaid: boolean('bonus_paid'),
  hiredAt: timestamp('hired_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }),
});

export const fiGlDocuments = pgTable('fi_gl_documents', {
  id: integer('id').primaryKey(),
  documentNumber: varchar('document_number', { length: 50 }),
  documentDate: varchar('document_date', { length: 10 }),
  postingDate: varchar('posting_date', { length: 10 }),
  documentType: varchar('document_type', { length: 20 }),
  referenceType: varchar('reference_type', { length: 30 }),
  referenceId: varchar('reference_id'),
  description: text('description'),
  currency: varchar('currency', { length: 10 }),
  totalDebit: numeric('total_debit', { precision: 18, scale: 4
 }),
  totalCredit: numeric('total_credit', { precision: 18, scale: 4
 }),
  status: varchar('status', { length: 20 }),
  postedBy: integer('posted_by'),
  postedAt: timestamp('posted_at'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at'),
  costCenterId: integer('cost_center_id'),
  profitCenterId: integer('profit_center_id'),
  updatedAt: timestamp('updated_at'),
  docNumber: varchar('doc_number'),
  docType: varchar('doc_type'),
  reference: text('reference'),
  totalAmount: numeric('total_amount'),
});

export const financePayments = pgTable('finance_payments', {
  id: integer('id').primaryKey(),
  invoiceId: integer('invoice_id'),
  paymentDate: date('payment_date'),
  amount: numeric('amount', { precision: 15, scale: 2
 }),
  currency: varchar('currency', { length: 10 }),
  paymentMethod: varchar('payment_method', { length: 50 }),
  reference: varchar('reference', { length: 100 }),
  status: varchar('status', { length: 30 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const financialRatiosSnapshot = pgTable('financial_ratios_snapshot', {
  id: uuid('id').primaryKey(),
  period: varchar('period', { length: 7 }).notNull(),
  currentRatio: numeric('current_ratio', { precision: 12, scale: 6
 }),
  quickRatio: numeric('quick_ratio', { precision: 12, scale: 6
 }),
  grossMarginPct: numeric('gross_margin_pct', { precision: 8, scale: 4
 }),
  netMarginPct: numeric('net_margin_pct', { precision: 8, scale: 4
 }),
  roa: numeric('roa', { precision: 8, scale: 4
 }),
  roe: numeric('roe', { precision: 8, scale: 4
 }),
  debtToEquity: numeric('debt_to_equity', { precision: 12, scale: 6
 }),
  altmanZ: numeric('altman_z', { precision: 12, scale: 6
 }),
  altmanZone: varchar('altman_zone', { length: 20 }),
  revenue: numeric('revenue', { precision: 18, scale: 4
 }),
  netIncome: numeric('net_income', { precision: 18, scale: 4
 }),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const fineRules = pgTable('fine_rules', {
  id: integer('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  nameRu: varchar('name_ru', { length: 200 }),
  category: varchar('category', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  fineAmount: numeric('fine_amount', { precision: 12, scale: 2
 }),
  description: text('description'),
  escalationCount: integer('escalation_count'),
  escalationTo: varchar('escalation_to', { length: 20 }),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at', { withTimezone: true }),
});

// ── Promoted to lib/db (hr-goals.ts) — re-export canonical definitions ──────
export {
  hrAiAttendance,
  hrEmployeeGoals,
  hrEmployeeOneOnOnes,
  hrHealthAlerts,
  hrLateArrivals,
  hrOnboardingMilestones,
  hrOnboardingProcesses,
  hrUserBlocks,
} from '@workspace/db';

export const hrV2DailyReports = pgTable('hr_v2_daily_reports', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id'),
  reportDate: date('report_date'),
  tasksCompleted: text('tasks_completed'),
  tasksPlanned: text('tasks_planned'),
  blockers: text('blockers'),
  hoursWorked: numeric('hours_worked', { precision: 5, scale: 2
 }),
  status: varchar('status', { length: 30 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const hrV2Documents = pgTable('hr_v2_documents', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id'),
  documentType: varchar('document_type', { length: 50 }),
  title: text('title'),
  description: text('description'),
  status: varchar('status', { length: 30 }),
  fileUrl: text('file_url'),
  currentStep: integer('current_step'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const integrationShifts = pgTable('integration_shifts', {
  id: integer('id').primaryKey(),
  shiftDate: date('shift_date'),
  shiftNumber: integer('shift_number'),
  startTime: timestamp('start_time', { withTimezone: true }),
  endTime: timestamp('end_time', { withTimezone: true }),
  status: text('status'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const iotDevices = pgTable('iot_devices', {
  id: integer('id').primaryKey(),
  deviceCode: varchar('device_code', { length: 100 }),
  deviceType: varchar('device_type', { length: 50 }),
  name: text('name'),
  location: text('location'),
  status: varchar('status', { length: 30 }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  thresholds: jsonb('thresholds'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

// ── Kanban extended tables — canonical definitions in schema-kanban.ts ──────────
// These tables (kanbanCardComments, kanbanCardTags, kanbanCardWatchers,
// kanbanChecklistItems, kanbanChecklists, kanbanCoExecutors, kanbanFiles,
// kanbanNotifications, kanbanObservers, kanbanResultFiles, kanbanResults,
// kanbanTags, kanbanTemplates, kanbanTimeTracks) are defined in:
//   apps/api/src/shared/db/schema-kanban.ts
// — with proper .defaultRandom()/.defaultNow() defaults. Import from there.

export const labelPrintHistory = pgTable('label_print_history', {
  id: integer('id').primaryKey(),
  barcodeQueueId: integer('barcode_queue_id'),
  barcode: varchar('barcode', { length: 200 }).notNull(),
  materialId: integer('material_id'),
  movementId: integer('movement_id'),
  printerId: integer('printer_id'),
  printedBy: integer('printed_by'),
  copies: integer('copies').notNull(),
  format: varchar('format', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  printedAt: timestamp('printed_at').notNull(),
});

export const lowStockAlerts = pgTable('low_stock_alerts', {
  id: integer('id').primaryKey(),
  materialId: integer('material_id').notNull(),
  warehouseId: integer('warehouse_id'),
  currentStock: numeric('current_stock', { precision: 15, scale: 4
 }).notNull(),
  minStock: numeric('min_stock', { precision: 15, scale: 4
 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  isResolved: boolean('is_resolved').notNull(),
  notifiedTo: jsonb('notified_to'),
  notifiedAt: timestamp('notified_at'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull(),
});

export const masterCategories = pgTable('master_categories', {
  id: integer('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameRu: text('name_ru'),
  scope: text('scope'),
  parentId: integer('parent_id'),
  isActive: boolean('is_active'),
  sortOrder: integer('sort_order'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const materialLotsView = pgTable('material_lots_view', {
  id: integer('id').primaryKey(),
  lotNumber: varchar('lot_number'),
  batchNumber: varchar('batch_number', { length: 50 }),
  materialId: integer('material_id'),
  productId: integer('product_id'),
  warehouseId: integer('warehouse_id'),
  quantity: numeric('quantity', { precision: 18, scale: 4
 }),
  availableQuantity: numeric('available_quantity', { precision: 18, scale: 4
 }),
  unit: varchar('unit', { length: 20 }),
  expiryDate: timestamp('expiry_date'),
  productionDate: timestamp('production_date'),
  receivedDate: timestamp('received_date'),
  status: varchar('status', { length: 30 }),
  supplierId: integer('supplier_id'),
  supplierBatchNumber: varchar('supplier_batch_number', { length: 50 }),
  costPerUnit: numeric('cost_per_unit', { precision: 18, scale: 4
 }),
  defectReason: varchar('defect_reason', { length: 100 }),
  quarantineReason: varchar('quarantine_reason', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  isFifoLocked: boolean('is_fifo_locked'),
  binLocationId: integer('bin_location_id'),
  binCode: varchar('bin_code', { length: 50 }),
  binRow: varchar('bin_row', { length: 10 }),
  binShelf: varchar('bin_shelf', { length: 10 }),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
});

export const materialPriceHistory = pgTable('material_price_history', {
  id: integer('id').primaryKey(),
  materialId: integer('material_id').notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2
 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  supplierName: text('supplier_name'),
  purchaseDate: date('purchase_date'),
  movementId: integer('movement_id'),
  createdAt: timestamp('created_at').notNull(),
});

// materialSupplierRatings pgTable export OLIB TASHLANDI (2026-07-02, Q-46 — dead/orfan kod):
// material_supplier_ratings jadvali 0 qator, hech qanday repository/servis o'qimaydi/
// yozmaydi (faqat bir martalik setup-full-warehouse-system.mjs skriptida CREATE TABLE).
// DB jadvali DROP QILINMAGAN (loyiha qoidasi), faqat kod-darajasida uzildi. O'rniga:
// vendor_rating_unified VIEW (migrations/vendor-rating-unified-view-2026-07-02.sql) —
// mm_vendor_ratings + vendor_performance_metrics birlashtiradi (faol jadvallar).

export const mesOperations = pgTable('mes_operations', {
  id: integer('id').primaryKey(),
  sessionId: integer('session_id'),
  operationType: varchar('operation_type', { length: 50 }),
  status: varchar('status', { length: 30 }),
  startTime: timestamp('start_time', { withTimezone: true }),
  endTime: timestamp('end_time', { withTimezone: true }),
  durationMinutes: integer('duration_minutes'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const mesTelemetry = pgTable('mes_telemetry', {
  id: uuid('id').primaryKey(),
  machineId: text('machine_id').notNull(),
  metricType: varchar('metric_type', { length: 100 }),
  metricValue: numeric('metric_value', { precision: 14, scale: 3
 }),
  value: numeric('value', { precision: 14, scale: 3
 }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const mmDriverExpenses = pgTable('mm_driver_expenses', {
  id: integer('id').primaryKey(),
  driverId: integer('driver_id'),
  vehicleId: integer('vehicle_id'),
  orderId: integer('order_id'),
  expenseType: varchar('expense_type', { length: 50 }),
  amount: numeric('amount', { precision: 18, scale: 4
 }),
  currency: varchar('currency', { length: 5 }),
  receiptImageUrl: text('receipt_image_url'),
  ocrExtractedData: jsonb('ocr_extracted_data'),
  status: varchar('status', { length: 20 }),
  approvedBy: integer('approved_by'),
  notes: text('notes'),
  expenseDate: varchar('expense_date', { length: 10 }),
  createdAt: timestamp('created_at'),
});

export const mmDrivers = pgTable('mm_drivers', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id'),
  licenseNumber: text('license_number'),
  licenseClass: text('license_class'),
  licenseExpiry: date('license_expiry'),
  vehicleId: integer('vehicle_id'),
  status: text('status'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const operatorHourlyInvoices = pgTable('operator_hourly_invoices', {
  id: integer('id').primaryKey(),
  employeeId: integer('employee_id').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  unitsProduced: integer('units_produced').notNull(),
  unitsDefective: integer('units_defective').notNull(),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2
 }).notNull(),
  summaryText: text('summary_text'),
  pdfData: customType<{ data: Buffer }>({ dataType: () => 'bytea' })('pdf_data'),
  createdAt: timestamp('created_at').notNull(),
});

export const posGlPostings = pgTable('pos_gl_postings', {
  id: integer('id').primaryKey(),
  movementId: integer('movement_id'),
  debitAccount: varchar('debit_account', { length: 20 }).notNull(),
  creditAccount: varchar('credit_account', { length: 20 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2
 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 15, scale: 4
 }).notNull(),
  amountBase: numeric('amount_base', { precision: 15, scale: 2
 }).notNull(),
  description: text('description'),
  postingDate: date('posting_date').notNull(),
  postedBy: varchar('posted_by', { length: 20 }),
  isApproved: boolean('is_approved').notNull(),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').notNull(),
});

export const posInventoryPassport = pgTable('pos_inventory_passport', {
  id: integer('id').primaryKey(),
  movementId: integer('movement_id').notNull(),
  materialCode: varchar('material_code', { length: 100 }),
  supplierName: text('supplier_name'),
  contractNumber: varchar('contract_number', { length: 100 }),
  waybillNumber: varchar('waybill_number', { length: 100 }),
  arrivalDate: date('arrival_date').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 4
 }).notNull(),
  weightKg: numeric('weight_kg', { precision: 15, scale: 4
 }),
  volumeM3: numeric('volume_m3', { precision: 15, scale: 4
 }),
  certificateNumber: varchar('certificate_number', { length: 100 }),
  quarantineStartedAt: timestamp('quarantine_started_at'),
  qcStartedAt: timestamp('qc_started_at'),
  qcResult: varchar('qc_result', { length: 20 }),
  qcNote: text('qc_note'),
  transferredAt: timestamp('transferred_at'),
  createdAt: timestamp('created_at').notNull(),
});

export const posMovementsLegacyView = pgTable('pos_movements_legacy_view', {
  id: integer('id').primaryKey(),
  movementType: varchar('movement_type', { length: 20 }),
  movementTypeId: integer('movement_type_id'),
  status: varchar('status'),
  materialId: integer('material_id'),
  quantity: numeric('quantity', { precision: 18, scale: 4
 }),
  unit: varchar('unit', { length: 20 }),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at'),
  notes: text('notes'),
  fromWarehouseId: integer('from_warehouse_id'),
  toWarehouseId: integer('to_warehouse_id'),
  qcStatus: varchar('qc_status'),
  movementNumber: text('movement_number'),
});

export const posShiftAudit = pgTable('pos_shift_audit', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull(),
  loggedInAt: timestamp('logged_in_at').notNull(),
  loggedOutAt: timestamp('logged_out_at'),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  sessionTokenHash: varchar('session_token_hash', { length: 128 }),
  createdAt: timestamp('created_at').notNull(),
});

export const posWarehouseStockView = pgTable('pos_warehouse_stock_view', {
  stockId: integer('stock_id'),
  warehouseId: integer('warehouse_id'),
  warehouseCode: varchar('warehouse_code', { length: 50 }),
  warehouseName: text('warehouse_name'),
  warehouseType: varchar('warehouse_type', { length: 30 }),
  materialId: integer('material_id'),
  materialCode: varchar('material_code', { length: 50 }),
  materialName: text('material_name'),
  materialNameRu: text('material_name_ru'),
  category: varchar('category', { length: 30 }),
  materialType: varchar('material_type', { length: 30 }),
  unitOfMeasure: varchar('unit_of_measure', { length: 20 }),
  quantity: numeric('quantity', { precision: 18, scale: 4
 }),
  reservedQuantity: numeric('reserved_quantity', { precision: 18, scale: 4
 }),
  availableQuantity: numeric('available_quantity', { precision: 18, scale: 4
 }),
  minStock: numeric('min_stock', { precision: 18, scale: 4
 }),
  maxStock: numeric('max_stock', { precision: 18, scale: 4
 }),
  unitPrice: numeric('unit_price', { precision: 18, scale: 4
 }),
  currency: varchar('currency', { length: 10 }),
  stockStatus: text('stock_status'),
  lastUpdatedAt: timestamp('last_updated_at'),
  isActive: boolean('is_active'),
});

export const positionFolderContent = pgTable('position_folder_content', {
  id: integer('id').primaryKey(),
  orgFunctionId: integer('org_function_id').notNull(),
  contentType: varchar('content_type', { length: 20 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull(),
  isMandatory: boolean('is_mandatory').notNull(),
  isActive: boolean('is_active').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const ppOrders = pgTable('pp_orders', {
  id: integer('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }),
  productId: integer('product_id'),
  quantity: integer('quantity'),
  customerName: text('customer_name'),
  customerId: integer('customer_id'),
  dueDate: varchar('due_date', { length: 10 }),
  priority: varchar('priority', { length: 20 }),
  status: varchar('status', { length: 20 }),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
  customerTier: text('customer_tier'),
  stateVersion: integer('state_version'),
  totalAmount: numeric('total_amount'),
  currency: text('currency'),
  assignedSalesManager: integer('assigned_sales_manager'),
  tenantId: uuid('tenant_id'),
  estimatedDeliveryAt: timestamp('estimated_delivery_at', { withTimezone: true }),
  actualDeliveryAt: timestamp('actual_delivery_at', { withTimezone: true }),
  customerApproved: boolean('customer_approved'),
  techCardConfirmedAt: timestamp('tech_card_confirmed_at', { withTimezone: true }),
  customerSignatureUrl: text('customer_signature_url'),
  cashierId: integer('cashier_id'),
  paymentMethod: text('payment_method'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  quotationId: integer('quotation_id'),
  managerId: integer('manager_id'),
  advancePercent: numeric('advance_percent'),
  advancePaid: numeric('advance_paid'),
  balanceDue: numeric('balance_due'),
  deliveryDate: varchar('delivery_date'),
  deliveryAddress: text('delivery_address'),
  deliveryType: varchar('delivery_type'),
  receiverName: text('receiver_name'),
  receiverPhone: varchar('receiver_phone'),
  specialInstructions: text('special_instructions'),
  cancelReason: text('cancel_reason'),
  cancelledAt: timestamp('cancelled_at'),
  deliveredAt: timestamp('delivered_at'),
  warehouseEntryDate: timestamp('warehouse_entry_date'),
  productionOrderId: integer('production_order_id'),
  version: bigint('version', { mode: 'number' }),
  advanceStatus: varchar('advance_status'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  companyId: integer('company_id'),
});

export const ppRouting = pgTable('pp_routing', {
  id: integer('id').primaryKey(),
  productId: integer('product_id'),
  routingName: text('routing_name'),
  isActive: boolean('is_active'),
  version: varchar('version', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const ppWorkCenters = pgTable('pp_work_centers', {
  id: integer('id').primaryKey(),
  code: varchar('code', { length: 50 }),
  name: text('name'),
  nameRu: text('name_ru'),
  type: varchar('type', { length: 20 }),
  capacity: integer('capacity'),
  departmentId: integer('department_id'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at'),
  deletedAt: timestamp('deleted_at'),
  hoursPerDay: numeric('hours_per_day', { precision: 5, scale: 2
 }),
  department: text('department'),
  orgDepartmentId: integer('org_department_id'),
  costPerHour: numeric('cost_per_hour'),
  certificationLmsCourseId: uuid('certification_lms_course_id'),
  updatedAt: timestamp('updated_at'),
  nameUz: varchar('name_uz'),
  requiredSkillName: varchar('required_skill_name'),
  capacityPerHour: numeric('capacity_per_hour'),
});

export const priceTier = pgTable('price_tier', {
  id: uuid('id').primaryKey(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  tierName: varchar('tier_name', { length: 50 }).notNull(),
  minQty: integer('min_qty').notNull(),
  maxQty: integer('max_qty'),
  priceUzs: numeric('price_uzs', { precision: 18, scale: 4
 }).notNull(),
  validFrom: date('valid_from').notNull(),
  validTo: date('valid_to'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  productId: integer('product_id'),
  createdBy: integer('created_by'),
});

export const purchaseRequests = pgTable('purchase_requests', {
  id: uuid('id').primaryKey(),
  materialId: integer('material_id').notNull(),
  qty: numeric('qty', { precision: 12, scale: 2
 }).notNull(),
  reason: text('reason'),
  requestedBy: varchar('requested_by', { length: 40 }),
  requestedByUserId: integer('requested_by_user_id'),
  approvedByUserId: integer('approved_by_user_id'),
  approvedAt: timestamp('approved_at'),
  status: varchar('status', { length: 20 }).notNull(),
  preferredSupplierId: integer('preferred_supplier_id'),
  estimatedCost: numeric('estimated_cost', { precision: 14, scale: 2
 }),
  currency: varchar('currency', { length: 10 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const qcAiTrend = pgTable('qc_ai_trend', {
  id: integer('id').primaryKey(),
  period: varchar('period', { length: 20 }),
  passRate: numeric('pass_rate', { precision: 8, scale: 4
 }),
  defectCount: integer('defect_count'),
  dpmo: numeric('dpmo', { precision: 18, scale: 4
 }),
  sigmaLevel: numeric('sigma_level', { precision: 8, scale: 4
 }),
  totalInspections: integer('total_inspections'),
  trendDirection: varchar('trend_direction', { length: 20 }),
  aiInsight: text('ai_insight'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const qcDefectsExtended = pgTable('qc_defects_extended', {
  id: integer('id').primaryKey(),
  orderId: integer('order_id'),
  defectType: varchar('defect_type', { length: 100 }),
  defectCode: varchar('defect_code', { length: 50 }),
  description: text('description'),
  severity: varchar('severity', { length: 20 }),
  status: varchar('status', { length: 50 }),
  resolution: varchar('resolution', { length: 50 }),
  costImpact: numeric('cost_impact', { precision: 18, scale: 2
 }),
  reportedBy: integer('reported_by'),
  resolvedBy: integer('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const roomReferenceComparisons = pgTable('room_reference_comparisons', {
  id: integer('id').primaryKey(),
  roomId: integer('room_id').notNull(),
  deviationScore: numeric('deviation_score', { precision: 4, scale: 3
 }),
  issues: jsonb('issues'),
  notes: text('notes'),
  comparedAt: timestamp('compared_at').notNull(),
});

export const roomReferences = pgTable('room_references', {
  id: integer('id').primaryKey(),
  roomName: varchar('room_name', { length: 200 }).notNull(),
  referenceImageUrl: text('reference_image_url').notNull(),
  deptHeadId: integer('dept_head_id'),
  isActive: boolean('is_active').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export const sapSalesOrders = pgTable('sap_sales_orders', {
  id: integer('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 100 }),
  customerId: integer('customer_id'),
  status: varchar('status', { length: 50 }),
  totalAmount: numeric('total_amount', { precision: 18, scale: 2
 }),
  currency: varchar('currency', { length: 10 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const sdInvoices = pgTable('sd_invoices', {
  id: uuid('id').primaryKey(),
  invoiceNumber: text('invoice_number'),
  salesOrderId: uuid('sales_order_id'),
  customerName: text('customer_name'),
  customerId: uuid('customer_id'),
  items: text('items'),
  subtotal: numeric('subtotal'),
  taxAmount: numeric('tax_amount'),
  totalAmount: numeric('total_amount'),
  paidAmount: numeric('paid_amount'),
  status: text('status'),
  dueDate: timestamp('due_date'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
  deletedAt: timestamp('deleted_at'),
  number: varchar('number'),
  proposalId: integer('proposal_id'),
  contactId: integer('contact_id'),
  companyId: integer('company_id'),
  stageId: varchar('stage_id'),
  currency: varchar('currency'),
  discountAmount: numeric('discount_amount'),
  paidDate: timestamp('paid_date'),
  terms: text('terms'),
  notes: text('notes'),
  templateId: integer('template_id'),
  createdById: integer('created_by_id'),
  amount: numeric('amount'),
  invoiceNo: text('invoice_no'),
  vendorId: integer('vendor_id'),
  type: text('type'),
  invoiceDate: date('invoice_date'),
  orderId: integer('order_id'),
});

export const standardCost = pgTable('standard_cost', {
  id: uuid('id').primaryKey(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  period: varchar('period', { length: 7 }).notNull(),
  stdMaterialUzs: numeric('std_material_uzs', { precision: 18, scale: 4
 }).notNull(),
  stdLaborUzs: numeric('std_labor_uzs', { precision: 18, scale: 4
 }).notNull(),
  stdOverheadUzs: numeric('std_overhead_uzs', { precision: 18, scale: 4
 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  productId: integer('product_id'),
  stdTotalUzs: numeric('std_total_uzs', { precision: 18, scale: 4
 }),
  createdBy: integer('created_by'),
});

export const threeWayMatchLog = pgTable('three_way_match_log', {
  id: integer('id').primaryKey(),
  movementId: integer('movement_id'),
  purchaseOrderNo: varchar('purchase_order_no', { length: 100 }),
  receiptNo: varchar('receipt_no', { length: 100 }),
  invoiceNo: varchar('invoice_no', { length: 100 }),
  poQuantity: numeric('po_quantity', { precision: 15, scale: 4
 }),
  receivedQuantity: numeric('received_quantity', { precision: 15, scale: 4
 }),
  invoicedQuantity: numeric('invoiced_quantity', { precision: 15, scale: 4
 }),
  poAmount: numeric('po_amount', { precision: 15, scale: 2
 }),
  invoiceAmount: numeric('invoice_amount', { precision: 15, scale: 2
 }),
  qtyVariance: numeric('qty_variance', { precision: 15, scale: 4
 }),
  amountVariance: numeric('amount_variance', { precision: 15, scale: 2
 }),
  matchStatus: varchar('match_status', { length: 20 }).notNull(),
  notes: text('notes'),
  matchedAt: timestamp('matched_at'),
  matchedBy: integer('matched_by'),
  createdAt: timestamp('created_at').notNull(),
});

export const units = pgTable('units', {
  code: text('code').notNull(),
  name: text('name').notNull(),
  nameRu: text('name_ru'),
  category: text('category'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const varianceReport = pgTable('variance_report', {
  id: uuid('id').primaryKey(),
  orderId: integer('order_id'),
  mpv: numeric('mpv', { precision: 18, scale: 4
 }).notNull(),
  mqv: numeric('mqv', { precision: 18, scale: 4
 }).notNull(),
  lrv: numeric('lrv', { precision: 18, scale: 4
 }).notNull(),
  lev: numeric('lev', { precision: 18, scale: 4
 }).notNull(),
  ov: numeric('ov', { precision: 18, scale: 4
 }).notNull(),
  totalVariance: numeric('total_variance', { precision: 18, scale: 4
 }).notNull(),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }),
});

export const warehouseEmployees = pgTable('warehouse_employees', {
  id: integer('id').primaryKey(),
  warehouseId: integer('warehouse_id').notNull(),
  userId: integer('user_id').notNull(),
  role: varchar('role', { length: 30 }).notNull(),
  isPrimary: boolean('is_primary').notNull(),
  assignedAt: timestamp('assigned_at').notNull(),
  assignedBy: integer('assigned_by'),
  removedAt: timestamp('removed_at'),
  notes: text('notes'),
});

export const warehouseKpiCache = pgTable('warehouse_kpi_cache', {
  id: integer('id').primaryKey(),
  warehouseId: integer('warehouse_id'),
  metricKey: varchar('metric_key', { length: 50 }).notNull(),
  metricValue: numeric('metric_value', { precision: 15, scale: 4
 }).notNull(),
  metricUnit: varchar('metric_unit', { length: 20 }),
  calculatedAt: timestamp('calculated_at').notNull(),
  expiresAt: timestamp('expires_at'),
});

export const warehouseRollUsage = pgTable('warehouse_roll_usage', {
  id: uuid('id').primaryKey(),
  rollId: uuid('roll_id').notNull(),
  usedWeightKg: numeric('used_weight_kg', { precision: 10, scale: 2
 }).notNull(),
  remainingWeightKg: numeric('remaining_weight_kg', { precision: 10, scale: 2
 }).notNull(),
  productionOrderId: varchar('production_order_id', { length: 80 }),
  usedByUserId: integer('used_by_user_id'),
  usedAt: timestamp('used_at').notNull(),
});

export const warehouseRolls = pgTable('warehouse_rolls', {
  id: uuid('id').primaryKey(),
  rollId: varchar('roll_id', { length: 80 }).notNull(),
  articleCode: varchar('article_code', { length: 80 }).notNull(),
  supplierId: integer('supplier_id'),
  supplierName: varchar('supplier_name', { length: 200 }),
  initialWeightKg: numeric('initial_weight_kg', { precision: 10, scale: 2
 }).notNull(),
  remainingWeightKg: numeric('remaining_weight_kg', { precision: 10, scale: 2
 }).notNull(),
  warehouseId: varchar('warehouse_id', { length: 80 }),
  binLocation: varchar('bin_location', { length: 120 }),
  qrCodeUrl: varchar('qr_code_url', { length: 500 }),
  qrCodePayload: text('qr_code_payload'),
  receivedDate: timestamp('received_date').notNull(),
  expiresAt: timestamp('expires_at'),
  isCritical: boolean('is_critical').notNull(),
  isLow: boolean('is_low').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const wmsInventory = pgTable('wms_inventory', {
  id: integer('id').primaryKey(),
  warehouseId: integer('warehouse_id'),
  materialId: integer('material_id'),
  quantity: numeric('quantity', { precision: 15, scale: 2
 }),
  reservedQuantity: numeric('reserved_quantity', { precision: 15, scale: 2
 }),
  availableQuantity: numeric('available_quantity', { precision: 15, scale: 2
 }),
  unit: varchar('unit', { length: 20 }),
  reorderPoint: numeric('reorder_point', { precision: 15, scale: 2
 }),
  lastCountedAt: timestamp('last_counted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

