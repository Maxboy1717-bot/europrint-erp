/**
 * AI Automation Daily Service — soatlik va kunlik cron joblar
 *  - Har soat:       Finance anomaliyalarni tekshirish
 *  - Har kuni 08:00: Ijroiya xulosasini yaratish (LLM) + Telegram'ga yuborish
 *
 * 07-07 to'lqin: kunlik ijroiya xulosasi (`DirectorAiService.generateExecutiveSummary`)
 * avval faqat server log'ga yozilar edi — egasi hech qachon ko'rmasdi. Endi
 * `OwnerSummaryDailyCron` (director module) bilan bir xil naqsh: config-gated
 * (TELEGRAM_BOT_TOKEN + OWNER_TELEGRAM_CHAT_ID) Telegram push, graceful (config
 * yo'q bo'lsa ham cron muvaffaqiyatli tugaydi, faqat `sent=false` bilan).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { safeCall, Ok, Result, AppError } from '@common/result';
import { FinanceAiService } from './finance-ai.service';
import { DirectorAiService } from './director-ai.service';
import { AiAutomationRepository } from './ai-automation.repository';
import { TelegramService } from '../../../telegram/telegram.service';
import type { ExecutiveSummary } from './director-ai.types';

const SYSTEM_USER_ID = 1;

@Injectable()
export class AiAutomationDailyService {
  private readonly logger = new Logger(AiAutomationDailyService.name);
  private isRunning: Record<string, boolean> = {};

  constructor(
    private readonly financeAi: FinanceAiService,
    private readonly directorAi: DirectorAiService,
    private readonly automationRepo: AiAutomationRepository,
    private readonly telegram: TelegramService,
    private readonly config: ConfigService,
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
      const summary = summaryR.data as ExecutiveSummary;
      this.logger.log(`[AI-AUTO] Ijroiya xulosasi tayyor: "${summary.headline}" | Health: ${summary.overallHealth}`);

      await this.automationRepo.logAutomationUsage({ module: 'gemini', action: 'director.kpi_explain', model: 'gemini-1.5-flash' });

      const digestText = this.renderDigest(summary);
      const telegram = await this.trySend(digestText);
      if (telegram.sent) {
        this.logger.log('[AI-AUTO] Kunlik ijroiya xulosasi Telegramga yuborildi');
      } else {
        this.logger.warn(`[AI-AUTO] Telegramga yuborilmadi: ${telegram.reason}`);
      }
    });
    if (!r.ok) this.logger.warn(`[AI-AUTO] Ijroiya xulosasi xatosi: ${r.error.message}`);
    return r;
  }

  /** Render a compact UZ Telegram digest (HTML parse mode) from the AI executive summary. */
  private renderDigest(summary: ExecutiveSummary): string {
    const metrics = Array.isArray(summary.keyMetrics) ? summary.keyMetrics : [];
    const metricsText = metrics.length > 0
      ? metrics.map(m => `• ${m.name}: <b>${m.value}</b>`).join('\n')
      : 'Metrikalar mavjud emas';

    return (
      `🤖 <b>Kunlik ijroiya xulosasi (AI)</b>\n` +
      `${summary.headline}\n\n` +
      `${metricsText}\n\n` +
      `Holat: <b>${summary.overallHealth}</b>`
    );
  }

  /** Config-gated graceful Telegram send. Missing config → sent=false, no throw.
   *  Mirrors OwnerSummaryService.trySend() (director module). */
  private async trySend(text: string): Promise<{ sent: boolean; reason: string }> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('OWNER_TELEGRAM_CHAT_ID');
    if (!token || !chatId) {
      this.logger.warn('[AI-AUTO] Telegram config yo\'q (TELEGRAM_BOT_TOKEN / OWNER_TELEGRAM_CHAT_ID) — kunlik AI xulosa yuborilmadi');
      return { sent: false, reason: 'telegram_not_configured' };
    }
    const r = await this.telegram.sendMessage(chatId, text);
    if (!r.ok) {
      this.logger.warn(`[AI-AUTO] Telegram yuborish xato: ${r.error.message}`);
      return { sent: false, reason: 'telegram_send_failed' };
    }
    return { sent: true, reason: 'ok' };
  }
}
