import {
  pgTable, uuid, text, boolean, timestamp,
  decimal, integer, jsonb, index,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const retail_pos_products = pgTable('retail_pos_products', {
  id:            uuid('id').primaryKey().$defaultFn(() => createId()),
  barcode:       text('barcode').unique().notNull(),
  name:          text('name').notNull(),
  name_ru:       text('name_ru'),
  category:      text('category'),
  unit_price:    decimal('unit_price', { precision: 18, scale: 2 }).notNull().default('0'),
  unit:          text('unit').notNull().default('dona'),
  stock_quantity: decimal('stock_quantity', { precision: 12, scale: 3 }).default('0'),
  min_stock:     decimal('min_stock', { precision: 12, scale: 3 }).default('0'),
  is_active:     boolean('is_active').default(true),
  image_url:     text('image_url'),
  created_by:    text('created_by'),
  created_at:    timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at:    timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('retail_pos_products_barcode_idx').on(t.barcode),
  index('retail_pos_products_active_idx').on(t.is_active),
]);

export const retail_pos_transactions = pgTable('retail_pos_transactions', {
  id:                uuid('id').primaryKey().$defaultFn(() => createId()),
  transaction_number: text('transaction_number').unique().notNull(),
  receipt_number:    text('receipt_number').unique(),
  cashier_id:        text('cashier_id'),
  customer_name:     text('customer_name'),
  customer_id:       text('customer_id'),
  items:             jsonb('items').notNull().default('[]'),
  subtotal:          decimal('subtotal', { precision: 18, scale: 2 }).notNull().default('0'),
  discount_amount:   decimal('discount_amount', { precision: 18, scale: 2 }).default('0'),
  tax_rate:          decimal('tax_rate', { precision: 5, scale: 2 }).default('12'),
  tax_amount:        decimal('tax_amount', { precision: 18, scale: 2 }).default('0'),
  total_amount:      decimal('total_amount', { precision: 18, scale: 2 }).notNull().default('0'),
  payment_method:    text('payment_method').notNull().default('cash'),
  payment_details:   jsonb('payment_details').default('{}'),
  status:            text('status').notNull().default('completed'),
  notes:             text('notes'),
  refunded_at:       timestamp('refunded_at', { withTimezone: true }),
  refunded_by:       text('refunded_by'),
  created_at:        timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('retail_pos_transactions_cashier_idx').on(t.cashier_id),
  index('retail_pos_transactions_status_idx').on(t.status),
  index('retail_pos_transactions_date_idx').on(t.created_at),
]);
