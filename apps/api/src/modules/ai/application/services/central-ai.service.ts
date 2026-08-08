/**
 * @module central-ai.service
 * @description Markaziy AI xizmat. JWT dan card_id (org_functions.id) oladi;
 *   barcha AI chaqiruvlar shu yerdan o'tadi. Result<T> qaytaradi.
 * @layer Application (AI)
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiRouterService } from './ai-router.service';
import { Err, isErr, Result } from '@common/result';
import type { AiRequest, AiResponse, AiTaskType } from '../../domain/types/ai.types';

export interface CentralAiCallOptions {
  taskType: AiTaskType;
  prompt: string;
  systemPrompt?: string;
  /** JWT dan olingan users.id — integer */
  userId?: number;
  /** JWT dan olingan org_functions.id — karta ID */
  cardId?: number;
  sessionId?: string;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class CentralAiService {
  private readonly logger = new Logger(CentralAiService.name);

  constructor(private readonly aiRouterService: AiRouterService) {}

  /**
   * Markaziy AI chaqiruvi.
   * `cardId` — JWT dan keladi, `metadata.cardId` orqali uzatiladi (kelajakda karta
   *   bo'yicha xarajat hisobi).
   * `userId` — integer (string QABUL QILINMAYDI).
   */
  async call(options: CentralAiCallOptions): Promise<Result<AiResponse>> {
    const { taskType, prompt, systemPrompt, userId, cardId, sessionId, temperature, maxTokens } = options;

    if (!prompt || prompt.trim().length === 0) {
      return Err('Prompt bo\'sh bo\'lmasligi kerak');
    }

    const req: AiRequest = {
      taskType,
      prompt,
      systemPrompt,
      userId,                    // integer yoki undefined
      sessionId,
      temperature,
      maxTokens,
      metadata: {
        cardId,                  // karta ID — kelajakda karta bo'yicha xarajat hisobi
        source: 'central-ai',
      },
    };

    const result = await this.aiRouterService.call(req);

    if (isErr(result)) {
      this.logger.warn(`[CentralAI] taskType=${taskType} cardId=${cardId} XATO: ${result.error.message}`);
    } else {
      this.logger.log(
        `[CentralAI] taskType=${taskType} cardId=${cardId} provider=${result.data.provider} ` +
        `latency=${result.data.latencyMs}ms cost=$${result.data.estimatedCostUsd.toFixed(6)}`,
      );
    }

    return result;
  }
}
