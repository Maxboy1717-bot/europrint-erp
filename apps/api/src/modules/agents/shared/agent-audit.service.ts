/**
 * Agent harakatlari audit log
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: `::jsonb` cast on JSON.stringify results for input_summary /
 *   output_summary jsonb columns, and the target table `agents_audit_log` is
 *   not present in the Drizzle schema barrel.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

export interface AgentAuditEntry {
  agentName:     string;
  action:        string;
  userId?:       number | null;
  targetType?:   string | null;
  targetId?:     string | null;
  inputSummary?: Record<string, unknown>;
  outputSummary?: Record<string, unknown>;
  durationMs?:   number;
  aiUsed?:       boolean;
  aiTokens?:     number;
  aiCostUsd?:    number;
  success?:      boolean;
  errorMessage?: string;
}

@Injectable()
export class AgentAuditService {
  async log(e: AgentAuditEntry): Promise<void> {
    try {
      await runQuery(sql`
        INSERT INTO agents_audit_log
          (agent_name, action, user_id, target_type, target_id,
           input_summary, output_summary, duration_ms, ai_used, ai_tokens, ai_cost_usd,
           success, error_message)
        VALUES
          (${e.agentName}, ${e.action}, ${e.userId ?? null}, ${e.targetType ?? null}, ${e.targetId ?? null},
           ${JSON.stringify(e.inputSummary ?? null)}::jsonb,
           ${JSON.stringify(e.outputSummary ?? null)}::jsonb,
           ${e.durationMs ?? null}, ${e.aiUsed ?? false}, ${e.aiTokens ?? null}, ${e.aiCostUsd ?? null},
           ${e.success ?? true}, ${e.errorMessage ?? null})
      `);
    } catch { /* audit-log fail bo'lsa app to'xtamasligi uchun yutamiz */ }
  }

  /** Wrapper: agent metodini logged tarzda ishga tushirish */
  async wrap<T>(
    args: Pick<AgentAuditEntry, 'agentName' | 'action' | 'userId' | 'targetType' | 'targetId' | 'inputSummary' | 'aiUsed'>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      await this.log({ ...args, durationMs: Date.now() - start, success: true });
      return result;
    } catch (err) {
      await this.log({ ...args, durationMs: Date.now() - start, success: false, errorMessage: (err as Error).message });
      throw err;
    }
  }
}
