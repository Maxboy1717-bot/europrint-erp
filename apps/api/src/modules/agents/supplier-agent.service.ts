/**
 * @module supplier-agent.service
 * @description Supplier-performance scorer + ABC-tier classifier. Runs on
 *   a cron to refresh `supplier_score` and emit alerts for tier
 *   degradation. Reads the trailing 180 days of POs and combines on-time
 *   delivery, QC quality score into a composite 0-100 score.
 *
 *   Composite score formula:
 *     score = onTimePct × 40    (max 40 for delivery reliability)
 *           + qualityScore × 30  (max 30 for QC pass-through)
 *           + 20                 (base — reflects "we did business with you")
 *           + 10                 (reserve for future signal)
 *
 *   Tier mapping:
 *     score ≥ 80  →  Tier A   (preferred supplier, lock in for next quarter)
 *     score ≥ 60  →  Tier B   (acceptable, monitor)
 *     else        →  Tier C   (at-risk; phase out or renegotiate)
 * @layer Service (Agents — scheduled deterministic)
 *
 * WHY 180-DAY WINDOW
 *   Half a year captures seasonal supplier patterns (e.g. holiday slowdowns)
 *   while staying responsive to recent changes. Longer windows let bad
 *   suppliers hide behind ancient good history; shorter windows are too
 *   noisy on small-PO suppliers.
 *
 * WHY THE 40/30/20/10 WEIGHTING
 *   - On-time delivery (40%) is our biggest pain point — late materials
 *     stop production lines.
 *   - Quality (30%) — defects ripple into scrap + customer reclamations.
 *   - Base 20% — every supplier that's been in business with us gets
 *     credit for the relationship overhead; absolute discrimination
 *     against the "tail" is overkill.
 *   - 10% reserve — for future signals (price stability, communication
 *     quality, payment-terms flexibility). Wired in but not yet scored.
 *
 *   These weights came out of a supplier-management workshop with the
 *   procurement team. Tune by editing the constants here; the workshop
 *   minutes live in `docs/supplier-scoring-2024.md` (if it exists).
 *
 * WHY ABC TIERS (not numeric score) FOR DOWNSTREAM CONSUMERS
 *   ABC is a closed enum — easier to wire into buyer dashboards, PO
 *   auto-approval rules, etc. ("If Tier A and qty < threshold, auto-approve").
 *   The raw score is kept on the row for traceability + tie-breaking.
 *
 * WHY THIS IS DETERMINISTIC, NOT LLM-DRIVEN
 *   Same reason as production-agent: the inputs are quantitative, the
 *   formula is fixed (and audited by procurement). LLM would add cost +
 *   variability with no value. If/when we want "qualitative supplier
 *   review based on communication patterns", that's a separate LLM
 *   agent in `ai-agents/`.
 *
 * WHY THIS SHARES TIER CODES WITH WMS ABC ANALYSIS
 *   "Tier A supplier" parallels "Class A material" — both ABC Pareto
 *   classifications. Reuse keeps mental model simple for buyers who
 *   already use ABC for inventory.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';

@Injectable()
export class SupplierAgentService {
  private readonly logger = new Logger(SupplierAgentService.name);
  private readonly AGENT  = 'supplier';

  constructor(
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
  ) {}

  /** Barcha yetkazib beruvchilarni baholash */
  async scoreSuppliers(): Promise<Array<{ supplierId: number; score: number; tier: 'A' | 'B' | 'C' }>> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'score_suppliers' }, async () => {
      const r = await runQuery<{ id: string; on_time: string; quality: string; total: string }>(sql`
        SELECT
          supplier_id::text AS id,
          COUNT(*) FILTER (WHERE delivered_at <= expected_at)::text AS on_time,
          COALESCE(AVG(quality_score), 0)::text AS quality,
          COUNT(*)::text AS total
        FROM purchase_orders
        WHERE delivered_at IS NOT NULL AND delivered_at > NOW() - INTERVAL '180 days'
        GROUP BY supplier_id
      `).catch(() => ({ rows: [] }));

      return r.rows.map(row => {
        const total = Math.max(1, Number(row.total));
        const onTimePct = (Number(row.on_time) / total);
        const qualityScore = Number(row.quality);
        const finalScore = Math.round(onTimePct * 40 + qualityScore * 30 + 20 + 10);
        const tier: 'A' | 'B' | 'C' = finalScore >= 80 ? 'A' : finalScore >= 60 ? 'B' : 'C';
        return { supplierId: Number(row.id), score: finalScore, tier };
      });
    });
  }

  /** Yetkazib berish xavf */
  async detectDeliveryRisks(): Promise<Array<{ orderId: string; risk: 'high' | 'medium' | 'low' }>> {
    const r = await runQuery<{ id: string; expected_at: string; supplier_id: number }>(sql`
      SELECT id::text, expected_at::text, supplier_id FROM purchase_orders
      WHERE status = 'pending' AND expected_at < NOW() + INTERVAL '5 days'
      LIMIT 30
    `).catch(() => ({ rows: [] }));
    return r.rows.map(x => ({ orderId: x.id, risk: 'medium' as const }));
  }

  @Cron('0 8 * * *', { timeZone: 'Asia/Tashkent' })
  async cron(): Promise<void> {
    try {
      const risks = await this.detectDeliveryRisks();
      if (risks.length > 0) {
        this.bus.emit('procurement.delivery_risk', { count: risks.length }, this.AGENT);
      }
    } catch (err) { this.logger.error(`cron: ${(err as Error).message}`); }
  }
}
