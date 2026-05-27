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

  register(tool: IAishaTool): Result<void> {
    if (this.tools.has(tool.definition.name)) {
      return Err(AppErr('CONFLICT', `ToolRegistry: duplicate tool "${tool.definition.name}"`));
    }
    this.tools.set(tool.definition.name, tool);
    return Ok();
  }

  registerAll(tools: IAishaTool[]): Result<void> {
    for (const t of tools) {
      const r = this.register(t);
      if (!r.ok) return r;
    }
    return Ok();
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
