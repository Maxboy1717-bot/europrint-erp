/**
 * @module absence-block.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { hrEmployees, hrDepartments, hrPositions, appUsers } from '@shared/db';
import { absence_tracking, employee_blocks } from '@shared/db';
import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm';
import { extractDrizzleError } from '@common/utils/drizzle-error.util';

export interface AbsentEmployeeRow {
  employee_id:           number;
  consecutive_day_count: number;
  first_name:            string;
  last_name:             string;
  department_name:       string | null;
  department_id:         number | null;
  user_id:               number | null;
  telegram_chat_id:      string | null;
}

export interface HrManagerRow {
  telegram_chat_id: string;
}

@Injectable()
export class AbsenceBlockRepository {
  private readonly logger = new Logger(AbsenceBlockRepository.name);

  private async _queryAbsentEmployees(minDays: number, maxDays?: number): Promise<AbsentEmployeeRow[]> {
    type QRow = {
      employee_id: number | null;
      consecutive_day_count: number | null;
      first_name: string | null;
      last_name: string | null;
      department_name: string | null;
      department_id: number | null;
      user_id: number | null;
      telegram_chat_id: string | null;
    };

    let rows: QRow[] = [];
    try {
      rows = (await db
        .select({
          employee_id:           absence_tracking.employee_id,
          consecutive_day_count: absence_tracking.consecutive_day_count,
          first_name:            hrEmployees.first_name,
          last_name:             hrEmployees.last_name,
          department_name:       hrDepartments.name,
          department_id:         hrEmployees.department_id,
          user_id:               hrEmployees.user_id,
          telegram_chat_id:      hrEmployees.telegram_chat_id,
        })
        .from(absence_tracking)
        .innerJoin(hrEmployees, eq(hrEmployees.id, absence_tracking.employee_id))
        .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .where(
          and(
            sql`${absence_tracking.consecutive_day_count} >= ${minDays}`,
            maxDays !== undefined ? sql`${absence_tracking.consecutive_day_count} < ${maxDays}` : undefined,
            eq(absence_tracking.auto_blocked, false),
            eq(hrEmployees.is_blocked, false),
            eq(hrEmployees.status, 'active'),
            isNull(hrEmployees.deleted_at),
            sql`${absence_tracking.absence_date} = (
              SELECT MAX(at2.absence_date) FROM absence_tracking at2
              WHERE at2.employee_id = ${absence_tracking.employee_id}
            )`,
          ),
        )) as QRow[];
    } catch (err: unknown) {
      const detail = extractDrizzleError(err);
      this.logger.error('AbsenceBlockRepository query failed (min=%d max=%s): %s', minDays, maxDays, detail);
      return []; // Return empty — cron still reports result but won't crash
    }

    return rows.map(r => ({
      employee_id:           r.employee_id ?? 0,
      consecutive_day_count: r.consecutive_day_count ?? 0,
      first_name:            String(r.first_name ?? ''),
      last_name:             String(r.last_name ?? ''),
      department_name:       r.department_name ? String(r.department_name) : null,
      department_id:         r.department_id ?? null,
      user_id:               r.user_id ?? null,
      telegram_chat_id:      r.telegram_chat_id ?? null,
    }));
  }

  async findAbsentEmployeesToBlock(): Promise<AbsentEmployeeRow[]> {
    return this._queryAbsentEmployees(3);
  }

  async findAbsentEmployees1Day(): Promise<AbsentEmployeeRow[]> {
    return this._queryAbsentEmployees(1, 2);
  }

  async findAbsentEmployees2Day(): Promise<AbsentEmployeeRow[]> {
    return this._queryAbsentEmployees(2, 3);
  }

  async deactivateExistingBlocks(employeeId: number): Promise<void> {
    await db
      .update(employee_blocks)
      .set({ is_active: false })
      .where(and(eq(employee_blocks.employee_id, employeeId), eq(employee_blocks.is_active, true)));
  }

  async insertEmployeeBlock(employeeId: number, reason: string): Promise<void> {
    await db.insert(employee_blocks).values({
      employee_id: employeeId,
      reason,
      blocked_by: 0,
      is_active: true,
    });
  }

  async blockEmployee(employeeId: number, reason: string): Promise<void> {
    await db
      .update(hrEmployees)
      .set({ is_blocked: true, blocked_reason: reason, status: 'blocked' })
      .where(eq(hrEmployees.id, employeeId));
  }

  async markAbsenceAutoBlocked(employeeId: number): Promise<void> {
    await db
      .update(absence_tracking)
      .set({ auto_blocked: true })
      .where(
        and(
          eq(absence_tracking.employee_id, employeeId),
          sql`${absence_tracking.absence_date} = (
            SELECT MAX(at2.absence_date) FROM absence_tracking at2
            WHERE at2.employee_id = ${employeeId}
          )`,
        ),
      );
  }

  async findHrManagersWithTelegram(): Promise<HrManagerRow[]> {
    const rows = await db
      .selectDistinct({ telegram_chat_id: hrEmployees.telegram_chat_id })
      .from(hrEmployees)
      .innerJoin(hrPositions, eq(hrPositions.id, hrEmployees.position_id))
      .where(
        and(
          eq(hrEmployees.status, 'active'),
          isNull(hrEmployees.deleted_at),
          isNotNull(hrEmployees.telegram_chat_id),
          sql`(
            LOWER(${hrPositions.name}) LIKE '%hr%' OR
            LOWER(${hrPositions.name}) LIKE '%human resource%' OR
            LOWER(${hrPositions.name}) LIKE '%kadrlar%' OR
            LOWER(${hrPositions.name}) LIKE '%xodimlar%'
          )`,
        ),
      )
      .limit(10);

    return rows
      .filter(r => r.telegram_chat_id)
      .map(r => ({ telegram_chat_id: String(r.telegram_chat_id) }));
  }

  async findDirectorsWithTelegram(): Promise<HrManagerRow[]> {
    const rows = await db
      .selectDistinct({ telegram_chat_id: hrEmployees.telegram_chat_id })
      .from(hrEmployees)
      .innerJoin(hrPositions, eq(hrPositions.id, hrEmployees.position_id))
      .where(
        and(
          eq(hrEmployees.status, 'active'),
          isNull(hrEmployees.deleted_at),
          isNotNull(hrEmployees.telegram_chat_id),
          sql`(
            LOWER(${hrPositions.name}) LIKE '%director%' OR
            LOWER(${hrPositions.name}) LIKE '%direktor%' OR
            LOWER(${hrPositions.name}) LIKE '%ceo%' OR
            LOWER(${hrPositions.name}) LIKE '%bosh%'
          )`,
        ),
      )
      .limit(5);

    return rows
      .filter(r => r.telegram_chat_id)
      .map(r => ({ telegram_chat_id: String(r.telegram_chat_id) }));
  }

  async findDepartmentLeadWithTelegram(departmentId: number): Promise<HrManagerRow | null> {
    const [row] = await db
      .selectDistinct({ telegram_chat_id: hrEmployees.telegram_chat_id })
      .from(hrEmployees)
      .innerJoin(hrPositions, eq(hrPositions.id, hrEmployees.position_id))
      .where(
        and(
          eq(hrEmployees.department_id, departmentId),
          eq(hrEmployees.status, 'active'),
          isNull(hrEmployees.deleted_at),
          isNotNull(hrEmployees.telegram_chat_id),
          sql`(
            LOWER(${hrPositions.name}) LIKE '%manager%' OR
            LOWER(${hrPositions.name}) LIKE '%menejer%' OR
            LOWER(${hrPositions.name}) LIKE '%rahbar%' OR
            LOWER(${hrPositions.name}) LIKE '%boshliq%'
          )`,
        ),
      )
      .limit(1);

    return row?.telegram_chat_id
      ? { telegram_chat_id: String(row.telegram_chat_id) }
      : null;
  }

  async disableUserAccount(userId: number): Promise<void> {
    await db
      .update(appUsers)
      .set({ is_active: false })
      .where(eq(appUsers.id, userId));
  }
}
