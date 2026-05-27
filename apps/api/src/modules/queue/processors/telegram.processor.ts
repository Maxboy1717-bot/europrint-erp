/**
 * telegram.processor.ts — BullMQ 'telegram' navbat workeri.
 * Telegram Bot API orqali asinxron xabar yuborish.
 * TAQIQLANGAN: sinxron Telegram API chaqiruvi (blocking).
 * concurrency: 2
 */
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { QUEUE_NAMES, backoffDelay } from '../queue.constants';
import { TELEGRAM_TIMEOUT_MS } from '@common/constants/app.constants';
import { Result, Ok, Err } from '@common/types/result.type';

export interface TelegramJobData {
  chatId: string | number;
  message: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyToMessageId?: number;
}

const TELEGRAM_API = 'https://api.telegram.org';

@Processor(QUEUE_NAMES.TELEGRAM, { concurrency: 2 })
export class TelegramProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramProcessor.name);

  constructor(private readonly cfg: ConfigService) {
    super();
  }

  async process(job: Job<TelegramJobData>): Promise<void> {
    const delay = backoffDelay(job.attemptsMade);
    this.logger.debug(
      `[telegram] Job #${job.id} — chatId: ${job.data.chatId}, urinish: ${job.attemptsMade}, backoff: ${delay}ms`,
    );

    try {
      const result = await this.sendTelegramMessage(job.data);
      if (!result.ok) {
        this.logger.error(`[telegram] Job #${job.id} xato: ${result.error.message}`);
        throw new Error(result.error.message);
      }
      this.logger.log(`[telegram] Job #${job.id} muvaffaqiyatli yuborildi: chatId=${job.data.chatId}`);
    } catch (err) {
      this.logger.error(`[telegram] Job #${job.id} xato: ${String(err)}`);
      throw err;
    }
  }

  private async sendTelegramMessage(data: TelegramJobData): Promise<Result<void>> {
    const token = this.cfg.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      return Err('[telegram] TELEGRAM_BOT_TOKEN muhit o\'zgaruvchisi sozlanmagan');
    }

    const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
    const payload: Record<string, unknown> = {
      chat_id: data.chatId,
      text: data.message,
      parse_mode: data.parseMode ?? 'HTML',
    };

    if (data.replyToMessageId) {
      payload['reply_to_message_id'] = data.replyToMessageId;
    }

    try {
      await axios.post(url, payload, { timeout: TELEGRAM_TIMEOUT_MS });
      return Ok();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const body = JSON.stringify(err.response.data ?? {});
        return Err(`[telegram] HTTP ${err.response.status} — Telegram API xatosi: ${body}`);
      }
      throw err;
    }
  }
}
