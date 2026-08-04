/**
 * @module pos-request-ext.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */


import { Injectable } from '@nestjs/common';
import type { SQL, SQLWrapper } from 'drizzle-orm';
import { posMaterialRequests, db, sql, desc, eq, and, gte, lte } from '@workspace/db';
import { safeCall, Result } from '@common/result';

interface RequestFilter {
  status?: string; departmentCode?: string; priority?: string;
  dateFrom?: string; dateTo?: string; requestedBy?: number;
}

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await db.execute(q)).rows as Row[]);

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
    // Discovery sweep 2026-08-03 ("status bo'yicha filtrlash doim DB xatosi beradi"): re-verified
    // live (Q-29) — the RAW SQL comparison itself does not throw (posMaterialRequests.status is
    // physically varchar(30); the requestStatusEnum PG type was never migrated). The real bug was
    // a vocabulary mismatch one layer up, in RequestFilterSchema (see request.dto.ts fix,
    // same commit): its Zod enum only accepted lowercase values, but every actual writer
    // (pos-request.service.ts create/approve/reject, PosRequests.tsx FE tab logic) uses UPPERCASE
    // ('DRAFT'/'SUBMITTED'/'APPROVED'/...) — matching this column's Drizzle-declared type below.
    // A FE filter request for the real status values (e.g. ?status=SUBMITTED) was rejected by Zod
    // before ever reaching this query — this cast is correct as-is; do not lowercase it.
    const conditions = [];
    if (filter.status)         conditions.push(eq(posMaterialRequests.status, filter.status as 'DRAFT' | 'REJECTED' | 'APPROVED' | 'SUBMITTED' | 'PARTIALLY_ISSUED' | 'FULLY_ISSUED' | 'CANCELLED'));
    if (filter.departmentCode) conditions.push(eq(posMaterialRequests.departmentCode, filter.departmentCode));
    if (filter.priority)       conditions.push(eq(posMaterialRequests.priority, filter.priority));
    if (filter.dateFrom)       conditions.push(gte(posMaterialRequests.createdAt, new Date(filter.dateFrom)));
    if (filter.dateTo)         conditions.push(lte(posMaterialRequests.createdAt, new Date(filter.dateTo)));
    if (filter.requestedBy)    conditions.push(eq(posMaterialRequests.requestedBy, filter.requestedBy));
    const where = conditions.length ? and(...conditions) : undefined;
    return this.paginateRequests(where, limit, offset);
  }
}
