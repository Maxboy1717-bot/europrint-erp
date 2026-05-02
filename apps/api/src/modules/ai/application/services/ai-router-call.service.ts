import { Err, isErr, safeCall } from '@common/result';
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiRequest,
  AiResponse,
  AiProvider,
  PROVIDER_MODELS,
  COST_PER_1K,
  Result,
} from '../../domain/types/ai.types';
import { AiRouterRepository } from '../ai-router.repository';

import { MAX_NAME_LENGTH, AI_DEFAULT_MAX_TOKENS, AI_TOKENS_PER_UNIT } from '@common/constants/app.constants';
@Injectable()
export class AiRouterCallService {
  private readonly logger = new Logger(AiRouterCallService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly aiRouterRepo: AiRouterRepository,
  ) {}

  async callOpenAi(req: AiRequest): Promise<Result<AiResponse>> {
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

  async callGemini(req: AiRequest): Promise<Result<AiResponse>> {
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
        generationConfig: { maxOutputTokens: req.maxTokens ?? AI_DEFAULT_MAX_TOKENS, temperature: req.temperature ?? 0.7 },
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

  async callClaude(req: AiRequest): Promise<Result<AiResponse>> {
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

  estimateCost(provider: AiProvider, inputTokens: number, outputTokens: number): number {
    const costs = COST_PER_1K[provider];
    return (inputTokens / AI_TOKENS_PER_UNIT) * costs.input + (outputTokens / AI_TOKENS_PER_UNIT) * costs.output;
  }

  async logUsage(provider: AiProvider, req: AiRequest, result: AiResponse): Promise<void> {
    const logResult = await safeCall(async () => {
      await this.aiRouterRepo.insertUsageLog({
        provider,
        taskType: req.taskType,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.inputTokens + result.outputTokens,
        estimatedCostUsd: result.estimatedCostUsd.toFixed(6),
        userId: req.userId != null ? Number(req.userId) : undefined,
        sessionId: req.sessionId != null ? String(req.sessionId) : undefined,
        requestSummary: req.prompt.substring(0, MAX_NAME_LENGTH),
        responseSummary: result.text.substring(0, MAX_NAME_LENGTH),
        latencyMs: result.latencyMs,
        status: 'success',
      });
    });
    if (isErr(logResult)) {
      this.logger.warn(`AI usage log yozishda xato: ${logResult.error.message}`);
    }
  }
}
