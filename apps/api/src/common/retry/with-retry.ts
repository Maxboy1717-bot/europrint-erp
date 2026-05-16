/**
 * @module with-retry
 * @description Retry + timeout wrapper used by infrastructure adapters that
 * call external (network) services. Implements the P2-23 policy:
 *
 *   - 3 attempts total (1 initial + 2 retries)
 *   - exponential backoff: 100ms, 300ms, 1000ms (base * 3^i)
 *   - 30-second hard timeout per attempt (rejects with Error('TIMEOUT'))
 *
 * Callers should translate the final rejection into a typed `AppErr` —
 * `Error('TIMEOUT')` → `AppErr('EXTERNAL_TIMEOUT', ...)` and any other
 * throw → `AppErr('EXTERNAL_5XX', ...)`. The helper itself stays generic
 * so it can be reused outside the LLM stack (notifications adapters reuse
 * it for Eskiz / Infobip / SMTP / Telegram).
 */

export interface WithRetryOptions {
  /** Total attempts including the first one. Defaults to 3. */
  attempts?:    number;
  /** Base delay between retries in ms. Backoff = base * 3^i. Defaults to 100ms. */
  baseDelayMs?: number;
  /** Per-attempt timeout. Rejects with `Error('TIMEOUT')`. Defaults to 30 000ms. */
  timeoutMs?:   number;
}

/**
 * Wrap an async function with retry + timeout. The function is invoked up to
 * `attempts` times; each attempt races against a `timeoutMs` timer. On every
 * failure (timeout or thrown error) we wait `baseDelayMs * 3^i` before the
 * next attempt. After the final failure the last error is re-thrown — the
 * caller decides how to translate it into a domain error.
 *
 * Why exponential backoff with base 3 instead of 2: P2-23 audit spec calls
 * out the exact delays 100 → 300 → 1000ms, which only works with base 3
 * (`100 * 3^0`, `100 * 3^1`, `100 * 3^2 ≈ 900`).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: WithRetryOptions = {},
): Promise<T> {
  const attempts    = options.attempts    ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const timeoutMs   = options.timeoutMs   ?? 30_000;

  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await Promise.race<T>([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs),
        ),
      ]);
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise<void>(r =>
          setTimeout(r, baseDelayMs * Math.pow(3, i)),
        );
      }
    }
  }
  throw lastError;
}

/**
 * Helper for adapter return paths: maps a thrown value into the two AppErr
 * codes most adapters care about (timeout vs. generic 5xx-ish failure).
 * Returns the literal AppErr code so the caller can use it in `Err(AppErr(...))`.
 */
export function classifyRetryError(err: unknown): 'EXTERNAL_TIMEOUT' | 'EXTERNAL_5XX' {
  const message = err instanceof Error ? err.message : String(err);
  return message === 'TIMEOUT' ? 'EXTERNAL_TIMEOUT' : 'EXTERNAL_5XX';
}
