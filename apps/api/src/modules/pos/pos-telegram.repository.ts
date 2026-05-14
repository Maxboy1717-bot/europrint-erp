/**
 * @module pos-telegram.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();

import { Injectable } from '@nestjs/common';
import { posTelegramSessions, db, sql, eq, and } from '@workspace/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await db.execute(q)).rows as Row[];
};

@Injectable()
export class PosTelegramRepository {
  async getUserByTelegramId(telegramUserId: bigint): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT id, first_name, last_name, department_code FROM users WHERE telegram_id = ${String(telegramUserId)} AND is_active = TRUE LIMIT 1`);
      return (r[0] as Row) ?? null;
      }, 'DB_ERROR');
  }

  async getManagersByDepartment(departmentCode: string): Promise<Result<{ telegram_id: unknown }[]>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT telegram_id FROM users WHERE department_code = ${departmentCode} AND role IN ('department_manager', 'warehouse_manager') AND telegram_id IS NOT NULL AND is_active = TRUE`);
      return r as { telegram_id: unknown }[];
      }, 'DB_ERROR');
  }

  async deactivateUserSessions(telegramUserId: number): Promise<void> {
    await db.update(posTelegramSessions).set({ isActive: false }).where(eq(posTelegramSessions.telegramUserId, telegramUserId));
  }

  async createSession(data: typeof posTelegramSessions.$inferInsert): Promise<void> {
    await db.insert(posTelegramSessions).values(data as never);
  }

  async findActiveSessionByToken(token: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const [session] = await db.select().from(posTelegramSessions).where(and(eq(posTelegramSessions.sessionToken, token), eq(posTelegramSessions.isActive, true), sql`expires_at > NOW()`));
      return session ?? null;
      }, 'DB_ERROR');
  }

  async touchSession(token: string): Promise<void> {
    await db.update(posTelegramSessions).set({ lastActiveAt: _time.now() }).where(eq(posTelegramSessions.sessionToken, token));
  }
}
