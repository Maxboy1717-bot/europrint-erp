/**
 * @module gemini.adapter
 * @description Infrastructure adapter implementing `IGeminiPort` against the
 *   `@google/generative-ai` SDK. Used as the fallback path when Claude
 *   returns a 5xx or times out > 5s. Tool use is intentionally NOT supported
 *   (read-only summarisation only).
 *
 *   Wrapped in `withRetry` (3 attempts, exp. backoff 100/300/1000ms, 30s
 *   timeout). On final failure returns `Err(AppErr('EXTERNAL_5XX'))` or
 *   `Err(AppErr('EXTERNAL_TIMEOUT'))`.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { withRetry, classifyRetryError } from '@common/retry/with-retry';
import { AishaConfig } from '../../config/aisha.config';
import { IGeminiPort } from '../../domain/ports/i-gemini-port';

interface GeminiLike {
  getGenerativeModel(opts: { model: string }): {
    generateContent(prompt: string): Promise<{ response: { text(): string } }>;
  };
}

@Injectable()
export class GeminiAdapter implements IGeminiPort {
  private readonly logger = new Logger(GeminiAdapter.name);
  private sdk: GeminiLike | null = null;

  constructor(private readonly cfg: AishaConfig) {}

  /** Test-only hook so unit tests can inject a fake SDK. */
  setSdkForTesting(sdk: GeminiLike): void {
    this.sdk = sdk;
  }

  private async getSdk(): Promise<GeminiLike> {
    if (this.sdk) return this.sdk;
    const mod = await import('@google/generative-ai');
    const Ctor = (mod as unknown as {
      GoogleGenerativeAI: new (key: string) => GeminiLike;
    }).GoogleGenerativeAI;
    this.sdk = new Ctor(this.cfg.googleAiKey);
    return this.sdk;
  }

  async generate(prompt: string): Promise<Result<string>> {
    try {
      const text = await withRetry<string>(async () => {
        const sdk = await this.getSdk();
        const model = sdk.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const r = await model.generateContent(prompt);
        return r.response.text();
      });
      return Ok(text);
    } catch (err) {
      const code = classifyRetryError(err);
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Gemini fallback failed (${code}): ${msg}`);
      return Err(AppErr(
        code,
        code === 'EXTERNAL_TIMEOUT' ? 'Gemini timeout (30s)' : `Gemini error: ${msg}`,
      ));
    }
  }
}
