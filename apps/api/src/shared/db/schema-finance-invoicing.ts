/**
 * @module schema-finance-invoicing
 * @description Invoices, payments, and general-ledger entries.
 * Split out of schema-finance to respect the 300-line file budget.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { invoiceStatusEnum } from './schema-enums';
import { users, sales_orders } from './schema-core';

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    invoice_number: text('invoice_number').notNull().unique(),
    sales_order_id: uuid('sales_order_id').references(() => sales_orders.id, {
      onDelete: 'set null',
    }),
    customer_name: text('customer_name').notNull(),
    customer_id: uuid('customer_id'),
    items: text('items').notNull().default('[]'),
    subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
    tax_amount: decimal('tax_amount', { precision: 15, scale: 2 }).notNull(),
    total_amount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    paid_amount: decimal('paid_amount', { precision: 15, scale: 2 }).default('0'),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    due_date: timestamp('due_date', { withTimezone: true }),
    created_by: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    // Master-reja 3.5 "eksport-invoys (Incoterms)" — additive, ixtiyoriy (Q-35/Q-40).
    // EP-SD-070 JAVOBLANGAN: "variant tanlanadi (samovyvoz / zavod yetkazadi)" — erkin
    // matn, to'liq Incoterms-2020 kod-ro'yxati uchun qaror OCHIQ (fabrikatsiya qilinmadi).
    delivery_term: text('delivery_term'),
    incoterm_code: text('incoterm_code'),
    currency: text('currency'),
    // VISION-3340 SD-06 #24 — additive, computed column (Q-35/Q-40, owner schema-approval
    // 2026-07-11). Values: 'full' | 'partial' | NULL (pre-existing rows / orders with no
    // delivery data yet stay NULL — not fabricated). Written by CreateInvoiceHandler at
    // invoice-creation time by comparing delivery_items.delivery_quantity (yetkazilgan)
    // against sales_order_items.order_quantity (buyurtma qilingan) for the invoice's
    // sales_order_id — see DrizzleSdInvoicesRepository.getOrderFulfillmentQty.
    invoice_type: text('invoice_type'),
  },
  (table) => [
    uniqueIndex('invoices_invoice_number_idx').on(table.invoice_number),
    index('invoices_sales_order_id_idx').on(table.sales_order_id),
    index('invoices_status_idx').on(table.status),
    index('invoices_created_by_idx').on(table.created_by),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    invoice_id: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('UZS'),
    payment_method: text('payment_method').notNull(),
    reference_number: text('reference_number'),
    paid_at: timestamp('paid_at', { withTimezone: true }).notNull(),
    recorded_by: uuid('recorded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payments_invoice_id_idx').on(table.invoice_id),
    index('payments_paid_at_idx').on(table.paid_at),
  ],
);

export const gl_entries = pgTable(
  'gl_entries',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    entry_number: text('entry_number').notNull().unique(),
    debit_account: text('debit_account').notNull(),
    credit_account: text('credit_account').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    description: text('description'),
    reference_id: uuid('reference_id'),
    reference_type: text('reference_type'),
    posted_by: uuid('posted_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    posted_at: timestamp('posted_at', { withTimezone: true }).defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('gl_entries_entry_number_idx').on(table.entry_number),
    index('gl_entries_debit_account_idx').on(table.debit_account),
    index('gl_entries_credit_account_idx').on(table.credit_account),
    index('gl_entries_posted_at_idx').on(table.posted_at),
  ],
);
