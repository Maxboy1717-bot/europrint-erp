/**
 * @module claude.adapter
 * @description Infrastructure adapter implementing `IClaudePort` against the
 *   `@anthropic-ai/sdk`. Moved here from `application/llm/claude.service.ts`
 *   as part of P2-23 (hex-arch: SDK calls belong in infrastructure, not the
 *   application layer).
 *
 *   Each remote call is wrapped in `withRetry`:
 *     - 3 attempts total
 *     - exponential backoff 100ms / 300ms / 1000ms
 *     - 30s timeout per attempt
 *   On final failure the adapter returns `Err(AppErr('EXTERNAL_5XX'))` or
 *   `Err(AppErr('EXTERNAL_TIMEOUT'))` depending on whether the underlying
 *   reject was a timeout.
 *
 *   The SDK is dynamically imported so the package missing at install time
 *   doesn't break unrelated test suites (matches the original service
 *   contract; see `setSdkForTesting` for unit-test injection).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { withRetry, classifyRetryError } from '@common/retry/with-retry';
import { AishaConfig } from '../../config/aisha.config';
import {
  IClaudePort,
  ClaudeRequest,
  ClaudeStreamEvent,
} from '../../domain/ports/i-claude-port';

interface SdkLike {
  messages: {
    stream(params: Record<string, unknown>): AsyncIterable<Record<string, unknown>>;
  };
}

@Injectable()
export class ClaudeAdapter implements IClaudePort {
  private readonly logger = new Logger(ClaudeAdapter.name);
  private sdk: SdkLike | null = null;

  constructor(private readonly cfg: AishaConfig) {}

  /** Test-only hook so unit tests can inject a fake SDK. */
  setSdkForTesting(sdk: SdkLike): void {
    this.sdk = sdk;
  }

  private async getSdk(): Promise<SdkLike> {
    if (this.sdk) return this.sdk;
    const mod = await import('@anthropic-ai/sdk');
    const Anthropic = (mod as unknown as {
      default: new (opts: { apiKey: string }) => SdkLike;
    }).default;
    this.sdk = new Anthropic({ apiKey: this.cfg.anthropicKey });
    return this.sdk;
  }

  /**
   * Stream Claude's response. The whole stream lifecycle (SDK init + each
   * `for await` iteration) is wrapped in `withRetry` so a transient 5xx
   * mid-stream restarts cleanly. On final failure we yield a single
   * `{ kind: 'error', message }` and return — matching the original
   * contract so callers don't need to change.
   */
  async *streamWithTools(request: ClaudeRequest): AsyncIterable<ClaudeStreamEvent> {
    const params: Record<string, unknown> = {
      model:      request.model ?? 'claude-sonnet-4-6-20251022',
      max_tokens: request.maxTokens ?? 1024,
      messages:   request.messages,
    };
    if (request.tools)  params.tools  = request.tools;
    if (request.system) params.system = request.system;

    let collected: ClaudeStreamEvent[];
    try {
      collected = await withRetry<ClaudeStreamEvent[]>(async () => {
        const sdk = await this.getSdk();
        const events: ClaudeStreamEvent[] = [];
        const it = sdk.messages.stream(params);
        for await (const ev of it) {
          const mapped = this.mapEvent(ev);
          if (mapped) events.push(mapped);
        }
        return events;
      });
    } catch (err) {
      this.logger.error(`Claude stream failed: ${(err as Error).message}`);
      const code = classifyRetryError(err);
      yield {
        kind:    'error',
        message: code === 'EXTERNAL_TIMEOUT'
          ? 'Claude timeout (30s)'
          : `Claude unavailable: ${(err as Error).message}`,
      };
      return;
    }
    for (const ev of collected) yield ev;
  }

  private mapEvent(ev: Record<string, unknown>): ClaudeStreamEvent | null {
    const t = ev['type'];
    if (t === 'content_block_delta') {
      const delta = ev['delta'] as Record<string, unknown> | undefined;
      if (delta && delta['type'] === 'text_delta' && typeof delta['text'] === 'string') {
        return { kind: 'text_delta', text: delta['text'] };
      }
    }
    if (t === 'content_block_start') {
      const block = ev['content_block'] as Record<string, unknown> | undefined;
      if (block && block['type'] === 'tool_use') {
        return {
          kind:  'tool_use',
          id:    String(block['id']   ?? ''),
          name:  String(block['name'] ?? ''),
          input: (block['input'] as Record<string, unknown>) ?? {},
        };
      }
    }
    if (t === 'message_stop') {
      return { kind: 'done', stopReason: (ev['stop_reason'] as string | null) ?? null };
    }
    return null;
  }

  /**
   * One-shot text completion. Drains the stream and returns the concatenated
   * text. `withRetry` wraps the entire drain so the whole call is one logical
   * unit (timeout covers both connect + drain).
   */
  async sendOneShot(request: ClaudeRequest): Promise<Result<string>> {
    try {
      const text = await withRetry<string>(async () => {
        let acc = '';
        let streamError: string | null = null;
        for await (const ev of this.streamWithToolsRaw(request)) {
          if (ev.kind === 'text_delta') acc += ev.text;
          else if (ev.kind === 'error') streamError = ev.message;
        }
        if (streamError) throw new Error(streamError);
        return acc;
      });
      return Ok(text);
    } catch (err) {
      const code = classifyRetryError(err);
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Claude sendOneShot failed (${code}): ${msg}`);
      return Err(AppErr(
        code,
        code === 'EXTERNAL_TIMEOUT' ? 'Claude timeout (30s)' : `Claude error: ${msg}`,
      ));
    }
  }

  /**
   * Internal stream that throws on error (instead of yielding error events).
   * Used by `sendOneShot` so `withRetry` can catch + retry transient failures.
   */
  private async *streamWithToolsRaw(request: ClaudeRequest): AsyncIterable<ClaudeStreamEvent> {
    const sdk = await this.getSdk();
    const params: Record<string, unknown> = {
      model:      request.model ?? 'claude-sonnet-4-6-20251022',
      max_tokens: request.maxTokens ?? 1024,
      messages:   request.messages,
    };
    if (request.tools)  params.tools  = request.tools;
    if (request.system) params.system = request.system;

    const it = sdk.messages.stream(params);
    for await (const ev of it) {
      const mapped = this.mapEvent(ev);
      if (mapped) yield mapped;
    }
  }
}
