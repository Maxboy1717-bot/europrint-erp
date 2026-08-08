/**
 * @module off-hours-audit.repository
 * @description Repository / data-access layer. Wraps raw SQL; returns Result<T>.
 *   Vision 10-warehouse #30 - "Ish vaqtidan tashqari amal bayrogi AVTO" (off-hours flag):
 *   compares each warehouse movement (material_movements) timestamp against the performer's
 *   shift schedule (shift_schedules VIEW -> shift_assignments) and flags movements that fall
 *   outside any covering shift. The flag is COMPUTED IN THE REPORT (no new column/table).
 *
 *   Rule: the performer must be a shift worker (has at least one shift row) AND no shift may
 *   cover the movement timestamp -> off-hours. Accounts with no shift schedule at all
 *   (e.g. admin/director) are never flagged (no false signal). Night shifts (22:00->06:00)
 *   that cross midnight are handled via the previous-day predicate.
 *
 *   shift_schedules VIEW: employee_id_raw = shift_assignments.user_id = users.id =
 *   material_movements.performed_by (direct linkage; start/end times derived by the view).
 * @layer Infrastructure (WMS)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, safeCall } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class OffHoursAuditRepository {
  /**
   * Off-hours (outside-shift) warehouse movements in the last `sinceDays` days,
   * most recent first.
   */
  async findOffHoursMovements(sinceDays: number, limit: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        SELECT m.id            AS movement_id,
               m.performed_by  AS performed_by,
               u.username      AS performed_by_name,
               m.movement_type AS movement_type,
               m.material_name AS material_name,
               m.quantity      AS quantity,
               m.unit          AS unit,
               m.created_at    AS performed_at
        FROM material_movements m
        LEFT JOIN users u ON u.id = m.performed_by
        WHERE m.performed_by > 0
          AND m.created_at >= now() - make_interval(days => ${sinceDays})
          AND EXISTS (
            SELECT 1 FROM shift_schedules s WHERE s.employee_id_raw = m.performed_by
          )
          AND NOT EXISTS (
            SELECT 1 FROM shift_schedules s
            WHERE s.employee_id_raw = m.performed_by
              AND (
                (s.start_time <= s.end_time
                   AND s.shift_date = m.created_at::date
                   AND m.created_at::time BETWEEN s.start_time AND s.end_time)
                OR (s.start_time > s.end_time
                   AND ((s.shift_date = m.created_at::date AND m.created_at::time >= s.start_time)
                     OR (s.shift_date = (m.created_at::date - 1) AND m.created_at::time <= s.end_time)))
              )
          )
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `);
      return r.rows as Row[];
    }, 'DB_ERROR');
  }
}
