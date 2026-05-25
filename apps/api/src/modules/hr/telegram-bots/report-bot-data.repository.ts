/**
 * @module report-bot-data.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql, eq } from 'drizzle-orm';
import { hrEmployees, hrPositions, hr_daily_reports, gamification_points, gamification_totals } from '@shared/db';
import { execGamificationTotalsUpsert } from '@common/database/queries-remaining';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class ReportBotDataRepository {
  private readonly logger = new Logger(ReportBotDataRepository.name);

  async getEmployeeInfo(chatId: number): Promise<Result<{ id: number; first_name: string; position?: string } | null>> {
    return safeCall(async () => {
      const rows = await runQuery<{ id: number; first_name: string; position?: string }>(sql`
        SELECT e.id, e.first_name, p.name AS position
        FROM employees e
        LEFT JOIN positions p ON p.id = e.position_id
        WHERE e.telegram_chat_id = ${String(chatId)}
          AND e.status = 'active'
          AND LOWER(COALESCE(p.name, '')) NOT LIKE '%mashin%operator%'
          AND LOWER(COALESCE(p.name, '')) NOT LIKE '%machine operator%'
        LIMIT 1
      `);
      return rows.rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async hasSubmittedToday(employeeId: number, today: string): Promise<Result<boolean>> {
    return safeCall(async () => {
      const r = await db.select({ v: sql<number>`1` })
        .from(hr_daily_reports)
        .where(sql`${hr_daily_reports.employeeId} = ${employeeId} AND ${hr_daily_reports.reportDate}::date = ${today}::date`)
        .limit(1);
      return r.length > 0;
      }, 'DB_ERROR');
  }

  async insertDailyReport(employeeId: number, reportDate: string, tasksCompleted: string, tomorrowPlan: string, metrics: string): Promise<Result<boolean>> {
    return safeCall(async () => {
      const rows = await runQuery<{ id: number }>(sql`
        INSERT INTO hr_daily_reports (employee_id, report_date, tasks_completed, tomorrow_plan, metrics, status, submitted_at, is_auto_absent)
        VALUES (${employeeId}, ${reportDate}::date, ${tasksCompleted}, ${tomorrowPlan}, ${metrics}, 'submitted', NOW(), false)
        ON CONFLICT (employee_id, report_date) DO NOTHING
        RETURNING id
      `);
      return rows.rows.length > 0;
      }, 'DB_ERROR');
  }

  async addGamificationPoints(employeeId: number): Promise<void> {
    await db.insert(gamification_points).values({
      employee_id: employeeId,
      points:      5,
      event_type:  'daily_report_submitted',
      description: "Kunlik hisobot o'z vaqtida (bot orqali) topshirildi",
    });
    await execGamificationTotalsUpsert(employeeId, 5);
  }

  async getDailyStatistics(today: string): Promise<Result<{ submitted_count: unknown; absent_count: unknown; total_active_employees: unknown }>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        SELECT
          COUNT(*) FILTER (WHERE dr.status = 'submitted') AS submitted_count,
          COUNT(*) FILTER (WHERE dr.is_auto_absent = true) AS absent_count,
          COUNT(e.id) AS total_active_employees
        FROM employees e
        LEFT JOIN hr_daily_reports dr ON dr.employee_id = e.id AND dr.report_date::date = ${today}::date
        WHERE e.status = 'active'
          AND COALESCE(e.position, '') NOT ILIKE '%mashina operator%'
          AND COALESCE(e.position, '') NOT ILIKE '%machine operator%'
      `);
      const row = r.rows[0] ?? {};
      return { submitted_count: row.submitted_count ?? 0, absent_count: row.absent_count ?? 0, total_active_employees: row.total_active_employees ?? 0 };
      }, 'DB_ERROR');
  }
}
