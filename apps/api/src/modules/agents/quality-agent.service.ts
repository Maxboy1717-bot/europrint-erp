/**
 * AGENT 8: Sifat nazorati — AI Vision (defect detection placeholder)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';
import { SECONDS_PER_DAY } from '../../common/constants/business.constants';

@Injectable()
export class QualityAgentService {
  private readonly logger = new Logger(QualityAgentService.name);
  private readonly AGENT  = 'quality';

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
  ) {}

  /** AI Vision — kamera rasmidan defekt aniqlash (placeholder) */
  async analyzeDefect(imageUrl: string, productType: string): Promise<{ hasDefect: boolean; defectType?: string; severity?: string; confidence: number }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'analyze_defect', targetType: 'image', targetId: imageUrl, aiUsed: true }, async () => {
      // Real implementation: image → vision AI (Claude vision yoki external API)
      // Placeholder: simulated response
      return { hasDefect: false, confidence: 0.92 };
    });
  }

  /** Brak trend tahlil */
  async trackBrakTrend(): Promise<{ pct7d: number; pct30d: number; trend: 'rising' | 'stable' | 'falling' }> {
    const r = await runQuery<{ q_7: string; d_7: string; q_30: string; d_30: string }>(sql`
      SELECT
        COALESCE(SUM(qty)         FILTER (WHERE created_at > NOW() - INTERVAL '7 days'),  0)::text AS q_7,
        COALESCE(SUM(defect_qty)  FILTER (WHERE created_at > NOW() - INTERVAL '7 days'),  0)::text AS d_7,
        COALESCE(SUM(qty)         FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0)::text AS q_30,
        COALESCE(SUM(defect_qty)  FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0)::text AS d_30
      FROM production_facts
    `).catch(() => ({ rows: [{ q_7: '0', d_7: '0', q_30: '0', d_30: '0' }] }));
    const x = r.rows[0] ?? { q_7: '0', d_7: '0', q_30: '0', d_30: '0' };
    const pct7  = Number(x.q_7)  > 0 ? Number(x.d_7)  / Number(x.q_7)  * 100 : 0;
    const pct30 = Number(x.q_30) > 0 ? Number(x.d_30) / Number(x.q_30) * 100 : 0;
    const trend: 'rising' | 'stable' | 'falling' = pct7 > pct30 + 0.5 ? 'rising' : pct7 < pct30 - 0.5 ? 'falling' : 'stable';
    if (trend === 'rising') this.bus.emit('quality.defect_rising', { pct7d: pct7, pct30d: pct30 }, this.AGENT);
    return { pct7d: Math.round(pct7 * 10) / 10, pct30d: Math.round(pct30 * 10) / 10, trend };
  }

  /** Karantin omborni boshqarish */
  async manageQuarantine(): Promise<Array<{ batchId: string; daysInQuarantine: number }>> {
    const r = await runQuery<{ id: string; days: string }>(sql`
      SELECT id::text, EXTRACT(EPOCH FROM (NOW() - created_at))/${SECONDS_PER_DAY} AS days
      FROM warehouse_transactions
      WHERE warehouse_to LIKE 'QUARANTINE_%' AND status = 'pending'
        AND created_at < NOW() - INTERVAL '48 hours'
    `).catch(() => ({ rows: [] }));
    return r.rows.map(x => ({ batchId: x.id, daysInQuarantine: Math.floor(Number(x.days)) }));
  }

  @Cron('0 */4 * * *')   // har 4 soatda
  async cron(): Promise<void> {
    try {
      await this.trackBrakTrend();
      const stuck = await this.manageQuarantine();
      if (stuck.length > 0) {
        await this.alert.send({
          agentName: this.AGENT, severity: 'warning', module: 'quality',
          title: '48+ soat karantinda', message: `${stuck.length} ta partiya 48 soatdan oshib karantinda`,
          targetRole: 'qc_head', actionRequired: true,
        });
      }
    } catch (err) { this.logger.error(`cron: ${(err as Error).message}`); }
  }
}
