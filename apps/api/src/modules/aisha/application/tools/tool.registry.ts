/**
 * @module tool.registry
 * @description Central registry of every AIsha tool. Tools register
 * themselves during NestJS bootstrap (via constructor injection) — see
 * AishaModule.providers. Anthropic's tool-use API receives the list of
 * `definition` blocks; the orchestrator looks up the handler by name when
 * the LLM emits a `tool_use` block.
 */

import { Injectable } from '@nestjs/common';
import { Result, Ok, Err, AppErr } from '@common/result';
import type { IAishaTool, ToolDefinition } from '../../domain/tool.interface';

@Injectable()
export class ToolRegistry {
  private readonly tools = new Map<string, IAishaTool>();

  register(tool: IAishaTool): void {
    if (this.tools.has(tool.definition.name)) {
      throw new Error(`ToolRegistry: duplicate tool "${tool.definition.name}"`);
    }
    this.tools.set(tool.definition.name, tool);
  }

  registerAll(tools: IAishaTool[]): void {
    for (const t of tools) this.register(t);
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  getToolByName(name: string): Result<IAishaTool> {
    const t = this.tools.get(name);
    if (!t) return Err(AppErr('NOT_FOUND', `Tool topilmadi: ${name}`));
    return Ok(t);
  }

  size(): number {
    return this.tools.size;
  }

  clear(): void {
    this.tools.clear();
  }
}
