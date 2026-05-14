/**
 * AGENT 1: Direktor — CEO Dashboard
 * Direktor har kuni ERP ga kirganda barcha 20 ta moduldan konsolide holat ko'radi.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';
import { AiRouterCallService } from '../ai/application/services/ai-router-call.service';
import { isOk } from '@common/result';

interface KpiSnapshot {
  overdueDeals:         number;
  overdueDealsAmount:   number;
  criticalStockCount:   number;
  productionPlanPct:    number;
  overdueDebt:          number;
  absentToday:          number;
  ccInboxOverdue:       number;
  ordersDelayed:        number;
  ordersDelayedAmount:  number;
}

export interface DailyBriefing {
  date:    string;
  kpi:     KpiSnapshot;
  alerts:  Array<{ severity: string; title: string; message: string }>;
  summary: string;            // Claude AI bilan o'zbek tilidagi xulosa
}

@Injectable()
export class DirectorAgentService {
  private readonly logger = new Logger(DirectorAgentService.name);
  private readonly AGENT  = 'director';

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
    private readonly ai:    AiRouterCallService,
    private readonly configService: ConfigService,
  ) {}

  /** KPI snapshot — barcha modullardan asosiy ko'rsatkichlar */
  private async snapshotKpi(): Promise<KpiSnapshot> {
    const [dealsR, ccR, stockR, debtR, absR, ppR] = await Promise.all([
      runQuery<{ c: string; amt: string }>(sql`
        SELECT COUNT(*)::text AS c, COALESCE(SUM(opportunity::numeric), 0)::text AS amt
        FROM crm_deals WHERE deleted_at IS NULL AND close_date < NOW() AND status NOT IN ('won','lost')
      `).catch(() => ({ rows: [{ c: '0', amt: '0' }] })),

      runQuery<{ c: string }>(sql`
        SELECT COUNT(*)::text AS c FROM cc_documents WHERE basket_state='inbox' AND is_inbox_overdue=true
      `).catch(() => ({ rows: [{ c: '0' }] })),

      // criticalStockCount — warehouse_rolls dan
      runQuery<{ c: string }>(sql`
        SELECT COUNT(*)::text AS c FROM warehouse_rolls
        WHERE remaining_weight_kg < 50 AND (status IS NULL OR status != 'used')
      `).catch(() => ({ rows: [{ c: '0' }] })),

      // overdueDebt — sales_orders dan (30 kundan oshgan)
      // balance_due computed as total_amount for non-completed orders (no paid_amount column on this table)
      runQuery<{ amt: string }>(sql`
        SELECT COALESCE(SUM(total_amount::numeric), 0)::text AS amt
        FROM sales_orders
        WHERE deleted_at IS NULL
          AND status NOT IN ('completed', 'cancelled')
          AND COALESCE(total_amount::numeric, 0) > 0
          AND updated_at < NOW() - INTERVAL '30 days'
      `).catch(() => ({ rows: [{ amt: '0' }] })),

      // absentToday — hr_ai_attendance dan
      runQuery<{ c: string }>(sql`
        SELECT COUNT(*)::text AS c FROM hr_ai_attendance
        WHERE DATE(created_at) = CURRENT_DATE AND type = 'absent'
      `).catch(() => ({ rows: [{ c: '0' }] })),

      // productionPlanPct — bugungi production_sessions: completed / total (%)
      runQuery<{ done: string; total: string }>(sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'completed')::text AS done,
          NULLIF(COUNT(*), 0)::text                          AS total
        FROM production_sessions
        WHERE DATE(started_at) = CURRENT_DATE
      `).catch(() => ({ rows: [{ done: '0', total: null }] })),
    ]);

    return {
      overdueDeals:         Number(dealsR.rows[0]?.c ?? 0),
      overdueDealsAmount:   Number(dealsR.rows[0]?.amt ?? 0),
      criticalStockCount:   Number(stockR.rows[0]?.c ?? 0),
      productionPlanPct:    ppR.rows[0]?.total
        ? Math.round((Number(ppR.rows[0].done) / Number(ppR.rows[0].total)) * 100)
        : 0,
      overdueDebt:          Number(debtR.rows[0]?.amt ?? 0),
      absentToday:          Number(absR.rows[0]?.c ?? 0),
      ccInboxOverdue:       Number(ccR.rows[0]?.c ?? 0),
      ordersDelayed:        Number(dealsR.rows[0]?.c ?? 0),
      ordersDelayedAmount:  Number(dealsR.rows[0]?.amt ?? 0),
    };
  }

  /** Kunlik brifing — KPI + AI xulosa + alertlar */
  async getDailyBriefing(): Promise<DailyBriefing> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'daily_briefing' }, async () => {
      const kpi = await this.snapshotKpi();

      const alerts: DailyBriefing['alerts'] = [];
      if (kpi.overdueDeals > 0)         alerts.push({ severity: 'warning',  title: 'Muddati o\'tgan CRM bitimlar', message: `${kpi.overdueDeals} ta bitim muddati o'tdi (jami ${kpi.overdueDealsAmount.toLocaleString()} so'm)` });
      if (kpi.ccInboxOverdue > 0)       alerts.push({ severity: 'urgent',   title: '24h SLA buzilgan',        message: `${kpi.ccInboxOverdue} ta hujjat 24 soatdan oshib ketgan` });
      if (kpi.criticalStockCount > 5)   alerts.push({ severity: 'critical', title: 'Kritik qoldiq materiallar', message: `${kpi.criticalStockCount} ta material tugayapti` });

      // AI xulosa (ANTHROPIC_API_KEY bo'lsa)
      let summary = `Bugun ${kpi.overdueDeals} ta muddati o'tgan bitim, ${kpi.ccInboxOverdue} ta o'qilmagan hujjat.`;
      try {
        const r = await this.ai.callClaude({
          taskType: 'director.kpi_explain',
          systemPrompt: "Sen Europrint korxonasi direktorining yordamchisisan. KPI ma'lumotlari asosida 3-5 jumla qisqa o'zbek tilidagi xulosa yoz.",
          prompt: `Bugungi KPI:\n${JSON.stringify(kpi, null, 2)}\n\nAlertlar: ${alerts.length}\n\nDirector uchun xulosa:`,
          maxTokens: 400,
          temperature: 0.4,
        });
        if (isOk(r)) summary = r.data.text.trim();
      } catch { /* AI bo'lmasa standart xulosa */ }

      return {
        date: new Date().toISOString().slice(0, 10),
        kpi,
        alerts,
        summary,
      };
    });
  }

  /** Direktor savol beradi, AI strategik javob beradi (ERP ma'lumotlari kontekst bilan) */
  async askAdvisor(question: string, userId?: number): Promise<{ answer: string; sources: string[] }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'ask_advisor', userId, inputSummary: { question }, aiUsed: true }, async () => {
      const kpi = await this.snapshotKpi();
      const r = await this.ai.callClaude({
        taskType: 'director.strategic_recommend',
        systemPrompt: 'Sen Europrint kompaniyasining strategik AI maslahatchisisan. ERP KPI ma\'lumotlarini hisobga olib o\'zbek tilida professional javob ber.',
        prompt: `Joriy KPI:\n${JSON.stringify(kpi, null, 2)}\n\nDirektor savoli: ${question}\n\nJavob:`,
        maxTokens: 800,
        temperature: 0.6,
      });
      const answer = isOk(r) ? r.data.text.trim() : 'AI javob bera olmadi (sozlama xatosi).';
      return { answer, sources: ['CRM Deals', 'CC Inbox', 'Production'] };
    });
  }

  /** 20 ta modul uchun health 0-100 baholash */
  async getModuleHealth(): Promise<Array<{ code: string; name: string; health: number; errors24h: number }>> {
    const r = await runQuery<{
      code: string; name_uz: string; health_score: number; errors_24h: number;
    }>(sql`
      SELECT m.code, m.name_uz, COALESCE(h.health_score, 100) AS health_score, COALESCE(h.errors_24h, 0) AS errors_24h
      FROM agent_modules_registry m
      LEFT JOIN agent_module_health h ON h.module_name = m.code
      ORDER BY m.sort_order
    `);
    return r.rows.map(row => ({
      code:      row.code,
      name:      row.name_uz,
      health:    row.health_score,
      errors24h: row.errors_24h,
    }));
  }

  /** Ertalabki Telegram brifing — har kuni 07:30 (Tashkent) */
  @Cron('30 7 * * *', { timeZone: 'Asia/Tashkent' })
  async morningBriefing(): Promise<void> {
    try {
      const briefing = await this.getDailyBriefing();
      const directorIdEnv = this.configService.get<string>('DIRECTOR_USER_ID');
      const userId = directorIdEnv ? Number(directorIdEnv) : null;
      if (!userId) {
        this.logger.warn('DIRECTOR_USER_ID env yo\'q, brifing yuborilmadi');
        return;
      }

      const text = `📊 *Ertalabki brifing — ${briefing.date}*\n\n` +
        `${briefing.summary}\n\n` +
        `Alertlar: ${briefing.alerts.length}`;

      await this.alert.send({
        agentName:  this.AGENT,
        severity:   briefing.alerts.some(a => a.severity === 'urgent') ? 'urgent' : 'info',
        title:      `Ertalabki brifing — ${briefing.date}`,
        message:    text,
        targetUserId: userId,
        targetRole: 'ceo',
        actions: [{ label: 'Batafsil', action: 'open_dashboard' }, { label: 'AI ga savol', action: 'open_advisor' }],
      });
      this.bus.emit('director.briefing_sent', { briefing }, this.AGENT);
    } catch (err) {
      this.logger.error(`morningBriefing: ${(err as Error).message}`);
    }
  }
}
