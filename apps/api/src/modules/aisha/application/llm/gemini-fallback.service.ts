/**
 * @module gemini-fallback.service
 * @description Fallback LLM used when Claude returns 5xx or times out > 5s.
 * Implements the same one-shot interface as ClaudeService so the orchestrator
 * can swap them in place. Tool use is intentionally NOT supported here —
 * fallback is read-only summarisation; the orchestrator must degrade to
 * tool-free responses.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { AishaConfig } from '../../config/aisha.config';

interface GeminiLike {
  getGenerativeModel(opts: { model: string }): {
    generateContent(prompt: string): Promise<{ response: { text(): string } }>;
  };
}

@Injectable()
export class GeminiFallbackService {
  private readonly logger = new Logger(GeminiFallbackService.name);
  private sdk: GeminiLike | null = null;

  constructor(private readonly cfg: AishaConfig) {}

  setSdkForTesting(sdk: GeminiLike): void {
    this.sdk = sdk;
  }

  private async getSdk(): Promise<GeminiLike> {
    if (this.sdk) return this.sdk;
    const mod = await import('@google/generative-ai');
    const Ctor = (mod as unknown as { GoogleGenerativeAI: new (key: string) => GeminiLike }).GoogleGenerativeAI;
    this.sdk = new Ctor(this.cfg.googleAiKey);
    return this.sdk;
  }

  async generate(prompt: string): Promise<Result<string>> {
    try {
      const sdk = await this.getSdk();
      const model = sdk.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const r = await model.generateContent(prompt);
      return Ok(r.response.text());
    } catch (err) {
      this.logger.warn(`Gemini fallback failed: ${(err as Error).message}`);
      return Err(AppErr('EXTERNAL_SERVICE', (err as Error).message));
    }
  }
}
