/**
 * @module i-ai-provider-config.repo
 * @description Domain repository interface for AI provider configuration.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/drizzle-ai-provider-config.repo.ts`.
 * @layer Domain (AI)
 */

import type { Result } from '@common/result';
import type { AiProviderConfig, InsertAiProviderConfig } from '@workspace/db';
import type { AiProvider } from '../types/ai.types';

export interface IAiProviderConfigRepo {
  findAll(): Promise<Result<AiProviderConfig[]>>;
  findByProvider(provider: AiProvider): Promise<Result<AiProviderConfig | null>>;
  upsert(data: InsertAiProviderConfig): Promise<Result<AiProviderConfig>>;
  getActiveBudget(provider: AiProvider): Promise<Result<number>>;
}

export const AI_PROVIDER_CONFIG_REPO = Symbol('AI_PROVIDER_CONFIG_REPO');
