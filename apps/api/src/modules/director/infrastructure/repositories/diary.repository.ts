/**
 * @module diary.repository
 * @description Repository / data-access layer for diary_entries. Auto-fills
 *   daily_state from P29 company_state_log and main_kpi_value from PP
 *   production-plan %, and carries over unresolved issues from the prior day.
 *   Uses typedExecute raw SQL — table is created by the gated P30 migration and
 *   is not in the Drizzle schema barrel (directive QADAM 2).
 * @layer Infrastructure (Director)
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Result } from '@common/result';
import type {
  IDiaryRepo,
  IDiaryEntry,
  DiarySaveInput,
} from '../../domain/repositories/i-diary.repo';

/** YYYY-MM-DD sanadan bir kun oldingi sanani string sifatida qaytaradi (UTC). */
function previousDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

@Injectable()
export class DiaryRepository implements IDiaryRepo {
  /**
   * Foydalanuvchini o'z org-kartasiga (org_functions.id) bog'laydi. Karta-markazli
   * model: daftar muallifi USER emas, KARTA. Avval users.org_function_id (login
   * egasining kartasi), bo'lmasa employees.org_function_id (user_id orqali).
   * Karta topilmasa null — chaqiruvchi user.id ga fallback qiladi.
   */
  async resolveAuthorCard(userId: number): Promise<Result<number | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<{ card_id: number | null }>(sql`
        SELECT COALESCE(u.org_function_id, e.org_function_id) AS card_id
        FROM users u
        LEFT JOIN employees e
          ON e.user_id = u.id AND e.deleted_at IS NULL
        WHERE u.id = ${userId}
        LIMIT 1
      `);
      return rows[0]?.card_id ?? null;
    }, 'DB_ERROR');
  }

  async getOrCreateToday(authorCardId: number, date: string): Promise<Result<IDiaryEntry>> {
    return safeCall(async () => {
      // 1. Mavjud yozuv bormi?
      const existing = await typedExecute<IDiaryEntry>(
        sql`SELECT * FROM diary_entries
            WHERE author_card_id = ${authorCardId} AND date = ${date}::date`,
      );
      if (existing[0]) return existing[0];

      // 2. Auto-fill: P29 company_state_log dan oxirgi holat (EP-DIR-009).
      const stateRows = await typedExecute<{ state_code: string | null }>(
        sql`SELECT state_code FROM company_state_log ORDER BY detected_at DESC LIMIT 1`,
      );
      const dailyState = stateRows[0]?.state_code ?? null;

      // 3. Auto-fill: PP plan% (shu kun completed/total production_orders).
      const ppRows = await typedExecute<{ plan_pct: string | null }>(
        sql`SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed')
                  / NULLIF(COUNT(*), 0), 1) AS plan_pct
            FROM production_orders WHERE DATE(created_at) = ${date}::date`,
      );
      const mainKpi = ppRows[0]?.plan_pct ?? null;

      // 4. INSERT yangi yozuv (carry_over keyin alohida to'ldiriladi).
      const rows = await typedExecute<IDiaryEntry>(sql`
        INSERT INTO diary_entries
          (author_card_id, date, daily_state, main_kpi_value, carry_over_issues)
        VALUES
          (${authorCardId}, ${date}::date, ${dailyState},
           ${mainKpi}::numeric, '[]'::jsonb)
        RETURNING *
      `);
      if (!rows[0]) throw new Error('INSERT_FAILED');
      return rows[0];
    }, 'DB_ERROR');
  }

  async getByAuthorDate(authorCardId: number, date: string): Promise<Result<IDiaryEntry | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<IDiaryEntry>(
        sql`SELECT * FROM diary_entries
            WHERE author_card_id = ${authorCardId} AND date = ${date}::date`,
      );
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async listAll(from: string, to: string, authorCardId?: number): Promise<Result<IDiaryEntry[]>> {
    return safeCall(
      async () =>
        typedExecute<IDiaryEntry>(sql`
          SELECT * FROM diary_entries
          WHERE date >= ${from}::date AND date <= ${to}::date
            AND (${authorCardId ?? null}::int IS NULL
                 OR author_card_id = ${authorCardId ?? null}::int)
          ORDER BY date DESC, author_card_id ASC
        `),
      'DB_ERROR',
    );
  }

  async save(id: number, dto: DiarySaveInput): Promise<Result<IDiaryEntry>> {
    return safeCall(async () => {
      const rows = await typedExecute<IDiaryEntry>(sql`
        UPDATE diary_entries SET
          main_issue    = COALESCE(${dto.main_issue ?? null}, main_issue),
          solution      = COALESCE(${dto.solution ?? null}, solution),
          tomorrow_plan = COALESCE(${dto.tomorrow_plan ?? null}, tomorrow_plan),
          status        = 'draft',
          updated_at    = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      if (!rows[0]) throw new Error('NOT_FOUND');
      return rows[0];
    }, 'DB_ERROR');
  }

  async submit(id: number): Promise<Result<IDiaryEntry>> {
    return safeCall(async () => {
      const rows = await typedExecute<IDiaryEntry>(sql`
        UPDATE diary_entries SET status = 'submitted', updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      if (!rows[0]) throw new Error('NOT_FOUND');
      return rows[0];
    }, 'DB_ERROR');
  }

  /**
   * Kechagi (draft, ya'ni submit qilinmagan = hal qilinmagan) main_issue ni
   * bugungi yozuvning carry_over_issues JSONB massiviga qo'shadi (EP-DIR-010).
   * Idempotent: agar shu from_date allaqachon carry-over qilingan bo'lsa,
   * qayta qo'shilmaydi.
   */
  async carryOverIssues(authorCardId: number, targetDate: string): Promise<Result<void>> {
    return safeCall(async () => {
      const yDate = previousDay(targetDate);

      const prev = await typedExecute<IDiaryEntry>(sql`
        SELECT * FROM diary_entries
        WHERE author_card_id = ${authorCardId}
          AND date = ${yDate}::date
          AND status = 'draft'
      `);
      const prevIssue = prev[0]?.main_issue;
      if (!prevIssue) return;

      const payload = JSON.stringify([{ issue: prevIssue, from_date: yDate }]);
      await typedExecute<unknown>(sql`
        UPDATE diary_entries
        SET carry_over_issues = carry_over_issues || ${payload}::jsonb,
            updated_at = NOW()
        WHERE author_card_id = ${authorCardId}
          AND date = ${targetDate}::date
          AND NOT (carry_over_issues @> ${JSON.stringify([{ from_date: yDate }])}::jsonb)
      `);
    }, 'DB_ERROR');
  }
}
