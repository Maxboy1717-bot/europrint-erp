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

  /** Investitsiya tavsiyasi — real uskuna holati + daromad bashoratiga asoslangan AI tahlil */
  async recommendCapitalInvestment(): Promise<{ recommendations: Array<{ item: string; cost: number; roi: number; priority: 'high' | 'medium' | 'low' }> }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'investment_recommend', aiUsed: true }, async () => {
      const equipmentRows = await runQuery<{ name: string; status: string }>(sql`
        SELECT name, status FROM mro_equipment WHERE deleted_at IS NULL ORDER BY id
      `).catch(() => ({ rows: [] }));
      const equipmentSummary = equipmentRows.rows.length > 0
        ? equipmentRows.rows.map(e => `${e.name} (holat: ${e.status})`).join('; ')
        : 'Uskuna ma\'lumoti mavjud emas';

      const forecast = await this.forecastRevenue(6);

      const r = await this.ai.callClaude({
        taskType: 'director.strategic_recommend',
        systemPrompt: 'Sen Europrint strategik AI maslahatchisi sen. Faqat JSON massiv qaytar, boshqa matn yozma. ' +
          'Format: [{"item": string, "cost": number (so\'mda), "roi": number (foizda), "priority": "high"|"medium"|"low"}]',
        prompt: `Joriy uskunalar holati: ${equipmentSummary}\n` +
          `Kelgusi 6 oy daromad bashorati: realistik ${forecast.realistic} so'm (optimistik ${forecast.optimistic}, pessimistik ${forecast.pessimistic})\n\n` +
          `Shu ma'lumotlar asosida 2-4 ta kapital investitsiya tavsiyasini JSON massiv sifatida ber.`,
        maxTokens: 800,
        temperature: 0.4,
      });

      if (!isOk(r)) return { recommendations: [] };
      return { recommendations: this.parseInvestmentRecommendations(r.data.text) };
    });
  }

  private parseInvestmentRecommendations(text: string): Array<{ item: string; cost: number; roi: number; priority: 'high' | 'medium' | 'low' }> {
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return [];
      const raw: unknown = JSON.parse(match[0]);
      if (!Array.isArray(raw)) return [];
      const toPriority = (p: unknown): 'high' | 'medium' | 'low' => {
        if (p === 'high' || p === 'low') return p;
        return 'medium';
      };
      return raw
        .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
        .map((x): { item: string; cost: number; roi: number; priority: 'high' | 'medium' | 'low' } => ({
          item: typeof x.item === 'string' ? x.item : '',
          cost: typeof x.cost === 'number' ? x.cost : 0,
          roi: typeof x.roi === 'number' ? x.roi : 0,
          priority: toPriority(x.priority),
        }))
        .filter(x => x.item.length > 0);
    } catch {
      return [];
    }
  }

  @Cron('0 9 1 * *', { timeZone: 'Asia/Tashkent' })   // Oyning 1-kuni 09:00
  async monthlyCron(): Promise<void> {
    try { await this.forecastRevenue(); } catch (err) { this.logger.error(`monthlyCron: ${(err as Error).message}`); }
  }
}
