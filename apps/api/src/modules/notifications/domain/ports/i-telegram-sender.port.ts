/**
 * @module i-telegram-sender.port
 * @description Domain port for Telegram bot messaging. The infrastructure layer
 * provides concrete adapters (TelegramBotAdapter via @nestjs/axios HttpService)
 * that satisfy this contract — domain code only depends on the interface,
 * never on the bot SDK or transport details.
 */

import { Result } from '@common/result';

export const TELEGRAM_SENDER = Symbol('TELEGRAM_SENDER');

export type TelegramUrgency = 'low' | 'medium' | 'high';

export interface ITelegramSender {
  /**
   * Post a free-form HTML-rendered message to a Telegram chat. Returns Ok
   * when the bot token is missing (no-op fallback) so callers don't need to
   * special-case unconfigured environments.
   */
  sendMessage(chatId: string, message: string): Promise<Result<void>>;

  /**
   * Post a formatted alert with urgency emoji + timestamp prefix. Two-arity
   * forms (with or without body) are both supported.
   */
  sendAlert(
    chatId: string,
    title: string,
    body?: string,
    urgency?: TelegramUrgency,
  ): Promise<Result<void>>;

  /**
   * Convenience wrappers used by other modules' workflows. Implementations
   * may simply log + Ok() these — they exist so domain callers don't depend
   * on adapter-specific helpers.
   */
  sendOrderStatusUpdate(managerId: number, orderId: number, status: string): Promise<Result<void>>;
  sendAdvanceReminder(managerId: number, orderId: number, remaining: number): Promise<Result<void>>;
  sendCertExpiry(employeeId: number, certName: string, expiresAt: Date): Promise<Result<void>>;
  sendStockAlert(warehouseManagerId: number, materialId: number, currentQty: number): Promise<Result<void>>;
  sendQcResult(productionManagerId: number, orderId: number, passed: boolean): Promise<Result<void>>;
}
