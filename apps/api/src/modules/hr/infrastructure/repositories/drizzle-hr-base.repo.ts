/**
 * @module drizzle-hr-base.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { getTenantId } from '@shared/db/tenant-context';
import { eq, sql, ilike, and, isNull, or } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { IHrRepo, HrRow } from '../../domain/repositories/i-hr.repo';
import { HrLeaveRepo } from './drizzle-hr-leave.repo';
import { hrEmployees, hrDepartments, hrPositions } from '@shared/db';

type Row = Record<string, unknown>;


export class HrBaseRepository {
  protected readonly logger = new Logger('HrRepository');

  constructor(protected readonly leaveRepo: HrLeaveRepo) {}

  async findEmployeeById(id: string): Promise<Result<HrRow | null>> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return Ok(null);
    try {
      // A93 tenant-filter wiring: scope read to the request tenant
      // (TenantContextInterceptor resolves it from JWT; single-tenant default = 1).
      const tenantId = getTenantId();
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
        // Org-schema (canonical Lavozim/Bo'lim) — from employees.org_function_id.
        // Legacy department_name/position_name above are being phased out.
        orgPositionName:   sql<string | null>`(SELECT ofn.position_name FROM employees e2 JOIN org_functions ofn ON ofn.id = e2.org_function_id WHERE e2.id = ${hrEmployees.id})`,
        orgDepartmentName: sql<string | null>`(SELECT od.name FROM employees e3 JOIN org_functions ofn ON ofn.id = e3.org_function_id JOIN org_departments od ON od.id = ofn.department_id WHERE e3.id = ${hrEmployees.id})`,
      })
        .from(hrEmployees)
        .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .leftJoin(hrPositions, eq(hrPositions.id, hrEmployees.position_id))
        .where(and(eq(hrEmployees.id, numId), eq(hrEmployees.tenant_id, tenantId)))
        .limit(1);
      return Ok(castTo<HrRow | null>((rows[0] ?? null)));
    } catch (error: unknown) {
      this.logger.error(`findEmployeeById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findAllEmployees(filters: { department?: string; departmentId?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<Result<{ items: HrRow[]; total: number }>> {
    try {
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const offset = (page - 1) * limit;
      const pat = filters.search ? `%${filters.search}%` : null;
      // P1.6.4: accept departmentId (camelCase from FE) as alias for department
      const deptFilter = filters.department ?? filters.departmentId;
      const dPat = deptFilter ? `%${deptFilter}%` : null;

      // A93 tenant-filter wiring: scope the list to the request tenant
      // (TenantContextInterceptor resolves it from JWT; single-tenant default = 1).
      const tenantId = getTenantId();

      const where = sql`
        ${hrEmployees.deleted_at} IS NULL AND
        ${hrEmployees.tenant_id} = ${tenantId} AND
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
          department_id:   hrEmployees.department_id,
          department_name: hrDepartments.name,
          position_name:   hrPositions.title,
          telegram_chat_id: hrEmployees.telegram_chat_id,
          date_of_birth:   hrEmployees.date_of_birth,
          birth_date:      hrEmployees.birth_date,
          total_points:    hrEmployees.total_points,
          // P0.1 fix: discipline_count keeps real data; is_soft_deleted removed (column absent in DB)
          discipline_count: sql<number>`(
            SELECT COUNT(*)::int FROM discipline_records dr
            WHERE dr.employee_id = ${hrEmployees.id}
            AND dr.created_at > NOW() - INTERVAL '12 months'
          )`,
          // P0.1 fix: courses_total — lms_enrollments.user_id→employee mapping unknown; safe 0
          courses_total: sql<number>`0`,
          // P0.1 fix: bonus_payments table removed in dedup sprint; safe 0 until mapping resolved
          bonus_amount: sql<number>`0`,
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
      // Convert 0 FK references to null (0 is not a valid FK, would cause constraint error)
      const deptId  = (employee.departmentId  ?? employee.department_id  ?? null);
      const posId   = (employee.positionId    ?? employee.position_id    ?? null);
      const mgrId   = (employee.managerId     ?? employee.manager_id     ?? null);
      // Bug #3 fix (orphan/mismatched fields): EmployeeDialog.tsx form sends `employeeId`
      // (tabel raqami) / `phone` / `address` / `latitude` / `longitude` — none of those
      // exact keys were ever read here, so the user-entered values were silently replaced
      // (employee_code auto-generated) or dropped entirely (phone/address/lat/lng), even
      // though `employee_code` / `phone_number` / `address_actual` / `lat` / `lng` columns
      // exist. Read both the FE key and the canonical DB key as fallbacks.
      const latVal = employee.latitude ?? employee.lat ?? null;
      const lngVal = employee.longitude ?? employee.lng ?? null;

      const empPayload: Omit<typeof hrEmployees.$inferInsert, 'id'> = {
        employee_code:     (employee.employeeCode ?? employee.employee_code ?? employee.employeeId ?? null) as string,
        first_name:        (employee.firstName ?? employee.first_name ?? '') as string,
        last_name:         (employee.lastName ?? employee.last_name ?? '') as string,
        middle_name:       (employee.middleName ?? employee.middle_name ?? null) as string,
        department_id:     (deptId  && Number(deptId)  > 0 ? Number(deptId)  : null) as number | null,
        position_id:       (posId   && Number(posId)   > 0 ? Number(posId)   : null) as number | null,
        manager_id:        (mgrId   && Number(mgrId)   > 0 ? Number(mgrId)   : null) as number | null,
        hire_date:         (employee.hireDate ?? employee.hire_date ?? _time.now().toISOString().split('T')[0]) as string,
        base_salary:       String(employee.baseSalary ?? employee.base_salary ?? 0),
        employment_type:   (employee.employmentType ?? employee.employment_type ?? 'full_time') as string,
        employment_status: (employee.employmentStatus ?? employee.employment_status ?? 'active') as string,
        status:            (employee.status ?? 'active') as string,
        is_active:         true,
        phone_number:      (employee.phoneNumber ?? employee.phone_number ?? employee.phone ?? null) as string,
        email_work:        (employee.emailWork ?? employee.email_work ?? null) as string,
        telegram_chat_id:  (employee.telegramChatId ?? employee.telegram_chat_id ?? null) as string,
        gender:            (employee.gender ?? null) as string,
        date_of_birth:     (employee.dateOfBirth ?? employee.date_of_birth ?? null) as string,
        birth_date:        (employee.birthDate ?? employee.birth_date ?? null) as string,
        photo_url:         (employee.photoUrl ?? employee.photo_url ?? null) as string,
        address_actual:    (employee.address ?? employee.address_actual ?? null) as string,
        lat:               latVal !== null && latVal !== undefined && latVal !== '' ? String(latVal) : null,
        lng:               lngVal !== null && lngVal !== undefined && lngVal !== '' ? String(lngVal) : null,
        shift:              (employee.shift ?? null) as string,
        salary_type:        (employee.salaryType ?? employee.salary_type ?? null) as string,
        workshop_zone:      (employee.workshopZone ?? employee.workshop_zone ?? null) as string,
        attestation_date:   (employee.attestationDate ?? employee.attestation_date ?? null) as string,
        marital_status:     (employee.maritalStatus ?? employee.marital_status ?? null) as string,
        children_count:     (employee.childrenCount ?? employee.children_count ?? null) as number | null,
        children_education: (employee.childrenEducation ?? employee.children_education ?? null) as string,
        household_size:     (employee.householdSize ?? employee.household_size ?? null) as number | null,
        household_members:  (employee.householdMembers ?? employee.household_members ?? null) as string,
        housing_type:       (employee.housingType ?? employee.housing_type ?? null) as string,
      };

      const saved = await db.transaction(async (tx): Promise<typeof hrEmployees.$inferSelect> => {
        // 1) Employee row — the primary write.
        const inserted = await tx
          .insert(hrEmployees)
          .values(empPayload as typeof hrEmployees.$inferInsert)
          .returning();
        const row = inserted[0];
        if (!row) {
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
            ${String((row as { id: number }).id)},
            'CREATE',
            ${JSON.stringify(empPayload)}::jsonb,
            NOW()
          )
        `);

        return row;
      });

      return { ok: true, data: castTo<HrRow>(saved) };
    } catch (error: unknown) {
      // Any throw inside the tx callback bubbles up here with the rollback
      // already complete — no half-state in the DB.
      this.logger.error(`saveEmployee: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateEmployee(id: string, data: HrRow): Promise<Result<HrRow>> {
    try {
      // Bug #1/#3 fix (2026-07-13): this method silently dropped several fields the
      // callers already send:
      //   - deleteEmployee() (hr-employees.controller.ts) sends `deleted_at` +
      //     `employment_status` intending a real soft-delete — neither was in the old
      //     SET list, so `deleted_at` never landed in the DB and the "deleted" employee
      //     stayed visible forever (findAllEmployees filters on `deleted_at IS NULL`).
      //   - updateEmployeeStatus() sends `employmentStatus` — also missing.
      //   - The Edit-employee form sends telegramChatId/managerId/hireDate/birthDate/
      //     gender/address/latitude/longitude/shift/... — all missing.
      // On top of that, the pre-existing `base_salary` line cast the parameter to
      // `::text` while the column is `numeric(15,2)` — COALESCE(text, numeric) has "no
      // common type" and Postgres rejects the query outright (verified live via psql/pg:
      // "types text and numeric have no common type"), meaning EVERY call to this method
      // (edit, status-change, delete) was actually throwing, not silently succeeding.
      // Fix: cast every COALESCE branch to the column's real type, and cover the full
      // field set (including the bug#3 orphan-field columns added in the same change).
      const latVal = data.latitude ?? data.lat ?? null;
      const lngVal = data.longitude ?? data.lng ?? null;
      const rows = await db.update(hrEmployees).set({
        first_name:      sql`COALESCE(${(data.firstName ?? data.first_name ?? null)}, ${hrEmployees.first_name})`,
        last_name:       sql`COALESCE(${(data.lastName ?? data.last_name ?? null)}, ${hrEmployees.last_name})`,
        middle_name:     sql`COALESCE(${(data.middleName ?? data.middle_name ?? null)}, ${hrEmployees.middle_name})`,
        employee_code:   sql`COALESCE(${(data.employeeCode ?? data.employee_code ?? data.employeeId ?? null)}, ${hrEmployees.employee_code})`,
        department_id:   sql`COALESCE(${(data.departmentId ?? data.department_id ?? null)}::integer, ${hrEmployees.department_id})`,
        position_id:     sql`COALESCE(${(data.positionId ?? data.position_id ?? null)}::integer, ${hrEmployees.position_id})`,
        manager_id:      sql`COALESCE(${(data.managerId ?? data.manager_id ?? null)}::integer, ${hrEmployees.manager_id})`,
        base_salary:     sql`COALESCE(${data.baseSalary ?? data.base_salary ?? null}::numeric, ${hrEmployees.base_salary})`,
        status:          sql`COALESCE(${data.status ?? null}, ${hrEmployees.status})`,
        employment_status: sql`COALESCE(${(data.employmentStatus ?? data.employment_status ?? null)}, ${hrEmployees.employment_status})`,
        employment_type: sql`COALESCE(${(data.employmentType ?? data.employment_type ?? null)}, ${hrEmployees.employment_type})`,
        phone_number:    sql`COALESCE(${(data.phoneNumber ?? data.phone_number ?? data.phone ?? null)}, ${hrEmployees.phone_number})`,
        email_work:      sql`COALESCE(${(data.emailWork ?? data.email_work ?? null)}, ${hrEmployees.email_work})`,
        telegram_chat_id: sql`COALESCE(${(data.telegramChatId ?? data.telegram_chat_id ?? null)}, ${hrEmployees.telegram_chat_id})`,
        hire_date:       sql`COALESCE(${(data.hireDate ?? data.hire_date ?? null)}::date, ${hrEmployees.hire_date})`,
        birth_date:      sql`COALESCE(${(data.birthDate ?? data.birth_date ?? null)}::date, ${hrEmployees.birth_date})`,
        gender:          sql`COALESCE(${(data.gender ?? null)}, ${hrEmployees.gender})`,
        photo_url:       sql`COALESCE(${(data.photoUrl ?? data.photo_url ?? null)}, ${hrEmployees.photo_url})`,
        address_actual:  sql`COALESCE(${(data.address ?? data.address_actual ?? null)}, ${hrEmployees.address_actual})`,
        lat:             sql`COALESCE(${latVal !== null && latVal !== undefined && latVal !== '' ? String(latVal) : null}::numeric, ${hrEmployees.lat})`,
        lng:             sql`COALESCE(${lngVal !== null && lngVal !== undefined && lngVal !== '' ? String(lngVal) : null}::numeric, ${hrEmployees.lng})`,
        shift:              sql`COALESCE(${(data.shift ?? null)}, ${hrEmployees.shift})`,
        salary_type:        sql`COALESCE(${(data.salaryType ?? data.salary_type ?? null)}, ${hrEmployees.salary_type})`,
        workshop_zone:      sql`COALESCE(${(data.workshopZone ?? data.workshop_zone ?? null)}, ${hrEmployees.workshop_zone})`,
        attestation_date:   sql`COALESCE(${(data.attestationDate ?? data.attestation_date ?? null)}::date, ${hrEmployees.attestation_date})`,
        marital_status:     sql`COALESCE(${(data.maritalStatus ?? data.marital_status ?? null)}, ${hrEmployees.marital_status})`,
        children_count:     sql`COALESCE(${(data.childrenCount ?? data.children_count ?? null)}::integer, ${hrEmployees.children_count})`,
        children_education: sql`COALESCE(${(data.childrenEducation ?? data.children_education ?? null)}, ${hrEmployees.children_education})`,
        household_size:     sql`COALESCE(${(data.householdSize ?? data.household_size ?? null)}::integer, ${hrEmployees.household_size})`,
        household_members:  sql`COALESCE(${(data.householdMembers ?? data.household_members ?? null)}, ${hrEmployees.household_members})`,
        housing_type:       sql`COALESCE(${(data.housingType ?? data.housing_type ?? null)}, ${hrEmployees.housing_type})`,
        is_active:       sql`COALESCE(${(data.isActive ?? data.is_active ?? null)}::boolean, ${hrEmployees.is_active})`,
        deleted_at:      sql`COALESCE(${(data.deletedAt ?? data.deleted_at ?? null)}::timestamptz, ${hrEmployees.deleted_at})`,
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
