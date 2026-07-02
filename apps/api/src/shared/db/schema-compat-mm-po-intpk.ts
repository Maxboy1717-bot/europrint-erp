/**
 * @module schema-compat-mm-po-intpk
 * @description MM `purchase_orders` integer-PK compatibility definition.
 *
 * APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02
 *
 * The live DB has `purchase_orders`.id / vendor_id / created_by / supplier_id
 * / received_by / tenant_id as INTEGER (serial, `nextval(...)` sequence) —
 * NOT uuid. `schema-wms.ts` declares `purchase_orders` with a
 * `uuid('id').$defaultFn(() => createId())` PK, which never matches the live
 * column (SELECT/UPDATE `.where(eq(id, ...))` only "worked" by accident via
 * Postgres' implicit text→integer parameter cast; a real client-generated
 * insert would fail with `invalid input syntax for type integer`).
 * `schema-compat-2.ts`'s own `purchaseOrders` export is just an alias of the
 * schema-wms.ts uuid table (`export const purchaseOrders = canonicalPurchaseOrders`),
 * so it does not fix this either.
 *
 * This is the CORRECT, DB-verified integer-PK definition — column-for-column
 * parity with `information_schema.columns` (2026-07-02 live read).
 * `approved_by` / `goods_received_by` really are uuid columns in the live DB
 * (unrelated legacy columns) — kept as uuid here. Column keys are snake_case
 * (matching the live column names 1:1, and the naming schema-wms.ts already
 * used) so existing call sites' shape stays unchanged.
 *
 * Scope: imported ONLY by the MM call sites proven broken by this drift
 * (get-purchase-orders.handler.ts, drizzle-mm.repo.ts). It intentionally
 * does NOT replace `schema-wms.ts`'s uuid `purchase_orders` — ~30 other
 * modules still resolve tables from `@shared/db`/`@europrint/schemas` and
 * are out of this fix's scope.
 */

import { pgTable, uuid, varchar, text, boolean, decimal, integer, ts, serial } from './schema-compat-helpers';

// `id` uses `serial()` (not plain `integer()`) so Drizzle marks it optional
// on INSERT, matching the live DB's `nextval(...)` default.
export const purchase_orders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  po_number: varchar('po_number', { length: 50 }).notNull(),
  vendor_id: integer('vendor_id'),
  vendor_name: text('vendor_name'),
  order_date: varchar('order_date', { length: 20 }),
  delivery_date: varchar('delivery_date', { length: 20 }),
  status: varchar('status', { length: 30 }).notNull().default('draft'),
  total_amount: decimal('total_amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 10 }).default('UZS'),
  created_by: integer('created_by'),
  created_at: ts('created_at').defaultNow(),
  deleted_at: ts('deleted_at'),
  items: text('items'),
  approved_by: uuid('approved_by'),
  approved_at: ts('approved_at'),
  goods_received_by: uuid('goods_received_by'),
  goods_received_at: ts('goods_received_at'),
  invoice_matched: boolean('invoice_matched'),
  three_way_matched: boolean('three_way_matched'),
  notes: text('notes'),
  updated_at: ts('updated_at').defaultNow(),
  supplier_id: integer('supplier_id'),
  expected_delivery_date: ts('expected_delivery_date'),
  actual_delivery_date: ts('actual_delivery_date'),
  expected_date: varchar('expected_date', { length: 20 }),
  reference_number: text('reference_number'),
  received_by: integer('received_by'),
  tenant_id: integer('tenant_id'),
});
