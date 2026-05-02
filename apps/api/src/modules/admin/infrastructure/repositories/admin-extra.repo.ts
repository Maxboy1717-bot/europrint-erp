import { Injectable, Logger } from '@nestjs/common';
import { Result, safeCall } from '@common/result';
import { db } from '@shared/db';
import { sql, desc, eq } from 'drizzle-orm';
import { pgTable, varchar, text, jsonb, timestamp, integer, boolean, serial } from 'drizzle-orm/pg-core';

const auditLogsTable = pgTable('audit_logs', {
  id: varchar('id').primaryKey(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 100 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changedFields: text('changed_fields').array(),
  reason: text('reason'),
  userId: varchar('user_id'),
  userFullName: text('user_full_name'),
  userRole: varchar('user_role', { length: 50 }),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

const systemAlertsTable = pgTable('system_alerts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message'),
  level: varchar('level', { length: 20 }).notNull().default('info'),
  sourceType: varchar('source_type', { length: 50 }),
  sourceId: text('source_id'),
  isRead: boolean('is_read').notNull().default(false),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type AuditLogRow = typeof auditLogsTable.$inferSelect;
export type SystemAlertRow = typeof systemAlertsTable.$inferSelect;

@Injectable()
export class AdminExtraRepository {
  private readonly logger = new Logger(AdminExtraRepository.name);

  async findLogs(page: number, limit: number): Promise<Result<{ rows: AuditLogRow[]; total: number }>> {
    return safeCall(async () => {
      const offset = (page - 1) * limit;
      const [rows, countResult] = await Promise.all([
        db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(limit).offset(offset),
        db.select({ count: sql<number>`COUNT(*)` }).from(auditLogsTable),
      ]);
      return { rows, total: Number(countResult[0]?.count ?? 0) };
    });
  }

  async findAuditByTable(tableName: string | undefined, page: number): Promise<Result<AuditLogRow[]>> {
    return safeCall(async () => {
      const offset = (page - 1) * 20;
      return tableName
        ? db.select().from(auditLogsTable).where(eq(auditLogsTable.tableName, tableName)).orderBy(desc(auditLogsTable.createdAt)).limit(20).offset(offset)
        : db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(20).offset(offset);
    });
  }

  async findAlerts(): Promise<Result<{ alerts: SystemAlertRow[]; unreadCount: number }>> {
    return safeCall(async () => {
      const [alerts, cntResult] = await Promise.all([
        db.select().from(systemAlertsTable).orderBy(desc(systemAlertsTable.createdAt)).limit(20),
        db.select({ cnt: sql<number>`COUNT(*)` }).from(systemAlertsTable).where(eq(systemAlertsTable.isRead, false)),
      ]);
      return { alerts, unreadCount: Number(cntResult[0]?.cnt ?? 0) };
    });
  }

  async findAlertById(id: number): Promise<Result<SystemAlertRow | null>> {
    return safeCall(async () => {
      const [row] = await db.select().from(systemAlertsTable).where(eq(systemAlertsTable.id, id));
      return row ?? null;
    });
  }
}
