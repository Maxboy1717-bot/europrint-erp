/**
 * @module i-ai-router.repo
 * @description Domain repository interface for AI router usage logs and analytics.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/ai-router.repository.ts`.
 * @layer Domain (AI)
 */

import type { Result } from '@common/result';
import type { aiUsageLogsTable } from '../../infrastructure/db/ai-usage-logs.table';

export interface IAiRouterRepo {
  insertUsageLog(data: Omit<typeof aiUsageLogsTable.$inferInsert, 'id'>): Promise<void>;
  getTodaySpent(today: Date): Promise<Result<number>>;
  getTopTasksBySpend(
    today: Date,
    limit?: number,
  ): Promise<Result<Array<{ taskType: string | null; spent: string; count: number }>>>;
  /**
   * Per-karta (org-chart karta) xarajat rollup: ai_usage_logs.user_id →
   * users.id → users.card_id orqali. SB0529: AI router metadata → billing.
   */
  getSpendByCard(
    today: Date,
    limit?: number,
  ): Promise<Result<Array<{ cardId: number | null; userId: string | null; fullName: string | null; spent: string; count: number }>>>;
}

export const AI_ROUTER_REPO = Symbol('AI_ROUTER_REPO');
