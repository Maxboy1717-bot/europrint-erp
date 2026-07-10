/**
 * @module hr-attention-digest.repository
 * @description Repository / data-access layer. Wraps Drizzle raw SQL (typedExecute); returns typed rows.
 *   Vizyon 02-hr #46 — "E'tibor talab qiluvchi xodim" mezoni (haftalik HR digest).
 *   Uch mezon (trailing windowDays oynasi): reyting >=X% tushish, N+ kech hisobot, qisqa ta'til.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { extractDrizzleError } from '@common/utils/drizzle-error.util';

export interface AttentionEmployeeRow {
  employee_id:     number;
  first_name:      string;
  last_name:       string;
  department_name: string | null;
  /** vergul bilan ajratilgan mezonlar, masalan "late_reports,rating_drop,short_leave" */
  reasons:         string;
}

export interface AttentionDigestConfig {
  ratingDropFraction:  number; // 0.10 → overall_score oynada >=10% tushdi
  lateReportThreshold: number; // 3    → 3+ kech kunlik hisobot
  shortLeaveDays:      number; // 3    → tasdiqlangan ta'til < 3 kun
  windowDays:          number; // 7    → trailing (haftalik) oyna
}

@Injectable()
export class HrAttentionDigestRepository {
  private readonly logger = new Logger(HrAttentionDigestRepository.name);

  /**
   * Trailing `windowDays` oynasida quyidagi mezonlardan birortasi bo'yicha belgilangan
   * faol xodimlarni qaytaradi:
   *   - rating_drop : overall_score oyna-boshidan oyna-oxirigacha >= ratingDropFraction tushdi
   *   - late_reports: >= lateReportThreshold kech hr_daily_reports
   *   - short_leave : oyna bilan kesishuvchi, shortLeaveDays kundan qisqa tasdiqlangan ta'til
   * Bo'sh natija → chaqiruvchi "muammo yo'q" empty-state xabarini yuboradi.
   * Xatoda fail-soft: [] qaytaradi (cron yiqilmaydi).
   */
  async findAttentionNeededEmployees(cfg: AttentionDigestConfig): Promise<AttentionEmployeeRow[]> {
    const { ratingDropFraction, lateReportThreshold, shortLeaveDays, windowDays } = cfg;
    try {
      const rows = await typedExecute<{
        employee_id: number | null;
        first_name: string | null;
        last_name: string | null;
        department_name: string | null;
        reasons: string | null;
      }>(sql`
        WITH kpi_drop AS (
          SELECT employee_id FROM (
            SELECT employee_id,
              (ARRAY_AGG(overall_score ORDER BY evaluation_date::date ASC))[1]  AS first_score,
              (ARRAY_AGG(overall_score ORDER BY evaluation_date::date DESC))[1] AS last_score
            FROM employee_daily_kpi
            WHERE employee_id IS NOT NULL
              AND evaluation_date::date >= CURRENT_DATE - make_interval(days => ${windowDays})
            GROUP BY employee_id
          ) g
          WHERE first_score > 0
            AND (first_score - last_score) / first_score >= ${ratingDropFraction}
        ),
        late_reports AS (
          SELECT employee_id FROM hr_daily_reports
          WHERE is_late = true
            AND report_date::date >= CURRENT_DATE - make_interval(days => ${windowDays})
          GROUP BY employee_id
          HAVING COUNT(*) >= ${lateReportThreshold}
        ),
        short_leave AS (
          SELECT DISTINCT employee_id FROM hr_leave_requests
          WHERE status = 'approved'
            AND (end_date - start_date) < ${shortLeaveDays}
            AND end_date >= CURRENT_DATE - make_interval(days => ${windowDays})
        ),
        flagged AS (
          SELECT employee_id, 'rating_drop'  AS reason FROM kpi_drop
          UNION ALL SELECT employee_id, 'late_reports' FROM late_reports
          UNION ALL SELECT employee_id, 'short_leave'  FROM short_leave
        )
        SELECT f.employee_id, e.first_name, e.last_name, d.name AS department_name,
               STRING_AGG(DISTINCT f.reason, ',' ORDER BY f.reason) AS reasons
        FROM flagged f
        INNER JOIN employees e ON e.id = f.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.status = 'active' AND e.deleted_at IS NULL
        GROUP BY f.employee_id, e.first_name, e.last_name, d.name
        ORDER BY f.employee_id
      `);

      const safeRows = Array.isArray(rows) ? rows : [];
      return safeRows.map(r => ({
        employee_id:     r.employee_id ?? 0,
        first_name:      String(r.first_name ?? ''),
        last_name:       String(r.last_name ?? ''),
        department_name: r.department_name ? String(r.department_name) : null,
        reasons:         String(r.reasons ?? ''),
      }));
    } catch (err: unknown) {
      const detail = extractDrizzleError(err);
      this.logger.error('HrAttentionDigestRepository query failed: %s', detail);
      return []; // fail-soft — cron bo'sh natija bilan ishlaydi, yiqilmaydi
    }
  }
}
