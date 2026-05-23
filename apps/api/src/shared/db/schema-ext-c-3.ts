/**
 * @module schema-ext-c-3
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, jsonb, date,
} from 'drizzle-orm/pg-core';
import { dokla as canonicalDokla, rasporyazhenie as canonicalRasporyazhenie } from './schema-business-a-2';
import { enps_survey_responses as canonicalEnpsSurveyResponses } from './schema-business-a-1';

// [2026-05-22 dedup] warehouse_transactions: re-exported from canonical definition
// in @workspace/db/schema/wms-schema (warehouseTransactions, 13 cols, serial id, full constraints).
// Previous local pgTable (7 cols, snake_case) removed. Only used via barrel re-export.
export { warehouseTransactions as warehouse_transactions } from '@workspace/db/schema/wms-schema';

// lib/db da mavjud emas — saqlab qolindi.
export const warehouse_transfers = pgTable('warehouse_transfers', {
  id:                serial('id').primaryKey(),
  from_warehouse_id: integer('from_warehouse_id'),
  to_warehouse_id:   integer('to_warehouse_id'),
  item_id:           integer('item_id'),
  quantity:          numeric('quantity', { precision: 15, scale: 4 }),
  status:            text('status').default('pending'),
  created_at:        timestamp('created_at').defaultNow(),
});

// [2026-05-22 dedup] internal_requests: re-exported from canonical definition in
// lib/db (wms-schema.ts: internalRequests, in barrel). Previous local pgTable
// (5 cols) removed.
export { internalRequests as internal_requests } from '@workspace/db';

// lib/db da bor (mm-purchase.ts: goodsReceipts) lekin barrel da eksport yo'q
// (mm-schema.ts faqat mm-procurement/materials/advanced/logistics/mro re-export
// qiladi) — saqlab qolindi.
export const goods_receipts = pgTable('goods_receipts', {
  id:                serial('id').primaryKey(),
  purchase_order_id: integer('purchase_order_id'),
  received_by:       integer('received_by'),
  status:            text('status').default('draft'),
  notes:             text('notes'),
  received_at:       timestamp('received_at'),
  completed_by:      integer('completed_by'),
  completed_at:      timestamp('completed_at'),
  created_at:        timestamp('created_at').defaultNow(),
});

// SHIM: re-export canonical inventoryCounts from mm-inventory.ts as `inventory_counts`.
// Canon: @workspace/db/schema/mm-inventory (15 cols, serial id, full constraint set).
// Previous duplicate pgTable definition (6 cols, snake_case fields) removed.
export { inventoryCounts as inventory_counts } from '@workspace/db/schema/mm-inventory';

// [2026-05-22 dedup] stock_reservations: re-exported from canonical definition
// in @workspace/db/schema/mm-batch-mgmt (stockReservations, 21 cols, serial id, full FK set).
// Previous local pgTable (8 cols, snake_case) removed. Only used via barrel re-export.
export { stockReservations as stock_reservations } from '@workspace/db/schema/mm-batch-mgmt';

// [2026-05-22 dedup] department_warehouse_map: re-exported from canonical definition in
// lib/db (pos-schema-v2.ts: departmentWarehouseMap, in barrel). Previous local pgTable
// (3 cols) removed.
export { departmentWarehouseMap as department_warehouse_map } from '@workspace/db';

// ─── Assessment & Gamification ────────────────────────────────────────────────
// lib/db da mavjud emas — saqlab qolindi.

export const assessment_skips = pgTable('assessment_skips', {
  id:          serial('id').primaryKey(),
  employee_id: integer('employee_id'),
  reason:      text('reason'),
  created_at:  timestamp('created_at').defaultNow(),
});

// ─── Weekly Plans ──────────────────────────────────────────────────────────────
// [2026-05-22 dedup] weekly_plans: re-exported from canonical definition in
// lib/db (weekly-plans-schema.ts: weeklyPlans, in barrel). Previous local pgTable
// (7 cols) removed.
export { weeklyPlans as weekly_plans } from '@workspace/db';

// ─── Dokla & Rasporyazhenie ────────────────────────────────────────────────────
// dokla: re-exported from canonical definition in schema-business-a-2.ts
export const dokla_ext = canonicalDokla;

// rasporyazhenie: re-exported from canonical definition in schema-business-a-2.ts
export const rasporyazhenie_ext = canonicalRasporyazhenie;

// ─── Deficit & Monitoring ─────────────────────────────────────────────────────
// lib/db da mavjud emas (mm_vendors, mm_materials, mm_goods_receipts,
// mm_purchase_orders nomli jadvallar lib/db da yo'q) — saqlab qolindi.

export const mm_vendors_ext2 = pgTable('mm_vendors', {
  id:          serial('id').primaryKey(),
  name:        text('name'),
  tin:         text('tin'),
  phone:       text('phone'),
  email:       text('email'),
  is_active:   boolean('is_active').default(true),
  rating:      numeric('rating', { precision: 3, scale: 2 }),
  created_at:  timestamp('created_at').defaultNow(),
  updated_at:  timestamp('updated_at').defaultNow(),
});

export const mm_materials_int = pgTable('mm_materials', {
  id:             serial('id').primaryKey(),
  name:           text('name'),
  code:           text('code'),
  category:       text('category'),
  unit_of_measure: text('unit_of_measure'),
  barcode:        text('barcode'),
  sku:            text('sku'),
  is_active:      boolean('is_active').default(true),
  created_at:     timestamp('created_at').defaultNow(),
  updated_at:     timestamp('updated_at').defaultNow(),
});

export const mm_goods_receipts_int = pgTable('mm_goods_receipts', {
  id:                serial('id').primaryKey(),
  purchase_order_id: integer('purchase_order_id'),
  received_by:       integer('received_by'),
  status:            text('status').default('draft'),
  notes:             text('notes'),
  received_at:       timestamp('received_at'),
  completed_by:      integer('completed_by'),
  completed_at:      timestamp('completed_at'),
  created_at:        timestamp('created_at').defaultNow(),
});

export const mm_purchase_orders_ext = pgTable('mm_purchase_orders', {
  id:               serial('id').primaryKey(),
  reference_number: text('reference_number'),
  vendor_id:        integer('vendor_id'),
  status:           text('status').default('draft'),
  total_amount:     numeric('total_amount', { precision: 15, scale: 2 }),
  received_by:      integer('received_by'),
  notes:            text('notes'),
  created_at:       timestamp('created_at').defaultNow(),
  updated_at:       timestamp('updated_at').defaultNow(),
});

// ─── Agent (AI) Interview ──────────────────────────────────────────────────────
// [2026-05-22 dedup] ai_interview_sessions: re-exported from canonical definition
// in lib/db (hr-performance-ext.ts: 14 cols, CHECK constraints on type/lang/status,
// in barrel chain). Previous local pgTable (8 cols, text PK, minimal stub) removed.
import { aiInterviewSessions as _aiis_canon } from '@workspace/db';
export const ai_interview_sessions = _aiis_canon;

// ─── Enps ──────────────────────────────────────────────────────────────────────
// enps_survey_responses: re-exported from canonical definition in schema-business-a-1.ts
export const enps_survey_responses_ext = canonicalEnpsSurveyResponses;
