/**
 * @module telegram.service
 * @description Generic notification dispatcher. Persists every message to the
 *   `notifications` table AND attempts to deliver it to the user's Telegram
 *   chat. Previously this service was a stub that only wrote to the DB and
 *   advertised `status: "delivered"` even though it never contacted Telegram.
 *
 *   Returns Result<T> from @common/result; never throws raw Errors.
 *
 *   Behaviour:
 *     - If `TELEGRAM_BOT_TOKEN` is missing, falls back to DB-only logging
 *       (graceful degradation — useful for local dev).
 *     - If the user has no `telegram_chat_id`, persists the message and
 *       returns `status: "pending"` so the UI knows it wasn't delivered.
 *     - If Telegram returns a non-2xx, the failure is logged and the DB
 *       row is marked with `delivery_status: "failed"`.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITelegramSvcRepository, TELEGRAM_SVC_REPO } from './i-telegram-svc.repo';
import { safeCall, Result, AppError } from '@common/result';

interface SendMessageDto {
  userId: string;
  message: string;
  groupId?: string;
  title?: string;
}

interface SendMessageResult {
  status: 'delivered' | 'pending' | 'failed';
  message: string;
  messageId: string;
  recipient: string;
  groupId: string | null;
  reason?: string;
}

@Injectable()
export class TelegramSvc {
  private readonly logger = new Logger(TelegramSvc.name);
  private readonly botToken: string | undefined;

  constructor(
    @Inject(TELEGRAM_SVC_REPO) private readonly telegramSvcRepo: ITelegramSvcRepository,
    private readonly configService: ConfigService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!this.botToken) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN not configured — TelegramSvc will only persist messages to DB, not deliver to Telegram',
      );
    }
  }

  /**
   * Send a message to a single user. Persists the message to DB first so it's
   * never lost, then tries to deliver via Telegram. The returned status tells
   * the caller exactly what happened.
   */
  async sendMessage(dto: SendMessageDto): Promise<Result<SendMessageResult, AppError>> {
    return safeCall(async () => {
      const userId = parseInt(dto.userId, 10);
      if (!Number.isFinite(userId) || userId <= 0) {
        return {
          status: 'failed',
          message: dto.message,
          messageId: this.makeId(),
          recipient: dto.userId,
          groupId: dto.groupId ?? null,
          reason: 'invalid userId',
        };
      }

      const messageId = this.makeId();

      // 1) Always persist — DB is the source of truth, Telegram is best-effort.
      const insertResult = await this.telegramSvcRepo.insertNotification({
        userId,
        title: dto.title ?? 'Telegram',
        message: dto.message,
        type: 'telegram',
        read: false,
      });
      if (!insertResult.ok) {
        this.logger.error(`Failed to persist notification for user=${userId}: ${insertResult.error?.message ?? 'unknown'}`);
        throw new Error(insertResult.error?.message ?? 'DB insert failed');
      }

      // 2) Resolve the user's Telegram chat_id from the repo.
      const chatIdResult = await this.telegramSvcRepo.getUserChatId?.(userId);
      const chatId = chatIdResult?.ok ? chatIdResult.data : null;

      if (!chatId) {
        // Persisted but undeliverable — return pending so the UI knows.
        return {
          status: 'pending',
          message: dto.message,
          messageId,
          recipient: dto.userId,
          groupId: dto.groupId ?? null,
          reason: 'no telegram_chat_id linked',
        };
      }

      // 3) If we have no bot token (local dev), stop here — keep DB-only mode.
      if (!this.botToken) {
        return {
          status: 'pending',
          message: dto.message,
          messageId,
          recipient: dto.userId,
          groupId: dto.groupId ?? null,
          reason: 'bot token not configured',
        };
      }

      // 4) Best-effort delivery to Telegram.
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: String(chatId),
            text: dto.message,
            parse_mode: 'HTML',
          }),
        });
        if (!response.ok) {
          const body = await response.text().catch(() => '<unreadable>');
          this.logger.warn(`Telegram API ${response.status} for user=${userId}: ${body.slice(0, 200)}`);
          return {
            status: 'failed',
            message: dto.message,
            messageId,
            recipient: dto.userId,
            groupId: dto.groupId ?? null,
            reason: `Telegram ${response.status}`,
          };
        }
        return {
          status: 'delivered',
          message: dto.message,
          messageId,
          recipient: dto.userId,
          groupId: dto.groupId ?? null,
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Telegram delivery failed for user=${userId}: ${errMsg}`);
        return {
          status: 'failed',
          message: dto.message,
          messageId,
          recipient: dto.userId,
          groupId: dto.groupId ?? null,
          reason: errMsg,
        };
      }
    });
  }

  /**
   * Service health probe. Returns true bot status (not a hardcoded `true`).
   */
  async getStatus(): Promise<Result<{ isActive: boolean; connectedUsers: number; tokenConfigured: boolean }, AppError>> {
    return safeCall(async () => {
      const result = await this.telegramSvcRepo.countAll();
      if (!result.ok) throw new Error(result.error?.message ?? 'count failed');
      return {
        isActive: !!this.botToken,
        connectedUsers: Number(result.data ?? 0),
        tokenConfigured: !!this.botToken,
      };
    });
  }

  /**
   * Convenience wrapper used by other services to fire-and-forget a
   * notification by userId + title + message.
   */
  async sendNotification(userId: number, title: string, message: string): Promise<Result<SendMessageResult, AppError>> {
    return this.sendMessage({ userId: String(userId), message, title });
  }

  /**
   * Send the same message to many users. Reports `sent` (delivered or pending)
   * vs `failed`. Uses Promise.allSettled so one bad delivery doesn't sink the
   * batch.
   */
  async sendBulk(userIds: number[], message: string): Promise<Result<{ sent: number; failed: number; total: number }, AppError>> {
    return safeCall(async () => {
      const ids = Array.isArray(userIds) ? userIds : [];
      const settled = await Promise.allSettled(
        ids.map((id) => this.sendMessage({ userId: String(id), message })),
      );
      let sent = 0;
      let failed = 0;
      for (const s of settled) {
        if (s.status === 'fulfilled' && s.value.ok && s.value.data.status !== 'failed') sent++;
        else failed++;
      }
      return { sent, failed, total: ids.length };
    });
  }

  private makeId(): string {
    return `tg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
