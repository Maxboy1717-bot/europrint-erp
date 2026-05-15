/**
 * @module tool-executed.event
 * @description Emitted after a tool finishes successfully. Carries the full
 * ToolCall so listeners (audit, billing) get provenance for free.
 */

import type { ToolCall } from '../value-objects/tool-call.vo';

export class ToolExecutedEvent {
  static readonly NAME = 'aisha.tool.executed';
  constructor(
    public readonly conversationId: string,
    public readonly toolCall: ToolCall,
    public readonly latencyMs: number,
  ) {}
}
