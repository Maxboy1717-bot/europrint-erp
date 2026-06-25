/**
 * @module drizzle-ai-provider-config.repo
 * @description Drizzle ORM implementatsiyasi — ai_provider_configs jadvali.
 *   Result<T> qaytaradi; throw taqiq (Qoida-1).
 * @layer Infrastructure (AI)
 */

import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@common/services/drizzle.service';
import { aiProviderConfigs } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import type { IAiProviderConfigRepo } from '../../domain/repositories/i-ai-provider-config.repo';
import type { AiProviderConfig, InsertAiProviderConfig } from '@workspace/db';
import type { AiProvider } from '../../domain/types/ai.types';

/** DB bo'sh / nofaol bo'lsa byudjet fallback (AiRouterService DAILY_BUDGET_USD bilan moslashadi). */
const DEFAULT_DAILY_BUDGET = 50;

@Injectable()
export class DrizzleAiProviderConfigRepo implements IAiProviderConfigRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll(): Promise<Result<AiProviderConfig[]>> {
    return safeCall(async () => {
      return this.drizzle.db.select().from(aiProviderConfigs);
    }, 'DB_ERROR');
  }

  async findByProvider(provider: AiProvider): Promise<Result<AiProviderConfig | null>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiProviderConfigs)
        .where(eq(aiProviderConfigs.provider, provider))
        .limit(1);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async upsert(data: InsertAiProviderConfig): Promise<Result<AiProviderConfig>> {
    return safeCall(async () => {
      // InsertAiProviderConfig (@workspace/db) barrel-stub = {} bo'lib kelyapti; haqiqiy insert-tip
      // jadvalning o'zidan (aiProviderConfigs.$inferInsert). Cast faqat tip-ko'rinish, xulq saqlanadi.
      const d = data as typeof aiProviderConfigs.$inferInsert;
      const rows = await this.drizzle.db
        .insert(aiProviderConfigs)
        .values(d)
        .onConflictDoUpdate({
          target: aiProviderConfigs.provider,
          set: {
            defaultModel:    d.defaultModel,
            dailyBudgetUsd:  d.dailyBudgetUsd,
            isActive:        d.isActive,
            notes:           d.notes,
            apiKeyHint:      d.apiKeyHint,
            updatedByUserId: d.updatedByUserId,
            updatedAt:       new Date(),
          },
        })
        .returning();
      if (!rows[0]) throw new Error('upsert qaytarmadi');
      return rows[0];
    }, 'DB_ERROR');
  }

  async getActiveBudget(provider: AiProvider): Promise<Result<number>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select({ budget: aiProviderConfigs.dailyBudgetUsd, isActive: aiProviderConfigs.isActive })
        .from(aiProviderConfigs)
        .where(eq(aiProviderConfigs.provider, provider))
        .limit(1);
      if (!rows[0] || !rows[0].isActive) return DEFAULT_DAILY_BUDGET;
      return parseFloat(String(rows[0].budget ?? DEFAULT_DAILY_BUDGET));
    }, 'DB_ERROR');
  }
}
