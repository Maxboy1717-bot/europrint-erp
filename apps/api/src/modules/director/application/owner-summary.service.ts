/**
 * @module owner-summary.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *
 * T21-B1 #27/#28 — owner daily digest:
 *   - compute the company holat + 5 owner numbers (real SD/CRM, via OwnerSummaryRepository),
 *   - render a Telegram-ready digest text,
 *   - send it config-gated (TELEGRAM_BOT_TOKEN + OWNER_TELEGRAM_CHAT_ID). When config is
 *     absent the digest is still computed/returned (graceful: sent=false), never throws.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeCall, Result, AppError } from '@common/result';
import { TashkentTimeService } from '@common/time';
import { TelegramService } from '../../../telegram/telegram.service';
import { OwnerSummaryRepository, type OwnerSummaryNumbers } from '../infrastructure/repositories/owner-summary.repository';

const _time = new TashkentTimeService();

/** Level → emoji (label source is company_state_levels; emoji is a presentation hint). */
const LEVEL_EMOJI: Record<string, string> = {
  OSISH: '🚀', NORMAL: '✅', EHTIYOT: '⚠️', XAVF: '🔶', INQIROZ: '🚨',
};

export interface OwnerSummary {
  generatedAt: string;
  holat: { level: string; score: number; label: string; emoji: string };
  numbers: OwnerSummaryNumbers;
  digestText: string;
  telegram: { sent: boolean; reason: string };
}

@Injectable()
export class OwnerSummaryService {
  private readonly logger = new Logger(OwnerSummaryService.name);

  constructor(
    private readonly repo: OwnerSummaryRepository,
    private readonly telegram: TelegramService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Build the owner summary (holat + 5 numbers + digest text) and, when configured,
   * push it to Telegram. `send` controls whether a Telegram push is attempted.
   */
  async buildSummary(send = false): Promise<Result<OwnerSummary, AppError>> {
    return safeCall(async () => {
      const [numbersR, holatR] = await Promise.all([
        this.repo.computeNumbers(),
        this.repo.getLatestHolat(),
      ]);

      const numbers: OwnerSummaryNumbers = numbersR.ok
        ? numbersR.data
        : {
            newCustomers: 0,
            lostCustomers: 0,
            smallCustomers: 0,
            salesTrend: { currentWindow: 0, previousWindow: 0, deltaPct: null, windowDays: 30 },
            topRisk: null,
          };

      const hs = holatR.ok ? holatR.data : { level: 'NORMAL', score: 0, detectedAt: null };
      const holat = {
        level: hs.level,
        score: hs.score,
        label: hs.level,
        emoji: LEVEL_EMOJI[hs.level] ?? '',
      };

      const digestText = this.renderDigest(holat, numbers);

      let telegram = { sent: false, reason: 'not_requested' };
      if (send) {
        telegram = await this.trySend(digestText);
      }

      return {
        generatedAt: _time.now().toISOString(),
        holat,
        numbers,
        digestText,
        telegram,
      };
    }, 'DB_ERROR');
  }

  /** Render a compact UZ Telegram digest (HTML parse mode). */
  private renderDigest(
    holat: { level: string; score: number; label: string; emoji: string },
    n: OwnerSummaryNumbers,
  ): string {
    const fmt = (v: number) => Number(v).toLocaleString('uz-UZ');
    const trend =
      n.salesTrend.deltaPct == null
        ? 'taqqoslash uchun maʼlumot yetarli emas'
        : `${n.salesTrend.deltaPct >= 0 ? '📈 +' : '📉 '}${n.salesTrend.deltaPct}% ` +
          `(${fmt(n.salesTrend.currentWindow)} ╳ ${fmt(n.salesTrend.previousWindow)} so'm)`;
    const risk = n.topRisk
      ? `${n.topRisk.customerName ?? '#' + n.topRisk.customerId} — churn ${n.topRisk.churnRiskPct ?? 0}%` +
        (n.topRisk.openDebt ? `, qarz ${fmt(n.topRisk.openDebt)} so'm` : '')
      : 'aniqlanmadi';

    return (
      `${holat.emoji} <b>Egasi kunlik hisoboti</b>\n` +
      `Holat: <b>${holat.label}</b> (${holat.score} ball)\n\n` +
      `🆕 Yangi mijoz: <b>${n.newCustomers}</b>\n` +
      `🚪 Yo'qolgan mijoz: <b>${n.lostCustomers}</b>\n` +
      `🐣 Kichik mijoz: <b>${n.smallCustomers}</b>\n` +
      `💰 Savdo-trend: ${trend}\n` +
      `⚠️ Top xavf: ${risk}`
    );
  }

  /** Config-gated graceful Telegram send. Missing config → sent=false, no throw. */
  private async trySend(text: string): Promise<{ sent: boolean; reason: string }> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('OWNER_TELEGRAM_CHAT_ID');
    if (!token || !chatId) {
      this.logger.warn('[OwnerSummary] Telegram config yo\'q (TELEGRAM_BOT_TOKEN / OWNER_TELEGRAM_CHAT_ID) — digest yuborilmadi');
      return { sent: false, reason: 'telegram_not_configured' };
    }
    const r = await this.telegram.sendMessage(chatId, text);
    if (!r.ok) {
      this.logger.warn(`[OwnerSummary] Telegram yuborish xato: ${r.error.message}`);
      return { sent: false, reason: 'telegram_send_failed' };
    }
    return { sent: true, reason: 'ok' };
  }
}
