/**
 * @module drizzle-hr-base.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql, ilike, and, isNull, or } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { IHrRepo, HrRow } from '../../domain/repositories/i-hr.repo';
import { HrLeaveRepo } from './drizzle-hr-leave.repo';
import {
  hrEmployees, hrDepartments, hrPositions,
  salary_history, payroll_periods_hr,
  candidates, discipline_records, hr_health_checkups,
} from '@shared/db';

type Row = Record<string, unknown>;


export class HrBaseRepository {
  protected readonly logger = new Logger('HrRepository');

  constructor(protected readonly leaveRepo: HrLeaveRepo) {}

  async findEmployeeById(id: string): Promise<Result<HrRow | null>> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return Ok(null);
    try {
      const rows = await db.select({
        id:              hrEmployees.id,
        employee_code:   hrEmployees.employee_code,
        first_name:      hrEmployees.first_name,
        last_name:       hrEmployees.last_name,
        middle_name:     hrEmployees.middle_name,
        status:          hrEmployees.status,
        employment_status: hrEmployees.employment_status,
        hire_date:       hrEmployees.hire_date,
        base_salary:     hrEmployees.base_salary,
        phone_number:    hrEmployees.phone_number,
        email_work:      hrEmployees.email_work,
        photo_url:       hrEmployees.photo_url,
        department_name: hrDepartments.name,
        position_name:   hrPositions.title,
      })
        .from(hrEmployees)
        .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .leftJoin(hrPositions, eq(hrPositions.id, hrEmployees.position_id))
        .where(eq(hrEmployees.id, numId))
        .limit(1);
      return Ok(castTo<HrRow | null>((rows[0] ?? null)));
    } catch (error: unknown) {
      this.logger.error(`findEmployeeById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findAllEmployees(filters: { department?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<Result<{ items: HrRow[]; total: number }>> {
    try {
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const offset = (page - 1) * limit;
      const pat = filters.search ? `%${filters.search}%` : null;
      const dPat = filters.department ? `%${filters.department}%` : null;

      const where = sql`
        ${hrEmployees.deleted_at} IS NULL AND
        (${filters.status ?? null}::text IS NULL OR ${hrEmployees.status} = ${filters.status ?? null}) AND
        (${dPat}::text IS NULL OR ${hrDepartments.name} ILIKE ${dPat}) AND
        (${pat}::text IS NULL OR ${hrEmployees.first_name} ILIKE ${pat} OR ${hrEmployees.last_name} ILIKE ${pat} OR ${hrEmployees.employee_code} ILIKE ${pat})
      `;

      const [items, counts] = await Promise.all([
        db.select({
          id:              hrEmployees.id,
          employee_code:   hrEmployees.employee_code,
          first_name:      hrEmployees.first_name,
          last_name:       hrEmployees.last_name,
          middle_name:     hrEmployees.middle_name,
          status:          hrEmployees.status,
          employment_status: hrEmployees.employment_status,
          hire_date:       hrEmployees.hire_date,
          base_salary:     hrEmployees.base_salary,
          phone_number:    hrEmployees.phone_number,
          email_work:      hrEmployees.email_work,
          photo_url:       hrEmployees.photo_url,
          department_name: hrDepartments.name,
          position_name:   hrPositions.title,
        })
          .from(hrEmployees)
          .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
          .leftJoin(hrPositions, eq(hrPositions.id, hrEmployees.position_id))
          .where(where)
          .orderBy(hrEmployees.last_name, hrEmployees.first_name)
          .limit(limit).offset(offset),
        db.select({ cnt: sql<number>`COUNT(*)::int` })
          .from(hrEmployees)
          .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
          .where(where),
      ]);
      return { ok: true, data: { items: castTo<HrRow[]>(items), total: Number(counts[0]?.cnt ?? 0) } };
    } catch (error: unknown) {
      this.logger.error(`findAllEmployees: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * Phase 2 / Task 2.4 — Add Employee transaction.
   *
   * Wraps the employee INSERT in `db.transaction(...)` so multi-table writes
   * (employee row + the per-create audit row written inline) commit together
   * or roll back together. The existing global AuditInterceptor still writes
   * its envelope-level audit AFTER the controller returns, but that row can
   * appear without a matching employee if the INSERT throws at the DB layer
   * (constraint violation, timeout) — the inline audit closes that gap.
   *
   * If a parallel module ever links the new employee to a `users` row inside
   * Add Employee (today the controller does not), the user INSERT lands here
   * too — adding another statement inside the same `tx.transaction` callback.
   * Any failure throws inside the callback, which rolls back every prior
   * statement in the same transaction.
   */
  async saveEmployee(employee: HrRow): Promise<Result<HrRow>> {
    try {
      const empPayload: Omit<typeof hrEmployees.$inferInsert, 'id'> = {
        employee_code:   (employee.employeeCode ?? employee.employee_code ?? null) as string,
        first_name:      (employee.firstName ?? employee.first_name ?? '') as string,
        last_name:       (employee.lastName ?? employee.last_name ?? '') as string,
        middle_name:     (employee.middleName ?? employee.middle_name ?? null) as string,
        department_id:   (employee.departmentId ?? employee.department_id ?? null) as number,
        position_id:     (employee.positionId ?? employee.position_id ?? null) as number,
        hire_date:       (employee.hireDate ?? employee.hire_date ?? _time.now().toISOString().split('T')[0]) as string,
        base_salary:     String(employee.baseSalary ?? employee.base_salary ?? 0),
        employment_type: (employee.employmentType ?? employee.employment_type ?? 'full_time') as string,
        status:          (employee.status ?? 'active') as string,
        phone_number:    (employee.phoneNumber ?? employee.phone_number ?? null) as string,
        email_work:      (employee.emailWork ?? employee.email_work ?? null) as string,
        gender:          (employee.gender ?? null) as string,
        date_of_birth:   (employee.dateOfBirth ?? employee.date_of_birth ?? null) as string,
      };

      type TxOutcome =
        | { kind: 'ok'; saved: typeof hrEmployees.$inferSelect }
        | { kind: 'err'; message: string };

      const outcome: TxOutcome = await db.transaction(async (tx): Promise<TxOutcome> => {
        // 1) Employee row — the primary write.
        const inserted = await tx
          .insert(hrEmployees)
          .values(empPayload as typeof hrEmployees.$inferInsert)
          .returning();
        const saved = inserted[0];
        if (!saved) {
          // Throwing inside the callback rolls back the whole tx.
          throw new Error('saveEmployee: INSERT returned no row');
        }

        // 2) Inline audit envelope — recorded in the same tx so the audit
        //    row cannot exist without the employee row (and vice versa).
        //    The global AuditInterceptor still writes the request-level
        //    audit envelope AFTER the controller returns; this row is the
        //    transactional, machine-readable counterpart.
        await tx.execute(sql`
          INSERT INTO audit_logs (id, table_name, record_id, action, new_values, created_at)
          VALUES (
            gen_random_uuid()::text,
            'employees',
            ${String((saved as { id: number }).id)},
            'CREATE',
            ${JSON.stringify(empPayload)}::jsonb,
            NOW()
          )
        `);

        return { kind: 'ok', saved };
      });

      if (outcome.kind === 'err') {
        return Err(outcome.message);
      }
      return { ok: true, data: castTo<HrRow>(outcome.saved) };
    } catch (error: unknown) {
      // Any throw inside the tx callback bubbles up here with the rollback
      // already complete — no half-state in the DB.
      this.logger.error(`saveEmployee: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateEmployee(id: string, data: HrRow): Promise<Result<HrRow>> {
    try {
      const rows = await db.update(hrEmployees).set({
        first_name:      sql`COALESCE(${(data.firstName ?? data.first_name ?? null)}, ${hrEmployees.first_name})`,
        last_name:       sql`COALESCE(${(data.lastName ?? data.last_name ?? null)}, ${hrEmployees.last_name})`,
        middle_name:     sql`COALESCE(${(data.middleName ?? data.middle_name ?? null)}, ${hrEmployees.middle_name})`,
        department_id:   sql`COALESCE(${(data.departmentId ?? data.department_id ?? null)}, ${hrEmployees.department_id})`,
        position_id:     sql`COALESCE(${(data.positionId ?? data.position_id ?? null)}, ${hrEmployees.position_id})`,
        base_salary:     sql`COALESCE(${data.baseSalary ?? data.base_salary ?? null}::text, ${hrEmployees.base_salary})`,
        status:          sql`COALESCE(${data.status ?? null}, ${hrEmployees.status})`,
        employment_type: sql`COALESCE(${(data.employmentType ?? data.employment_type ?? null)}, ${hrEmployees.employment_type})`,
        phone_number:    sql`COALESCE(${(data.phoneNumber ?? data.phone_number ?? null)}, ${hrEmployees.phone_number})`,
        email_work:      sql`COALESCE(${(data.emailWork ?? data.email_work ?? null)}, ${hrEmployees.email_work})`,
        updated_at:      _time.now(),
      }).where(eq(hrEmployees.id, parseInt(id, 10))).returning();
      return { ok: true, data: castTo<HrRow>((rows[0] ?? {}))};
    } catch (error: unknown) {
      this.logger.error(`updateEmployee: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findAttendance(employeeId: string, period: string): Promise<Result<HrRow[]>> {
    try {
      const [year, month] = period.split('-');
      const startDate = `${year}-${month}-01`;
      const rows = await runQuery<Row>(sql`
        SELECT * FROM attendance
        WHERE employee_id = ${parseInt(employeeId, 10)}
          AND date_trunc('month', attendance_date::date) = date_trunc('month', ${startDate}::date)
        ORDER BY attendance_date
      `);
      return Ok(castTo<HrRow[]>(rows.rows));
    } catch (error: unknown) {
      this.logger.error(`findAttendance: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveAttendance(r: HrRow): Promise<Result<HrRow>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, status, late_minutes, early_leave_minutes, overtime_minutes, source, created_at, updated_at)
        VALUES (${(r.employeeId ?? r.employee_id) as number}, ${(r.attendanceDate ?? r.attendance_date ?? _time.now().toISOString().split('T')[0]) as string}, ${(r.checkInTime ?? r.check_in_time ?? null) as string | null}, ${(r.checkOutTime ?? r.check_out_time ?? null) as string | null}, ${(r.status ?? 'present') as string}, ${(r.lateMinutes ?? r.late_minutes ?? 0) as number}, ${(r.earlyLeaveMinutes ?? r.early_leave_minutes ?? 0) as number}, ${(r.overtimeMinutes ?? r.overtime_minutes ?? 0) as number}, ${(r.source ?? null) as string | null}, NOW(), NOW())
        ON CONFLICT (employee_id, attendance_date) DO UPDATE
          SET check_in_time = EXCLUDED.check_in_time,
              check_out_time = EXCLUDED.check_out_time,
              status = EXCLUDED.status,
              overtime_minutes = EXCLUDED.overtime_minutes,
              updated_at = NOW()
        RETURNING *
      `);
      return { ok: true, data: castTo<HrRow>((rows.rows[0] ?? {}))};
    } catch (error: unknown) {
      this.logger.error(`saveAttendance: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

}
