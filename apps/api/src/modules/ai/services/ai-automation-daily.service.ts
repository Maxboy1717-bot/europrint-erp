/**
 * AI Automation Daily Service — soatlik va kunlik cron joblar
 *  - Har soat:       Finance anomaliyalarni tekshirish
 *  - Har kuni 08:00: Ijroiya xulosasini yaratish
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { safeCall, Ok, Result, AppError } from '@common/result';
import { FinanceAiService } from './finance-ai.service';
import { DirectorAiService } from './director-ai.service';
import { AiAutomationRepository } from './ai-automation.repository';

const SYSTEM_USER_ID = 1;

@Injectable()
export class AiAutomationDailyService {
  private readonly logger = new Logger(AiAutomationDailyService.name);
  private isRunning: Record<string, boolean> = {};

  constructor(
    private readonly financeAi: FinanceAiService,
    private readonly directorAi: DirectorAiService,
    private readonly automationRepo: AiAutomationRepository,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)

  async autoDetectFinanceAnomalies(): Promise<Result<void, AppError>> {
    if (this.isRunning['finance_anomaly']) return Ok();
    this.isRunning['finance_anomaly'] = true;
    try {
      const r = await safeCall(async () => {
        const anomalyR = await this.financeAi.detectAnomalies(1, SYSTEM_USER_ID);
        if (!anomalyR.ok) return;
        const result = anomalyR.data as { hasAnomalies: boolean; overallRiskScore: number; anomalies: unknown[] };
        if (result.hasAnomalies && result.overallRiskScore > 50) {
          this.logger.warn(
            `[AI-AUTO] Finance anomaliyalar aniqlandi!\nRisk: ${result.overallRiskScore}/100. ` +
            `Anomaliyalar: ${result.anomalies.length} ta`,
          );
        }
      });
      if (!r.ok) this.logger.warn(`[AI-AUTO] Finance anomaliya tekshiruvi xatosi: ${r.error.message}`);
      return r;
    } finally {
      this.isRunning['finance_anomaly'] = false;
    }
  }

  @Cron('0 8 * * *')
  async generateDailyExecutiveSummary(): Promise<Result<void, AppError>> {
    const r = await safeCall(async () => {
      this.logger.log('[AI-AUTO] Kunlik ijroiya xulosasi yaratilmoqda...');
      const summaryR = await this.directorAi.generateExecutiveSummary(SYSTEM_USER_ID);
      if (!summaryR.ok) return;
      const summary = summaryR.data as { headline: string; overallHealth: string };
      this.logger.log(`[AI-AUTO] Ijroiya xulosasi tayyor: "${summary.headline}" | Health: ${summary.overallHealth}`);

      await this.automationRepo.logAutomationUsage({ module: 'gemini', action: 'director.kpi_explain', model: 'gemini-1.5-flash' });
    });
    if (!r.ok) this.logger.warn(`[AI-AUTO] Ijroiya xulosasi xatosi: ${r.error.message}`);
    return r;
  }
}
