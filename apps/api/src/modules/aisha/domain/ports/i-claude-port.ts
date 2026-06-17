/**
 * @module i-claude-port
 * @description Domain port for the Claude (Anthropic) LLM. Infrastructure
 *   layer provides a concrete adapter (`ClaudeAdapter`) that satisfies this
 *   contract — domain code only depends on the interface, never on the
 *   `@anthropic-ai/sdk` package or HTTP transport details.
 *
 *   Method shapes are derived from the original `ClaudeService` API
 *   (streamWithTools + sendOneShot) so existing AIsha tools and the chat
 *   controller can swap to the port without behavioural changes.
 */

import { Result } from '@common/result';

export const CLAUDE_PORT = Symbol('CLAUDE_PORT');

/**
 * SSE-style event emitted by `streamWithTools`. Matches the Anthropic stream
 * shape exactly so callers can ferry deltas straight to the browser without
 * an extra mapping layer.
 */
export type ClaudeStreamEvent =
  | { kind: 'text_delta';  text: string }
  | { kind: 'tool_use';    id: string; name: string; input: Record<string, unknown> }
  | { kind: 'tool_result'; id: string; content: unknown }
  | { kind: 'done';        stopReason: string | null }
  | { kind: 'error';       message: string };

export interface ClaudeMessage {
  role:    'user' | 'assistant';
  /**
   * Either a plain string or the multimodal content array used by vision
   * tools (image + text blocks). Kept as `Record<string, unknown>[]` so the
   * port stays decoupled from SDK-internal types.
   */
  content: string | Array<Record<string, unknown>>;
}

export interface ClaudeRequest {
  messages:    ClaudeMessage[];
  tools?:      Array<Record<string, unknown>>;
  model?:      string;
  system?:     string;
  maxTokens?:  number;
}

export interface IClaudePort {
  /**
   * Stream Claude's response as an async iterable of events. Implementations
   * must yield a single `{ kind: 'error', message }` and return when the
   * underlying call fails — they MUST NOT throw.
   */
  streamWithTools(request: ClaudeRequest): AsyncIterable<ClaudeStreamEvent>;

  /**
   * Convenience one-shot wrapper that drains the stream and returns the
   * concatenated text. Returns `Err(AppErr('EXTERNAL_5XX' | 'EXTERNAL_TIMEOUT'))`
   * on failure (translated by the adapter from the underlying transport error).
   */
  sendOneShot(request: ClaudeRequest): Promise<Result<string>>;

  /**
   * Non-streaming call that returns COMPLETE content blocks — the assistant text plus any tool_use
   * blocks with their FULL input (the streaming path only surfaces tool_use at content_block_start where
   * the input is still empty). The tool-execution loop uses this so tools run with real arguments.
   */
  createWithTools(request: ClaudeRequest): Promise<Result<ClaudeToolTurn>>;
}

export interface ClaudeToolUse {
  id:    string;
  name:  string;
  input: Record<string, unknown>;
}

export interface ClaudeToolTurn {
  text:       string;
  toolUses:   ClaudeToolUse[];
  stopReason: string | null;
}
