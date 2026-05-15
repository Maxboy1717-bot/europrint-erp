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

export interface IAishaTool {
  readonly definition: ToolDefinition;
  execute(input: Record<string, unknown>): Promise<Result<ToolResult<unknown>>>;
}
