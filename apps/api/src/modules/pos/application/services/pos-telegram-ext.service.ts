/**
 * @module pos-telegram-ext.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeCall, Result, AppError } from '@common/result';
import { PosTelegramExtRepository } from '../../infrastructure/repositories/pos-telegram-ext.repository';

@Injectable()
export class PosTelegramExtService {
  private readonly logger = new Logger(PosTelegramExtService.name);
  private readonly botToken: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramExtRepo: PosTelegramExtRepository,
  ) {
    this.botToken = this.configService.get<string>('POS_TELEGRAM_BOT_TOKEN');
  }

  private async _sendNotif(
    telegramUserId: bigint,
    message: string,
    keyboard?: Array<Array<{ text: string; callback_data: string }>>,
  ){
    if (!this.botToken) return;
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const body = {
        chat_id:      String(telegramUserId),
        text:         message,
        parse_mode:   'HTML',
        reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined,
      };
      const response = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Telegram xato: ${error}`);
      }
    } catch (err) {
      this.logger.error(`Telegram API xato: ${(err as Error).message}`);
    }
  }

  async notifyMovementApprovalRequired(
    movementId: number,
    movementNumber: string,
    assignedTo: number,
  ): Promise<Result<void, AppError>> {
    return safeCall(async () => {
    const telegramIdR = await this.telegramExtRepo.getUserTelegramId(assignedTo);
    const telegramId = telegramIdR.ok ? telegramIdR.data as string | number | null : null;
    if (!telegramId) return;
    await this._sendNotif(
      BigInt(telegramId),
      `⏳ <b>Tasdiqlash kutilmoqda</b>\n\nHarakat: <code>${movementNumber}</code>\nID: ${movementId}`,
      [[
        { text: '✅ Tasdiqlash', callback_data: `approve_${movementId}` },
        { text: '❌ Rad etish',  callback_data: `reject_${movementId}` },
      ]],
    );
  
    });}

  async notifyQcRequired(movementId: number, movementNumber: string){
    return safeCall(async () => {
    const inspectors = await this.telegramExtRepo.getQcInspectors();
    for (const insp of (inspectors.ok ? inspectors.data : [])) {
      await this._sendNotif(
        BigInt(insp.telegram_id as string | number),
        `🔍 <b>QC Tekshiruv Kerak</b>\n\nHarakat: <code>${movementNumber}</code>\nID: ${movementId}\n\nKarantin omboriga keldi. Tekshiruv o'tkazing.`,
      );
    }
  
    });}
}
