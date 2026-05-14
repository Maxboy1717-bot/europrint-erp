/**
 * AGENT 2: CRM Lead Scoring + Customer 360
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';
import { AiRouterCallService } from '../ai/application/services/ai-router-call.service';
import { CHURN_HIGH_DAYS, CHURN_MED_DAYS } from '@common/constants/business.constants';
import { isOk } from '@common/result';

export interface LeadScore {
  leadId:    number;
  score:     number;     // 0-100
  category:  'hot' | 'warm' | 'cold';
  reasons:   string[];
}

@Injectable()
export class LeadScoringAgentService {
  private readonly logger = new Logger(LeadScoringAgentService.name);
  private readonly AGENT  = 'lead-scoring';

  constructor(
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
    private readonly ai:    AiRouterCallService,
  ) {}

  /** Barcha NEW leadlarni baholash */
  async scoreLeads(): Promise<LeadScore[]> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'score_leads' }, async () => {
      const r = await runQuery<{ id: number; source: string | null; created_at: string }>(sql`
        SELECT id, source, created_at FROM crm_leads
        WHERE deleted_at IS NULL AND status = 'NEW'
        ORDER BY created_at DESC LIMIT 200
      `);

      const scores: LeadScore[] = [];
      for (const lead of r.rows) {
        const sourceScore = lead.source === 'REFERRAL' ? 30 : lead.source === 'DIRECT' ? 25 : lead.source === 'WEB' ? 20 : 10;
        const ageDays = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (24 * 3600_000));
        const recencyScore = Math.max(0, 15 - ageDays);
        const score = Math.min(100, sourceScore + recencyScore + 30);   // +30 base
        const category: LeadScore['category'] = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
        scores.push({ leadId: lead.id, score, category, reasons: [`Source: ${lead.source ?? 'unknown'}`, `Age: ${ageDays} kun`] });
      }
      return scores;
    });
  }

  /** Tijorat taklifi yaratish */
  async generateProposal(leadId: number): Promise<{ html: string }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'generate_proposal', targetType: 'lead', targetId: String(leadId), aiUsed: true }, async () => {
      const r = await runQuery<{ name: string | null; company_id: number | null }>(sql`
        SELECT name, company_id FROM crm_leads WHERE id = ${leadId} LIMIT 1
      `);
      const lead = r.rows[0];
      if (!lead) throw new Error('Lead topilmadi');

      const ai = await this.ai.callClaude({
        taskType: 'crm.email_template',
        systemPrompt: 'Sen Europrint kompaniyasi savdo bo\'limi yordamchisisan. O\'zbek tilida professional tijorat taklifi HTML yoz.',
        prompt: `Mijoz: ${lead.name ?? 'Hurmatli mijoz'}\n\nEuroprint karton va qadoqlash mahsulotlari uchun tijorat taklifi yarating.`,
        maxTokens: 1500,
      });
      const html = isOk(ai) ? ai.data.text : '<p>Taklif tayyorlanmadi</p>';
      return { html };
    });
  }

  /** Customer 360 view */
  async getCustomer360(customerId: number) {
    const [customer, deals, payments] = await Promise.all([
      runQuery<Record<string, unknown>>(sql`SELECT * FROM crm_companies WHERE id = ${customerId} LIMIT 1`).catch(() => ({ rows: [] })),
      runQuery<Record<string, unknown>>(sql`SELECT * FROM crm_deals WHERE company_id = ${customerId} ORDER BY created_at DESC LIMIT 12`).catch(() => ({ rows: [] })),
      runQuery<Record<string, unknown>>(sql`SELECT * FROM customer_payments WHERE customer_id = ${customerId} ORDER BY paid_at DESC LIMIT 20`).catch(() => ({ rows: [] })),
    ]);
    return { customer: customer.rows[0] ?? null, deals: deals.rows, payments: payments.rows };
  }

  /** Churn xavfini bashoratlash (oxirgi 90 kun harakatsiz) */
  async predictChurn(customerId: number): Promise<{ risk: 'low' | 'medium' | 'high'; reasonsUz: string[] }> {
    const r = await runQuery<{ last_deal: string | null }>(sql`
      SELECT MAX(created_at)::text AS last_deal FROM crm_deals WHERE company_id = ${customerId}
    `).catch(() => ({ rows: [{ last_deal: null }] }));
    const lastDeal = r.rows[0]?.last_deal ? new Date(r.rows[0].last_deal) : null;
    const daysSince = lastDeal ? Math.floor((Date.now() - lastDeal.getTime()) / (24 * 3600_000)) : 999;
    const risk = daysSince > CHURN_HIGH_DAYS ? 'high' : daysSince > CHURN_MED_DAYS ? 'medium' : 'low';
    return { risk, reasonsUz: [`Oxirgi bitim ${daysSince} kun oldin`] };
  }

  /** Har kuni 09:00 da avto-bahosh */
  @Cron('0 9 * * *', { timeZone: 'Asia/Tashkent' })
  async dailyScoreCron(): Promise<void> {
    try {
      const scores = await this.scoreLeads();
      const hot = scores.filter(s => s.category === 'hot');
      if (hot.length > 0) {
        this.bus.emit('crm.hot_leads_found', { count: hot.length, leadIds: hot.map(h => h.leadId) }, this.AGENT);
      }
    } catch (err) {
      this.logger.error(`dailyScoreCron: ${(err as Error).message}`);
    }
  }
}
