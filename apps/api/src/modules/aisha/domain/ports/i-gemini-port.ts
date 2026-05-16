/**
 * @module i-gemini-port
 * @description Domain port for the Gemini fallback LLM. Used when Claude
 *   returns a 5xx or exceeds the per-call timeout — the orchestrator can
 *   degrade to tool-free summarisation via this port without depending on
 *   the `@google/generative-ai` package directly.
 */

import { Result } from '@common/result';

export const GEMINI_PORT = Symbol('GEMINI_PORT');

export interface IGeminiPort {
  /**
   * One-shot prompt → completion. Tool use is intentionally NOT supported
   * here — the fallback is read-only summarisation. Returns
   * `Err(AppErr('EXTERNAL_5XX' | 'EXTERNAL_TIMEOUT'))` on failure.
   */
  generate(prompt: string): Promise<Result<string>>;
}
