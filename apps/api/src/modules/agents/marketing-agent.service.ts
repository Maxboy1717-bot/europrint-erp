/**
 * AGENT 10: Marketing — content + ROI + segmentatsiya
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAuditService } from './shared/agent-audit.service';
import { AiRouterCallService } from '../ai/application/services/ai-router-call.service';
import { isOk } from '@common/result';

@Injectable()
export class MarketingAgentService {
  private readonly logger = new Logger(MarketingAgentService.name);
  private readonly AGENT  = 'marketing';

  constructor(
    private readonly audit: AgentAuditService,
    private readonly ai:    AiRouterCallService,
  ) {}

  async analyzeMarketingROI(campaignId: string) {
    return this.audit.wrap({ agentName: this.AGENT, action: 'roi', targetType: 'campaign', targetId: campaignId }, async () => {
      const r = await runQuery<{ spent: string; revenue: string; leads: string }>(sql`
        SELECT spent_amount::text AS spent, revenue_attributed::text AS revenue, leads_count::text AS leads
        FROM marketing_campaigns WHERE id = ${campaignId}
      `).catch(() => ({ rows: [{ spent: '0', revenue: '0', leads: '0' }] }));
      const x = r.rows[0] ?? { spent: '0', revenue: '0', leads: '0' };
      const spent = Number(x.spent), revenue = Number(x.revenue);
      return { spent, revenue, roi: spent > 0 ? Math.round((revenue / spent) * 100) : 0, leads: Number(x.leads) };
    });
  }

  /** Marketing matni generatsiya */
  async generateContent(brief: string, lang: 'uz' | 'ru' = 'uz'): Promise<{ text: string }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'generate_content', aiUsed: true }, async () => {
      const r = await this.ai.callClaude({
        taskType: 'marketing.content_generate',
        systemPrompt: `Sen Europrint marketing yordamchisisan. ${lang === 'ru' ? 'Rus' : "O'zbek"} tilida professional marketing matn yoz.`,
        prompt: brief,
        maxTokens: 600,
      });
      return { text: isOk(r) ? r.data.text : 'Matn yaratilmadi' };
    });
  }

  /** Mijozlar segmentatsiyasi (RFM-style) */
  async segmentCustomers(): Promise<Array<{ customerId: number; segment: 'VIP' | 'regular' | 'at_risk' }>> {
    const r = await runQuery<{ id: string; deals: string; total: string; last: string | null }>(sql`
      SELECT company_id::text AS id, COUNT(*)::text AS deals, SUM(opportunity::numeric)::text AS total, MAX(created_at)::text AS last
      FROM crm_deals WHERE company_id IS NOT NULL AND deleted_at IS NULL GROUP BY company_id LIMIT 200
    `).catch(() => ({ rows: [] }));
    return r.rows.map(row => {
      const total = Number(row.total);
      const lastDays = row.last ? Math.floor((Date.now() - new Date(row.last).getTime()) / 86400_000) : 999;
      const segment: 'VIP' | 'regular' | 'at_risk' = total > 100_000_000 && lastDays < 30 ? 'VIP' : lastDays > 90 ? 'at_risk' : 'regular';
      return { customerId: Number(row.id), segment };
    });
  }

  @Cron('0 9 * * 1', { timeZone: 'Asia/Tashkent' })   // Dushanba 09:00
  async weeklyCron(): Promise<void> {
    try { await this.segmentCustomers(); } catch (err) { this.logger.error(`weeklyCron: ${(err as Error).message}`); }
  }
}
