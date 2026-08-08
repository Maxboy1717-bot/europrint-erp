/**
 * @module aisha-tool.types
 * @description Type-only contracts for the Aisha tool-call loop (A78).
 *   No runtime code — just the interfaces the orchestrator and any tool
 *   implementation share.
 *
 * WHY A SEPARATE TYPES FILE
 *   The orchestrator (aisha-orchestrator.service.ts) is the *skeleton* of an
 *   LLM tool-use loop. Tool implementations live elsewhere (the existing
 *   `modules/aisha` already ships ~30 concrete tools). Keeping the contract
 *   type-only lets a tool be registered into the loop without the loop ever
 *   importing a concrete tool — the registry is the only coupling point.
 */

import type { Result } from '@common/result';

/**
 * JSON-schema-ish description the LLM receives so it knows a tool exists and
 * what arguments it takes. Mirrors the Anthropic / OpenAI tool spec shape so a
 * real provider tool-use call can reuse it verbatim later.
 */
export interface AishaToolDefinition {
  name:        string;
  description: string;
  inputSchema: {
    type:       'object';
    properties: Record<string, { type: string; description?: string }>;
    required?:  string[];
  };
}

/**
 * A registered tool. `execute` returns a Result — a tool MUST NOT throw and
 * MUST NOT fabricate: it either returns real data (Ok) or a typed failure
 * (Err). The loop feeds the Result back to the LLM as the next observation.
 */
export interface AishaTool {
  readonly definition: AishaToolDefinition;
  execute(input: Record<string, unknown>): Promise<Result<unknown>>;
}

/**
 * A tool-call the LLM asked for, parsed out of its turn. `id` lets a future
 * provider-native tool-use turn correlate the observation back to the request.
 */
export interface ToolCallRequest {
  id:   string;
  name: string;
  args: Record<string, unknown>;
}

/** One observation appended to the transcript after a tool runs (or fails). */
export interface ToolObservation {
  toolName: string;
  ok:       boolean;
  /** Real tool output on success; the error message on failure. NEVER faked. */
  result:   unknown;
}

/** Why the loop stopped. */
export type AishaLoopStatus =
  /** LLM produced a final answer with no further tool request. */
  | 'completed'
  /** Loop hit the iteration cap before the LLM finalised. */
  | 'max_iterations'
  /** No AI provider key configured — loop cannot run (Q-40 gate). */
  | 'needs_ai_key'
  /** AI provider returned an error other than a missing key (budget, 5xx). */
  | 'ai_error';

/** One turn of the loop, recorded for transparency / audit. */
export interface AishaLoopStep {
  iteration:    number;
  /** Raw assistant turn text (may contain the tool-call JSON or the answer). */
  assistantText: string;
  /** The tool the assistant asked for this turn, if any. */
  toolCall:     ToolCallRequest | null;
  /** The observation produced by running `toolCall`, if any. */
  observation:  ToolObservation | null;
}

/** Final structured outcome of a `run()`. */
export interface AishaLoopResult {
  status:      AishaLoopStatus;
  /** Final natural-language answer when status === 'completed'; else ''. */
  answer:      string;
  steps:       AishaLoopStep[];
  toolsUsed:   string[];
  iterations:  number;
  /** Set when status is needs_ai_key / ai_error / max_iterations. */
  reason:      string | null;
}

/** Options for a single loop run. */
export interface AishaRunOptions {
  /** Max LLM↔tool round-trips before bailing out. */
  maxIterations?: number;
  /** Optional system prompt prepended to the tool catalogue. */
  systemPrompt?:  string;
  /** For audit log attribution; 0 when system-initiated. */
  userId?:        number;
}
