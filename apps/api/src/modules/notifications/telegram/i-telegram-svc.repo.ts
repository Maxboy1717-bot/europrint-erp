/**
 * @module i-telegram-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export interface ITelegramSvcRepository {
  insertNotification(dto: { userId: number; title: string; message: string; type: string; read: boolean }): Promise<Result<Record<string, unknown>>>;
  countAll(): Promise<Result<number>>;
  /**
   * Resolve the Telegram chat_id for a given internal employee/user id.
   * Returns null if the user hasn't linked their Telegram account.
   * Implementations: look up `employees.telegram_chat_id` by user id.
   */
  getUserChatId?(userId: number): Promise<Result<string | null>>;
}

export const TELEGRAM_SVC_REPO = 'ITelegramSvcRepository';
