/**
 * @module qc-override.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db, qc_override_log, rawSql } from '@shared/db';
import { desc, sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class QcOverrideRepository {
  /** Count this user's overrides in the current Tashkent day and month (drives the 3/day, 15/month allowance). */
  async countRecent(userId: number): Promise<Result<{ daily: number; monthly: number }>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT
          count(*) FILTER (
            WHERE created_at >= date_trunc('day',   now() AT TIME ZONE 'Asia/Tashkent') AT TIME ZONE 'Asia/Tashkent'
          )::int AS daily,
          count(*) FILTER (
            WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'Asia/Tashkent') AT TIME ZONE 'Asia/Tashkent'
          )::int AS monthly
        FROM qc_override_log
        WHERE user_id = ${userId}
      `);
      // tsc-slip fix (09-qc#35): db.execute() returns a QueryResult whose row shape
      // does not overlap { daily; monthly } — cast via unknown first (Qoida 16 idiom).
      const row = (r as unknown as { rows?: Array<{ daily: number; monthly: number }> }).rows?.[0];
      return { daily: Number(row?.daily ?? 0), monthly: Number(row?.monthly ?? 0) };
    }, 'DB_ERROR');
  }

  async insert(data: { userId: number; inspectionId: number | null; reason: string; escalated: boolean }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(qc_override_log).values({
        userId: data.userId,
        inspectionId: data.inspectionId ?? null,
        reason: data.reason,
        escalated: data.escalated,
      }).returning();
      return rows[0] as Row;
    }, 'DB_ERROR');
  }

  async findRecent(limit: number, offset: number): Promise<Result<object[]>> {
    return safeCall(async () => {
      const rows = await db.select().from(qc_override_log)
        .orderBy(desc(qc_override_log.createdAt))
        .limit(limit)
        .offset(offset);
      return rows;
    }, 'DB_ERROR');
  }
}
