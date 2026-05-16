/**
 * @module telegram-bot.adapter
 * @description Infrastructure adapter for Telegram bot messaging. Implements
 *   the domain `ITelegramSender` port using `@nestjs/axios` HttpService against
 *   `https://api.telegram.org/bot<token>/sendMessage`. When the bot token is
 *   missing `sendMessage()` becomes a no-op (logs + Ok).
 *
 *   Each Telegram HTTP call is wrapped in `withRetry` (P2-23): 3 attempts
 *   with exponential backoff 100ms / 300ms / 1000ms and a 30s timeout per
 *   attempt. On final failure we map to `EXTERNAL_TIMEOUT` or `EXTERNAL_5XX`.
 *
 *   Moved from `domain/services/telegram.service.ts` — HTTP calls and the
 *   urgency-emoji formatting are infrastructure concerns.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Err, Ok, AppErr } from '@common/result';
import { withRetry, classifyRetryError } from '@common/retry/with-retry';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Result } from '@common/types/result.type';
import { ITelegramSender, TelegramUrgency } from '../../domain/ports/i-telegram-sender.port';

@Injectable()
export class TelegramBotAdapter implements ITelegramSender {
  private readonly logger = new Logger(TelegramBotAdapter.name);
  private readonly botToken: string;
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly cfg: ConfigService,
  ) {
    this.botToken = this.cfg.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(chatId: string, message: string): Promise<Result<void>> {
    if (!this.botToken) {
      this.logger.warn('Telegram bot token not configured');
      return Ok(undefined);
    }
    try {
      await withRetry<void>(async () => {
        await firstValueFrom(
          this.httpService.post(`${this.apiUrl}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        );
      });
    } catch (err) {
      const code = classifyRetryError(err);
      const msg  = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send Telegram message (${code}): ${msg}`);
      return Err(AppErr(code, `Telegram xatolik: ${msg}`));
    }
    this.logger.debug('Telegram message sent');
    return Ok(undefined);
  }

  async sendAlert(
    chatId: string,
    title: string,
    body?: string,
    urgency?: TelegramUrgency,
  ): Promise<Result<void>>;
  async sendAlert(
    chatId: string,
    title: string,
    bodyOrUrgency?: string | TelegramUrgency,
    urgencyOrUndefined?: TelegramUrgency,
  ): Promise<Result<void>> {
    let body = '';
    let urgency: TelegramUrgency = 'medium';
    if (
      typeof bodyOrUrgency === 'string' &&
      !['low', 'medium', 'high'].includes(bodyOrUrgency)
    ) {
      body = bodyOrUrgency;
      urgency = (urgencyOrUndefined as TelegramUrgency) || 'medium';
    } else if (
      typeof bodyOrUrgency === 'string' &&
      ['low', 'medium', 'high'].includes(bodyOrUrgency)
    ) {
      urgency = bodyOrUrgency as TelegramUrgency;
    }
    const urgencyEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🔴',
    }[urgency];
    const timestamp = _time.now().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const message = `${urgencyEmoji} <b>${urgency.toUpperCase()}: ${title}</b>${body ? `\n${body}` : ''}\n\n⏰ ${timestamp}`;
    return this.sendMessage(chatId, message);
  }

  async sendOrderStatusUpdate(
    managerId: number,
    orderId: number,
    status: string,
  ): Promise<Result<void>> {
    const message = `Order #${orderId} status changed to: ${status}`;
    this.logger.log('Order status update');
    return Ok(undefined);
  }

  async sendAdvanceReminder(
    managerId: number,
    orderId: number,
    remaining: number,
  ): Promise<Result<void>> {
    const message = `Order #${orderId}: ${remaining} days remaining for advance`;
    this.logger.log('Advance reminder');
    return Ok(undefined);
  }

  async sendCertExpiry(
    employeeId: number,
    certName: string,
    expiresAt: Date,
  ): Promise<Result<void>> {
    const message = `Certificate "${certName}" expires at ${expiresAt.toDateString()}`;
    this.logger.log('Certificate expiry');
    return Ok(undefined);
  }

  async sendStockAlert(
    warehouseManagerId: number,
    materialId: number,
    currentQty: number,
  ): Promise<Result<void>> {
    const message = `Stock alert for material #${materialId}: Current qty=${currentQty}`;
    this.logger.log('Stock alert');
    return Ok(undefined);
  }

  async sendQcResult(
    productionManagerId: number,
    orderId: number,
    passed: boolean,
  ): Promise<Result<void>> {
    const status = passed ? 'PASSED' : 'FAILED';
    const message = `QC result for order #${orderId}: ${status}`;
    this.logger.log('QC result');
    return Ok(undefined);
  }
}
