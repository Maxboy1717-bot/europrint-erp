/**
 * @module claude.service
 * @description Streaming Claude wrapper used by AIsha. Exposes an async
 * iterator of `StreamEvent` so the SSE gateway can pipe tokens straight to
 * the browser. Tool-use blocks are surfaced verbatim so the orchestrator can
 * dispatch them to the ToolRegistry.
 *
 * NB: we hold off on importing `@anthropic-ai/sdk` at module load time —
 * lazy-load inside the method so failing to install the dep doesn't break
 * unrelated test suites.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import { AishaConfig } from '../../config/aisha.config';

export type StreamEvent =
  | { kind: 'text_delta';  text: string }
  | { kind: 'tool_use';    id: string; name: string; input: Record<string, unknown> }
  | { kind: 'tool_result'; id: string; content: unknown }
  | { kind: 'done';        stopReason: string | null }
  | { kind: 'error';       message: string };

export interface ClaudeMessage {
  role:    'user' | 'assistant';
  content: string | Array<Record<string, unknown>>;
}

export interface ClaudeStreamOpts {
  messages: ClaudeMessage[];
  tools?:   Array<Record<string, unknown>>;
  model?:   string;
  system?:  string;
  maxTokens?: number;
}

interface SdkLike {
  messages: {
    stream(params: Record<string, unknown>): AsyncIterable<Record<string, unknown>>;
  };
}

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private sdk: SdkLike | null = null;

  constructor(private readonly cfg: AishaConfig) {}

  setSdkForTesting(sdk: SdkLike): void {
    this.sdk = sdk;
  }

  private async getSdk(): Promise<SdkLike> {
    if (this.sdk) return this.sdk;
    const mod = await import('@anthropic-ai/sdk');
    const Anthropic = (mod as unknown as { default: new (opts: { apiKey: string }) => SdkLike }).default;
    this.sdk = new Anthropic({ apiKey: this.cfg.anthropicKey });
    return this.sdk;
  }

  async *streamWithTools(opts: ClaudeStreamOpts): AsyncIterable<StreamEvent> {
    let sdk: SdkLike;
    try {
      sdk = await this.getSdk();
    } catch (err) {
      yield { kind: 'error', message: `Claude SDK unavailable: ${(err as Error).message}` };
      return;
    }

    const params: Record<string, unknown> = {
      model:      opts.model ?? 'claude-sonnet-4-6-20251022',
      max_tokens: opts.maxTokens ?? 1024,
      messages:   opts.messages,
    };
    if (opts.tools)  params.tools  = opts.tools;
    if (opts.system) params.system = opts.system;

    try {
      const it = sdk.messages.stream(params);
      for await (const ev of it) {
        const mapped = this.mapEvent(ev);
        if (mapped) yield mapped;
      }
    } catch (err) {
      this.logger.error('Claude stream failed', err as Error);
      yield { kind: 'error', message: (err as Error).message };
    }
  }

  private mapEvent(ev: Record<string, unknown>): StreamEvent | null {
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
          kind: 'tool_use',
          id:   String(block['id'] ?? ''),
          name: String(block['name'] ?? ''),
          input: (block['input'] as Record<string, unknown>) ?? {},
        };
      }
    }
    if (t === 'message_stop') {
      return { kind: 'done', stopReason: (ev['stop_reason'] as string | null) ?? null };
    }
    return null;
  }

  async sendOneShot(opts: ClaudeStreamOpts): Promise<Result<string>> {
    try {
      let text = '';
      for await (const ev of this.streamWithTools(opts)) {
        if (ev.kind === 'text_delta') text += ev.text;
        if (ev.kind === 'error') return Err(AppErr('EXTERNAL_SERVICE', ev.message));
      }
      return Ok(text);
    } catch (err) {
      return Err(AppErr('EXTERNAL_SERVICE', (err as Error).message));
    }
  }
}
