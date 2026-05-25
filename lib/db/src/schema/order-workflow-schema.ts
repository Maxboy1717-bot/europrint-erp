/**
 * @module order-workflow-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import {
  pgTable, uuid, text, numeric, integer, boolean,
  timestamp, jsonb, index, uniqueIndex, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── 1. ow_orders ────────────────────────────────────────────────────────────
export const owOrders = pgTable('ow_orders', {
  id:                  uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderNumber:         text('order_number').notNull().unique(),
  customerId:          integer('customer_id'),
  customerTier:        text('customer_tier').notNull().default('NEW'),
  status:              text('status').notNull().default('DRAFT'),
  stateVersion:        integer('state_version').notNull().default(0),
  totalAmount:         numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0'),
  currency:            text('currency').notNull().default('UZS'),
  assignedSalesManager: integer('assigned_sales_manager'),
  estimatedDeliveryAt: timestamp('estimated_delivery_at', { withTimezone: true }),
  actualDeliveryAt:    timestamp('actual_delivery_at', { withTimezone: true }),
  tenantId:            uuid('tenant_id'),
  customerApproved:    boolean('customer_approved').notNull().default(false),
  techCardConfirmedAt:   timestamp('tech_card_confirmed_at', { withTimezone: true }),
  customerSignatureUrl:  text('customer_signature_url'),
  createdAt:           timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
}, (t) => [
  check('ow_total_positive', sql`${t.totalAmount} >= 0`),
  check('ow_tier_valid', sql`${t.customerTier} IN ('NEW','REGULAR','VIP','FROZEN')`),
  index('ow_orders_status_idx').on(t.status),
  index('ow_orders_customer_idx').on(t.customerId),
]);

// ─── 2. ow_order_lines ───────────────────────────────────────────────────────
export const owOrderLines = pgTable('ow_order_lines', {
  id:              uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:         uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  sku:             text('sku').notNull(),
  description:     text('description'),
  qty:             numeric('qty', { precision: 14, scale: 3 }).notNull(),
  unitPrice:       numeric('unit_price', { precision: 14, scale: 4 }).notNull(),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  sumNet:          numeric('sum_net', { precision: 14, scale: 2 }),
  techCardId:      uuid('tech_card_id'),
}, (t) => [
  check('ow_line_qty_positive',   sql`${t.qty} > 0`),
  check('ow_line_discount_range', sql`${t.discountPercent} BETWEEN 0 AND 100`),
  index('ow_order_lines_order_idx').on(t.orderId),
]);

// ─── 3. ow_order_surveys ─────────────────────────────────────────────────────
export const owOrderSurveys = pgTable('ow_order_surveys', {
  id:                   uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:              uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  fields:               jsonb('fields').notNull().default({}),
  aiAutofillConfidence: numeric('ai_autofill_confidence', { precision: 4, scale: 3 }),
  completenessScore:    numeric('completeness_score', { precision: 4, scale: 3 }).notNull().default('0'),
  completedBy:          integer('completed_by'),
  completedAt:          timestamp('completed_at', { withTimezone: true }),
}, (t) => [
  check('ow_survey_completeness', sql`${t.completenessScore} BETWEEN 0 AND 1`),
]);

// ─── 4. ow_order_samples ─────────────────────────────────────────────────────
export const owOrderSamples = pgTable('ow_order_samples', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:          uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  iteration:        integer('iteration').notNull().default(1),
  requestedAt:      timestamp('requested_at', { withTimezone: true }).default(sql`now()`),
  producedAt:       timestamp('produced_at', { withTimezone: true }),
  customerDecision: text('customer_decision').default('PENDING'),
  feedback:         jsonb('feedback'),
  rejectionReason:  text('rejection_reason'),
}, (t) => [
  check('ow_sample_decision', sql`${t.customerDecision} IN ('APPROVED','REJECTED','PENDING')`),
]);

// ─── 5. ow_contracts ─────────────────────────────────────────────────────────
export const owContracts = pgTable('ow_contracts', {
  id:                 uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:            uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  contractNumber:     text('contract_number').notNull().unique(),
  signedAt:           timestamp('signed_at', { withTimezone: true }),
  fileUrl:            text('file_url'),
  templateId:         uuid('template_id'),
  aiGenerated:        boolean('ai_generated').notNull().default(true),
  signedByCustomerAt: timestamp('signed_by_customer_at', { withTimezone: true }),
  signedByCompanyAt:  timestamp('signed_by_company_at', { withTimezone: true }),
  version:            integer('version').notNull().default(1),
});

// ─── 6. ow_tech_cards ────────────────────────────────────────────────────────
export const owTechCards = pgTable('ow_tech_cards', {
  id:                     uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:                uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  orderLineId:            uuid('order_line_id'),
  version:                integer('version').notNull().default(1),
  parentId:               uuid('parent_id'),
  status:                 text('status').notNull().default('DRAFT'),
  content:                jsonb('content').notNull().default({}),
  aiGeneratedFrom:        uuid('ai_generated_from'),
  approvedBy:             integer('approved_by'),
  approvedAt:             timestamp('approved_at', { withTimezone: true }),
  immutableAfterApproval: boolean('immutable_after_approval').notNull().default(true),
}, (t) => [
  check('ow_techcard_status', sql`${t.status} IN ('DRAFT','REVIEW','CONFIRMED','OBSOLETE')`),
  index('ow_tech_cards_order_idx').on(t.orderId),
]);

// ─── 7. ow_molds ─────────────────────────────────────────────────────────────
export const owMolds = pgTable('ow_molds', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:       uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  vendor:        text('vendor').notNull(),
  orderSentAt:   timestamp('order_sent_at', { withTimezone: true }),
  expectedAt:    timestamp('expected_at', { withTimezone: true }),
  receivedAt:    timestamp('received_at', { withTimezone: true }),
  status:        text('status').notNull().default('ORDERED'),
  rejectReason:  text('reject_reason'),
  photoProofUrl: text('photo_proof_url'),
}, (t) => [
  check('ow_mold_vendor', sql`${t.vendor} IN ('Tashkent','Europrint','Flexo','Internal')`),
  check('ow_mold_status', sql`${t.status} IN ('ORDERED','IN_TRANSIT','RECEIVED','REJECTED')`),
]);

// ─── 8. ow_cliches ───────────────────────────────────────────────────────────
export const owCliches = pgTable('ow_cliches', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:          uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  clicheType:       text('cliche_type').notNull(),
  vendor:           text('vendor').notNull(),
  orderSentAt:      timestamp('order_sent_at', { withTimezone: true }),
  arrivedAt:        timestamp('arrived_at', { withTimezone: true }),
  positionedOnFilm: boolean('positioned_on_film').notNull().default(false),
  readyForFlexo:    boolean('ready_for_flexo').notNull().default(false),
  status:           text('status').notNull().default('ORDERED'),
}, (t) => [
  check('ow_cliche_type', sql`${t.clicheType} IN ('photopolymer','embossing','positive_film')`),
]);

// ─── 9. ow_material_requirements ─────────────────────────────────────────────
export const owMaterialRequirements = pgTable('ow_material_requirements', {
  id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:     uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  materialId:  text('material_id').notNull(),
  qtyRequired: numeric('qty_required', { precision: 14, scale: 3 }).notNull(),
  qtyReserved: numeric('qty_reserved', { precision: 14, scale: 3 }).notNull().default('0'),
  qtyIssued:   numeric('qty_issued',   { precision: 14, scale: 3 }).notNull().default('0'),
  labPassed:   boolean('lab_passed').notNull().default(false),
  labPassedAt: timestamp('lab_passed_at', { withTimezone: true }),
  status:      text('status').notNull().default('NEEDED'),
}, (t) => [
  check('ow_mat_status', sql`${t.status} IN ('NEEDED','RESERVED','ISSUED','RETURNED')`),
  index('ow_mat_req_order_idx').on(t.orderId),
]);

// ─── 10. ow_production_plans ─────────────────────────────────────────────────
export const owProductionPlans = pgTable('ow_production_plans', {
  id:                 uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:            uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  machineId:          text('machine_id').notNull(),
  plannedStart:       timestamp('planned_start', { withTimezone: true }).notNull(),
  plannedEnd:         timestamp('planned_end',   { withTimezone: true }).notNull(),
  priority:           integer('priority').notNull().default(3),
  aiOptimizerVersion: text('ai_optimizer_version'),
  createdAt:          timestamp('created_at', { withTimezone: true }).default(sql`now()`),
}, (t) => [
  check('ow_plan_priority',    sql`${t.priority} BETWEEN 1 AND 5`),
  check('ow_plan_dates_valid', sql`${t.plannedEnd} > ${t.plannedStart}`),
]);

// ─── 11. ow_work_orders ──────────────────────────────────────────────────────
export const owWorkOrders = pgTable('ow_work_orders', {
  id:               uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productionPlanId: uuid('production_plan_id').notNull().references(() => owProductionPlans.id, { onDelete: 'cascade' }),
  orderLineId:      uuid('order_line_id'),
  machineId:        text('machine_id').notNull(),
  operatorId:       integer('operator_id'),
  status:           text('status').notNull().default('QUEUED'),
  qtyTarget:        numeric('qty_target', { precision: 14, scale: 3 }).notNull(),
  qtyGood:          numeric('qty_good',   { precision: 14, scale: 3 }).notNull().default('0'),
  qtyScrap:         numeric('qty_scrap',  { precision: 14, scale: 3 }).notNull().default('0'),
  startedAt:        timestamp('started_at',   { withTimezone: true }),
  completedAt:      timestamp('completed_at', { withTimezone: true }),
}, (t) => [
  check('ow_wo_status', sql`${t.status} IN ('QUEUED','IN_PROGRESS','PAUSED','DONE','REWORK')`),
  check('ow_wo_scrap',  sql`${t.qtyScrap} <= ${t.qtyTarget}`),
]);

// ─── 12. ow_qc_results ───────────────────────────────────────────────────────
export const owQcResults = pgTable('ow_qc_results', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workOrderId:   uuid('work_order_id').notNull().references(() => owWorkOrders.id, { onDelete: 'cascade' }),
  inspectorId:   integer('inspector_id'),
  aiVisionAgent: text('ai_vision_agent'),
  verdict:       text('verdict').notNull(),
  colorDeltaE:   numeric('color_delta_e', { precision: 6, scale: 3 }),
  defectCodes:   jsonb('defect_codes'),
  photoUrls:     text('photo_urls').array(),
  inspectedAt:   timestamp('inspected_at', { withTimezone: true }).default(sql`now()`),
  aiConfidence:  numeric('ai_confidence', { precision: 4, scale: 3 }),
  humanOverride: boolean('human_override').notNull().default(false),
}, (t) => [
  check('ow_qc_verdict', sql`${t.verdict} IN ('PASS','REWORK','SCRAP')`),
  check('ow_qc_delta_e', sql`${t.colorDeltaE} >= 0`),
]);

// ─── 13. ow_packaging_records ────────────────────────────────────────────────
export const owPackagingRecords = pgTable('ow_packaging_records', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workOrderId:   uuid('work_order_id').notNull().references(() => owWorkOrders.id, { onDelete: 'cascade' }),
  palletBarcode: text('pallet_barcode').notNull().unique(),
  qty:           numeric('qty', { precision: 14, scale: 3 }).notNull(),
  packagingType: text('packaging_type'),
  packedBy:      integer('packed_by'),
  packedAt:      timestamp('packed_at', { withTimezone: true }).default(sql`now()`),
});

// ─── 14. ow_fg_transfers ─────────────────────────────────────────────────────
export const owFgTransfers = pgTable('ow_fg_transfers', {
  id:                 uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:            uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  fromLocation:       text('from_location').notNull().default('PRODUCTION'),
  toLocation:         text('to_location').notNull().default('FG_WAREHOUSE'),
  approvedByProdHead: integer('approved_by_prod_head'),
  approvedByFgHead:   integer('approved_by_fg_head'),
  transferredAt:      timestamp('transferred_at', { withTimezone: true }),
});

// ─── 15. ow_shipping_requests ────────────────────────────────────────────────
export const owShippingRequests = pgTable('ow_shipping_requests', {
  id:              uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:         uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  requestedBy:     integer('requested_by'),
  requestedAt:     timestamp('requested_at', { withTimezone: true }).default(sql`now()`),
  approvedBy:      integer('approved_by'),
  deliveryAddress: jsonb('delivery_address').notNull().default({}),
  contactPhone:    text('contact_phone'),
  paymentVerified: boolean('payment_verified').notNull().default(false),
});

// ─── 16. ow_deliveries ───────────────────────────────────────────────────────
export const owDeliveries = pgTable('ow_deliveries', {
  id:                   uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shippingRequestId:    uuid('shipping_request_id').notNull().references(() => owShippingRequests.id, { onDelete: 'cascade' }),
  truckId:              text('truck_id'),
  driverId:             integer('driver_id'),
  routePlan:            jsonb('route_plan'),
  dispatchedAt:         timestamp('dispatched_at',  { withTimezone: true }),
  arrivedAt:            timestamp('arrived_at',     { withTimezone: true }),
  customerSignatureUrl: text('customer_signature_url'),
  gpsTrackUrl:          text('gps_track_url'),
  status:               text('status').notNull().default('DISPATCHED'),
}, (t) => [
  check('ow_delivery_status', sql`${t.status} IN ('DISPATCHED','IN_TRANSIT','DELIVERED','RETURNED')`),
]);

// ─── 17. ow_rework_events ────────────────────────────────────────────────────
export const owReworkEvents = pgTable('ow_rework_events', {
  id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:     uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  workOrderId: uuid('work_order_id'),
  trigger:     text('trigger').notNull(),
  rootCause:   text('root_cause'),
  qtyAffected: numeric('qty_affected', { precision: 14, scale: 3 }),
  costImpact:  numeric('cost_impact',  { precision: 14, scale: 2 }),
  createdAt:   timestamp('created_at', { withTimezone: true }).default(sql`now()`),
}, (t) => [
  check('ow_rework_trigger', sql`${t.trigger} IN ('AI_VISION_FAIL','HUMAN_REJECT','LAB_FAIL')`),
]);

// ─── 18. ow_pallet_recoveries ────────────────────────────────────────────────
export const owPalletRecoveries = pgTable('ow_pallet_recoveries', {
  id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  palletBarcode:  text('pallet_barcode').notNull(),
  orderId:        uuid('order_id').references(() => owOrders.id, { onDelete: 'set null' }),
  recoverableQty: numeric('recoverable_qty', { precision: 14, scale: 3 }),
  scrapQty:       numeric('scrap_qty',       { precision: 14, scale: 3 }),
  recoveredAt:    timestamp('recovered_at',  { withTimezone: true }),
  recoveredBy:    integer('recovered_by'),
});

// ─── Extra: ow_credit_limits ─────────────────────────────────────────────────
export const owCreditLimits = pgTable('ow_credit_limits', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  customerId:   integer('customer_id').notNull(),
  tier:         text('tier').notNull().default('NEW'),
  limitAmount:  numeric('limit_amount', { precision: 14, scale: 2 }).notNull().default('0'),
  assessedAt:   timestamp('assessed_at',    { withTimezone: true }),
  assessedBy:   integer('assessed_by'),
  nextReviewAt: timestamp('next_review_at', { withTimezone: true }),
}, (t) => [
  check('ow_credit_limit_pos', sql`${t.limitAmount} >= 0`),
  check('ow_credit_tier',      sql`${t.tier} IN ('NEW','REGULAR','VIP','FROZEN')`),
  uniqueIndex('ow_credit_limit_customer_uq').on(t.customerId),
]);

// ─── Extra: ow_payment_plan_entries ──────────────────────────────────────────
export const owPaymentPlanEntries = pgTable('ow_payment_plan_entries', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:      uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  sequence:     integer('sequence').notNull(),
  dueType:      text('due_type').notNull(),
  dueCondition: jsonb('due_condition'),
  percent:      numeric('percent', { precision: 5, scale: 2 }).notNull(),
  amount:       numeric('amount',  { precision: 14, scale: 2 }).notNull(),
  paidAt:       timestamp('paid_at', { withTimezone: true }),
  paidRef:      text('paid_ref'),
  status:       text('status').notNull().default('PENDING'),
}, (t) => [
  check('ow_payment_due_type',  sql`${t.dueType} IN ('ADVANCE','MILESTONE','NET_30','ON_DELIVERY')`),
  check('ow_payment_status',    sql`${t.status} IN ('PENDING','PARTIAL','PAID','OVERDUE','WRITTEN_OFF')`),
  check('ow_payment_pct_range', sql`${t.percent} BETWEEN 0 AND 100`),
  uniqueIndex('ow_payment_order_seq_uq').on(t.orderId, t.sequence),
]);

// ─── Extra: ow_document_workflow_instances ───────────────────────────────────
export const owDocumentWorkflowInstances = pgTable('ow_document_workflow_instances', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  documentType: text('document_type').notNull(),
  documentId:   uuid('document_id').notNull(),
  currentStep:  integer('current_step').notNull().default(0),
  routingPath:  jsonb('routing_path').notNull().default([]),
  status:       text('status').notNull().default('IN_PROGRESS'),
  createdAt:    timestamp('created_at', { withTimezone: true }).default(sql`now()`),
}, (t) => [
  check('ow_doc_workflow_status', sql`${t.status} IN ('IN_PROGRESS','APPROVED','REJECTED','ESCALATED')`),
  index('ow_doc_wf_doc_idx').on(t.documentId),
]);

// ─── State history ───────────────────────────────────────────────────────────
export const owOrderStatusHistory = pgTable('ow_order_status_history', {
  id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId:      uuid('order_id').notNull().references(() => owOrders.id, { onDelete: 'cascade' }),
  fromStatus:   text('from_status'),
  toStatus:     text('to_status').notNull(),
  changedBy:    integer('changed_by'),
  reason:       text('reason'),
  stateVersion: integer('state_version').notNull().default(0),
  changedAt:    timestamp('changed_at', { withTimezone: true }).default(sql`now()`),
}, (t) => [
  index('ow_status_history_order_idx').on(t.orderId),
]);

export type OwOrder              = typeof owOrders.$inferSelect;
export type OwOrderLine          = typeof owOrderLines.$inferSelect;
export type OwPaymentPlanEntry   = typeof owPaymentPlanEntries.$inferSelect;
export type OwTechCard           = typeof owTechCards.$inferSelect;
export type OwMold               = typeof owMolds.$inferSelect;
export type OwCliche             = typeof owCliches.$inferSelect;
export type OwMaterialReq        = typeof owMaterialRequirements.$inferSelect;
export type OwProductionPlan     = typeof owProductionPlans.$inferSelect;
export type OwWorkOrder          = typeof owWorkOrders.$inferSelect;
export type OwDelivery           = typeof owDeliveries.$inferSelect;
export type OwDocWorkflowInstance = typeof owDocumentWorkflowInstances.$inferSelect;
