
import { Injectable } from '@nestjs/common';
import { posMaterialRequests, db, sql, desc, eq, and, gte, lte } from '@workspace/db';
import type { SQL } from '@workspace/db';
import { safeCall, Result } from '@common/result';

interface RequestFilter {
  status?: string; departmentCode?: string; priority?: string;
  dateFrom?: string; dateTo?: string; requestedBy?: number;
}

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await db.execute(q)).rows as Row[]);

@Injectable()
export class PosRequestExtRepository {
  async getInternalIssueTypeId(): Promise<Result<{ id: unknown } | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT id FROM pos_movement_types WHERE code = 'INTERNAL_ISSUE' LIMIT 1`);
      return (r.ok ? r.data[0] : null) as { id: unknown } ?? null;
      }, 'DB_ERROR');
  }

  async paginateRequests(where: SQL | undefined, limit: number, offset: number): Promise<Result<{ items: unknown[]; total: number }>> {
    return safeCall(async () => {
      const [items, [{ total }]] = await Promise.all([
        db.select().from(posMaterialRequests).where(where).orderBy(desc(posMaterialRequests.createdAt)).limit(limit).offset(offset),
        db.select({ total: sql<number>`count(*)` }).from(posMaterialRequests).where(where),
      ]);
      return { items, total: Number(total) };
      }, 'DB_ERROR');
  }

  async paginateWithFilter(filter: RequestFilter, limit: number, offset: number): Promise<Result<{ items: unknown[]; total: number }>> {
    return safeCall(async () => {
      const conditions = [];
      if (filter.status)         conditions.push(eq(posMaterialRequests.status, filter.status as 'DRAFT' | 'REJECTED' | 'APPROVED' | 'SUBMITTED' | 'PARTIALLY_ISSUED' | 'FULLY_ISSUED' | 'CANCELLED'));
      if (filter.departmentCode) conditions.push(eq(posMaterialRequests.departmentCode, filter.departmentCode));
      if (filter.priority)       conditions.push(eq(posMaterialRequests.priority, filter.priority));
      if (filter.dateFrom)       conditions.push(gte(posMaterialRequests.createdAt, new Date(filter.dateFrom)));
      if (filter.dateTo)         conditions.push(lte(posMaterialRequests.createdAt, new Date(filter.dateTo)));
      if (filter.requestedBy)    conditions.push(eq(posMaterialRequests.requestedBy, filter.requestedBy));
      const where = conditions.length ? and(...conditions) : undefined;
      const result = await this.paginateRequests(where, limit, offset);
      if (!result.ok) throw new Error(result.error?.message ?? 'DB_ERROR');
      return result.data;
      }, 'DB_ERROR');
  }
}
