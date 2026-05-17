/**
 * @module schema-compat-3
 * @description Source module. See exports for details.
 */

import { pgTable, uuid, text, boolean, decimal, integer, createId, ts, stub } from './schema-compat-helpers';
import { work_centers as canonicalWorkCenters } from './schema-manufacturing';
import { routings as canonicalRoutings } from './schema-manufacturing';

export const mroInventory = stub(pgTable('mro_inventory', {
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
}));

export const productionOrders = stub(pgTable('production_orders', {
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
}));

// routings: re-exported from canonical definition in schema-manufacturing.ts
export const routings = canonicalRoutings;

export const routingOperations = stub(pgTable('routing_operations', {
  id: integer('id').primaryKey(),
  routingId: text('routing_id').notNull(),
  workCenterId: text('work_center_id'),
  name: text('name').notNull(),
  sequence: integer('sequence').default(0),
  setupTimeMin: decimal('setup_time_min', { precision: 8, scale: 2 }).default('0'),
  runTimeMin: decimal('run_time_min', { precision: 8, scale: 2 }).default('0'),
  createdAt: ts('created_at').defaultNow(),
}));

export const bomHeaders = stub(pgTable('bom_headers', {
  id: integer('id').primaryKey(),
  productId: text('product_id').notNull(),
  version: text('version').default('1.0'),
  status: text('status').default('draft'),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const bomItems = stub(pgTable('bom_items', {
  id: integer('id').primaryKey(),
  bomId: integer('bom_id').notNull(),
  materialId: text('material_id').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unit: text('unit'),
  scrapPercent: decimal('scrap_percent', { precision: 5, scale: 2 }).default('0'),
  createdAt: ts('created_at').defaultNow(),
}));

// work_centers: re-exported from canonical definition in schema-manufacturing.ts
export const workCenters = canonicalWorkCenters;

export const downtimeEvents = stub(pgTable('downtime_events', {
  id: integer('id').primaryKey(),
  sessionId: text('session_id'),
  workCenterId: text('work_center_id').notNull(),
  reasonCodeId: text('reason_code_id'),
  startedAt: ts('started_at').notNull(),
  endedAt: ts('ended_at'),
  durationMin: decimal('duration_min', { precision: 8, scale: 2 }),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
}));

export const downtimeReasonCodes = stub(pgTable('downtime_reason_codes', {
  id: integer('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category'),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
}));

export const machineCrews = stub(pgTable('machine_crews', {
  id: integer('id').primaryKey(),
  workCenterId: text('work_center_id').notNull(),
  employeeId: text('employee_id').notNull(),
  productionOrderId: integer('production_order_id'),
  role: text('role'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
}));

export const equipmentMaintenance = stub(pgTable('equipment_maintenance', {
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
}));

export const qcReclamations = stub(pgTable('qc_reclamations', {
  id: integer('id').primaryKey(),
  productionOrderId: text('production_order_id'),
  type: text('type').notNull(),
  severity: text('severity').notNull().default('low'),
  description: text('description'),
  status: text('status').notNull().default('open'),
  resolvedAt: ts('resolved_at'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const qcBraks = stub(pgTable('qc_braks', {
  id: integer('id').primaryKey(),
  productionOrderId: text('production_order_id'),
  materialId: text('material_id'),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('pending'),
  createdAt: ts('created_at').defaultNow(),
}));

export const notifications = stub(pgTable('notifications', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  type: text('type').notNull().default('info'),
  isRead: boolean('is_read').default(false),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  createdAt: ts('created_at').defaultNow(),
}));

export const marketingCampaigns = stub(pgTable('marketing_campaigns', {
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
}));

export const marketingLeads = stub(pgTable('marketing_leads', {
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
}));

export const productCategories = stub(pgTable('product_categories', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  parentId: text('parent_id'),
  description: text('description'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const websiteBanners = stub(pgTable('website_banners', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  position: text('position'),
}));

export const websiteSettings = stub(pgTable('website_settings', {
  id: integer('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  type: text('type').default('text'),
  updatedAt: ts('updated_at').defaultNow(),
  category: text('category'),
}));

export const securityAccess = stub(pgTable('security_access', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  module: text('module').notNull(),
  canAccess: boolean('can_access').default(true),
  grantedBy: text('granted_by'),
  grantedAt: ts('granted_at').defaultNow(),
  createdAt: ts('created_at').defaultNow(),
}));

export const securityAttendance = stub(pgTable('security_attendance', {
  id: integer('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  eventType: text('event_type').notNull(),
  timestamp: ts('timestamp').notNull(),
  gateId: text('gate_id'),
  method: text('method'),
  createdAt: ts('created_at').defaultNow(),
}));
