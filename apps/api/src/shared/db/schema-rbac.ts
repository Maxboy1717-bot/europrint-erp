/**
 * @module schema-rbac
 * @description Source module. See exports for details.
 */

import {
  pgTable, serial, integer, varchar, text, jsonb, timestamp, boolean, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const rbacPositions = pgTable('positions', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  nameUz: varchar('name_uz', { length: 150 }).notNull(),
  nameRu: varchar('name_ru', { length: 150 }),
  departmentId: integer('department_id'),
  level: integer('level').default(1),
  rbacTier: varchar('rbac_tier', { length: 20 }).notNull().default('standard'),
  isManagement: boolean('is_management').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const positionPermissions = pgTable(
  'position_permissions',
  {
    id: serial('id').primaryKey(),
    positionId: integer('position_id').notNull(),
    moduleCode: varchar('module_code', { length: 50 }).notNull(),
    accessLevel: varchar('access_level', { length: 20 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_pos_perm_position_module').on(table.positionId, table.moduleCode),
  ],
);

export const auditLogs = pgTable('audit_logs', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 100 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changedFields: text('changed_fields').array(),
  reason: text('reason'),
  transactionId: varchar('transaction_id', { length: 100 }),
  userId: varchar('user_id'),
  userFullName: text('user_full_name'),
  userRole: varchar('user_role', { length: 50 }),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const positionFeatureFlags = pgTable(
  'position_feature_flags',
  {
    id: serial('id').primaryKey(),
    positionId: integer('position_id').notNull(),
    featureKey: varchar('feature_key', { length: 100 }).notNull(),
    isAllowed: boolean('is_allowed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_pos_ff_position_feature').on(table.positionId, table.featureKey),
  ],
);
