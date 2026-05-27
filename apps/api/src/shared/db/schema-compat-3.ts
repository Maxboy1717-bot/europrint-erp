/**
 * @module schema-compat-3
 * @description Source module. See exports for details.
 */

import { pgTable, uuid, text, boolean, decimal, integer, createId, ts } from './schema-compat-helpers';
import { work_centers as canonicalWorkCenters, downtime_events as canonicalDowntimeEvents } from './schema-manufacturing';
import { routings as canonicalRoutings } from './schema-manufacturing';

export const mroInventory = pgTable('mro_inventory', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  partNumber: text('part_number').unique(),
  warehouseId: text('warehouse_id'),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).default('0'),
  unit: text('unit'),
  minQuantity: decimal('min_quantity', { precision: 15, scale: 4 }).default('0'),
  unitPrice: decimal('unit_price', { precision: 18, scale: 2 }),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
});

export const productionOrders = pgTable('production_orders', {
  id: integer('id').primaryKey(),
  orderNumber: text('order_number').unique(),
  productId: text('product_id'),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unit: text('unit'),
  status: text('status').notNull().default('draft'),
  plannedStart: ts('planned_start'),
  plannedEnd: ts('planned_end'),
  actualStart: ts('actual_start'),
  actualEnd: ts('actual_end'),
  createdBy: text('created_by'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

// routings: re-exported from canonical definition in schema-manufacturing.ts
export const routings = canonicalRoutings;

export const routingOperations = pgTable('routing_operations', {
  id: integer('id').primaryKey(),
  routingId: text('routing_id').notNull(),
  workCenterId: text('work_center_id'),
  name: text('name').notNull(),
  sequence: integer('sequence').default(0),
  setupTimeMin: decimal('setup_time_min', { precision: 8, scale: 2 }).default('0'),
  runTimeMin: decimal('run_time_min', { precision: 8, scale: 2 }).default('0'),
  createdAt: ts('created_at').defaultNow(),
});

// NOTE: convergence deferred (tier-1) — lib/db bomHeaders.productId is numeric but
// pp-bom repo passes string; needs column-type reconciliation before re-export.
export const bomHeaders = pgTable('bom_headers', {
  id: integer('id').primaryKey(),
  productId: text('product_id').notNull(),
  version: text('version').default('1.0'),
  status: text('status').default('draft'),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

export const bomItems = pgTable('bom_items', {
  id: integer('id').primaryKey(),
  bomId: integer('bom_id').notNull(),
  materialId: text('material_id').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unit: text('unit'),
  scrapPercent: decimal('scrap_percent', { precision: 5, scale: 2 }).default('0'),
  createdAt: ts('created_at').defaultNow(),
});

// work_centers: re-exported from canonical definition in schema-manufacturing.ts
export const workCenters = canonicalWorkCenters;

// downtimeEvents: re-exported from schema-manufacturing (integer PK, matches DB migration).
// The 9-col stub here was redundant — schema-manufacturing is now the canonical definition.
export const downtimeEvents = canonicalDowntimeEvents;

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { downtimeReasonCodes } from '@workspace/db';

export const machineCrews = pgTable('machine_crews', {
  id: integer('id').primaryKey(),
  workCenterId: text('work_center_id').notNull(),
  employeeId: text('employee_id').notNull(),
  productionOrderId: integer('production_order_id'),
  role: text('role'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
});

export const equipmentMaintenance = pgTable('equipment_maintenance', {
  id: integer('id').primaryKey(),
  workCenterId: text('work_center_id').notNull(),
  type: text('type').notNull(),
  scheduledAt: ts('scheduled_at').notNull(),
  completedAt: ts('completed_at'),
  status: text('status').notNull().default('scheduled'),
  notes: text('notes'),
  assignedTo: text('assigned_to'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

// qcReclamations: converged to canonical lib/db definition (superset of 9-col stub).
// Consumers importing qcReclamations from this module get the richer canonical schema.
export { qcReclamations } from '@workspace/db';

export const qcBraks = pgTable('qc_braks', {
  id: integer('id').primaryKey(),
  productionOrderId: text('production_order_id'),
  materialId: text('material_id'),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('pending'),
  createdAt: ts('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  type: text('type').notNull().default('info'),
  isRead: boolean('is_read').default(false),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  createdAt: ts('created_at').defaultNow(),
});

export const marketingCampaigns = pgTable('marketing_campaigns', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('draft'),
  budget: decimal('budget', { precision: 18, scale: 2 }),
  startDate: ts('start_date'),
  endDate: ts('end_date'),
  createdBy: text('created_by'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

export const marketingLeads = pgTable('marketing_leads', {
  id:          integer('id').primaryKey(),
  campaignId:  text('campaign_id'),
  firstName:   text('first_name'),
  lastName:    text('last_name'),
  email:       text('email'),
  phone:       text('phone'),
  status:      text('status').notNull().default('new'),
  lostReason:  text('lost_reason'),
  convertedAt: ts('converted_at'),
  createdAt:   ts('created_at').defaultNow(),
  updatedAt:   ts('updated_at').defaultNow(),
  deletedAt:   ts('deleted_at'),
});

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { productCategories } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { websiteBanners } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { websiteSettings } from '@workspace/db';

export const securityAccess = pgTable('security_access', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  module: text('module').notNull(),
  canAccess: boolean('can_access').default(true),
  grantedBy: text('granted_by'),
  grantedAt: ts('granted_at').defaultNow(),
  createdAt: ts('created_at').defaultNow(),
});

export const securityAttendance = pgTable('security_attendance', {
  id: integer('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  eventType: text('event_type').notNull(),
  timestamp: ts('timestamp').notNull(),
  gateId: text('gate_id'),
  method: text('method'),
  createdAt: ts('created_at').defaultNow(),
});
