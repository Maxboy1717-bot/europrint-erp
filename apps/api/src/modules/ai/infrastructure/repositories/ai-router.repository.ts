/**
 * @module ai-router.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (AI)
 */

import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@common/services/drizzle.service';
import { aiUsageLogsTable } from '../db/ai-usage-logs.table';
import { runQuery } from '@shared/db';
import { sql, gte } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import type { IAiRouterRepo } from '../../domain/repositories/i-ai-router.repo';

@Injectable()
export class AiRouterRepository implements IAiRouterRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async insertUsageLog(data: Omit<typeof aiUsageLogsTable.$inferInsert, 'id'>): Promise<void> {
    await this.drizzle.db.insert(aiUsageLogsTable).values(data);
  }

  async getTodaySpent(today: Date): Promise<Result<number>> {
    return safeCall(async () => {
      const result = await this.drizzle.db
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${aiUsageLogsTable.estimatedCost} AS FLOAT)), 0)`,
        })
        .from(aiUsageLogsTable)
        .where(
          sql`DATE(${aiUsageLogsTable.createdAt} AT TIME ZONE 'UTC') = DATE(${today} AT TIME ZONE 'UTC')`,
        );
      return parseFloat(result[0]?.total ?? '0');
      }, 'DB_ERROR');
  }

  async getTopTasksBySpend(today: Date, limit = 10): Promise<Result<Array<{ taskType: string | null; spent: string; count: number }>>> {
    return safeCall(async () => {
      return this.drizzle.db
        .select({
          taskType: aiUsageLogsTable.taskType,
          spent: sql<string>`COALESCE(SUM(CAST(${aiUsageLogsTable.estimatedCost} AS FLOAT)), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(aiUsageLogsTable)
        .where(gte(aiUsageLogsTable.createdAt, today))
        .groupBy(aiUsageLogsTable.taskType)
        .orderBy(sql`SUM(CAST(${aiUsageLogsTable.estimatedCost} AS FLOAT)) DESC`)
        .limit(limit);
      }, 'DB_ERROR');
  }

  /**
   * Per-karta xarajat rollup (SB0529): ai_usage_logs.user_id → users.id →
   * users.card_id. Raw SQL ishlatiladi (runQuery) — Drizzle `schema-core.ts`
   * dagi `users` (uuid PK) jonli DB dagi haqiqiy `users` (integer PK,
   * card_id) bilan mos emas (schema barrel precedence xatosi — memory:
   * reference_schema_barrel_precedence). ⭐ Live-DB tekshiruv (2026-07-04,
   * _audit/q.cjs information_schema): `ai_usage_logs.user_id` haqiqatda
   * `integer` (Drizzle interfeys izohi "text ustun" — bu ESKIRGAN/DRIFT edi,
   * cast urinishi "invalid input syntax for type integer" bilan xato berdi;
   * to'g'ridan-to'g'ri INTEGER=INTEGER join ishlatiladi, cast kerak emas).
   * user_id NULL bo'lsa LEFT JOIN mos kelmaydi → cardId/fullName null, lekin
   * spent baribir hisoblanadi (umumiy xarajat yo'qolmaydi).
   */
  async getSpendByCard(
    today: Date,
    limit = 20,
  ): Promise<Result<Array<{ cardId: number | null; userId: string | null; fullName: string | null; spent: string; count: number }>>> {
    return safeCall(async () => {
      const result = await runQuery<{ card_id: number | null; user_id: number | null; full_name: string | null; spent: string; count: number }>(sql`
        SELECT
          u.card_id AS card_id,
          l.user_id AS user_id,
          u.full_name AS full_name,
          COALESCE(SUM(CAST(l.estimated_cost AS FLOAT)), 0) AS spent,
          COUNT(*)::int AS count
        FROM ai_usage_logs l
        LEFT JOIN users u ON u.id = l.user_id
        WHERE l.created_at >= ${today}
        GROUP BY u.card_id, l.user_id, u.full_name
        ORDER BY SUM(CAST(l.estimated_cost AS FLOAT)) DESC
        LIMIT ${limit}
      `);
      return result.rows.map((row) => ({
        cardId: row.card_id ?? null,
        userId: row.user_id != null ? String(row.user_id) : null,
        fullName: row.full_name ?? null,
        spent: String(row.spent ?? '0'),
        count: Number(row.count ?? 0),
      }));
      }, 'DB_ERROR');
  }
}
