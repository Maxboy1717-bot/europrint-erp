/**
 * @module mes-schema
 * @description Drizzle ORM schema for MES (Manufacturing Execution System) module.
 * Tables: mes_tasks, mes_papka_orders, mes_shift_handovers, mes_shift_evaluations.
 * These tables support shift management, task tracking, and order execution in MES.
 */

import { sql } from 'drizzle-orm';
import {
  serial, pgTable, text, varchar, integer, timestamp,
  numeric, boolean, uniqueIndex, index, check,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ─── 1. mes_tasks ─────────────────────────────────────────────────────────────
// Operator / supervisor tasks within a production shift.
// Referenced by: mes.bot.ts (getShiftStats, getPendingTasks)

export const mesTasks = pgTable('mes_tasks', {
  id:           serial('id').primaryKey(),
  title:        text('title').notNull(),
  description:  text('description'),
  status:       varchar('status', { length: 30 }).notNull().default('PENDING'),
  priority:     varchar('priority', { length: 20 }).notNull().default('MEDIUM'),
  assignedTo:   integer('assigned_to'),          // FK → employees.id (app-level)
  workCenterId: integer('work_center_id'),        // FK → work_centers (app-level)
  dueDate:      timestamp('due_date', { withTimezone: true }),
  completedAt:  timestamp('completed_at', { withTimezone: true }),
  notes:        text('notes'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('mes_tasks_status_chk', sql`${t.status} IN ('PENDING','IN_PROGRESS','DONE','CANCELLED','ON_HOLD')`),
  check('mes_tasks_priority_chk', sql`${t.priority} IN ('LOW','MEDIUM','HIGH','URGENT')`),
  index('mes_tasks_status_idx').on(t.status),
  index('mes_tasks_priority_idx').on(t.priority),
  index('mes_tasks_created_at_idx').on(t.createdAt),
]);

export const insertMesTaskSchema = createInsertSchema(mesTasks, {
  title:    z.string().min(2, "Sarlavha kamida 2 belgi bo'lishi kerak"),
  status:   z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'ON_HOLD']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type MesTask = typeof mesTasks.$inferSelect;
export type InsertMesTask = z.infer<typeof insertMesTaskSchema>;

// ─── 2. mes_papka_orders ─────────────────────────────────────────────────────
// MES-level papka (folder) orders linked to sales orders.
// Referenced by: mes-shifts-stats.repo.ts (getPapkaOrders)

export const mesPapkaOrders = pgTable('mes_papka_orders', {
  id:             serial('id').primaryKey(),
  salesOrderId:   varchar('sales_order_id', { length: 100 }), // FK → sales_orders.id (app-level)
  orderNumber:    varchar('order_number', { length: 100 }),
  customerName:   text('customer_name'),
  productName:    text('product_name'),
  quantity:       integer('quantity').notNull().default(0),
  completedQty:   integer('completed_qty').notNull().default(0),
  status:         varchar('status', { length: 30 }).notNull().default('PENDING'),
  priority:       varchar('priority', { length: 20 }).notNull().default('MEDIUM'),
  plannedDate:    timestamp('planned_date', { withTimezone: true }),
  completedAt:    timestamp('completed_at', { withTimezone: true }),
  assignedTo:     integer('assigned_to'),
  workCenterId:   integer('work_center_id'),
  notes:          text('notes'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('mes_papka_orders_status_chk', sql`${t.status} IN ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED','ON_HOLD')`),
  check('mes_papka_orders_priority_chk', sql`${t.priority} IN ('LOW','MEDIUM','HIGH','URGENT')`),
  index('mes_papka_orders_status_idx').on(t.status),
  index('mes_papka_orders_sales_order_idx').on(t.salesOrderId),
  index('mes_papka_orders_created_at_idx').on(t.createdAt),
]);

export const insertMesPapkaOrderSchema = createInsertSchema(mesPapkaOrders, {
  quantity: z.number().int().nonnegative(),
  status:   z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type MesPapkaOrder = typeof mesPapkaOrders.$inferSelect;
export type InsertMesPapkaOrder = z.infer<typeof insertMesPapkaOrderSchema>;

// ─── 3. mes_shift_handovers ───────────────────────────────────────────────────
// Shift handover records between supervisors.
// Referenced by: mes-shifts-stats.repo.ts (shiftHandover)

export const mesShiftHandovers = pgTable('mes_shift_handovers', {
  id:                  serial('id').primaryKey(),
  outgoingSupervisor:  integer('outgoing_supervisor').notNull(),  // FK → employees.id (app-level)
  incomingSupervisor:  integer('incoming_supervisor').notNull(),  // FK → employees.id (app-level)
  notes:               text('notes'),
  issues:              text('issues'),
  handoverTime:        timestamp('handover_time', { withTimezone: true }).notNull().defaultNow(),
  pendingTasksCount:   integer('pending_tasks_count').notNull().default(0),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('mes_shift_handovers_outgoing_idx').on(t.outgoingSupervisor),
  index('mes_shift_handovers_time_idx').on(t.handoverTime),
]);

export const insertMesShiftHandoverSchema = createInsertSchema(mesShiftHandovers, {
  outgoingSupervisor: z.number().int().positive(),
  incomingSupervisor: z.number().int().positive(),
  notes:              z.string().optional().nullable(),
  issues:             z.string().optional().nullable(),
}).omit({ id: true, createdAt: true } as never);

export type MesShiftHandover = typeof mesShiftHandovers.$inferSelect;
export type InsertMesShiftHandover = z.infer<typeof insertMesShiftHandoverSchema>;

// ─── 4. mes_shift_evaluations ────────────────────────────────────────────────
// End-of-shift quality / safety / production evaluations.
// Referenced by: mes-shifts-stats.repo.ts (closeShiftEvaluation, getShiftEvaluations)
// Note: ON CONFLICT (shift_id) — shift_id is unique.

export const mesShiftEvaluations = pgTable('mes_shift_evaluations', {
  id:               serial('id').primaryKey(),
  shiftId:          integer('shift_id').notNull(),          // logical shift day-slot id
  supervisorId:     integer('supervisor_id'),               // FK → employees.id (app-level)
  productionScore:  numeric('production_score', { precision: 5, scale: 2 }).notNull().default('0'),
  qualityScore:     numeric('quality_score', { precision: 5, scale: 2 }).notNull().default('0'),
  safetyScore:      numeric('safety_score', { precision: 5, scale: 2 }).notNull().default('0'),
  overallScore:     numeric('overall_score', { precision: 5, scale: 2 }),
  notes:            text('notes'),
  evaluatedAt:      timestamp('evaluated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('mes_shift_evaluations_shift_id_key').on(t.shiftId),
  check('mes_shift_eval_prod_chk', sql`${t.productionScore} BETWEEN 0 AND 100`),
  check('mes_shift_eval_qual_chk', sql`${t.qualityScore} BETWEEN 0 AND 100`),
  check('mes_shift_eval_safe_chk', sql`${t.safetyScore} BETWEEN 0 AND 100`),
  index('mes_shift_evaluations_evaluated_at_idx').on(t.evaluatedAt),
]);

export const insertMesShiftEvaluationSchema = createInsertSchema(mesShiftEvaluations, {
  shiftId:         z.number().int().positive(),
  productionScore: z.number().min(0).max(100).default(0),
  qualityScore:    z.number().min(0).max(100).default(0),
  safetyScore:     z.number().min(0).max(100).default(0),
  notes:           z.string().optional().nullable(),
}).omit({ id: true, createdAt: true } as never);

export type MesShiftEvaluation = typeof mesShiftEvaluations.$inferSelect;
export type InsertMesShiftEvaluation = z.infer<typeof insertMesShiftEvaluationSchema>;

// ─── 5. mes_maintenance_tasks ─────────────────────────────────────────────────
// Maintenance tasks assigned from maintenance requests.
// Canonical source: apps/api/src/shared/db/schema-ext-b-2.ts

export const mesMaintenanceTasks = pgTable('mes_maintenance_tasks', {
  id:          serial('id').primaryKey(),
  requestId:   integer('request_id'),
  assignedTo:  integer('assigned_to'),
  title:       text('title'),
  status:      text('status').default('pending'),
  reason:      text('reason'),
  result:      text('result'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('mes_maint_tasks_status_idx').on(t.status),
  index('mes_maint_tasks_request_idx').on(t.requestId),
]);

export const insertMesMaintenanceTaskSchema = createInsertSchema(mesMaintenanceTasks).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type MesMaintenanceTask = typeof mesMaintenanceTasks.$inferSelect;
export type InsertMesMaintenanceTask = z.infer<typeof insertMesMaintenanceTaskSchema>;

// ─── 6. mes_production_sessions ───────────────────────────────────────────────
// Operator production sessions per order/machine/shift.
// Canonical source: apps/api/src/shared/db/schema-ext-b-2.ts

export const mesProductionSessions = pgTable('mes_production_sessions', {
  id:          serial('id').primaryKey(),
  orderId:     integer('order_id'),
  operatorId:  integer('operator_id'),
  machineId:   integer('machine_id'),
  shiftId:     integer('shift_id'),
  sessionDate: timestamp('session_date', { mode: 'date', withTimezone: false }),
  status:      text('status').default('active'),
  producedQty: numeric('produced_qty', { precision: 15, scale: 4 }).default('0'),
  defectQty:   numeric('defect_qty',   { precision: 15, scale: 4 }).default('0'),
  startTime:   timestamp('start_time', { withTimezone: true }),
  endTime:     timestamp('end_time',   { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('mes_prod_sessions_operator_idx').on(t.operatorId),
  index('mes_prod_sessions_machine_idx').on(t.machineId),
  index('mes_prod_sessions_status_idx').on(t.status),
]);

export const insertMesProductionSessionSchema = createInsertSchema(mesProductionSessions).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type MesProductionSession = typeof mesProductionSessions.$inferSelect;
export type InsertMesProductionSession = z.infer<typeof insertMesProductionSessionSchema>;

// ─── 7. mes_shift_stats ───────────────────────────────────────────────────────
// Aggregated per-machine shift statistics (produced, defects, downtime, OEE).
// Canonical source: apps/api/src/shared/db/schema-ext-b-2.ts

export const mesShiftStats = pgTable('mes_shift_stats', {
  id:          serial('id').primaryKey(),
  shiftDate:   timestamp('shift_date', { mode: 'date', withTimezone: false }),
  shiftNumber: integer('shift_number'),
  machineId:   integer('machine_id'),
  producedQty: numeric('produced_qty', { precision: 15, scale: 4 }).default('0'),
  defectQty:   numeric('defect_qty',   { precision: 15, scale: 4 }).default('0'),
  downtimeMin: integer('downtime_min').default(0),
  oee:         numeric('oee', { precision: 5, scale: 2 }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('mes_shift_stats_machine_idx').on(t.machineId),
  index('mes_shift_stats_date_idx').on(t.shiftDate),
]);

export const insertMesShiftStatSchema = createInsertSchema(mesShiftStats).omit({ id: true, createdAt: true } as never);
export type MesShiftStat = typeof mesShiftStats.$inferSelect;
export type InsertMesShiftStat = z.infer<typeof insertMesShiftStatSchema>;

// ─── 8. mes_wms_param_checks ──────────────────────────────────────────────────
// 08-mes #24 — session Format/gramm (А×В + grammaj) compared against the WMS batch's
// material parameters (batch_lots → material_cards). One row per comparison; is_mismatch
// flags when a parameter present on BOTH sides differs. Additive, all-nullable snapshot
// columns; existing rows/flows unaffected. Written by MesWmsParamCompareRepository (raw SQL).
export const mesWmsParamChecks = pgTable('mes_wms_param_checks', {
  id:             serial('id').primaryKey(),
  sessionId:      integer('session_id').notNull(),
  batchLotId:     integer('batch_lot_id'),
  materialId:     integer('material_id'),
  sessionFormatA: numeric('session_format_a', { precision: 12, scale: 4 }),
  sessionFormatB: numeric('session_format_b', { precision: 12, scale: 4 }),
  sessionGramm:   numeric('session_gramm', { precision: 12, scale: 4 }),
  wmsFormatA:     numeric('wms_format_a', { precision: 12, scale: 4 }),
  wmsFormatB:     numeric('wms_format_b', { precision: 12, scale: 4 }),
  wmsGrammage:    numeric('wms_grammage', { precision: 12, scale: 4 }),
  comparedParams: integer('compared_params').notNull().default(0),
  isMismatch:     boolean('is_mismatch').notNull().default(false),
  mismatchDetail: text('mismatch_detail'),
  checkedBy:      integer('checked_by'),
  checkedAt:      timestamp('checked_at', { withTimezone: false }).notNull().defaultNow(),
}, (t) => [
  index('idx_mes_wms_param_checks_session').on(t.sessionId),
]);

export const insertMesWmsParamCheckSchema = createInsertSchema(mesWmsParamChecks).omit({ id: true, checkedAt: true } as never);
export type MesWmsParamCheck = typeof mesWmsParamChecks.$inferSelect;
export type InsertMesWmsParamCheck = z.infer<typeof insertMesWmsParamCheckSchema>;
