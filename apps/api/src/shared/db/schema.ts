/**
 * @module schema
 * @description Source module. See exports for details.
 */

import { InternalServerErrorException } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export * from './schema-enums';
export * from './schema-core';
export * from './schema-manufacturing';
export * from './schema-wms';
export * from './schema-hr-lms';
export * from './schema-finance';
export * from './schema-misc';
export * from './schema-misc-iot';
export * from './schema-misc-qc';
export * from './schema-pos-ext';
export * from './schema-pos-retail';
export * from './schema-rbac';
export * from './schema-misc-app';
export * from './schema-forecast';
export * from './schema-qc-spc';
export * from './schema-hr-overtime';
export * from './schema-sprint3';
export * from './schema-order-workflow';

import {
  users, refresh_tokens, audit_logs, settings,
  leads, deals, sales_orders,
} from './schema-core';
import {
  boms, routings, production_orders, mes_sessions,
  work_centers, downtime_events,
} from './schema-manufacturing';
import {
  warehouses, stock_items, stock_movements,
  vendors, purchase_orders, qc_inspections,
} from './schema-wms';
import {
  employees, attendance, payroll,
  lms_courses, lms_enrollments,
  departments, positions, user_panels, leave_requests,
} from './schema-hr-lms';
import {
  invoices, payments, gl_entries,
  budgets, budget_lines, approval_requests, ai_usage_logs,
} from './schema-finance';
import {
  sensor_devices, sensor_readings,
} from './schema-misc-iot';
import {
  deliveries, design_orders, maintenance_orders,
  kanban_tasks, campaigns, security_incidents, notifications,
} from './schema-misc';
import {
  qc_defects, qc_reclamations,
} from './schema-misc-qc';
import {
  pos_movement_types, pos_movements, pos_movement_lines, pos_warehouse_access,
  inventory_counts, inventory_count_lines,
  transfer_requests, transfer_request_lines, materials,
} from './schema-pos-ext';
import { forecast_series } from './schema-forecast';
import { control_chart_point } from './schema-qc-spc';
import { overtime_policy, employee_separation } from './schema-hr-overtime';

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

// In test/CI environments DATABASE_URL is often unset or empty — return a stub
// Pool that throws only when used, so unit tests that don't actually hit the DB
// can `import` from @shared/db without crashing at module-load time.
//
// NOTE: use `||` not `??` because GitHub Actions sets `DATABASE_URL` to an empty
// string when the secret is missing; `??` would not fall through on `""`.
const TEST_STUB_URL = 'postgres://stub:stub@localhost:5432/stub';
const isTestEnv = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID || !!process.env.VITEST;
const effectiveConnString = connectionString
  || (isTestEnv ? TEST_STUB_URL : null);

if (!effectiveConnString) {
  throw new InternalServerErrorException('DATABASE_URL environment variable is not set');
}

export const pool = new Pool({ connectionString: effectiveConnString });
export const db = drizzle(pool);

import { SQL, SQLWrapper, sql } from 'drizzle-orm';
// RULE4_EXCEPTION: `rawSql` is the project's parameterised raw-SQL escape
// hatch. By definition it wraps `db.execute`; callers must already pass a
// safely-parameterised `sql\`...\`` template. Used elsewhere for the few
// queries Drizzle builders cannot express (lateral joins, complex CTEs).
export const rawSql = (query: SQL): ReturnType<typeof db.execute> => db.execute(query);

/**
 * DDL operations only (CREATE TABLE, ALTER TABLE, etc.) — cannot use query builder.
 * SECURITY: `q` MUST be a hard-coded string literal — never a user-controlled value.
 * For DML queries use `rawSql(sql\`...\`)` with template-literal parameterisation.
 */
// RULE4_EXCEPTION: DDL-only helper. Drizzle has no builder API for CREATE
// TABLE / ALTER TABLE / CREATE INDEX. Callers pass hard-coded string
// literals from migration files.
export const ddlRun = (q: SQL | SQLWrapper | string): ReturnType<typeof db.execute> =>
  // NOTE: P3-30 — `ddlRun` is the project-wide DDL helper; the string branch is only invoked with hard-coded migration literals (see JSDoc above and call sites in `common/database/ddl-migrations.ts`, `infrastructure/database/sprint*-migration.service.ts`, `crm-migration.service.ts`); no user input.
  db.execute(typeof q === 'string' ? sql.raw(q) : (q as SQL));

/**
 * Typed query helper.
 * Accepts only `sql\`...\`` template objects — NOT plain strings — to prevent accidental
 * SQL injection. Use `sql\`SELECT ... WHERE id = ${id}\`` for parameterised values.
 */
export async function runQuery<T = Record<string, unknown>>(
  q: SQL | SQLWrapper,
): Promise<T[] & { rows: T[] }> {
  // RULE4_EXCEPTION: typed wrapper around `db.execute` for callers that
  // already need raw SQL (analytics with LATERAL/UNNEST/window functions,
  // multi-CTE pipelines). Drizzle builder API has no equivalent.
  const result = await db.execute(q as SQL);
  const arr = castTo<T[]>(Array.isArray(result) ? result : ((result as { rows?: unknown }).rows ?? []));
  return Object.assign(arr, { rows: arr });
}

// ============================================================================
// SCHEMA EXPORT (for Drizzle migrations)
// ============================================================================

export const schema = {
  users, refresh_tokens, audit_logs, settings,
  leads, deals, sales_orders,
  boms, routings, production_orders, mes_sessions,
  work_centers, downtime_events,
  warehouses, stock_items, stock_movements,
  vendors, purchase_orders, qc_inspections,
  employees, attendance, payroll,
  lms_courses, lms_enrollments,
  departments, positions, user_panels, leave_requests,
  invoices, payments, gl_entries,
  budgets, budget_lines, approval_requests, ai_usage_logs,
  sensor_devices, sensor_readings,
  deliveries, design_orders, maintenance_orders,
  kanban_tasks, campaigns, security_incidents, notifications,
  qc_defects, qc_reclamations,
  pos_movement_types, pos_movements, pos_movement_lines, pos_warehouse_access,
  inventory_counts, inventory_count_lines,
  transfer_requests, transfer_request_lines, materials,
  forecast_series,
  control_chart_point,
  overtime_policy,
  employee_separation,
};
