import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { sql, eq } from 'drizzle-orm';
import { execAbsenceTrackingUpsert } from '@common/database/queries-remaining';
import { safeCall, Result } from '@common/result';
import {
  absence_tracking, discipline_records, employee_blocks, hrEmployees, hrDepartments,
} from '@shared/db';

type Row = Record<string, unknown>;

@Injectable()
export class DisciplineV2AbsenceRepository {
  async getLastAbsence(employeeId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        absence_date:          absence_tracking.absence_date,
        consecutive_day_count: absence_tracking.consecutive_day_count,
      })
        .from(absence_tracking)
        .where(eq(absence_tracking.employee_id, employeeId))
        .orderBy(sql`${absence_tracking.absence_date} DESC`)
        .limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async upsertAbsence(employeeId: number, absenceDate: string, consecutiveCount: number): Promise<void> {
    await execAbsenceTrackingUpsert(employeeId, absenceDate, consecutiveCount);
  }

  async getBlockedEmployees(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id, e.first_name, e.last_name, e.employee_code,
               d.name AS department_name,
               eb.reason, eb.blocked_at, eb.blocked_by
        FROM employees e
        JOIN employee_blocks eb ON eb.employee_id = e.id AND eb.is_active = true
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.is_blocked = true
        ORDER BY eb.blocked_at DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async expireOldDisciplineRecords(): Promise<void> {
    await db.update(discipline_records).set({ is_expired: true }).where(
      sql`${discipline_records.is_expired} = false AND ${discipline_records.issued_date} < NOW() - INTERVAL '6 months' AND ${discipline_records.status} = 'acknowledged'`,
    );
  }

  async getEmployeeViolations(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT dr.*, vc.name AS catalog_name, vc.category,
               e.first_name || ' ' || e.last_name AS issuer_name
        FROM discipline_records dr
        LEFT JOIN violation_catalog vc ON vc.code = dr.catalog_code
        LEFT JOIN employees e ON e.id = dr.issued_by
        WHERE dr.employee_id = ${employeeId}
        ORDER BY dr.violation_date DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async acknowledgeViolation(id: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(discipline_records).set({
        status:          'acknowledged',
        acknowledged_at: _time.now(),
      }).where(eq(discipline_records.id, id)).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async approveViolation(id: number, approvedBy?: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(discipline_records).set({
        status:      'approved',
        approved_by: approvedBy ?? null,
        approved_at: _time.now(),
      }).where(eq(discipline_records.id, id)).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async checkDisciplineStatus(employeeId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.is_blocked, e.blocked_reason,
               eb.reason, eb.blocked_at, eb.block_erp_access, eb.block_payroll, eb.block_physical_access
        FROM employees e
        LEFT JOIN employee_blocks eb ON eb.employee_id = e.id AND eb.is_active = true
        WHERE e.id = ${employeeId}
      `);
      return (rows.rows[0] ?? { is_blocked: false }) as Row;
      }, 'DB_ERROR');
  }

  async excuseAbsence(absenceId: number, dto: { excuseReason: string; excuseDocumentUrl?: string; excusedBy?: number }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(absence_tracking).set({
        is_excused:          true,
        excuse_reason:       dto.excuseReason,
        excuse_document_url: dto.excuseDocumentUrl ?? null,
        excused_by:          dto.excusedBy ?? null,
        excused_at:          _time.now(),
      }).where(eq(absence_tracking.id, absenceId)).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async findAbsentEmployees(dateStr: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT e.id
        FROM employees e
        WHERE e.is_blocked = false
          AND e.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.employee_id = e.id AND DATE(a.check_in) = ${dateStr}::date)
          AND NOT EXISTS (SELECT 1 FROM leave_requests lr WHERE lr.employee_id = e.id AND lr.status = 'approved' AND ${dateStr}::date BETWEEN lr.start_date::date AND lr.end_date::date)
        LIMIT 100
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }
}
