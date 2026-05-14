/**
 * @module ai-router.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@common/services/drizzle.service';
import { aiUsageLogsTable } from '../infrastructure/db/ai-usage-logs.table';
import { sql, gte } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

@Injectable()
export class AiRouterRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async insertUsageLog(data: Omit<typeof aiUsageLogsTable.$inferInsert, 'id'>): Promise<void> {
    await this.drizzle.db.insert(aiUsageLogsTable).values(data);
  }

  async getTodaySpent(today: Date): Promise<Result<number>> {
    return safeCall(async () => {
      const result = await this.drizzle.db
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${aiUsageLogsTable.estimatedCostUsd} AS FLOAT)), 0)`,
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
          spent: sql<string>`COALESCE(SUM(CAST(${aiUsageLogsTable.estimatedCostUsd} AS FLOAT)), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(aiUsageLogsTable)
        .where(gte(aiUsageLogsTable.createdAt, today))
        .groupBy(aiUsageLogsTable.taskType)
        .orderBy(sql`SUM(CAST(${aiUsageLogsTable.estimatedCostUsd} AS FLOAT)) DESC`)
        .limit(limit);
      }, 'DB_ERROR');
  }
}
