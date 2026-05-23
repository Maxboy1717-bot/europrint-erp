/**
 * @module telegram-bots/employees.repo
 * @description Employee / chat-id / candidate / linking queries for Telegram bots.
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db, runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { execTelegramBotNotificationInsert, execEmployeeBlockInsert } from '@common/database/queries-bots';
import { safeCall, Result } from '@common/result';
import {
  hrEmployees, notificationsApp,
  gamification_totals,
  hr_adaptation_cases, offboarding_cases,
} from '@shared/db';
import { TashkentTimeService } from '@common/time';

const _time = new TashkentTimeService();
type Row = Record<string, unknown>;

@Injectable()
export class TelegramBotsEmployeesRepo {
  async insertFallbackNotification(message: string): Promise<void> {
    await db.insert(notificationsApp).values({
      userId: 1, title: 'Telegram Bildirishnoma', message, type: 'telegram', read: false,
    }).onConflictDoNothing();
  }

  async getActiveTelegramChatIds(): Promise<Result<string[]>> {
    return safeCall(async () => {
      const rows = await db.select({ telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(sql`${hrEmployees.telegram_chat_id} IS NOT NULL AND ${hrEmployees.status} = 'active'`);
      return (Array.isArray(rows) ? rows : []).map((r) => r.telegram_chat_id as string).filter(Boolean);
    }, 'DB_ERROR');
  }

  async getEmployeeTelegramChatId(employeeId: number): Promise<Result<string | null>> {
    return safeCall(async () => {
      const rows = await db.select({ telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(eq(hrEmployees.id, employeeId))
        .limit(1);
      return (rows[0]?.telegram_chat_id as string | null) ?? null;
    }, 'DB_ERROR');
  }

  async insertNotificationByEmployeeId(employeeId: number, message: string): Promise<void> {
    await execTelegramBotNotificationInsert(employeeId, message);
  }

  async getEmployeeByChatId(chatId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(hrEmployees)
        .where(eq(hrEmployees.telegram_chat_id, String(chatId)))
        .limit(1);
      return (rows[0] as Row | undefined) ?? null;
    }, 'DB_ERROR');
  }

  async findEmployeeByPhone(phone: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const normalized = phone.replace(/\D/g, '');
      const rows = await runQuery<Row>(sql`
        SELECT id, first_name, last_name, status, is_department_head,
               department_id, telegram_chat_id
        FROM employees
        WHERE phone_number ~ ${`[^0-9]?${normalized}[^0-9]?`}
           OR REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g') = ${normalized}
        LIMIT 1
      `);
      return (rows.rows[0] as Row | undefined) ?? null;
    }, 'DB_ERROR');
  }

  async linkEmployeeChatId(employeeId: number, chatId: number): Promise<void> {
    await db.update(hrEmployees)
      .set({ telegram_chat_id: String(chatId), updated_at: _time.now() })
      .where(eq(hrEmployees.id, employeeId));
  }

  async getActiveEmployeesWithChatId(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({ id: hrEmployees.id, telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(sql`${hrEmployees.status} = 'active' AND ${hrEmployees.telegram_chat_id} IS NOT NULL`);
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  async getAllActiveChatIds(): Promise<Result<string[]>> {
    return safeCall(async () => {
      const rows = await db.select({ telegram_chat_id: hrEmployees.telegram_chat_id })
        .from(hrEmployees)
        .where(sql`${hrEmployees.status} = 'active' AND ${hrEmployees.telegram_chat_id} IS NOT NULL`);
      return rows.map(r => r.telegram_chat_id as string);
    }, 'DB_ERROR');
  }

  async terminateEmployee(employeeId: number): Promise<void> {
    await db.update(hrEmployees).set({
      status: 'terminated', is_blocked: true, updated_at: _time.now(),
    }).where(eq(hrEmployees.id, employeeId));
  }

  async completeOffboardingCase(caseId: number): Promise<void> {
    await db.update(offboarding_cases).set({
      status: 'completed', updated_at: _time.now(),
    }).where(eq(offboarding_cases.id, caseId));
  }

  async insertTerminationBlock(employeeId: number): Promise<void> {
    await execEmployeeBlockInsert(employeeId);
  }

  async getGamificationPoints(employeeId: number): Promise<Result<{ total_points: unknown; monthly_points: unknown } | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        total_points: gamification_totals.total_points,
        monthly_points: gamification_totals.monthly_points,
      })
        .from(gamification_totals)
        .where(eq(gamification_totals.employee_id, employeeId))
        .limit(1);
      return (rows[0] ?? null) as { total_points: unknown; monthly_points: unknown } | null;
    }, 'DB_ERROR');
  }

  async markAdaptationNotified(employeeId: number): Promise<void> {
    await db.update(hr_adaptation_cases)
      .set({ notified_at: _time.now() })
      .where(eq(hr_adaptation_cases.employee_id, employeeId));
  }
}
