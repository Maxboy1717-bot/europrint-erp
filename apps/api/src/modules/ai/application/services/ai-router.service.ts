import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Err, isErr, Ok, safeCall } from '@common/result';
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { sql, gte } from 'drizzle-orm';
import {
  AiRequest,
  AiResponse,
  AiProvider,
  AiTaskType,
  TASK_PROVIDER_MAP,
  PROVIDER_FALLBACK,
  PROVIDER_MODELS,
  COST_PER_1K,
  DAILY_BUDGET_USD,
  Result,
  UsageStats,
} from '../../domain/types/ai.types';
import { aiUsageLogsTable } from '../../infrastructure/db/ai-usage-logs.table';
import { DrizzleService } from '@common/services/drizzle.service';
import { AiRouterRepository } from '../ai-router.repository';

import { MAX_NAME_LENGTH, AI_DEFAULT_MAX_TOKENS, AI_TOKENS_PER_UNIT } from '@common/constants/app.constants';
export type { UsageStats };

@Injectable()
export class AiRouterService {
  private readonly logger = new Logger(AiRouterService.name);

  constructor(private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly drizzle: DrizzleService,
    private readonly aiRouterRepo: AiRouterRepository) {}

  async call(req: AiRequest): Promise<Result<AiResponse>> {
    const startTime = Date.now();

    // 1. Check daily budget
    const spentResult = await this.getTodaySpent();
    if (isErr(spentResult)) return Err(spentResult.error);

    if (spentResult.data >= DAILY_BUDGET_USD) {
      const msg = `AI kunlik byudjet oshdi: $${spentResult.data.toFixed(2)}/$${DAILY_BUDGET_USD}`;
      this.logger.warn(msg);
      return Err(msg);
    }

    // 2. Build provider order: preferred → fallbacks
    const preferred = req.provider ?? TASK_PROVIDER_MAP[req.taskType] ?? 'gemini';
    const providers: AiProvider[] = [preferred, ...PROVIDER_FALLBACK.filter((p) => p !== preferred)];

    // 3. Try each provider
    for (const provider of providers) {
      const result = await this.callProvider(provider, req);
      if (isErr(result)) {
        this.logger.warn(`[AI] ${provider} xato: ${result.error.message} — fallback...`);
        continue;
      }
      const latencyMs = Date.now() - startTime;
      const response: AiResponse = {
        ...result.data,
        latencyMs,
      };
      await this.logUsage(provider, req, response);
      this.logger.log(
        `[AI] ${req.taskType} | ${provider} | $${response.estimatedCostUsd.toFixed(6)} | ${response.latencyMs}ms`,
      );
      return { ok: true, data: response };
    }

    return Err('Barcha AI provayderlar ishlamaydi');
  }

  async getTodaySpent(): Promise<Result<number>> {
    const today = _time.now();
    today.setHours(0, 0, 0, 0);
    return this.aiRouterRepo.getTodaySpent(today);
  }

  async getUsageStats(): Promise<Result<UsageStats>> {
    const EMPTY: UsageStats = {
      today: { spent: 0, remaining: DAILY_BUDGET_USD, budget: DAILY_BUDGET_USD, requestCount: 0 },
      byProvider: { openai: { spent: 0, requestCount: 0 }, gemini: { spent: 0, requestCount: 0 }, claude: { spent: 0, requestCount: 0 } },
      topTaskTypes: [],
    };
    try {
      const db = this.drizzle.db;
      const today = _time.now();
      today.setHours(0, 0, 0, 0);

      const todaySpentResult = await this.getTodaySpent();
      const todaySpentValue = isErr(todaySpentResult) ? 0 : todaySpentResult.data;

      let byProviderRows: Array<{ provider: string; spent: string; requestCount: number }> = [];
      try {
        byProviderRows = await db
          .select({
            provider: aiUsageLogsTable.provider,
            spent: sql<string>`COALESCE(SUM(CAST(${aiUsageLogsTable.estimatedCostUsd} AS FLOAT)), 0)`,
            requestCount: sql<number>`COUNT(*)`,
          })
          .from(aiUsageLogsTable)
          .where(gte(aiUsageLogsTable.createdAt, today))
          .groupBy(aiUsageLogsTable.provider);
      } catch { this.logger.warn('getUsageStats: byProvider query failed'); }

      const providerStats: Record<AiProvider, { spent: number; requestCount: number }> = {
        openai: { spent: 0, requestCount: 0 },
        gemini: { spent: 0, requestCount: 0 },
        claude: { spent: 0, requestCount: 0 },
      };
      for (const row of byProviderRows) {
        const provider = row.provider as AiProvider;
        if (provider in providerStats) providerStats[provider] = { spent: parseFloat(row.spent), requestCount: row.requestCount };
      }

      let topTasks: Array<{ taskType: string | null; spent: string; count: number }> = [];
      try {
        const topTasksResult = await this.aiRouterRepo.getTopTasksBySpend(today, 10);
        if (topTasksResult.ok) topTasks = topTasksResult.data as typeof topTasks;
      } catch { this.logger.warn('getUsageStats: topTasks query failed'); }

      return Ok({
        today: { spent: todaySpentValue, remaining: DAILY_BUDGET_USD - todaySpentValue, budget: DAILY_BUDGET_USD, requestCount: Object.values(providerStats).reduce((sum, p) => sum + p.requestCount, 0) },
        byProvider: providerStats,
        topTaskTypes: (topTasks ?? []).map((row) => ({ taskType: row.taskType as AiTaskType, spent: parseFloat(row.spent), count: row.count })),
      });
    } catch (e) {
      this.logger.warn(`getUsageStats: fallback due to error: ${e}`);
      return Ok(EMPTY);
    }
  }

  private async callProvider(provider: AiProvider, req: AiRequest): Promise<Result<AiResponse>> {
    switch (provider) {
      case 'openai':
        return this.callOpenAi(req);
      case 'gemini':
        return this.callGemini(req);
      case 'claude':
        return this.callClaude(req);
    }
  }

  private async callOpenAi(req: AiRequest): Promise<Result<AiResponse>> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) return Err('OPENAI_API_KEY konfiguratsiyasi yo`q');

    return safeCall(async () => {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });
      const model = PROVIDER_MODELS.openai;

      const response = await client.chat.completions.create({
        model,
        messages: [
          ...(req.systemPrompt ? [{ role: 'system' as const, content: req.systemPrompt }] : []),
          { role: 'user' as const, content: req.prompt },
        ],
        max_tokens: req.maxTokens ?? AI_DEFAULT_MAX_TOKENS,
        temperature: req.temperature ?? 0.7,
      });

      if (!response.choices[0]?.message?.content) throw new InternalServerErrorException('OpenAI javob bo`sh');

      const text = response.choices[0].message.content;
      const inputTokens = response.usage?.prompt_tokens ?? 0;
      const outputTokens = response.usage?.completion_tokens ?? 0;
      const estimatedCostUsd = this.estimateCost('openai', inputTokens, outputTokens);

      return { text, provider: 'openai' as AiProvider, model, inputTokens, outputTokens, estimatedCostUsd, latencyMs: 0 };
    });
  }

  private async callGemini(req: AiRequest): Promise<Result<AiResponse>> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) return Err('GEMINI_API_KEY konfiguratsiyasi yo`q');

    return safeCall(async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const client = new GoogleGenerativeAI(apiKey);
      const model = PROVIDER_MODELS.gemini;
      const genModel = client.getGenerativeModel({ model });

      const systemPromptPart = req.systemPrompt ? `${req.systemPrompt}\n\n` : '';
      const fullPrompt = systemPromptPart + req.prompt;

      const response = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          maxOutputTokens: req.maxTokens ?? AI_DEFAULT_MAX_TOKENS,
          temperature: req.temperature ?? 0.7,
        },
      });

      if (!response.response?.text()) throw new InternalServerErrorException('Gemini javob bo`sh');

      const text = response.response.text();
      const usageMetadata = response.response.usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
      const estimatedCostUsd = this.estimateCost('gemini', inputTokens, outputTokens);

      return { text, provider: 'gemini' as AiProvider, model, inputTokens, outputTokens, estimatedCostUsd, latencyMs: 0 };
    });
  }

  private async callClaude(req: AiRequest): Promise<Result<AiResponse>> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) return Err('ANTHROPIC_API_KEY konfiguratsiyasi yo`q');

    return safeCall(async () => {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });
      const model = PROVIDER_MODELS.claude;

      const response = await client.messages.create({
        model,
        max_tokens: req.maxTokens ?? AI_DEFAULT_MAX_TOKENS,
        ...(req.temperature !== undefined && { temperature: req.temperature }),
        system: req.systemPrompt,
        messages: [{ role: 'user', content: req.prompt }],
      });

      if (!response.content?.[0] || response.content[0].type !== 'text') throw new InternalServerErrorException('Claude javob bo`sh');

      const text = response.content[0].text;
      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;
      const estimatedCostUsd = this.estimateCost('claude', inputTokens, outputTokens);

      return { text, provider: 'claude' as AiProvider, model, inputTokens, outputTokens, estimatedCostUsd, latencyMs: 0 };
    });
  }

  private estimateCost(provider: AiProvider, inputTokens: number, outputTokens: number): number {
    const costs = COST_PER_1K[provider];
    const inputCost = (inputTokens / AI_TOKENS_PER_UNIT) * costs.input;
    const outputCost = (outputTokens / AI_TOKENS_PER_UNIT) * costs.output;
    return inputCost + outputCost;
  }

  private async logUsage(provider: AiProvider, req: AiRequest, result: AiResponse): Promise<void> {
    const requestSummary = req.prompt.substring(0, MAX_NAME_LENGTH);
    const responseSummary = result.text.substring(0, MAX_NAME_LENGTH);

    const logResult = await safeCall(async () => {
      await this.aiRouterRepo.insertUsageLog({
        provider,
        taskType: req.taskType,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.inputTokens + result.outputTokens,
        estimatedCostUsd: result.estimatedCostUsd.toFixed(6),
        userId: req.userId ? Number(req.userId) : undefined,
        sessionId: req.sessionId != null ? String(req.sessionId) : undefined,
        requestSummary,
        responseSummary,
        latencyMs: result.latencyMs,
        status: 'success',
      });
    });
    if (isErr(logResult)) {
      this.logger.warn(`[AI] logUsage xato: ${logResult.error.message}`);
    }
  }
}
