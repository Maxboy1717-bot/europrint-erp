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
import { getBusinessSettingNumber } from '../../../../shared/config/business-settings.reader';
import type {
  IDiaryRepo,
  IDiaryEntry,
  DiarySaveInput,
} from '../../domain/repositories/i-diary.repo';

type CarryItem = { issue: string; from_date: string; days: number; chronic: boolean };

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

  async getById(id: number): Promise<Result<IDiaryEntry | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<IDiaryEntry>(
        sql`SELECT * FROM diary_entries WHERE id = ${id}`,
      );
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  async save(id: number, dto: DiarySaveInput, authorCardId: number): Promise<Result<IDiaryEntry>> {
    return safeCall(async () => {
      const rows = await typedExecute<IDiaryEntry>(sql`
        UPDATE diary_entries SET
          main_issue    = COALESCE(${dto.main_issue ?? null}, main_issue),
          solution      = COALESCE(${dto.solution ?? null}, solution),
          tomorrow_plan = COALESCE(${dto.tomorrow_plan ?? null}, tomorrow_plan),
          status        = 'draft',
          updated_at    = NOW()
        WHERE id = ${id} AND author_card_id = ${authorCardId}
        RETURNING *
      `);
      if (!rows[0]) throw new Error('NOT_FOUND');
      return rows[0];
    }, 'DB_ERROR');
  }

  async submit(id: number, authorCardId: number): Promise<Result<IDiaryEntry>> {
    return safeCall(async () => {
      const rows = await typedExecute<IDiaryEntry>(sql`
        UPDATE diary_entries SET status = 'submitted', updated_at = NOW()
        WHERE id = ${id} AND author_card_id = ${authorCardId}
        RETURNING *
      `);
      if (!rows[0]) throw new Error('NOT_FOUND');
      return rows[0];
    }, 'DB_ERROR');
  }

  /**
   * Kechagi (draft, ya'ni submit qilinmagan = hal qilinmagan) main_issue'ni
   * bugungi yozuvning carry_over_issues JSONB massiviga qo'shadi (EP-DIR-010),
   * har bir muammo uchun ketma-ket kun sanog'ini (days) yuritadi va chegaradan
   * (director.diary_chronic_threshold_days, default=3) oshgan muammolarni
   * "surunkali" deb belgilab, direktor + org_functions.manager_id zanjiridagi
   * yuqori kartaga bir martalik eskalatsiya-bildirishnoma yuboradi (item #116).
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
      const prevEntry = prev[0];
      if (!prevEntry) return;

      const threshold = await getBusinessSettingNumber('director.diary_chronic_threshold_days', 3);
      const priorItems: CarryItem[] = Array.isArray(prevEntry.carry_over_issues)
        ? (prevEntry.carry_over_issues as CarryItem[])
        : [];

      const items: CarryItem[] = [];
      if (prevEntry.main_issue) {
        items.push({ issue: prevEntry.main_issue, from_date: yDate, days: 1, chronic: threshold <= 1 });
      }
      for (const it of priorItems) {
        if (!it?.issue || !it?.from_date) continue;
        const days = Number(it.days ?? 1) + 1;
        items.push({ issue: it.issue, from_date: it.from_date, days, chronic: days >= threshold });
      }
      if (items.length === 0) return;

      const maxDays = Math.max(...items.map((i) => i.days));
      const payload = JSON.stringify(items);

      const updated = await typedExecute<{ id: number }>(sql`
        UPDATE diary_entries
        SET carry_over_issues = ${payload}::jsonb, dir_chronic_days = ${maxDays}, updated_at = NOW()
        WHERE author_card_id = ${authorCardId} AND date = ${targetDate}::date
        RETURNING id
      `);
      const entryId = updated[0]?.id;
      if (entryId && maxDays >= threshold) {
        await this.notifyChronicEscalation(entryId, authorCardId, items.filter((i) => i.chronic), maxDays);
      }
    }, 'DB_ERROR');
  }

  /**
   * Item #116: bitta diary-yozuv uchun bir marta eskalatsiya (notifications'da
   * reference_type='diary_chronic' + reference_id=entryId bo'yicha dedup) —
   * shu kunlik kunlik qayta ochilsa ham qayta yuborilmaydi.
   */
  private async notifyChronicEscalation(
    entryId: number, authorCardId: number, chronicItems: CarryItem[], days: number,
  ): Promise<void> {
    const already = await typedExecute<{ id: number }>(sql`
      SELECT id FROM notifications WHERE reference_type = 'diary_chronic' AND reference_id = ${entryId} LIMIT 1
    `);
    if (already[0]) return;

    const issueText = (chronicItems[0]?.issue ?? '').slice(0, 200);
    const title = 'Surunkali muammo';
    const body = `Kartaning kundaligida "${issueText}" ${days} kundan beri hal qilinmadi.`;

    const directors = await typedExecute<{ id: number }>(sql`
      SELECT id FROM users WHERE role IN ('director', 'super_admin') AND is_active = true
    `);
    const manager = await typedExecute<{ user_id: number | null }>(sql`
      SELECT COALESCE(u.id, e_u.id) AS user_id
      FROM org_functions f
      LEFT JOIN users u ON u.org_function_id = f.manager_id
      LEFT JOIN employees emp ON emp.org_function_id = f.manager_id AND emp.deleted_at IS NULL
      LEFT JOIN users e_u ON e_u.id = emp.user_id
      WHERE f.id = ${authorCardId}
      LIMIT 1
    `);

    const recipients = new Set<number>(directors.map((d) => d.id));
    if (manager[0]?.user_id) recipients.add(manager[0].user_id);

    for (const userId of recipients) {
      await typedExecute<unknown>(sql`
        INSERT INTO notifications (user_id, type, title, body, is_read, reference_id, reference_type, priority, created_at)
        VALUES (${userId}, 'diary_chronic', ${title}, ${body}, false, ${entryId}, 'diary_chronic', 'urgent', NOW())
      `);
    }
  }
}
