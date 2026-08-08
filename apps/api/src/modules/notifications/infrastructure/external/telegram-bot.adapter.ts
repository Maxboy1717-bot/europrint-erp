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
import { randomBytes } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Result } from '@common/types/result.type';
import { ITelegramSender, TelegramUrgency } from '../../domain/ports/i-telegram-sender.port';
import { getNotificationIcon } from '../../notification-icon.util';

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

  async sendDocument(
    chatId: string,
    document: Buffer | Uint8Array,
    filename: string,
    caption?: string,
  ): Promise<Result<void>> {
    if (!this.botToken) {
      this.logger.warn('Telegram bot token not configured');
      return Ok(undefined);
    }
    const safeName =
      filename && filename.trim().length > 0 ? filename : 'document.pdf';
    const { body, contentType } = this.buildDocumentMultipart(
      chatId,
      Buffer.from(document),
      safeName,
      caption,
    );
    try {
      await withRetry<void>(async () => {
        await firstValueFrom(
          this.httpService.post(`${this.apiUrl}/sendDocument`, body, {
            headers: { 'Content-Type': contentType },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          }),
        );
      });
    } catch (err) {
      const code = classifyRetryError(err);
      const msg  = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send Telegram document (${code}): ${msg}`);
      // Graceful degradation (P2 #70 / EP-NTF-020): if the attachment can't be
      // delivered, still send the digest text so the recipient gets the report.
      const fallbackText =
        caption && caption.length > 0
          ? caption
          : `📎 Hujjat biriktirib bo'lmadi (${safeName})`;
      return this.sendMessage(chatId, fallbackText);
    }
    this.logger.debug('Telegram document sent');
    return Ok(undefined);
  }

  /**
   * Build a multipart/form-data body for Telegram's /sendDocument. Dependency-free
   * (manual boundary + Buffer.concat) so no new npm package is pulled in; the file
   * part is streamed as raw bytes with an application/pdf content-type.
   */
  private buildDocumentMultipart(
    chatId: string,
    document: Buffer,
    filename: string,
    caption?: string,
  ): { body: Buffer; contentType: string } {
    const boundary = `----EuroPrintFormBoundary${randomBytes(16).toString('hex')}`;
    const CRLF = '\r\n';
    const parts: Buffer[] = [];
    const pushField = (name: string, value: string): void => {
      parts.push(
        Buffer.from(
          `--${boundary}${CRLF}` +
            `Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}` +
            `${value}${CRLF}`,
        ),
      );
    };
    pushField('chat_id', chatId);
    if (caption && caption.length > 0) {
      // Telegram caption hard limit is 1024 chars.
      pushField('caption', caption.slice(0, 1024));
      pushField('parse_mode', 'HTML');
    }
    parts.push(
      Buffer.from(
        `--${boundary}${CRLF}` +
          `Content-Disposition: form-data; name="document"; filename="${filename}"${CRLF}` +
          `Content-Type: application/pdf${CRLF}${CRLF}`,
      ),
    );
    parts.push(document);
    parts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`));
    return {
      body: Buffer.concat(parts),
      contentType: `multipart/form-data; boundary=${boundary}`,
    };
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
    const urgencyEmoji = getNotificationIcon({ priority: urgency });
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
}
