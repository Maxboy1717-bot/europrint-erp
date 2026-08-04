/**
 * @module tool.interface
 * @description Contract every AIsha tool implements. The LLM receives the
 * `definition` (Anthropic tool spec) and invokes `execute()` with the
 * structured input. Every tool MUST return a ToolResult so the
 * TransparencyPanel can render the data sources.
 */

import type { Result } from '@common/result';
import type { Provenance } from './value-objects/tool-call.vo';

export interface ToolDefinition {
  name:        string;
  description: string;
  input_schema: {
    type:       'object';
    properties: Record<string, { type: string; description?: string }>;
    required?:  string[];
  };
}

export interface ToolResult<T> {
  data:       T;
  provenance: Provenance;
}

/**
 * Who is asking. Threaded from the chat controller (JWT `req.user`) through
 * `AishaConversationService.runTurn` into every tool's `execute()`, so a
 * tool that touches sensitive data (PII, financials) can apply the same
 * role-gate the corresponding REST endpoint would. Optional — most tools
 * (camera/machine/production status, etc.) are role-agnostic and never
 * read it. `role` is `null` when the caller (e.g. the high-stake-approval
 * resume path) doesn't currently track it.
 */
export interface AishaToolContext {
  userId: number;
  role:   string | null;
}

export interface IAishaTool {
  readonly definition: ToolDefinition;
  execute(input: Record<string, unknown>, ctx?: AishaToolContext): Promise<Result<ToolResult<unknown>>>;
}
