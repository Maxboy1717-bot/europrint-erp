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

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { customerOrders } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { customerAccounts } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { publicProducts } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { websitePages } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { portfolioItems } from '@workspace/db';

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
  // Card-centric LMS (EP-LMS-001): a darslik is bound to an org-CARD (org_functions.id),
  // not a department/employee. Logical ref only (no hard FK — cross-module ADR). Keeps department_id.
  cardId: integer('card_id'),
  // Q562 (cross-card credit): a universal course (e.g. TX instruktaj) completed on one card
  // credits the same course on the employee's OTHER cards. CourseCompletedCreditHandler gates on this.
  isUniversal: boolean('is_universal').default(false),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
});

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { mmDeliveries } from '@workspace/db';

// Converged to single source (lib/db canonical) — see docs/schema-merge-plan.md
export { sdOrders } from '@workspace/db';

export const productionSessions = pgTable('production_sessions', {
  id: integer('id').primaryKey(),
  productionOrderId: text('production_order_id'),
  sessionId: text('session_id'),
  workCenterId: text('work_center_id'),
  status: text('status').notNull().default('active'),
  startedAt: ts('started_at'),
  endedAt: ts('ended_at'),
  createdAt: ts('created_at').defaultNow(),
  // T7-05: direct operator=KARTA link → org_departments(id). Additive, nullable
  // (owner/MES DATA). A67 ckp-mes-feed listener prefers this over resolve-via paths.
  operatorCardId: integer('operator_card_id'),
  // 08-mes #4 — sessiya BOSHLANGANDAGI norma versiyasi snapshot (retro-buzilmaslik).
  // NULL = hali snapshot qilinmagan / amaldagi norma yo'q. start-session.handler yozadi.
  normaVersion: integer('norma_version'),
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

// designOrders: converged to canonical lib/db definition (pp/pp-design.ts superset).
// Consumers importing designOrders from this module get the richer canonical schema.
export { designOrders } from '@workspace/db';

export const stockTransferLines = pgTable('stock_transfer_lines', {
  id: integer('id').primaryKey(),
  transferId: text('transfer_id').notNull(),
  materialId: text('material_id').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unit: text('unit'),
  status: text('status').notNull().default('pending'),
  createdAt: ts('created_at').defaultNow(),
});

