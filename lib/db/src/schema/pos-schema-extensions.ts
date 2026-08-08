/**
 * POS Schema Extensions — v3
 * New tables: stock_ledger, movement_confirmations, barcode_map,
 * material_passports, stock_alerts, gl_posting_log,
 * inventory_plans, inventory_variances
 */

import { numericMoney } from './numeric-money';
import { sql } from 'drizzle-orm';
import {
  bigserial, serial, pgTable, text, varchar, integer,
  boolean, timestamp, jsonb, index, pgEnum, inet, numeric,
} from 'drizzle-orm/pg-core';

// ─── ENUM-LAR ────────────────────────────────────────────────────────────────

export const confirmStepEnum = pgEnum('pos_confirm_step_enum', [
  'DRAFT', 'KARANTIN', 'QC', 'OMBOR', 'FINANCE', 'AI_GL',
]);

export const confirmDecisionEnum = pgEnum('pos_confirm_decision_enum', [
  'APPROVED', 'REJECTED', 'REWORK',
  // POS-19 #131 (2026-07-11, owner schema-grant -- Q-35): topshirilgan vs
  // qabul qilingan miqdor mos kelmasa qaror shu holatga o'tadi (nizo).
  'DISPUTED',
]);

export const barcodeTypeEnum = pgEnum('pos_barcode_type_enum', [
  'EAN13', 'CODE128', 'QR',
]);

export const stockAlertTypeEnum = pgEnum('pos_stock_alert_type_enum', [
  'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRY_NEAR', 'EXPIRED', 'NEGATIVE', 'OVERSTOCK',
]);

export const stockAlertSeverityEnum = pgEnum('pos_stock_alert_severity_enum', [
  'INFO', 'WARNING', 'CRITICAL',
]);

export const glStageNameEnum = pgEnum('pos_gl_stage_name_enum', [
  'EXTRACT', 'CLASSIFY', 'COMPUTE', 'VERIFY', 'POST',
]);

export const glPostingStatusEnum = pgEnum('pos_gl_posting_status_enum', [
  'PROCESSING', 'AWAITING_REVIEW', 'APPROVED', 'REJECTED', 'POSTED',
]);

export const inventoryPlanStatusEnum = pgEnum('pos_inventory_plan_status_enum', [
  'SCHEDULED', 'IN_PROGRESS', 'COUNTING_DONE', 'FINANCE_REVIEW', 'APPROVED', 'REJECTED',
]);

export const varianceTypeEnum = pgEnum('pos_variance_type_enum', [
  'SHORTAGE', 'SURPLUS',
]);

// ─── 1. POS_STOCK_LEDGER — Append-only stok registri ────────────────────────

export const posStockLedger = pgTable('stock_ledger', {
  id:             bigserial('id', { mode: 'number' }).primaryKey(),
  ts:             timestamp('ts').notNull().defaultNow(),
  materialCardId: integer('material_id').notNull(),
  warehouseId:    varchar('warehouse_id', { length: 50 }).notNull(),
  batchId:        integer('batch_id'),
  movementId:     integer('movement_id'),
  qtyChange:      numericMoney('qty_change').notNull(),
  balanceAfter:   numericMoney('balance_after').notNull(),
  reason:         varchar('reason', { length: 100 }),
}, (t) => [
  index('idx_stock_ledger_mat_wh_ts').on(t.materialCardId, t.warehouseId, t.ts),
  index('idx_stock_ledger_movement').on(t.movementId),
]);

// ─── 2. MOVEMENT_CONFIRMATIONS — Ko'p bosqichli tasdiqlash ──────────────────

export const movementConfirmations = pgTable('pos_movement_confirmations', {
  id:            serial('id').primaryKey(),
  movementId:    integer('movement_id').notNull(),
  step:          confirmStepEnum('step').notNull(),
  userId:        integer('user_id').notNull(),
  decision:      confirmDecisionEnum('decision').notNull(),
  comment:       text('comment'),
  signedAt:      timestamp('signed_at').notNull().defaultNow(),
  signatureHash: varchar('signature_hash', { length: 64 }).notNull(),
  ip:            inet('ip'),
  // POS-19 #131 (2026-07-11, owner schema-grant -- Q-35): topshirilgan vs
  // qabul qilingan miqdor -- ikkalasi ham to'ldirilib farq qilsa `decision`
  // 'DISPUTED' bo'ladi (StockLedgerService.recordConfirmation). Ixtiyoriy --
  // eski qatorlar/chaqiruvlar NULL qoldiradi (additive, regress yo'q).
  handedOverQty: numericMoney('handed_over_qty'),
  receivedQty:   numericMoney('received_qty'),
}, (t) => [
  index('idx_mv_confirm_movement').on(t.movementId),
  index('idx_mv_confirm_user').on(t.userId),
]);

// ─── 3. BARCODE_MAP — Barcode registri ───────────────────────────────────────

export const barcodeMap = pgTable('pos_barcode_map', {
  id:             serial('id').primaryKey(),
  barcode:        varchar('barcode', { length: 200 }).notNull().unique(),
  barcodeType:    barcodeTypeEnum('barcode_type').notNull().default('EAN13'),
  materialCardId: integer('material_id').notNull(),
  batchId:        integer('batch_id'),
  isPrimary:      boolean('is_primary').notNull().default(false),
  scanCount:      integer('scan_count').notNull().default(0),
  lastScannedAt:  timestamp('last_scanned_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_barcode_map_mat').on(t.materialCardId),
  index('idx_barcode_map_barcode').on(t.barcode),
]);

// ─── 4. MATERIAL_PASSPORTS — EXTERNAL_IN kirim pasporti ─────────────────────

export const materialPassports = pgTable('pos_material_passports', {
  id:                    serial('id').primaryKey(),
  materialCardId:        integer('material_id').notNull(),
  batchId:               integer('batch_id'),
  externalInMovementId:  integer('external_in_movement_id').notNull(),
  supplierInvoiceUrl:    text('supplier_invoice_url'),
  qualityCertificateUrl: text('quality_certificate_url'),
  techPassportUrl:       text('tech_passport_url'),
  serialNo:              varchar('serial_no', { length: 100 }),
  warrantyUntil:         timestamp('warranty_until'),
  photos:                jsonb('photos').default(sql`'[]'::jsonb`),
  createdAt:             timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_mat_passport_mat').on(t.materialCardId),
  index('idx_mat_passport_movement').on(t.externalInMovementId),
]);

// ─── 5. STOCK_ALERTS — Stok ogohlantirishlari ────────────────────────────────

export const stockAlerts = pgTable('pos_stock_alerts', {
  id:             serial('id').primaryKey(),
  materialCardId: integer('material_id').notNull(),
  warehouseId:    varchar('warehouse_id', { length: 50 }).notNull(),
  alertType:      stockAlertTypeEnum('alert_type').notNull(),
  thresholdValue: numericMoney('threshold_value'),
  currentValue:   numericMoney('current_value').notNull(),
  severity:       stockAlertSeverityEnum('severity').notNull().default('WARNING'),
  acknowledged:   boolean('acknowledged').notNull().default(false),
  acknowledgedBy: integer('acknowledged_by'),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolved:       boolean('resolved').notNull().default(false),
  resolvedAt:     timestamp('resolved_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
  updatedAt:      timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_stock_alert_mat_wh').on(t.materialCardId, t.warehouseId),
  index('idx_stock_alert_type').on(t.alertType),
  index('idx_stock_alert_resolved').on(t.resolved),
]);

// ─── 6. GL_POSTING_LOG — AI GL 5 bosqich logi ────────────────────────────────

export const glPostingLog = pgTable('pos_gl_posting_log', {
  id:           serial('id').primaryKey(),
  movementId:   integer('movement_id').notNull(),
  stage:        integer('stage').notNull(),
  stageName:    glStageNameEnum('stage_name').notNull(),
  aiConfidence: numeric('ai_confidence', { precision: 5, scale: 4 }),
  glEntries:    jsonb('gl_entries').default(sql`'[]'::jsonb`),
  status:       glPostingStatusEnum('status').notNull().default('PROCESSING'),
  errorMessage: text('error_message'),
  processedAt:  timestamp('processed_at').notNull().defaultNow(),
  approvedBy:   integer('approved_by'),
  approvedAt:   timestamp('approved_at'),
}, (t) => [
  index('idx_gl_log_movement').on(t.movementId),
  index('idx_gl_log_status').on(t.status),
]);

// ─── 7. INVENTORY_PLANS — Inventarizatsiya reja ──────────────────────────────

export const inventoryPlans = pgTable('pos_inventory_plans', {
  id:                 serial('id').primaryKey(),
  planNo:             varchar('plan_no', { length: 50 }).notNull().unique(),
  warehouseId:        varchar('warehouse_id', { length: 50 }).notNull(),
  scheduledFor:       timestamp('scheduled_for').notNull(),
  status:             inventoryPlanStatusEnum('status').notNull().default('SCHEDULED'),
  createdBy:          integer('created_by').notNull(),
  responsibleUserId:  integer('responsible_user_id'),
  startedAt:          timestamp('started_at'),
  finishedAt:         timestamp('finished_at'),
  approvedByFinance:  integer('approved_by_finance'),
  approvedAt:         timestamp('approved_at'),
  notes:              text('notes'),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_inv_plan_wh').on(t.warehouseId),
  index('idx_inv_plan_status').on(t.status),
]);

export const inventoryVariances = pgTable('pos_inventory_variances', {
  id:             serial('id').primaryKey(),
  planId:         integer('plan_id').notNull(),
  materialCardId: integer('material_id').notNull(),
  diffQty:        numericMoney('diff_qty').notNull(),
  diffAmount:     numericMoney('diff_amount').notNull().default(sql`'0'`),
  varianceType:   varianceTypeEnum('variance_type').notNull(),
  glPosted:       boolean('gl_posted').notNull().default(false),
  glPostedAt:     timestamp('gl_posted_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_inv_variance_plan').on(t.planId),
  index('idx_inv_variance_mat').on(t.materialCardId),
]);

// ─── 8. POS_NOTIFICATIONS — Bildirishnomalar ─────────────────────────────────

export const posNotifications = pgTable('pos_notifications', {
  id:               serial('id').primaryKey(),
  userId:           integer('user_id').notNull(),
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  title:            varchar('title', { length: 200 }).notNull(),
  body:             text('body').notNull(),
  entityType:       varchar('entity_type', { length: 50 }),
  entityId:         integer('entity_id'),
  isRead:           boolean('is_read').notNull().default(false),
  readAt:           timestamp('read_at'),
  metadata:         jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_pos_notif_user').on(t.userId),
  index('idx_pos_notif_read').on(t.isRead),
  index('idx_pos_notif_type').on(t.notificationType),
]);

// ─── TYPESCRIPT TYPES ────────────────────────────────────────────────────────

export type PosStockLedger        = typeof posStockLedger.$inferSelect;
export type MovementConfirmation  = typeof movementConfirmations.$inferSelect;
export type BarcodeMap            = typeof barcodeMap.$inferSelect;
export type MaterialPassport      = typeof materialPassports.$inferSelect;
export type StockAlert            = typeof stockAlerts.$inferSelect;
export type GlPostingLog          = typeof glPostingLog.$inferSelect;
export type InventoryPlan         = typeof inventoryPlans.$inferSelect;
export type InventoryVariance     = typeof inventoryVariances.$inferSelect;
export type PosNotification       = typeof posNotifications.$inferSelect;
