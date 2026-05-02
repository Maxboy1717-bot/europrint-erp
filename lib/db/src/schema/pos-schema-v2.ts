/**
 * ================================================================
 * POS SCHEMA V2 — EuroPrint ERP
 * 50 ta savol asosida to'liq qayta yozildi
 * ================================================================
 * Faylni import qilish uchun:
 *   import * as PosSchema from '@europrint/db/schema/pos-schema-v2';
 * ================================================================
 */

import { numericMoney } from './numeric-money';
import { sql, relations } from 'drizzle-orm';
import {
  serial, pgTable, text, varchar, integer, boolean,
  timestamp, jsonb, unique, index, pgEnum, inet, bigserial,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ─── ENUM-LAR ──────────────────────────────────────────────────────────────────

export const movementTypeEnum = pgEnum('pos_movement_type_enum', [
  'EXTERNAL_IN',
  'EXTERNAL_OUT',
  'INTERNAL_ISSUE',
  'INTERNAL_RETURN',
  'DAMAGE',
  'INTERNAL_TRANSFER',
  'INVENTORY_ADJ_PLUS',
  'INVENTORY_ADJ_MINUS',
]);

export const movementStatusEnum = pgEnum('pos_movement_status_enum', [
  'draft',
  'qc_pending',
  'qc_approved',
  'qc_rework',
  'qc_rejected',
  'pending',
  'approved',
  'ai_processing',
  'completed',
  'cancelled',
]);

export const requestStatusEnum = pgEnum('pos_request_status', [
  'DRAFT', 'SUBMITTED', 'APPROVED',
  'PARTIALLY_ISSUED', 'FULLY_ISSUED', 'REJECTED', 'CANCELLED',
]);

export const countStatusEnum = pgEnum('pos_count_status', [
  'DRAFT', 'IN_PROGRESS', 'COMPLETED', 'GL_POSTED', 'CANCELLED',
]);

export const printStatusEnum = pgEnum('pos_print_status', [
  'PENDING', 'PRINTING', 'DONE', 'FAILED',
]);

export const liabilityStatusEnum = pgEnum('pos_liability_status', [
  'OPEN', 'UNDER_INVESTIGATION', 'COMPENSATED', 'WRITTEN_OFF', 'CLOSED',
]);

export const reservationStatusEnum = pgEnum('pos_reservation_status', [
  'ACTIVE', 'PARTIALLY_ISSUED', 'FULLY_ISSUED', 'EXPIRED', 'CANCELLED',
]);

// ─── 1. POS_MOVEMENTS — Asosiy harakat jurnali ────────────────────────────────

export const posMovements = pgTable('pos_movements', {
  id:                    serial('id').primaryKey(),
  movementNumber:        varchar('movement_number', { length: 50 }).notNull().unique(),
  movementType:          movementTypeEnum('movement_type').notNull(),
  fromWarehouseId:       varchar('from_warehouse_id', { length: 50 }),
  toWarehouseId:         varchar('to_warehouse_id', { length: 50 }),
  status:                movementStatusEnum('status').notNull().default('draft'),
  // Qo'shimcha ma'lumotlar
  receivedByEmployeeId:  integer('received_by_employee_id'),
  supplierId:            varchar('supplier_id', { length: 50 }),
  cashPaid:              boolean('cash_paid').notNull().default(false),
  cashAmount:            numericMoney('cash_amount').default(sql`'0'`),
  // INTERNAL_RETURN uchun
  returnReason:          text('return_reason'),
  // Valyuta
  currency:              varchar('currency', { length: 3 }).notNull().default('UZS'),
  exchangeRate:          numericMoney('exchange_rate').notNull().default(sql`'1'`),
  totalAmount:           numericMoney('total_amount').notNull().default(sql`'0'`),
  totalAmountBase:       numericMoney('total_amount_base').notNull().default(sql`'0'`),
  // Karantin / QC
  quarantineRequired:    boolean('quarantine_required').notNull().default(false),
  qcStatus:              varchar('qc_status', { length: 20 }),
  qcCompletedAt:         timestamp('qc_completed_at'),
  qcCompletedBy:         integer('qc_completed_by'),
  // AI GL Posting
  aiGlStatus:            varchar('ai_gl_status', { length: 20 }).default('PENDING'),
  aiGlPostedAt:          timestamp('ai_gl_posted_at'),
  glDocumentId:          integer('gl_document_id'),
  // 3-way match
  purchaseOrderId:       varchar('purchase_order_id', { length: 50 }),
  goodsReceiptId:        varchar('goods_receipt_id', { length: 50 }),
  invoiceId:             varchar('invoice_id', { length: 50 }),
  threeWayMatched:       boolean('three_way_matched').notNull().default(false),
  // Telegram Mini-App
  telegramSent:          boolean('telegram_sent').notNull().default(false),
  // Offline sync
  isOfflineSync:         boolean('is_offline_sync').notNull().default(false),
  offlineQueueId:        integer('offline_queue_id'),
  // Hujjatlar
  actPdfPath:            text('act_pdf_path'),
  invoicePdfPath:        text('invoice_pdf_path'),
  // Standart maydonlar
  referenceDoc:          varchar('reference_doc', { length: 100 }),
  notes:                 text('notes'),
  createdBy:             integer('created_by').notNull(),
  approvedBy:            integer('approved_by'),
  approvedAt:            timestamp('approved_at'),
  completedAt:           timestamp('completed_at'),
  cancelledAt:           timestamp('cancelled_at'),
  cancelReason:          text('cancel_reason'),
  deletedAt:             timestamp('deleted_at'),
  createdAt:             timestamp('created_at').notNull().defaultNow(),
  updatedAt:             timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_pos_movements_type').on(t.movementType),
  index('idx_pos_movements_status').on(t.status),
  index('idx_pos_movements_from_wh').on(t.fromWarehouseId),
  index('idx_pos_movements_to_wh').on(t.toWarehouseId),
  index('idx_pos_movements_created_by').on(t.createdBy),
  index('idx_pos_movements_created_at').on(t.createdAt),
]);

// ─── 2. POS_MOVEMENT_LINES — Harakat qatorlari ────────────────────────────────

export const posMovementLines = pgTable('pos_movement_lines', {
  id:                  serial('id').primaryKey(),
  movementId:          integer('movement_id').notNull(),
  materialCardId:      integer('material_card_id').notNull(),
  batchId:             integer('batch_id'),
  serialNumberItemId:  integer('serial_number_item_id'),
  binId:               varchar('bin_id', { length: 50 }),
  // O'lchov
  unit:                varchar('unit', { length: 20 }).notNull().default('dona'),
  quantity:            numericMoney('quantity').notNull(),
  // Narx (FIFO narxi bo'yicha)
  unitPrice:           numericMoney('unit_price').notNull().default(sql`'0'`),
  totalPrice:          numericMoney('total_price').notNull().default(sql`'0'`),
  currency:            varchar('currency', { length: 3 }).default('UZS'),
  exchangeRate:        numericMoney('exchange_rate').default(sql`'1'`),
  unitPriceBase:       numericMoney('unit_price_base').default(sql`'0'`),
  totalPriceBase:      numericMoney('total_price_base').default(sql`'0'`),
  // FIFO/FEFO
  fifoSequence:        integer('fifo_sequence').notNull().default(0),
  expiryDate:          timestamp('expiry_date'),
  // Bron bilan bog'lanish
  reservationId:       integer('reservation_id'),
  sortOrder:           integer('sort_order').notNull().default(0),
  notes:               text('notes'),
  createdAt:           timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_pos_mv_lines_movement').on(t.movementId),
  index('idx_pos_mv_lines_material').on(t.materialCardId),
  index('idx_pos_mv_lines_batch').on(t.batchId),
]);

// ─── 3. POS_MATERIAL_REQUESTS — Bo'lim ombor so'rovi ─────────────────────────

export const posMaterialRequests = pgTable('pos_material_requests', {
  id:                serial('id').primaryKey(),
  requestNumber:     varchar('request_number', { length: 50 }).notNull().unique(),
  departmentCode:    varchar('department_code', { length: 50 }).notNull(),
  targetWarehouseId: varchar('target_warehouse_id', { length: 50 }).notNull(),
  requestedBy:       integer('requested_by').notNull(),
  status:            requestStatusEnum('status').notNull().default('DRAFT'),
  priority:          varchar('priority', { length: 10 }).notNull().default('NORMAL'),
  neededBy:          timestamp('needed_by'),
  justification:     text('justification'),
  approvedBy:        integer('approved_by'),
  approvedAt:        timestamp('approved_at'),
  rejectionReason:   text('rejection_reason'),
  posMovementId:     integer('pos_movement_id'),
  telegramSent:      boolean('telegram_sent').notNull().default(false),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
  updatedAt:         timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_mat_req_dept').on(t.departmentCode),
  index('idx_mat_req_status').on(t.status),
  index('idx_mat_req_requested_by').on(t.requestedBy),
]);

export const posMaterialRequestLines = pgTable('pos_material_request_lines', {
  id:           serial('id').primaryKey(),
  requestId:    integer('request_id').notNull(),
  materialCardId: integer('material_card_id').notNull(),
  requestedQty: numericMoney('requested_qty').notNull(),
  approvedQty:  numericMoney('approved_qty'),
  issuedQty:    numericMoney('issued_qty').default(sql`'0'`),
  unitPrice:    numericMoney('unit_price').default(sql`'0'`),
  notes:        text('notes'),
  sortOrder:    integer('sort_order').notNull().default(0),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_mat_req_line_req').on(t.requestId),
  index('idx_mat_req_line_mat').on(t.materialCardId),
]);

// ─── 4. EMPLOYEE_ISSUANCE_LOG — Hayot tsikli bloklash ────────────────────────

export const employeeIssuanceLog = pgTable('employee_issuance_log', {
  id:              serial('id').primaryKey(),
  userId:          integer('user_id').notNull(),
  materialCardId:  integer('material_card_id').notNull(),
  warehouseId:     varchar('warehouse_id', { length: 50 }).notNull(),
  movementLineId:  integer('movement_line_id'),
  quantityIssued:  numericMoney('quantity_issued').notNull(),
  issuedAt:        timestamp('issued_at').notNull().defaultNow(),
  closedAt:        timestamp('closed_at'),
  closeReason:     varchar('close_reason', { length: 50 }),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_issuance_user_mat').on(t.userId, t.materialCardId),
  index('idx_issuance_issued_at').on(t.issuedAt),
]);

// ─── 5. EMPLOYEE_INVENTORY_LEDGER — Xodim debit/kredit ───────────────────────

export const employeeInventoryLedger = pgTable('employee_inventory_ledger', {
  id:              serial('id').primaryKey(),
  userId:          integer('user_id').notNull(),
  materialCardId:  integer('material_card_id').notNull(),
  warehouseId:     varchar('warehouse_id', { length: 50 }).notNull(),
  entryType:       varchar('entry_type', { length: 10 }).notNull(),
  quantity:        numericMoney('quantity').notNull(),
  unitPrice:       numericMoney('unit_price').notNull().default(sql`'0'`),
  totalAmount:     numericMoney('total_amount').notNull().default(sql`'0'`),
  currency:        varchar('currency', { length: 3 }).default('UZS'),
  referenceType:   varchar('reference_type', { length: 50 }),
  referenceId:     integer('reference_id'),
  supplierName:    text('supplier_name'),
  cashPaid:        boolean('cash_paid').notNull().default(false),
  cashAmount:      numericMoney('cash_amount').default(sql`'0'`),
  transactionDate: timestamp('transaction_date').notNull().defaultNow(),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_ledger_user_mat').on(t.userId, t.materialCardId),
  index('idx_ledger_txn_date').on(t.transactionDate),
  index('idx_ledger_user_id').on(t.userId),
]);

// ─── 6. EMPLOYEE_WRITE_OFF_ACTS — Hisobdan chiqarish akti ────────────────────

export const employeeWriteOffActs = pgTable('employee_write_off_acts', {
  id:          serial('id').primaryKey(),
  actNumber:   varchar('act_number', { length: 50 }).notNull().unique(),
  userId:      integer('user_id').notNull(),
  warehouseId: varchar('warehouse_id', { length: 50 }).notNull(),
  status:      varchar('status', { length: 20 }).notNull().default('DRAFT'),
  reason:      text('reason').notNull(),
  totalAmount: numericMoney('total_amount').notNull().default(sql`'0'`),
  approvedBy:  integer('approved_by'),
  approvedAt:  timestamp('approved_at'),
  glDocumentId: integer('gl_document_id'),
  pdfPath:     text('pdf_path'),
  notes:       text('notes'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_write_off_user').on(t.userId),
  index('idx_write_off_status').on(t.status),
]);

export const employeeWriteOffActLines = pgTable('employee_write_off_act_lines', {
  id:              serial('id').primaryKey(),
  actId:           integer('act_id').notNull(),
  materialCardId:  integer('material_card_id').notNull(),
  issuanceLogId:   integer('issuance_log_id'),
  quantity:        numericMoney('quantity').notNull(),
  unitPrice:       numericMoney('unit_price').notNull().default(sql`'0'`),
  totalAmount:     numericMoney('total_amount').notNull().default(sql`'0'`),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
}, (t) => [index('idx_write_off_line_act').on(t.actId)]);

// ─── 7. EMPLOYEE_LIABILITY_CASES — Moddiy javobgarlik ────────────────────────

export const employeeLiabilityCases = pgTable('employee_liability_cases', {
  id:                   serial('id').primaryKey(),
  caseNumber:           varchar('case_number', { length: 50 }).notNull().unique(),
  userId:               integer('user_id').notNull(),
  materialCardId:       integer('material_card_id').notNull(),
  serialNumberItemId:   integer('serial_number_item_id'),
  warehouseId:          varchar('warehouse_id', { length: 50 }),
  issuanceLogId:        integer('issuance_log_id'),
  status:               liabilityStatusEnum('status').notNull().default('OPEN'),
  incidentType:         varchar('incident_type', { length: 30 }).notNull(),
  incidentDate:         timestamp('incident_date').notNull(),
  incidentDescription:  text('incident_description').notNull(),
  quantity:             numericMoney('quantity').notNull(),
  assessedValue:        numericMoney('assessed_value').notNull().default(sql`'0'`),
  compensatedAmount:    numericMoney('compensated_amount').default(sql`'0'`),
  compensationDate:     timestamp('compensation_date'),
  compensationMethod:   varchar('compensation_method', { length: 30 }),
  openedBy:             integer('opened_by').notNull(),
  closedBy:             integer('closed_by'),
  closedAt:             timestamp('closed_at'),
  closeNotes:           text('close_notes'),
  attachments:          jsonb('attachments').default(sql`'[]'::jsonb`),
  createdAt:            timestamp('created_at').notNull().defaultNow(),
  updatedAt:            timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_liability_user').on(t.userId),
  index('idx_liability_status').on(t.status),
  index('idx_liability_number').on(t.caseNumber),
]);

// ─── 8. PRODUCTION_MATERIAL_ALLOCS — Ishlab chiqarish mas'uliyat ──────────────

export const productionMaterialAllocs = pgTable('production_material_allocs', {
  id:                        serial('id').primaryKey(),
  allocationNumber:          varchar('allocation_number', { length: 50 }).notNull().unique(),
  productionOrderId:         varchar('production_order_id', { length: 50 }).notNull(),
  materialCardId:            integer('material_card_id').notNull(),
  batchId:                   integer('batch_id'),
  fromWarehouseId:           varchar('from_warehouse_id', { length: 50 }).notNull(),
  toWarehouseId:             varchar('to_warehouse_id', { length: 50 }).notNull(),
  posMovementId:             integer('pos_movement_id'),
  plannedQty:                numericMoney('planned_qty').notNull(),
  allocatedQty:              numericMoney('allocated_qty').notNull(),
  unitCost:                  numericMoney('unit_cost').notNull().default(sql`'0'`),
  totalFinancialValue:       numericMoney('total_financial_value').notNull().default(sql`'0'`),
  excessQty:                 numericMoney('excess_qty').default(sql`'0'`),
  status:                    varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  returnedQty:               numericMoney('returned_qty').default(sql`'0'`),
  returnMovementId:          integer('return_movement_id'),
  returnedAt:                timestamp('returned_at'),
  orderCompletionWarningAt:  timestamp('order_completion_warning_at'),
  allocatedBy:               integer('allocated_by').notNull(),
  notes:                     text('notes'),
  createdAt:                 timestamp('created_at').notNull().defaultNow(),
  updatedAt:                 timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_prod_alloc_order').on(t.productionOrderId),
  index('idx_prod_alloc_mat').on(t.materialCardId),
  index('idx_prod_alloc_status').on(t.status),
]);

// ─── 9. STOCK_RESERVATIONS — AI bron tizimi ───────────────────────────────────

export const posStockReservations = pgTable('stock_reservations', {
  id:                 serial('id').primaryKey(),
  reservationNumber:  varchar('reservation_number', { length: 50 }).notNull().unique(),
  productionOrderId:  varchar('production_order_id', { length: 50 }).notNull(),
  materialCardId:     integer('material_card_id').notNull(),
  warehouseId:        varchar('warehouse_id', { length: 50 }).notNull(),
  batchId:            integer('batch_id'),
  reservedQty:        numericMoney('reserved_qty').notNull(),
  issuedQty:          numericMoney('issued_qty').notNull().default(sql`'0'`),
  remainingQty:       numericMoney('remaining_qty').notNull(),
  status:             reservationStatusEnum('status').notNull().default('ACTIVE'),
  reservedByAi:       boolean('reserved_by_ai').notNull().default(true),
  expiresAt:          timestamp('expires_at'),
  cacheVersion:       integer('cache_version').notNull().default(1),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  unique('uq_reservation_order_mat_wh').on(t.productionOrderId, t.materialCardId, t.warehouseId),
  index('idx_res_order').on(t.productionOrderId),
  index('idx_res_mat_wh').on(t.materialCardId, t.warehouseId),
  index('idx_res_status').on(t.status),
]);

// ─── 10. POS_SERIAL_NUMBER_ITEMS — Individual aktiv kuzatuv ──────────────────

export const posSerialNumberItems = pgTable('pos_serial_number_items', {
  id:                  serial('id').primaryKey(),
  materialCardId:      integer('material_card_id').notNull(),
  serialNumber:        varchar('serial_number', { length: 100 }).notNull(),
  barcode:             varchar('barcode', { length: 200 }).unique(),
  warehouseId:         varchar('warehouse_id', { length: 50 }),
  binLocation:         varchar('bin_location', { length: 100 }),
  assignedToUserId:    integer('assigned_to_user_id'),
  status:              varchar('status', { length: 30 }).notNull().default('IN_WAREHOUSE'),
  purchaseDate:        timestamp('purchase_date'),
  warrantyExpiresAt:   timestamp('warranty_expires_at'),
  unitCost:            numericMoney('unit_cost').notNull().default(sql`'0'`),
  notes:               text('notes'),
  createdAt:           timestamp('created_at').notNull().defaultNow(),
  updatedAt:           timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  unique('uq_serial_mat').on(t.materialCardId, t.serialNumber),
  index('idx_serial_mat').on(t.materialCardId),
  index('idx_serial_user').on(t.assignedToUserId),
  index('idx_serial_status').on(t.status),
]);

// ─── 11. POS_INVENTORY_COUNTS — Inventarizatsiya ─────────────────────────────

export const posInventoryCounts = pgTable('pos_inventory_counts', {
  id:                   serial('id').primaryKey(),
  countNumber:          varchar('count_number', { length: 50 }).notNull().unique(),
  warehouseId:          varchar('warehouse_id', { length: 50 }).notNull(),
  status:               countStatusEnum('status').notNull().default('DRAFT'),
  isWarehouseLocked:    boolean('is_warehouse_locked').notNull().default(false),
  systemSnapshotAt:     timestamp('system_snapshot_at'),
  completedAt:          timestamp('completed_at'),
  totalVarianceValue:   numericMoney('total_variance_value').default(sql`'0'`),
  glDocumentId:         integer('gl_document_id'),
  pdfPath:              text('pdf_path'),
  conductedBy:          integer('conducted_by').notNull(),
  approvedBy:           integer('approved_by'),
  approvedAt:           timestamp('approved_at'),
  notes:                text('notes'),
  createdAt:            timestamp('created_at').notNull().defaultNow(),
  updatedAt:            timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_inv_count_wh').on(t.warehouseId),
  index('idx_inv_count_status').on(t.status),
]);

export const posInventoryCountLines = pgTable('pos_inventory_count_lines', {
  id:             serial('id').primaryKey(),
  countId:        integer('count_id').notNull(),
  materialCardId: integer('material_card_id').notNull(),
  batchId:        integer('batch_id'),
  binLocation:    varchar('bin_location', { length: 100 }),
  systemQty:      numericMoney('system_qty').notNull(),
  actualQty:      numericMoney('actual_qty'),
  varianceQty:    numericMoney('variance_qty'),
  unitCost:       numericMoney('unit_cost').default(sql`'0'`),
  varianceValue:  numericMoney('variance_value').default(sql`'0'`),
  varianceType:   varchar('variance_type', { length: 10 }),
  expiryDate:     timestamp('expiry_date'),
  countedBy:      integer('counted_by'),
  countedAt:      timestamp('counted_at'),
  notes:          text('notes'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_inv_count_line_count').on(t.countId),
  index('idx_inv_count_line_mat').on(t.materialCardId),
]);

// ─── 12. POS_OFFLINE_QUEUE — Internet o'chsa ─────────────────────────────────

export const posOfflineQueue = pgTable('pos_offline_queue', {
  id:                serial('id').primaryKey(),
  terminalId:        varchar('terminal_id', { length: 100 }).notNull(),
  userId:            integer('user_id').notNull(),
  syncStatus:        varchar('sync_status', { length: 20 }).notNull().default('PENDING'),
  payload:           jsonb('payload').notNull(),
  offlineCreatedAt:  timestamp('offline_created_at').notNull(),
  syncedAt:          timestamp('synced_at'),
  syncedMovementId:  integer('synced_movement_id'),
  conflictReason:    text('conflict_reason'),
  retryCount:        integer('retry_count').notNull().default(0),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_offline_sync').on(t.syncStatus),
  index('idx_offline_terminal').on(t.terminalId),
]);

// ─── 13. POS_BARCODE_PRINT_QUEUE — Chop etish navbati ────────────────────────

export const posBarcodePrintQueue = pgTable('pos_barcode_print_queue', {
  id:                   serial('id').primaryKey(),
  materialCardId:       integer('material_card_id').notNull(),
  batchId:              integer('batch_id'),
  serialNumberItemId:   integer('serial_number_item_id'),
  posMovementId:        integer('pos_movement_id'),
  status:               printStatusEnum('status').notNull().default('PENDING'),
  copies:               integer('copies').notNull().default(1),
  printFormat:          varchar('print_format', { length: 10 }).notNull().default('ZPL'),
  printerIp:            varchar('printer_ip', { length: 50 }),
  triggerType:          varchar('trigger_type', { length: 10 }).notNull().default('AUTO'),
  requestedBy:          integer('requested_by'),
  printedAt:            timestamp('printed_at'),
  errorMessage:         text('error_message'),
  createdAt:            timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_print_status').on(t.status),
  index('idx_print_mat').on(t.materialCardId),
]);

// ─── 14. POS_DAMAGE_QC_LINKS — Zarar → QC ────────────────────────────────────

export const posDamageQcLinks = pgTable('pos_damage_qc_links', {
  id:                     serial('id').primaryKey(),
  posMovementId:          integer('pos_movement_id').notNull(),
  materialCardId:         integer('material_card_id').notNull(),
  damagedQty:             numericMoney('damaged_qty').notNull(),
  unitCost:               numericMoney('unit_cost').notNull().default(sql`'0'`),
  totalValue:             numericMoney('total_value').notNull().default(sql`'0'`),
  quarantineWarehouseId:  varchar('quarantine_warehouse_id', { length: 50 }),
  qcInspectionId:         integer('qc_inspection_id'),
  qcDecision:             varchar('qc_decision', { length: 30 }).notNull().default('PENDING_QC'),
  qcDecisionAt:           timestamp('qc_decision_at'),
  qcDecisionBy:           integer('qc_decision_by'),
  glPosted:               boolean('gl_posted').notNull().default(false),
  glDocumentId:           integer('gl_document_id'),
  telegramNotified:       boolean('telegram_notified').notNull().default(false),
  createdAt:              timestamp('created_at').notNull().defaultNow(),
  updatedAt:              timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_damage_qc_movement').on(t.posMovementId),
  index('idx_damage_qc_decision').on(t.qcDecision),
]);

// ─── 15. DEPARTMENT_WAREHOUSE_MAP ─────────────────────────────────────────────

export const departmentWarehouseMap = pgTable('department_warehouse_map', {
  id:                 serial('id').primaryKey(),
  departmentCode:     varchar('department_code', { length: 50 }).notNull(),
  departmentName:     text('department_name').notNull(),
  warehouseId:        varchar('warehouse_id', { length: 50 }).notNull(),
  warehouseKeeperId:  integer('warehouse_keeper_id'),
  isActive:           boolean('is_active').notNull().default(true),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
  updatedAt:          timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  unique('uq_dept_wh').on(t.departmentCode, t.warehouseId),
  index('idx_dept_wh_dept').on(t.departmentCode),
  index('idx_dept_wh_wh').on(t.warehouseId),
]);

// ─── 16. MATERIAL_CATEGORY_DEPT_RULES ────────────────────────────────────────

export const materialCategoryDeptRules = pgTable('material_category_dept_rules', {
  id:               serial('id').primaryKey(),
  materialCategory: varchar('material_category', { length: 50 }).notNull(),
  departmentCode:   varchar('department_code', { length: 50 }).notNull(),
  canRequest:       boolean('can_request').notNull().default(true),
  canReceive:       boolean('can_receive').notNull().default(true),
  notes:            text('notes'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  unique('uq_cat_dept').on(t.materialCategory, t.departmentCode),
  index('idx_cat_dept_cat').on(t.materialCategory),
]);

// ─── 17. MATERIAL_CARD_SUGGESTIONS — AI taklif ───────────────────────────────

export const materialCardSuggestions = pgTable('material_card_suggestions', {
  id:                      serial('id').primaryKey(),
  triggeredBy:             varchar('triggered_by', { length: 50 }).notNull().default('AI'),
  unknownBarcode:          varchar('unknown_barcode', { length: 200 }),
  posMovementId:           integer('pos_movement_id'),
  suggestedName:           text('suggested_name'),
  suggestedNameRu:         text('suggested_name_ru'),
  suggestedUnit:           varchar('suggested_unit', { length: 20 }),
  suggestedCategory:       varchar('suggested_category', { length: 30 }),
  suggestedBarcode:        varchar('suggested_barcode', { length: 200 }),
  aiConfidence:            numericMoney('ai_confidence'),
  aiReasoning:             text('ai_reasoning'),
  status:                  varchar('status', { length: 20 }).notNull().default('PENDING'),
  reviewedBy:              integer('reviewed_by'),
  reviewedAt:              timestamp('reviewed_at'),
  createdMaterialCardId:   integer('created_material_card_id'),
  rejectionReason:         text('rejection_reason'),
  createdAt:               timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_mc_suggest_status').on(t.status),
  index('idx_mc_suggest_barcode').on(t.unknownBarcode),
]);

// ─── 18. POS_THREE_WAY_MATCH — 3-way match ───────────────────────────────────

export const posThreeWayMatch = pgTable('pos_three_way_match', {
  id:                serial('id').primaryKey(),
  posMovementId:     integer('pos_movement_id').notNull().unique(),
  purchaseOrderId:   varchar('purchase_order_id', { length: 50 }),
  goodsReceiptId:    varchar('goods_receipt_id', { length: 50 }),
  invoiceId:         varchar('invoice_id', { length: 50 }),
  invoiceNumber:     varchar('invoice_number', { length: 100 }),
  poQty:             numericMoney('po_qty'),
  grQty:             numericMoney('gr_qty'),
  invoiceQty:        numericMoney('invoice_qty'),
  poUnitPrice:       numericMoney('po_unit_price'),
  invoiceUnitPrice:  numericMoney('invoice_unit_price'),
  qtyVariance:       numericMoney('qty_variance'),
  priceVariance:     numericMoney('price_variance'),
  qtyMatch:          boolean('qty_match'),
  priceMatch:        boolean('price_match'),
  overallMatch:      boolean('overall_match'),
  varianceNotes:     text('variance_notes'),
  matchedAt:         timestamp('matched_at').notNull().defaultNow(),
  matchedBy:         integer('matched_by'),
  aiVerified:        boolean('ai_verified').notNull().default(false),
}, (t) => [
  index('idx_3way_movement').on(t.posMovementId),
  index('idx_3way_po').on(t.purchaseOrderId),
]);

// ─── 19. POS_TELEGRAM_SESSIONS ────────────────────────────────────────────────

export const posTelegramSessions = pgTable('pos_telegram_sessions', {
  id:             serial('id').primaryKey(),
  telegramUserId: bigserial('telegram_user_id', { mode: 'number' }).notNull().unique(),
  userId:         integer('user_id').notNull(),
  chatId:         bigserial('chat_id', { mode: 'number' }),
  sessionToken:   varchar('session_token', { length: 200 }).notNull().unique(),
  expiresAt:      timestamp('expires_at').notNull(),
  lastActiveAt:   timestamp('last_active_at').notNull().defaultNow(),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_tg_token').on(t.sessionToken),
  index('idx_tg_user').on(t.telegramUserId),
]);

// ─── 20. POS_AUDIT_LOG — To'liq audit ────────────────────────────────────────

export const posAuditLog = pgTable('pos_audit_log', {
  id:              bigserial('id', { mode: 'number' }).primaryKey(),
  userId:          integer('user_id'),
  telegramUserId:  integer('telegram_user_id'),
  action:          varchar('action', { length: 100 }).notNull(),
  entityType:      varchar('entity_type', { length: 50 }),
  entityId:        integer('entity_id'),
  oldValue:        jsonb('old_value'),
  newValue:        jsonb('new_value'),
  ipAddress:       inet('ip_address'),
  userAgent:       text('user_agent'),
  sessionId:       varchar('session_id', { length: 200 }),
  durationMs:      integer('duration_ms'),
  success:         boolean('success').notNull().default(true),
  errorMessage:    text('error_message'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_audit_user').on(t.userId),
  index('idx_audit_action').on(t.action),
  index('idx_audit_entity').on(t.entityType, t.entityId),
  index('idx_audit_created').on(t.createdAt),
]);

// ─── ZOD VALIDATION SCHEMAS ──────────────────────────────────────────────────

export const insertPosMovementSchema = createInsertSchema(posMovements, {
  movementType: z.enum([
    'EXTERNAL_IN', 'EXTERNAL_OUT', 'INTERNAL_ISSUE',
    'INTERNAL_RETURN', 'DAMAGE', 'INTERNAL_TRANSFER',
    'INVENTORY_ADJ_PLUS', 'INVENTORY_ADJ_MINUS',
  ]),
});

export const insertMaterialRequestSchema = createInsertSchema(posMaterialRequests, {
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

export const insertPosStockReservationSchema = createInsertSchema(posStockReservations);
export const insertPosInventoryCountSchema   = createInsertSchema(posInventoryCounts);

// ─── TYPESCRIPT TYPES ────────────────────────────────────────────────────────

export type PosMovement             = typeof posMovements.$inferSelect;
export type PosMovementLine         = typeof posMovementLines.$inferSelect;
export type PosMaterialRequest      = typeof posMaterialRequests.$inferSelect;
export type EmployeeIssuanceLog     = typeof employeeIssuanceLog.$inferSelect;
export type EmployeeInventoryLedger = typeof employeeInventoryLedger.$inferSelect;
export type EmployeeLiabilityCase   = typeof employeeLiabilityCases.$inferSelect;
export type ProductionMaterialAlloc = typeof productionMaterialAllocs.$inferSelect;
export type PosStockReservation     = typeof posStockReservations.$inferSelect;
export type PosSerialNumberItem     = typeof posSerialNumberItems.$inferSelect;
export type PosInventoryCount       = typeof posInventoryCounts.$inferSelect;
export type PosAuditLog             = typeof posAuditLog.$inferSelect;

// ─── Printer Config ─────────────────────────────────────────────────────────

export const posPrinterConfig = pgTable('pos_printer_config', {
  id:          serial('id').primaryKey(),
  name:        varchar('name', { length: 100 }).notNull().default('Asosiy Printer'),
  printerIp:   varchar('printer_ip', { length: 100 }).notNull().default(''),
  printerPort: integer('printer_port').notNull().default(9100),
  printFormat: varchar('print_format', { length: 10 }).notNull().default('ZPL'),
  isActive:    boolean('is_active').notNull().default(true),
  notes:       text('notes'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
});

export type PosPrinterConfig = typeof posPrinterConfig.$inferSelect;
