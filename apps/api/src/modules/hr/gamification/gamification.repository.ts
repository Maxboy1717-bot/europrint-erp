import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { sql, eq } from 'drizzle-orm';
import { execGamificationTotalsUpsert } from '@common/database/queries-remaining';
import { safeCall, Result } from '@common/result';
import {
  gamification_points, gamification_totals, employee_badges, badge_catalog,
  hrEmployees, hrDepartments,
} from '@shared/db';

type Row = Record<string, unknown>;

@Injectable()
export class GamificationRepository {
  async insertPoints(employeeId: number, points: number, eventType: string, description: string, referenceId?: number): Promise<void> {
    await db.insert(gamification_points).values({
      employee_id:  employeeId,
      points:       points,
      event_type:   eventType,
      description:  description,
      reference_id: referenceId ?? null,
    });
  }

  async upsertTotals(employeeId: number, points: number): Promise<void> {
    await execGamificationTotalsUpsert(employeeId, points);
  }

  async insertBadge(employeeId: number, badgeCode: string, awardedBy?: number, reason?: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.insert(employee_badges).values({
        employee_id: employeeId,
        badge_code:  badgeCode,
        awarded_by:  awardedBy ?? null,
        reason:      reason ?? null,
      }).onConflictDoNothing().returning();
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async getBadgeCatalogEntry(badgeCode: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({ point_value: badge_catalog.point_value })
        .from(badge_catalog)
        .where(eq(badge_catalog.code, badgeCode))
        .limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async getLeaderboard(periodParam: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const pointsCol = periodParam === 'monthly'
        ? sql`gt.monthly_points`
        : periodParam === 'quarterly'
          ? sql`gt.quarterly_points`
          : sql`gt.total_points`;

      const rows = await runQuery<Row>(sql`
        SELECT gt.employee_id, gt.total_points, gt.monthly_points, gt.quarterly_points,
               e.first_name, e.last_name, e.employee_code, d.name AS department_name,
               ROW_NUMBER() OVER (ORDER BY ${pointsCol} DESC) AS rank,
               COUNT(eb.id) AS badge_count
        FROM gamification_totals gt
        JOIN employees e ON e.id = gt.employee_id
        LEFT JOIN departments d ON d.id = e.department_id
        LEFT JOIN employee_badges eb ON eb.employee_id = gt.employee_id
        GROUP BY gt.employee_id, gt.total_points, gt.monthly_points, gt.quarterly_points,
                 e.first_name, e.last_name, e.employee_code, d.name
        ORDER BY ${pointsCol} DESC
        LIMIT 50
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getEmployeeTotals(employeeId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(gamification_totals)
        .where(eq(gamification_totals.employee_id, employeeId))
        .limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async getEmployeePointsHistory(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(gamification_points)
        .where(eq(gamification_points.employee_id, employeeId))
        .orderBy(sql`${gamification_points.created_at} DESC`)
        .limit(50);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getEmployeeBadges(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:          employee_badges.id,
        employee_id: employee_badges.employee_id,
        badge_id:    employee_badges.badge_id,
        awarded_by:  employee_badges.awarded_by,
        awarded_at:  employee_badges.awarded_at,
        reason:      employee_badges.reason,
        name:        badge_catalog.name,
        name_ru:     badge_catalog.name_ru,
        icon:        badge_catalog.icon,
        description: badge_catalog.description,
        point_value: badge_catalog.point_value,
      })
        .from(employee_badges)
        .innerJoin(badge_catalog, eq(badge_catalog.id, employee_badges.badge_id))
        .where(eq(employee_badges.employee_id, employeeId))
        .orderBy(sql`${employee_badges.awarded_at} DESC`);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getBadgeCatalog(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT bc.*, COUNT(eb.id) AS total_awarded
        FROM badge_catalog bc
        LEFT JOIN employee_badges eb ON eb.badge_code = bc.code
        WHERE bc.is_active = true
        GROUP BY bc.id
        ORDER BY bc.point_value DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async upsertBadgeCatalogEntry(body: { code: string; name: string; name_ru?: string; description?: string; icon?: string; point_value?: number; category?: string }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO badge_catalog (code, name, name_ru, description, icon, point_value, category)
        VALUES (${body.code}, ${body.name}, ${body.name_ru ?? null}, ${body.description ?? null}, ${body.icon ?? null}, ${body.point_value ?? 0}, ${body.category ?? null})
        ON CONFLICT (code) DO UPDATE
          SET name = EXCLUDED.name, name_ru = EXCLUDED.name_ru, description = EXCLUDED.description,
              icon = EXCLUDED.icon, point_value = EXCLUDED.point_value, category = EXCLUDED.category
        RETURNING *
      `);
      return (rows.rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async getMonthlyChampion(): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        employee_id:    gamification_totals.employee_id,
        monthly_points: gamification_totals.monthly_points,
        first_name:     hrEmployees.first_name,
        last_name:      hrEmployees.last_name,
      })
        .from(gamification_totals)
        .innerJoin(hrEmployees, eq(hrEmployees.id, gamification_totals.employee_id))
        .orderBy(sql`${gamification_totals.monthly_points} DESC`)
        .limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async resetMonthlyPointsExcept(employeeId: number): Promise<void> {
    await db.update(gamification_totals)
      .set({ monthly_points: 0 })
      .where(sql`${gamification_totals.employee_id} != ${employeeId}`);
  }

  async getWeeklyDigest(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        employee_id:    gamification_totals.employee_id,
        monthly_points: gamification_totals.monthly_points,
        total_points:   gamification_totals.total_points,
        first_name:     hrEmployees.first_name,
        last_name:      hrEmployees.last_name,
        department_id:  hrEmployees.department_id,
      })
        .from(gamification_totals)
        .innerJoin(hrEmployees, eq(hrEmployees.id, gamification_totals.employee_id))
        .where(sql`${gamification_totals.monthly_points} > 0`)
        .orderBy(sql`${gamification_totals.monthly_points} DESC`)
        .limit(10);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }
}
