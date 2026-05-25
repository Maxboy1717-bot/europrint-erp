/**
 * @module gemini-fallback.service
 * @description LEGACY shim. The real implementation now lives in
 *   `infrastructure/external/gemini.adapter.ts` (`GeminiAdapter`, which
 *   implements `IGeminiPort`). This file is kept so any direct
 *   `GeminiFallbackService` imports continue to compile while consumers
 *   migrate to `@Inject(GEMINI_PORT) IGeminiPort`.
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import { GeminiAdapter } from '../../infrastructure/external/gemini.adapter';

interface GeminiLike {
  getGenerativeModel(opts: { model: string }): {
    generateContent(prompt: string): Promise<{ response: { text(): string } }>;
  };
}

/**
 * @deprecated New code should `@Inject(GEMINI_PORT)` and depend on
 *   `IGeminiPort`. This class delegates to `GeminiAdapter` for back-compat.
 */
@Injectable()
export class GeminiFallbackService {
  constructor(private readonly adapter: GeminiAdapter) {}

  setSdkForTesting(sdk: GeminiLike): void {
    this.adapter.setSdkForTesting(sdk);
  }

  generate(prompt: string): Promise<Result<string>> {
    return this.adapter.generate(prompt);
  }
}
