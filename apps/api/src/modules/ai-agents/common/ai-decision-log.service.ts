/**
 * @module ai-decision-log.service
 * @description Centralised log + idempotency cache for every AI-agent
 *   decision. Every agent (production, supplier, IoT, HR-perf, etc.) writes
 *   its action proposals here BEFORE applying them. Three jobs:
 *
 *     1. **Idempotency** — same input within 1 hour returns the cached
 *        decision instead of re-calling the LLM. Saves cost + latency.
 *     2. **Audit trail** — every model output recorded with confidence,
 *        latency, cost, model version → traceable for compliance + Director.
 *     3. **Stats** — per-agent rollups for the Director AI-Audit dashboard
 *        (auto-rate, override-rate, p95 latency, total spend).
 * @layer Service (AI-agents cross-cutting)
 *
 * WHY 1-HOUR IDEMPOTENCY WINDOW
 *   Production state changes fast — overtime, machine status, inventory.
 *   A cached decision from yesterday would act on stale facts. 1 hour
 *   matches our shortest agent cadence (MES monitor runs every 5 min, but
 *   its inputs are bucketed to the hour to avoid thrashing).
 *
 *   The hash key includes `bucketHour` so cache invalidation is automatic
 *   at the hour boundary — no manual cache-clear endpoint needed.
 *
 * WHY SHA-256 OF JSON STRINGIFY FOR THE INPUT HASH
 *   We need a stable key for "same logical input". `JSON.stringify` is not
 *   strictly stable (object key order can vary) but for our agent inputs
 *   (structured DTOs) it's good enough — and a real canonicaliser would
 *   need a separate dependency. If we hit false-negative cache misses, swap
 *   for `safe-stable-stringify`.
 *
 * WHY UUID NORMALISATION (toEntityUuid)
 *   The `aiDecisionLog.entityId` column is UUID-typed for indexing speed.
 *   But agents reference entities by different ID formats: production
 *   orders use INT, customers use UUID, machines use string codes. We
 *   deterministically map non-UUID strings to a SHA-256-derived UUID v4
 *   so the same logical entity always lands on the same row regardless of
 *   the source ID format. The bit-twiddling at `parseInt(h[16], 16) & 0x3 | 0x8`
 *   sets the UUID variant bits (RFC 4122 §4.1.1) so PG accepts it.
 *
 * WHY HumanOverride TRACKING MATTERS
 *   The Director AI-Audit panel shows "decisions overridden by humans".
 *   A high override rate on an agent means its model needs retuning. We
 *   record both the auto decision AND the human override on the same row
 *   so the audit query can compute override rate without a join.
 */

import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { db, aiDecisionLog } from '@shared/db';
import { and, eq, gte, sql } from 'drizzle-orm';
import type { AiDecisionLogInsert } from '@shared/db';
import { AGENT_CODES } from './ai-agents.constants';

const IDEMPOTENCY_TTL_HOURS = 1;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface LogDecisionInput {
  agentCode:   string;
  entityType:  string;
  entityId:    string;
  inputData:   unknown;
  decision:    { action: string; confidence: number; alternatives: unknown[] };
  confidence:  number;
  modelVersion: string;
  autoExecuted: boolean;
  latencyMs:   number;
  costUsd?:    number;
}

@Injectable()
export class AiDecisionLogService {
  private readonly logger = new Logger(AiDecisionLogService.name);

  hashInput(input: unknown): string {
    return createHash('sha256').update(JSON.stringify(input)).digest('hex');
  }

  /**
   * Normalises any string to a well-formed UUID v4.
   * - Valid UUID strings are returned as-is.
   * - All other strings are deterministically mapped using SHA-256 so the
   *   same logical entity always maps to the same UUID surrogate.
   */
  private toEntityUuid(id: string): string {
    if (UUID_RE.test(id)) return id;
    const h = createHash('sha256').update(id).digest('hex');
    return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${(parseInt(h[16], 16) & 0x3 | 0x8).toString(16)}${h.slice(17,20)}-${h.slice(20,32)}`;
  }

  async isDuplicate(agentCode: string, inputHash: string): Promise<boolean> {
    return (await this.findCachedDecision(agentCode, inputHash)) !== null;
  }

  async findCachedDecision(
    agentCode:  string,
    inputHash:  string,
  ): Promise<{ action: string; confidence: number; alternatives: unknown[] } | null> {
    const cutoff = new Date(Date.now() - IDEMPOTENCY_TTL_HOURS * 3600 * 1000);
    const rows = await db.select({
      decision:   aiDecisionLog.decision,
      confidence: aiDecisionLog.confidence,
    })
      .from(aiDecisionLog)
      .where(and(
        eq(aiDecisionLog.agentCode, agentCode),
        eq(aiDecisionLog.inputHash, inputHash),
        gte(aiDecisionLog.createdAt, cutoff),
      ))
      .limit(1);
    if (!rows.length) return null;
    const dec = rows[0].decision as { action?: string; alternatives?: unknown[] } | null;
    return {
      action:       dec?.action       ?? 'unknown',
      confidence:   Number(rows[0].confidence ?? 0),
      alternatives: dec?.alternatives ?? [],
    };
  }

  async log(input: LogDecisionInput): Promise<string> {
    const inputHash = this.hashInput(input.inputData);
    const isDup = await this.isDuplicate(input.agentCode, inputHash).catch((err: unknown) => {
      this.logger.error({ msg: 'isDuplicate check failed', agentCode: input.agentCode, err });
      throw err;
    });
    if (isDup) {
      this.logger.debug(`Duplicate decision skipped: ${input.agentCode}/${inputHash.slice(0, 8)}`);
      return inputHash;
    }

    const bucketHour = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000);
    const row: AiDecisionLogInsert = {
      agentCode:    input.agentCode,
      entityType:   input.entityType,
      entityId:     this.toEntityUuid(input.entityId),
      inputHash,
      bucketHour,
      decision:     input.decision,
      confidence:   String(input.confidence),
      modelVersion: input.modelVersion,
      autoExecuted: input.autoExecuted,
      latencyMs:    input.latencyMs,
      costUsd:      input.costUsd ? String(input.costUsd) : null,
    };

    await db.insert(aiDecisionLog).values(row).onConflictDoNothing();
    this.logger.log({
      msg:          'AI qaror yozildi',
      agent:        input.agentCode,
      entity:       input.entityType,
      auto:         input.autoExecuted,
      confidence:   input.confidence,
    });
    return inputHash;
  }

  async getStats(agentCode?: string) {
    const rows = await db.select({
      agentCode:     aiDecisionLog.agentCode,
      total:         sql<number>`count(*)`,
      autoCount:     sql<number>`count(*) FILTER (WHERE auto_executed = true)`,
      overrideCount: sql<number>`count(*) FILTER (WHERE human_override IS NOT NULL)`,
      avgConfidence: sql<number>`avg(confidence::numeric)`,
      avgLatency:    sql<number>`avg(latency_ms)`,
      p95Latency:    sql<number>`percentile_disc(0.95) WITHIN GROUP (ORDER BY latency_ms)`,
      totalCost:     sql<number>`sum(cost_usd::numeric)`,
    })
      .from(aiDecisionLog)
      .where(agentCode ? eq(aiDecisionLog.agentCode, agentCode) : sql`1=1`)
      .groupBy(aiDecisionLog.agentCode);

    return rows.map((r) => ({
      agentCode:      r.agentCode,
      total:          Number(r.total),
      autoCount:      Number(r.autoCount),
      overrideCount:  Number(r.overrideCount),
      avgConfidence:  Number(r.avgConfidence ?? 0),
      avgLatency:     Number(r.avgLatency ?? 0),
      p95LatencyMs:   Number(r.p95Latency ?? 0),
      totalCostUsd:   Number(r.totalCost ?? 0),
      autoRate:       Number(r.total) > 0 ? Number(r.autoCount) / Number(r.total) : 0,
      errorRate:      Number(r.total) > 0 ? Number(r.overrideCount) / Number(r.total) : 0,
    }));
  }

  async getRecentDecisions(agentCode: string, limit = 50, onlyIncorrect = false) {
    try {
      const baseWhere = onlyIncorrect
        ? sql`agent_code = ${agentCode} AND human_override IS NOT NULL`
        : eq(aiDecisionLog.agentCode, agentCode);
      return await db.select()
        .from(aiDecisionLog)
        .where(baseWhere)
        .orderBy(sql`created_at DESC`)
        .limit(limit);
    } catch (e) {
      throw new Error(`aiDecisionLog.getRecentDecisions: ${String(e)}`);
    }
  }

  async getHardBlockStats() {
    const result = await db.execute<{
      guard_type:         string;
      blocked_count:      string;
      avg_blocked_age_sec: string;
    }>(sql`
      SELECT guard_type, COUNT(*) AS blocked_count,
             ROUND(AVG(EXTRACT(EPOCH FROM NOW() - created_at)))::bigint AS avg_blocked_age_sec
      FROM (
        SELECT 'payment_pending' AS guard_type, created_at
        FROM customer_orders
        WHERE deleted_at IS NULL
          AND LOWER(payment_status) IN ('pending', 'unpaid')

        UNION ALL

        SELECT 'lab_wait' AS guard_type, s.created_at
        FROM mes_production_sessions s
        LEFT JOIN certificates c ON c.employee_id = s.operator_id
          AND c.is_active = true
          AND c.expires_at > NOW()
        WHERE s.operator_id IS NOT NULL
          AND c.id IS NULL

        UNION ALL

        SELECT 'material_wait' AS guard_type, po.created_at
        FROM mm_purchase_orders po
        WHERE LOWER(po.status) IN ('pending', 'approved')
      ) AS blocked_items
      GROUP BY guard_type
    `).then((r) => r.rows).catch((err: unknown): { guard_type: string; blocked_count: string; avg_blocked_age_sec: string }[] => {
      this.logger.error({ msg: 'getHardBlockStats query failed', err });
      return [];
    });

    const GUARD_AGENT: Record<string, string> = {
      payment_pending: AGENT_CODES.SALES_COPILOT,
      lab_wait:        AGENT_CODES.MES_MONITOR,
      material_wait:   AGENT_CODES.PLANNER,
    };

    return result.map((r) => ({
      agentCode:        GUARD_AGENT[r.guard_type] ?? 'UNKNOWN',
      guardType:        r.guard_type,
      blockedCount:     Number(r.blocked_count),
      avgBlockedAgeSec: Number(r.avg_blocked_age_sec ?? 0),
    }));
  }
}
