import { Result } from '@common/result';

export interface ITelegramSvcRepository {
  insertNotification(dto: { userId: number; title: string; message: string; type: string; read: boolean }): Promise<Result<Record<string, unknown>>>;
  countAll(): Promise<Result<number>>;
}

export const TELEGRAM_SVC_REPO = 'ITelegramSvcRepository';
