/**
 * AGENT 14: Strategik AI rejalashtirish — scenario, forecast, raqobatchi
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAuditService } from './shared/agent-audit.service';
import { AiRouterCallService } from '../ai/application/services/ai-router-call.service';
import { isOk } from '@common/result';
import { FORECAST } from '@common/constants/business.constants';

@Injectable()
export class StrategicAgentService {
  private readonly logger = new Logger(StrategicAgentService.name);
  private readonly AGENT  = 'strategic';

  constructor(
    private readonly audit: AgentAuditService,
    private readonly ai:    AiRouterCallService,
  ) {}

  /** Agar-tahlil (scenario analysis) */
  async scenarioAnalysis(scenario: string): Promise<{ analysis: string; impact: Record<string, number> }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'scenario_analysis', aiUsed: true, inputSummary: { scenario } }, async () => {
      const r = await this.ai.callClaude({
        taskType: 'director.strategic_recommend',
        systemPrompt: 'Sen Europrint strategik AI maslahatchisi sen. O\'zbek tilida agar-tahlil ber.',
        prompt: `Scenario: ${scenario}\n\nKompaniyaga ta'sirini tahlil qil: daromad, ishlab chiqarish, mijozlar, raqobat.`,
        maxTokens: 800,
        temperature: 0.4,
      });
      const analysis = isOk(r) ? r.data.text : 'AI tahlil yaratilmadi';
      return { analysis, impact: { revenue: 0, production: 0, customers: 0 } };
    });
  }

  /** Daromad bashorati (3 scenario) */
  async forecastRevenue(months = 6): Promise<{ optimistic: number; realistic: number; pessimistic: number }> {
    // So'nggi 6 oy yutilgan bitimlar yig'indisi — oylik o'rtachani hisoblash uchun
    const r = await runQuery<{ total: string }>(sql`
      SELECT COALESCE(SUM(opportunity::numeric), 0)::text AS total
      FROM crm_deals
      WHERE status = 'won' AND deleted_at IS NULL
        AND close_date > NOW() - INTERVAL '6 months'
    `).catch(() => ({ rows: [{ total: '0' }] }));
    const avgMonthly = Number(r.rows[0]?.total ?? 0) / 6;
    return {
      optimistic:  Math.round(avgMonthly * months * FORECAST.optimistic),
      realistic:   Math.round(avgMonthly * months),
      pessimistic: Math.round(avgMonthly * months * FORECAST.pessimistic),
    };
  }

  /** Investitsiya tavsiyasi */
  async recommendCapitalInvestment(): Promise<{ recommendations: Array<{ item: string; cost: number; roi: number; priority: 'high' | 'medium' | 'low' }> }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'investment_recommend', aiUsed: true }, async () => {
      // Placeholder
      return { recommendations: [
        { item: 'Yangi flexo mashinasi', cost: 250_000_000, roi: 35, priority: 'high' },
        { item: 'Ombor avtomatlashtirish', cost: 80_000_000, roi: 25, priority: 'medium' },
      ] };
    });
  }

  @Cron('0 9 1 * *', { timeZone: 'Asia/Tashkent' })   // Oyning 1-kuni 09:00
  async monthlyCron(): Promise<void> {
    try { await this.forecastRevenue(); } catch (err) { this.logger.error(`monthlyCron: ${(err as Error).message}`); }
  }
}
