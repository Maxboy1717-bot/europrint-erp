/**
 * @module admin-extra.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: dynamic SQL fragment composition (variable WHERE clause built at
 *   runtime from optional action/tableName/userId/from/to/search filters with
 *   ILIKE-escaped wildcards) combined with LEFT JOIN to users + TRIM/COALESCE
 *   computed user_display_name column, plus `sql.raw` literal DISTINCT query.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, safeCall, Err, AppErr } from '@common/result';
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

  async findLogsFiltered(opts: {
    action?: string;
    tableName?: string;
    userId?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ rows: AuditLogRow[]; total: number }>> {
    const { action, tableName, userId, search, from, to, page = 1, limit = 50 } = opts;
    const safeLimit = Math.min(Number(limit) || 50, 200);
    const offset = (Math.max(1, Number(page)) - 1) * safeLimit;

    // Escape LIKE metacharacters so user input doesn't accidentally match everything
    const esc = (s: string) => `%${s.replace(/[\\%_]/g, '\\$&')}%`;

    // Validate user-supplied date strings before constructing Date objects.
    // Invalid input would otherwise produce `Invalid Date` and a 500 from the DB driver.
    let fromDate: Date | null = null;
    if (from) {
      const d = new Date(from);
      if (isNaN(d.getTime())) {
        return Err(AppErr('VALIDATION', `Invalid 'from' date: ${from}`));
      }
      fromDate = d;
    }
    let toDate: Date | null = null;
    if (to) {
      const d = new Date(to + 'T23:59:59.999Z');
      if (isNaN(d.getTime())) {
        return Err(AppErr('VALIDATION', `Invalid 'to' date: ${to}`));
      }
      toDate = d;
    }

    return safeCall(async () => {
      const whereParts    = sql`1=1`;
      const actionPart    = action    ? sql` AND al.action     ILIKE ${esc(action)}`                                                                                              : sql``;
      const tableNamePart = tableName ? sql` AND al.table_name ILIKE ${esc(tableName)}`                                                                                           : sql``;
      const userIdPart    = userId    ? sql` AND al.user_id    = ${userId}`                                                                                                       : sql``;
      const fromPart      = fromDate  ? sql` AND al.created_at >= ${fromDate}`                                                                                                    : sql``;
      const toPart        = toDate    ? sql` AND al.created_at <= ${toDate}`                                                                                                      : sql``;
      const searchPart    = search    ? sql` AND (al.table_name ILIKE ${esc(search)} OR al.record_id ILIKE ${esc(search)} OR al.user_id ILIKE ${esc(search)})`                   : sql``;

      const [rows, countRows] = await Promise.all([
        db.execute(sql`
          SELECT al.id, al.table_name, al.record_id, al.action,
                 al.old_values, al.new_values, al.changed_fields,
                 al.reason, al.user_id, al.user_full_name, al.user_role,
                 al.ip_address, al.created_at,
                 TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS user_display_name,
                 NULL::text AS user_display_role
          FROM audit_logs al
          LEFT JOIN users u ON u.id::text = al.user_id
          WHERE ${whereParts}${actionPart}${tableNamePart}${userIdPart}${fromPart}${toPart}${searchPart}
          ORDER BY al.created_at DESC
          LIMIT ${safeLimit} OFFSET ${offset}
        `),
        db.execute(sql`
          SELECT COUNT(*)::int AS total FROM audit_logs al
          WHERE ${whereParts}${actionPart}${tableNamePart}${userIdPart}${fromPart}${toPart}${searchPart}
        `),
      ]);

      return {
        rows: (rows.rows ?? []) as unknown as AuditLogRow[],
        total: Number((countRows.rows?.[0] as Record<string, unknown>)?.total ?? 0),
      };
    });
  }

  async getDistinctTables(): Promise<Result<string[]>> {
    return safeCall(async () => {
      const rows = await db.execute(sql.raw(
        `SELECT DISTINCT table_name FROM audit_logs ORDER BY table_name`
      ));
      return (Array.isArray(rows.rows) ? rows.rows : []).map((r: Record<string, unknown>) => String(r.table_name ?? ''));
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
