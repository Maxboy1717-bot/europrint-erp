/**
 * @module schema-compat-4
 * @description Source module. See exports for details.
 */

import { pgTable, uuid, text, boolean, decimal, integer, serial, createId, ts } from './schema-compat-helpers';
import z from 'zod';


export const logisticsRoutes = pgTable('logistics_routes', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  fromLocation: text('from_location'),
  toLocation: text('to_location'),
  distanceKm: decimal('distance_km', { precision: 8, scale: 2 }),
  estimatedHours: decimal('estimated_hours', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
});

/**
 * @deprecated SCHEMA DISCREPANCY — this stub disagrees with two other definitions of `iot_sensors`:
 *   - schema-ext-b-2.ts:259 — basic shape (id, name, type, machine_id, is_active, created_at)
 *   - raw SQL in iot/application/commands/*.handler.ts — uses sensor_code/unit/min_threshold/
 *     max_threshold/last_reading column names that exist in neither Drizzle definition.
 *
 * The production DB shape matches the RAW-SQL contract (sensor_code etc.). The Drizzle defs
 * are out of date. Until a migration aligns them, the camelCase stub below is the only one
 * used by Drizzle queries; switching modules from this stub to schema-ext-b-2.ts's
 * iot_sensors will break them because that snake_case definition lacks the columns the
 * sensors.repository.ts service expects.
 *
 * Future cleanup task:
 *   1. Introspect the prod DB columns.
 *   2. Rewrite schema-ext-b-2.ts iot_sensors to match.
 *   3. Remove this stub.
 *   4. Migrate sensors.repository.ts to the canonical schema.
 */
export const iotSensors = pgTable('iot_sensors', {
  id: integer('id').primaryKey(),
  deviceCode: text('device_code').notNull().unique(),
  name: text('name').notNull(),
  location: text('location'),
  type: text('type').notNull(),
  status: text('status').notNull().default('active'),
  lastReadingAt: ts('last_reading_at'),
  thresholds: text('thresholds').default('{}'),
  createdAt: ts('created_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

export const designLibraryItems = pgTable('design_library_items', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  fileUrl: text('file_url'),
  thumbnailUrl: text('thumbnail_url'),
  tags: text('tags').default('[]'),
  status: text('status').notNull().default('active'),
  createdBy: text('created_by'),
  createdAt: ts('created_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

export const hitlApprovals = pgTable('hitl_approvals', {
  id: integer('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  status: text('status').notNull().default('pending'),
  requestedBy: text('requested_by'),
  approvedBy: text('approved_by'),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
});

export const customerOrders = pgTable('customer_orders', {
  id: integer('id').primaryKey(),
  customerId: text('customer_id'),
  orderNumber: text('order_number').unique(),
  status: text('status').notNull().default('pending'),
  totalAmount: decimal('total_amount', { precision: 18, scale: 2 }),
  total: decimal('total', { precision: 18, scale: 2 }),
  currency: text('currency').default('UZS'),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
  guestName: text('guest_name'),
  guestPhone: text('guest_phone'),
  paymentStatus: text('payment_status'),
});

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { customerAccounts } from '@workspace/db';

export const publicProducts = pgTable('public_products', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  description: text('description'),
  price: decimal('price', { precision: 18, scale: 2 }),
  categoryId: text('category_id'),
  isActive: boolean('is_active').default(true),
  imageUrl: text('image_url'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
  inStock: boolean('in_stock').default(true),
  isFeatured: boolean('is_featured').default(false),
});

export const websitePages = pgTable('website_pages', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  content: text('content'),
  isPublished: boolean('is_published').default(false),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

export const portfolioItems = pgTable('portfolio_items', {
  id: integer('id').primaryKey(),
  sortOrder: integer('sort_order').default(0),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  categoryId: text('category_id'),
  isPublished: boolean('is_published').default(true),
  createdAt: ts('created_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

export { lmsModules as modules } from '@workspace/db';

export const tests = pgTable('lms_tests', {
  id: integer('id').primaryKey(),
  moduleId: text('module_id'),
  courseId: integer('course_id'),
  title: text('title').notNull(),
  maxScore: integer('max_score').default(100),
  createdAt: ts('created_at').defaultNow(),
});

export const assignments = pgTable('lms_assignments', {
  id: integer('id').primaryKey(),
  enrollmentId: text('enrollment_id').notNull(),
  userId: integer('user_id'),
  moduleId: text('module_id'),
  status: text('status').notNull().default('pending'),
  score: decimal('score', { precision: 5, scale: 2 }),
  submittedAt: ts('submitted_at'),
  createdAt: ts('created_at').defaultNow(),
  courseId: integer('course_id'),
});

export const courses = pgTable('courses', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  status: text('status').notNull().default('active'),
  instructorId: text('instructor_id'),
  coverUrl: text('cover_url'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

export const mmDeliveries = pgTable('mm_deliveries', {
  id: integer('id').primaryKey(),
  purchaseOrderId: text('purchase_order_id'),
  vendorId: text('vendor_id'),
  status: text('status').notNull().default('pending'),
  deliveredAt: ts('delivered_at'),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
});

export const sdOrders = pgTable('sd_orders', {
  id: integer('id').primaryKey(),
  orderNumber: text('order_number').unique(),
  customerId: text('customer_id'),
  status: text('status').notNull().default('draft'),
  totalAmount: decimal('total_amount', { precision: 18, scale: 2 }),
  createdBy: text('created_by'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
});

export const productionSessions = pgTable('production_sessions', {
  id: integer('id').primaryKey(),
  productionOrderId: text('production_order_id'),
  sessionId: text('session_id'),
  workCenterId: text('work_center_id'),
  status: text('status').notNull().default('active'),
  startedAt: ts('started_at'),
  endedAt: ts('ended_at'),
  createdAt: ts('created_at').defaultNow(),
});

// NOTE: convergence deferred (tier-1) — lib/db aiUsageLogs.userId is numeric but
// ai-router passes string; needs column-type reconciliation before re-export.
export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: serial('id').primaryKey(),                                     // serial = auto-increment, id excluded from insert type
  userId: text('user_id'),
  module: text('module').notNull().default('system'),
  action: text('action').notNull().default('unknown'),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),                    // drift-added: sum of input+output
  cost: decimal('cost', { precision: 10, scale: 6 }).default('0'),
  model: text('model'),
  provider: text('provider'),                                         // used by ai-router module
  taskType: text('task_type'),                                        // used by ai-router module
  estimatedCost: decimal('estimated_cost', { precision: 12, scale: 6 }).default('0'),  // ai-router
  sessionId: text('session_id'),                                      // drift-added: ai-router session
  requestSummary: text('request_summary'),                            // drift-added: ai-router
  responseSummary: text('response_summary'),                          // drift-added: ai-router
  latencyMs: integer('latency_ms').default(0),                        // drift-added: ai-router
  status: text('status').notNull().default('success'),
  createdAt: ts('created_at').defaultNow(),
});

export const approvalRequests = pgTable('approval_requests', {
  id: serial('id').primaryKey(),                                     // serial = auto-increment
  documentType: text('document_type').notNull(),
  documentId: text('document_id').notNull(),
  documentNumber: text('document_number'),
  amount: decimal('amount', { precision: 18, scale: 2 }).default('0'),
  currency: text('currency').default('UZS'),
  status: text('status').notNull().default('pending'),
  requestedBy: text('requested_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: ts('approved_at'),
  rejectedBy: text('rejected_by'),
  rejectedAt: ts('rejected_at'),
  rejectionReason: text('rejection_reason'),  // drift-added column; used by approval-workflow.repo
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
});

export const designOrders = pgTable('design_orders', {
  id: integer('id').primaryKey(),
  salesOrderId: text('sales_order_id'),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  assignedTo: text('assigned_to'),
  files: text('files').default('[]'),
  completedAt: ts('completed_at'),
  createdBy: text('created_by').notNull(),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

export const stockTransferLines = pgTable('stock_transfer_lines', {
  id: integer('id').primaryKey(),
  transferId: text('transfer_id').notNull(),
  materialId: text('material_id').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unit: text('unit'),
  status: text('status').notNull().default('pending'),
  createdAt: ts('created_at').defaultNow(),
});

