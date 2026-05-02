import { Ok, Err, Result } from '@common/result';

import { Injectable, Logger } from '@nestjs/common';
import { db } from '@workspace/db';
import { posAuditLog } from '@workspace/db';
import { and, eq, gte, ilike, lte, sql, asc, desc } from '@workspace/db';
import { users } from '@workspace/db';
import { getTableColumns } from 'drizzle-orm';

export interface AuditLogEntry {
  userId?: number; telegramUserId?: bigint; action: string; entityType?: string; entityId?: number;
  oldValue?: Record<string, unknown>; newValue?: Record<string, unknown>; ipAddress?: string;
  userAgent?: string; sessionId?: string; durationMs?: number; success?: boolean; errorMessage?: string;
}

export interface AuditLogFilter {
  userId?: number; entityType?: string; entityId?: number;
  action?: string; dateFrom?: Date; dateTo?: Date;
}

type Row = Record<string, unknown>;
interface AuditLogPage { items: Row[]; countRow: { total?: string } | undefined }

@Injectable()
export class PosAuditRepository {
  private readonly logger = new Logger(PosAuditRepository.name);

  async insertLog(entry: AuditLogEntry & { createdAt: Date }): Promise<Result<void>> {
    try {
      await db.insert(posAuditLog).values({
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        sessionId: entry.sessionId,
        durationMs: entry.durationMs,
        success: entry.success ?? true,
        errorMessage: entry.errorMessage,
        createdAt: entry.createdAt,
      });
      return Ok();
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async queryAuditLog(filter: AuditLogFilter, limit: number, offset: number): Promise<Result<AuditLogPage>> {
    try {
      const conditions = [];
      if (filter.userId)     conditions.push(eq(posAuditLog.userId, filter.userId));
      if (filter.entityType) conditions.push(eq(posAuditLog.entityType, filter.entityType));
      if (filter.entityId)   conditions.push(eq(posAuditLog.entityId, filter.entityId));
      if (filter.action)     conditions.push(ilike(posAuditLog.action, `%${filter.action}%`));
      if (filter.dateFrom)   conditions.push(gte(posAuditLog.createdAt, filter.dateFrom));
      if (filter.dateTo)     conditions.push(lte(posAuditLog.createdAt, filter.dateTo));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, countRows] = await Promise.all([
        db.select().from(posAuditLog).where(where)
          .orderBy(desc(posAuditLog.createdAt))
          .limit(limit).offset(offset),
        db.select({ total: sql<string>`COUNT(*)` }).from(posAuditLog).where(where),
      ]);
      return Ok({ items: items as Row[], countRow: countRows[0] as { total?: string } | undefined });
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getEntityHistory(entityType: string, entityId: number): Promise<Result<Row[]>> {
    try {
      const auditCols = getTableColumns(posAuditLog);
      const rows = await db
        .select({
          ...auditCols,
          userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(posAuditLog)
        .leftJoin(users, eq(users.id, posAuditLog.userId))
        .where(
          and(
            eq(posAuditLog.entityType, entityType),
            eq(posAuditLog.entityId, entityId),
          ),
        )
        .orderBy(asc(posAuditLog.createdAt));
      return Ok(rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
