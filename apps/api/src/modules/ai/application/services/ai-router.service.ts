/**
 * @module ai-router.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

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
import { Inject } from '@nestjs/common';
import { AI_ROUTER_REPO, type IAiRouterRepo } from '../../domain/repositories/i-ai-router.repo';

import { MAX_NAME_LENGTH, AI_DEFAULT_MAX_TOKENS, AI_TOKENS_PER_UNIT } from '@common/constants/app.constants';
export type { UsageStats };

// ─── PII Masking ──────────────────────────────────────────────────────────
// Q-40: real promptlarda PII (telefon, passport, email, PINFL) bo'lishi mumkin.
// ai_usage_logs ga yozishdan OLDIN mask qilinadi.
const PII_PATTERNS: RegExp[] = [
  /\+998\d{9}/g,                  // O'zbekiston telefon
  /[A-Z]{2}\d{7}/g,               // Passport (AA1234567)
  /[\w.-]+@[\w.-]+\.\w{2,}/g,     // Email
  /\b\d{14}\b/g,                  // PINFL (14 raqam)
];

function maskPii(text: string): string {
  if (!text) return text;
  let masked = text;
  for (const pattern of PII_PATTERNS) {
    masked = masked.replace(pattern, '[MASKED]');
  }
  return masked;
}
// ─────────────────────────────────────────────────────────────────────────

@Injectable()
export class AiRouterService {
  private readonly logger = new Logger(AiRouterService.name);

  constructor(private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly drizzle: DrizzleService,
    @Inject(AI_ROUTER_REPO) private readonly aiRouterRepo: IAiRouterRepo) {}

  async call(req: AiRequest): Promise<Result<AiResponse>> {
    const startTime = Date.now();
    const budgetErr = await this.checkBudget();
    if (budgetErr) return budgetErr;
    const providers = this.buildProviderOrder(req);
    if (providers.length === 0) {
      // Q-40: hech qaysi provayder kaliti yo'q — soxta javob qaytarmaymiz, aniq xato beramiz.
      const msg = 'Hech qaysi AI provayder kaliti sozlanmagan (ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY|GOOGLE_API_KEY)';
      this.logger.warn(`[AI] ${msg}`);
      return Err(msg);
    }
    return this.tryProviders(providers, req, startTime);
  }

  /**
   * Provayder uchun API kalit sozlanganmi? Faqat kalit MAVJUDLIGINI tekshiradi —
   * qiymatni HECH QACHON qaytarmaydi/loglmaydi (Q-30). Gemini uchun ham
   * `GEMINI_API_KEY`, ham `GOOGLE_API_KEY` (jonli .env nomi) qabul qilinadi.
   */
  private resolveProviderKey(provider: AiProvider): string | undefined {
    switch (provider) {
      case 'openai':
        return this.configService.get<string>('OPENAI_API_KEY');
      case 'gemini':
        return this.configService.get<string>('GEMINI_API_KEY')
          ?? this.configService.get<string>('GOOGLE_API_KEY');
      case 'claude':
        return this.configService.get<string>('ANTHROPIC_API_KEY');
    }
  }

  private isProviderConfigured(provider: AiProvider): boolean {
    const key = this.resolveProviderKey(provider);
    return typeof key === 'string' && key.length > 0;
  }

  private async checkBudget(): Promise<Result<AiResponse> | null> {
    const spentResult = await this.getTodaySpent();
    if (isErr(spentResult)) return Err(spentResult.error);
    if (spentResult.data >= DAILY_BUDGET_USD) {
      const msg = `AI kunlik byudjet oshdi: $${spentResult.data.toFixed(2)}/$${DAILY_BUDGET_USD}`;
      this.logger.warn(msg);
      return Err(msg);
    }
    return null;
  }

  private buildProviderOrder(req: AiRequest): AiProvider[] {
    const preferred = req.provider ?? TASK_PROVIDER_MAP[req.taskType] ?? 'gemini';
    const ordered = [preferred, ...PROVIDER_FALLBACK.filter((p) => p !== preferred)];
    // Graceful fallback: faqat KALITI sozlangan provayderlar qoladi (afzallik
    // tartibi saqlanadi). Sozlanmagan provayderni urinib log to'ldirmaymiz va
    // kechikish qo'shmaymiz. Agar afzal provayder kalitsiz bo'lsa — keyingi
    // sozlangan provayderga (masalan, faqat ANTHROPIC bo'lsa, claude'ga) tushadi.
    return ordered.filter((p) => this.isProviderConfigured(p));
  }

  private async tryProviders(providers: AiProvider[], req: AiRequest, startTime: number): Promise<Result<AiResponse>> {
    for (const provider of providers) {
      const result = await this.callProvider(provider, req);
      if (isErr(result)) {
        this.logger.warn(`[AI] ${provider} xato: ${result.error.message} — fallback...`);
        continue;
      }
      const response: AiResponse = { ...result.data, latencyMs: Date.now() - startTime };
      await this.logUsage(provider, req, response);
      this.logger.log(`[AI] ${req.taskType} | ${provider} | $${response.estimatedCostUsd.toFixed(6)} | ${response.latencyMs}ms`);
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
    const EMPTY = this.emptyUsageStats();
    try {
      const today = _time.now();
      today.setHours(0, 0, 0, 0);
      const todaySpentResult = await this.getTodaySpent();
      const todaySpentValue = isErr(todaySpentResult) ? 0 : todaySpentResult.data;
      const providerStats = await this.collectProviderStats(today);
      const topTasks = await this.collectTopTasks(today);
      const byCard = await this.collectSpendByCard(today);
      const requestCount = Object.values(providerStats).reduce((sum, p) => sum + p.requestCount, 0);
      return Ok({
        today: { spent: todaySpentValue, remaining: DAILY_BUDGET_USD - todaySpentValue, budget: DAILY_BUDGET_USD, requestCount },
        byProvider: providerStats,
        topTaskTypes: (Array.isArray(topTasks) ? topTasks : []).map((row) => ({ taskType: row.taskType as AiTaskType, spent: parseFloat(row.spent), count: row.count })),
        byCard,
      });
    } catch (e) {
      this.logger.warn(`getUsageStats: fallback due to error: ${e}`);
      return Ok(EMPTY);
    }
  }

  private emptyUsageStats(): UsageStats {
    return {
      today: { spent: 0, remaining: DAILY_BUDGET_USD, budget: DAILY_BUDGET_USD, requestCount: 0 },
      byProvider: { openai: { spent: 0, requestCount: 0 }, gemini: { spent: 0, requestCount: 0 }, claude: { spent: 0, requestCount: 0 } },
      topTaskTypes: [],
      byCard: [],
    };
  }

  private async collectProviderStats(today: Date): Promise<Record<AiProvider, { spent: number; requestCount: number }>> {
    const providerStats: Record<AiProvider, { spent: number; requestCount: number }> = {
      openai: { spent: 0, requestCount: 0 },
      gemini: { spent: 0, requestCount: 0 },
      claude: { spent: 0, requestCount: 0 },
    };
    let byProviderRows: Array<{ provider: string | null; spent: string; requestCount: number }> = [];
    try {
      const db = this.drizzle.db;
      byProviderRows = await db
        .select({
          provider: aiUsageLogsTable.provider,
          spent: sql<string>`COALESCE(SUM(CAST(${aiUsageLogsTable.estimatedCost} AS FLOAT)), 0)`,
          requestCount: sql<number>`COUNT(*)`,
        })
        .from(aiUsageLogsTable)
        .where(gte(aiUsageLogsTable.createdAt, today))
        .groupBy(aiUsageLogsTable.provider);
    } catch { this.logger.warn('getUsageStats: byProvider query failed'); }
    for (const row of byProviderRows) {
      const provider = row.provider as AiProvider;
      if (provider in providerStats) providerStats[provider] = { spent: parseFloat(row.spent), requestCount: row.requestCount };
    }
    return providerStats;
  }

  private async collectTopTasks(today: Date): Promise<Array<{ taskType: string | null; spent: string; count: number }>> {
    try {
      const topTasksResult = await this.aiRouterRepo.getTopTasksBySpend(today, 10);
      if (topTasksResult.ok) return topTasksResult.data as Array<{ taskType: string | null; spent: string; count: number }>;
    } catch { this.logger.warn('getUsageStats: topTasks query failed'); }
    return [];
  }

  /** SB0529: per-karta xarajat rollup — UsageStats.byCard uchun. */
  private async collectSpendByCard(today: Date): Promise<UsageStats['byCard']> {
    try {
      const byCardResult = await this.aiRouterRepo.getSpendByCard(today, 20);
      if (byCardResult.ok) {
        return byCardResult.data.map((row) => ({
          cardId: row.cardId,
          userId: row.userId,
          fullName: row.fullName,
          spent: parseFloat(row.spent),
          count: row.count,
        }));
      }
    } catch { this.logger.warn('getUsageStats: byCard query failed'); }
    return [];
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
    const apiKey = this.resolveProviderKey('openai');
    if (!apiKey) return Err('OPENAI_API_KEY konfiguratsiyasi yo`q');

    return safeCall(async () => {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });
      const model = PROVIDER_MODELS.openai;

      // Vision (2.10): image present → multi-part user content (text + image_url data URI).
      const userContent = req.image
        ? [
            { type: 'text' as const, text: req.prompt },
            { type: 'image_url' as const, image_url: { url: `data:${req.image.mediaType};base64,${req.image.base64}` } },
          ]
        : req.prompt;

      const response = await client.chat.completions.create({
        model,
        messages: [
          ...(req.systemPrompt ? [{ role: 'system' as const, content: req.systemPrompt }] : []),
          { role: 'user' as const, content: userContent },
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

  private async invokeGemini(apiKey: string, req: AiRequest) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const client = new GoogleGenerativeAI(apiKey);
    const model = PROVIDER_MODELS.gemini;
    const genModel = client.getGenerativeModel({ model });
    const systemPromptPart = req.systemPrompt ? `${req.systemPrompt}\n\n` : '';
    const fullPrompt = systemPromptPart + req.prompt;
    // Vision (2.10): image present → append an inlineData part alongside the text part.
    const parts = req.image
      ? [{ text: fullPrompt }, { inlineData: { mimeType: req.image.mediaType, data: req.image.base64 } }]
      : [{ text: fullPrompt }];
    const response = await genModel.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: req.maxTokens ?? AI_DEFAULT_MAX_TOKENS,
        temperature: req.temperature ?? 0.7,
      },
    });
    return { response, model };
  }

  private async callGemini(req: AiRequest): Promise<Result<AiResponse>> {
    const apiKey = this.resolveProviderKey('gemini');
    if (!apiKey) return Err('GEMINI_API_KEY / GOOGLE_API_KEY konfiguratsiyasi yo`q');
    return safeCall(async () => {
      const { response, model } = await this.invokeGemini(apiKey, req);
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
    const apiKey = this.resolveProviderKey('claude');
    if (!apiKey) return Err('ANTHROPIC_API_KEY konfiguratsiyasi yo`q');

    return safeCall(async () => {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });
      const model = PROVIDER_MODELS.claude;

      // Vision (2.10): image present → multi-part user content (image block + text block),
      // matching the Anthropic vision message shape used elsewhere (AIsha vision tools).
      const userContent = req.image
        ? [
            {
              type: 'image' as const,
              source: { type: 'base64' as const, media_type: req.image.mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: req.image.base64 },
            },
            { type: 'text' as const, text: req.prompt },
          ]
        : req.prompt;

      const response = await client.messages.create({
        model,
        max_tokens: req.maxTokens ?? AI_DEFAULT_MAX_TOKENS,
        ...(req.temperature !== undefined && { temperature: req.temperature }),
        system: req.systemPrompt,
        messages: [{ role: 'user', content: userContent }],
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
    const logResult = await safeCall(async () => {
      await this.aiRouterRepo.insertUsageLog(this.buildUsageLogPayload(provider, req, result));
    });
    if (isErr(logResult)) {
      this.logger.warn(`[AI] logUsage xato: ${logResult.error.message}`);
    }
  }

  private buildUsageLogPayload(provider: AiProvider, req: AiRequest, result: AiResponse) {
    return {
      provider,
      taskType: req.taskType,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.inputTokens + result.outputTokens,
      estimatedCost: result.estimatedCostUsd.toFixed(6),
      userId: req.userId != null ? String(req.userId) : undefined,  // ai_usage_logs.user_id = text ustun (Number emas)
      sessionId: req.sessionId != null ? String(req.sessionId) : undefined,
      requestSummary: maskPii(req.prompt).substring(0, MAX_NAME_LENGTH),
      responseSummary: maskPii(result.text).substring(0, MAX_NAME_LENGTH),
      latencyMs: result.latencyMs,
      status: 'success' as const,
    };
  }
}
