import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { productionStatusEnum, mesSessionStatusEnum } from './schema-enums';
import { users, sales_orders } from './schema-core';

// ============================================================================
// PRODUCTION PLANNING (PP)
// ============================================================================

export const boms = pgTable(
  'boms',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    product_name: text('product_name').notNull(),
    version: text('version').notNull(),
    items: text('items').notNull().default('[]'),
    is_active: boolean('is_active').notNull().default(true),
    created_by: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('boms_product_name_idx').on(table.product_name),
    index('boms_is_active_idx').on(table.is_active),
  ],
);

export const routings = pgTable(
  'routings',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    steps: text('steps').notNull().default('[]'),
    work_centers: text('work_centers').notNull().default('[]'),
    is_active: boolean('is_active').notNull().default(true),
    created_by: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('routings_name_idx').on(table.name),
    index('routings_is_active_idx').on(table.is_active),
  ],
);

export const production_orders = pgTable(
  'production_orders',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    sales_order_id: uuid('sales_order_id').references(() => sales_orders.id, {
      onDelete: 'set null',
    }),
    order_number: text('order_number').notNull().unique(),
    product_name: text('product_name').notNull(),
    quantity: integer('quantity').notNull(),
    unit: text('unit').notNull(),
    status: productionStatusEnum('status').notNull().default('pending'),
    scheduled_start: timestamp('scheduled_start', { withTimezone: true }),
    scheduled_end: timestamp('scheduled_end', { withTimezone: true }),
    actual_start: timestamp('actual_start', { withTimezone: true }),
    actual_end: timestamp('actual_end', { withTimezone: true }),
    bom_id: uuid('bom_id').references(() => boms.id, { onDelete: 'set null' }),
    routing_id: uuid('routing_id').references(() => routings.id, { onDelete: 'set null' }),
    created_by: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('production_orders_order_number_idx').on(table.order_number),
    index('production_orders_sales_order_id_idx').on(table.sales_order_id),
    index('production_orders_status_idx').on(table.status),
    index('production_orders_bom_id_idx').on(table.bom_id),
    index('production_orders_routing_id_idx').on(table.routing_id),
  ],
);

// ============================================================================
// MES (Manufacturing Execution System)
// ============================================================================

export const mes_sessions = pgTable(
  'mes_sessions',
  {
    id: uuid('id').primaryKey().$defaultFn(() => createId()),
    production_order_id: uuid('production_order_id')
      .notNull()
      .references(() => production_orders.id, { onDelete: 'cascade' }),
    operator_id: uuid('operator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    work_center_id: uuid('work_center_id'),
    status: mesSessionStatusEnum('status').notNull().default('pending'),
    started_at: timestamp('started_at', { withTimezone: true }).notNull(),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    quality_passed: boolean('quality_passed'),
    defect_qty: integer('defect_qty').default(0),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('mes_sessions_production_order_id_idx').on(table.production_order_id),
    index('mes_sessions_operator_id_idx').on(table.operator_id),
    index('mes_sessions_status_idx').on(table.status),
  ],
);

// ============================================================================
// PP — Work Centers
// ============================================================================

export const work_centers = pgTable('work_centers', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  type: text('type').notNull().default('machine'),
  capacity: decimal('capacity', { precision: 10, scale: 2 }).notNull().default('8'),
  costPerHour: decimal('cost_per_hour', { precision: 18, scale: 2 }).notNull().default('0'),
  certificationLmsCourseId: uuid('certification_lms_course_id'),
  department: text('department'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// MES — Downtime Events
// ============================================================================

export const downtime_events = pgTable('downtime_events', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  sessionId: uuid('session_id').notNull(),
  workCenterId: uuid('work_center_id'),
  eventType: text('event_type').notNull().default('unplanned'),
  reasonCode: text('reason_code').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationMinutes: integer('duration_minutes'),
  reportedBy: text('reported_by').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
