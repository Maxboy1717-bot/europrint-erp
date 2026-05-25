/**
 * AGENT 7: HR Performance + Churn Prediction + Bonus Calculation
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: `NOW() - INTERVAL '30 days'` / `INTERVAL '3 hours'` date arithmetic
 *   combined with COUNT(*)::text casts, plus target tables (hr_late_arrivals,
 *   hr_daily_reports) are not present in the Drizzle schema barrel.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { AgentAlertService } from './shared/agent-alert.service';
import { AgentAuditService } from './shared/agent-audit.service';
import { AgentEventBusService } from './shared/agent-event-bus.service';
import { AiRouterCallService } from '../ai/application/services/ai-router-call.service';
import { isOk } from '@common/result';

@Injectable()
export class HrPerformanceAgentService {
  private readonly logger = new Logger(HrPerformanceAgentService.name);
  private readonly AGENT  = 'hr-performance';

  constructor(
    private readonly alert: AgentAlertService,
    private readonly audit: AgentAuditService,
    private readonly bus:   AgentEventBusService,
    private readonly ai:    AiRouterCallService,
  ) {}

  /** Xodim samaradorligini 0-100 baholash */
  async analyzePerformance(employeeId: number): Promise<{ score: number; reasons: string[] }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'analyze_performance', targetType: 'employee', targetId: String(employeeId) }, async () => {
      // Kechikishlar
      const late = await runQuery<{ c: string }>(sql`
        SELECT COUNT(*)::text AS c FROM hr_late_arrivals
        WHERE user_id = ${employeeId} AND arrival_at > NOW() - INTERVAL '30 days'
      `).catch(() => ({ rows: [{ c: '0' }] }));
      // Daily reports
      const reports = await runQuery<{ c: string }>(sql`
        SELECT COUNT(*)::text AS c FROM hr_daily_reports
        WHERE user_id = ${employeeId} AND report_date > NOW() - INTERVAL '30 days' AND NOT marked_absent
      `).catch(() => ({ rows: [{ c: '0' }] }));

      const lateCount = Number(late.rows[0]?.c ?? 0);
      const reportCount = Number(reports.rows[0]?.c ?? 0);
      // Formula: base 100, deduct 5 pts per late arrival, add 1 pt per daily report (max +20).
      // Max possible before cap: 120 (0 lates, 20+ reports) — capped at 100.
      // The +20 report bonus is intentionally capped so it can offset deductions but not exceed 100.
      const score = Math.max(0, Math.min(100, 100 - lateCount * 5 + Math.min(20, reportCount)));
      const reasons = [
        `So'nggi 30 kun: ${lateCount} ta kechikish`,
        `Kunlik hisobotlar: ${reportCount}/30`,
      ];
      if (score < 50) {
        this.bus.emit('hr.low_performance', { employeeId, score }, this.AGENT);
      }
      return { score, reasons };
    });
  }

  /** Churn xavfini bashoratlash */
  async predictChurn(employeeId: number): Promise<{ risk: 'low' | 'medium' | 'high'; reasonsUz: string[] }> {
    return this.audit.wrap({ agentName: this.AGENT, action: 'predict_churn', targetType: 'employee', targetId: String(employeeId), aiUsed: true }, async () => {
      const perf = await this.analyzePerformance(employeeId);
      const risk: 'low' | 'medium' | 'high' = perf.score < 40 ? 'high' : perf.score < 60 ? 'medium' : 'low';
      let reasonsUz = perf.reasons;
      try {
        const r = await this.ai.callClaude({
          taskType: 'hr.team_fit_score',
          systemPrompt: 'O\'zbek tilida HR uchun churn xavfi sabablarini 2-3 jumlada tushuntir.',
          prompt: `Xodim ID: ${employeeId}, Performance: ${perf.score}/100, Sabablar: ${perf.reasons.join(', ')}\n\nChurn xavfi ${risk}. Sabablarini ko'rsat:`,
          maxTokens: 200,
        });
        if (isOk(r)) reasonsUz = [r.data.text.trim()];
      } catch { /* placeholder */ }
      return { risk, reasonsUz };
    });
  }

  /** Bonus hisoblash (oy oxiri) */
  async calculateBonus(employeeId: number, baseSalary: number): Promise<{ bonus: number; details: Record<string, number> }> {
    const perf = await this.analyzePerformance(employeeId);
    const bonusPct = perf.score >= 80 ? 0.20 : perf.score >= 60 ? 0.10 : 0;
    return {
      bonus:   Math.round(baseSalary * bonusPct),
      details: { performanceScore: perf.score, bonusPct: bonusPct * 100, baseSalary },
    };
  }

  /** Har kuni 17:00 da samaradorlik tekshiruvi */
  @Cron('0 17 * * *', { timeZone: 'Asia/Tashkent' })
  async cron(): Promise<void> {
    try {
      // 3 soat ichida hisobot yubormagan xodimlar uchun marked_absent
      await runQuery(sql`
        UPDATE hr_daily_reports SET is_late = true
        WHERE report_date = CURRENT_DATE
          AND submitted_at IS NULL
          AND created_at < NOW() - INTERVAL '3 hours'
      `).catch(() => undefined);
    } catch (err) { this.logger.error(`cron: ${(err as Error).message}`); }
  }
}
