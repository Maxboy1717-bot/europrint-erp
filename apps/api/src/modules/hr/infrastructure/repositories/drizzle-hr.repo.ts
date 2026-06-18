/**
 * @module drizzle-hr.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { HrBaseRepository } from './drizzle-hr-base.repo';
import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { eq, sql, ilike, and, isNull, or, desc } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { IHrRepo, HrRow, OvertimePolicyRow } from '../../domain/repositories/i-hr.repo';
import { HrLeaveRepo } from './drizzle-hr-leave.repo';
import { overtime_policy } from '@shared/db/schema-hr-overtime';
import {
  hrEmployees, hrDepartments, hrPositions,
  salary_history, payroll_periods_hr,
  candidates, discipline_records, hr_health_checkups,
} from '@shared/db';

type Row = Record<string, unknown>;


@Injectable()
export class HrRepository extends HrBaseRepository implements IHrRepo {
  constructor(leaveRepo: HrLeaveRepo) { super(leaveRepo); }
  async findPayroll(filters: { employeeId?: string; period?: string; status?: string }): Promise<Result<HrRow[]>> {
    try {
      const eid = filters.employeeId ? parseInt(filters.employeeId, 10) : null;
      const rows = await db.select({
        id:              salary_history.id,
        employee_id:     salary_history.employee_id,
        employee_name:   sql<string>`CONCAT(${hrEmployees.first_name}, ' ', ${hrEmployees.last_name})`,
        employee_code:   hrEmployees.employee_code,
        salary_period_start: salary_history.salary_period_start,
        salary_period_end:   salary_history.salary_period_end,
        base_salary:         salary_history.base_salary,
        salary_earned:       salary_history.salary_earned,
        total_bonuses:       salary_history.total_bonuses,
      })
        .from(salary_history)
        .innerJoin(hrEmployees, eq(hrEmployees.id, salary_history.employee_id))
        .where(sql`
          (${eid}::int IS NULL OR ${salary_history.employee_id} = ${eid}) AND
          (${filters.period ?? null}::text IS NULL OR TO_CHAR(${salary_history.salary_period_start}::date, 'YYYY-MM') = ${filters.period ?? null})
        `)
        .orderBy(sql`${salary_history.salary_period_start} DESC`)
        .limit(100);
      return Ok(castTo<HrRow[]>(rows));
    } catch (error: unknown) {
      this.logger.error(`findPayroll: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async savePayroll(payrollRecord: HrRow): Promise<Result<HrRow>> {
    try {
      const rows = await db.insert(salary_history).values({
        employee_id:         (payrollRecord.employeeId ?? payrollRecord.employee_id) as number,
        salary_period_start: (payrollRecord.periodStart ?? _time.now().toISOString().split('T')[0]) as string,
        salary_period_end:   (payrollRecord.periodEnd ?? _time.now().toISOString().split('T')[0]) as string,
        base_salary:         String(payrollRecord.baseSalary ?? payrollRecord.gross ?? 0),
        salary_earned:       String(payrollRecord.netSalary ?? payrollRecord.net ?? 0),
        total_bonuses:       String(payrollRecord.bonus ?? 0),
        other_bonuses:       String(payrollRecord.otherBonuses ?? payrollRecord.other_bonuses ?? 0),
      }).returning();
      return { ok: true, data: castTo<HrRow>((rows[0] ?? {}))};
    } catch (error: unknown) {
      this.logger.error(`savePayroll: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  // P1.6.3: wrap salary review in a single DB transaction
  async reviewSalaryTransactional(employeeId: number, newSalary: number, today: string): Promise<Result<HrRow>> {
    try {
      let historyRow: HrRow = {};
      await db.transaction(async (tx) => {
        // 1. UPDATE employees.base_salary
        await tx.update(hrEmployees)
          .set({ base_salary: String(newSalary) })
          .where(eq(hrEmployees.id, employeeId));
        // 2. INSERT salary_history row
        const rows = await tx.insert(salary_history).values({
          employee_id:         employeeId,
          salary_period_start: today,
          salary_period_end:   today,
          base_salary:         String(newSalary),
          salary_earned:       String(newSalary),
          total_bonuses:       '0',
          other_bonuses:       '0',
        }).returning();
        historyRow = castTo<HrRow>(rows[0] ?? {});
      });
      return Ok(historyRow);
    } catch (error: unknown) {
      this.logger.error(`reviewSalaryTransactional: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updatePayroll(id: string, data: HrRow): Promise<Result<HrRow>> {
    try {
      const rows = await db.update(salary_history).set({
        base_salary:   data.baseSalary    != null ? String(data.baseSalary)    : undefined,
        salary_earned: data.netSalary     != null ? String(data.netSalary)     : undefined,
        total_bonuses: data.totalBonuses  != null ? String(data.totalBonuses)  : (data.bonus != null ? String(data.bonus) : undefined),
        other_bonuses: data.otherBonuses  != null ? String(data.otherBonuses)  : (data.other_bonuses != null ? String(data.other_bonuses) : undefined),
        salary_period_end: data.paymentDate != null ? String(data.paymentDate) : undefined,
        updated_at:    _time.now(),
      }).where(eq(salary_history.id, parseInt(id, 10))).returning();
      return { ok: true, data: castTo<HrRow>((rows[0] ?? {}))};
    } catch (error: unknown) {
      this.logger.error(`updatePayroll: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async getPayrollSummary(period: string): Promise<Result<{ totalGross: number; totalNet: number; employeeCount: number }>> {
    try {
      const rows = await db.select({
        totalGross:     sql<string>`COALESCE(SUM(${salary_history.base_salary}::numeric), 0)`,
        totalNet:       sql<string>`COALESCE(SUM(${salary_history.salary_earned}::numeric), 0)`,
        employeeCount:  sql<string>`COUNT(DISTINCT ${salary_history.employee_id})`,
      })
        .from(salary_history)
        .where(sql`TO_CHAR(${salary_history.salary_period_start}::date, 'YYYY-MM') = ${period}`);
      const row = rows[0] ?? {};
      // ERP gross-only: tax (INPS/JSHD) totals are computed in 1C, not here.
      return { ok: true, data: { totalGross: Number(row.totalGross ?? 0), totalNet: Number(row.totalNet ?? 0), employeeCount: Number(row.employeeCount ?? 0) } };
    } catch (error: unknown) {
      this.logger.error(`getPayrollSummary: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findPayrollRuns(period?: string): Promise<Result<{ data: HrRow[]; total: number }>> {
    try {
      const pat = period ? `%${period}%` : null;
      const countResult = await runQuery<{ c: string }>(sql`
        SELECT COUNT(*)::text AS c FROM payroll_periods_hr
        WHERE ${pat}::text IS NULL OR period_name ILIKE ${pat}
      `);
      const total = Number(countResult.rows[0]?.c ?? '0');
      const rows = await db.select({
        id:                   payroll_periods_hr.id,
        period_name:          payroll_periods_hr.period_name,
        status:               payroll_periods_hr.status,
        total_payroll_amount: payroll_periods_hr.total_payroll_amount,
        employee_count:       payroll_periods_hr.employee_count,
        period_start_date:    payroll_periods_hr.period_start_date,
        period_end_date:      payroll_periods_hr.period_end_date,
        created_at:           payroll_periods_hr.created_at,
        closed_at:            payroll_periods_hr.closed_at,
      })
        .from(payroll_periods_hr)
        .where(sql`${pat}::text IS NULL OR ${payroll_periods_hr.period_name} ILIKE ${pat}`)
        .orderBy(sql`${payroll_periods_hr.period_start_date} DESC`)
        .limit(50);
      return Ok({ data: castTo<HrRow[]>(rows), total });
    } catch (error: unknown) {
      this.logger.error(`findPayrollRuns: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findPayrollPeriods(): Promise<Result<{ data: HrRow[]; total: number }>> {
    try {
      const rows = await db.select({
        id:                   payroll_periods_hr.id,
        period_name:          payroll_periods_hr.period_name,
        status:               payroll_periods_hr.status,
        total_payroll_amount: payroll_periods_hr.total_payroll_amount,
        employee_count:       payroll_periods_hr.employee_count,
        period_start_date:    payroll_periods_hr.period_start_date,
        period_end_date:      payroll_periods_hr.period_end_date,
        created_at:           payroll_periods_hr.created_at,
        closed_at:            payroll_periods_hr.closed_at,
      })
        .from(payroll_periods_hr)
        .orderBy(sql`${payroll_periods_hr.period_start_date} DESC`)
        .limit(100);
      return Ok({ data: castTo<HrRow[]>(rows), total: rows.length });
    } catch (error: unknown) {
      this.logger.error(`findPayrollPeriods: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findVacancyCandidates(vacancyId?: string): Promise<Result<HrRow[]>> {
    try {
      const vid = vacancyId ? parseInt(vacancyId, 10) : 0;
      const rows = await db.select({
        id:         candidates.id,
        first_name: candidates.first_name,
        last_name:  candidates.last_name,
        email:      candidates.email,
        status:     candidates.status,
        rating:     candidates.rating,
        vacancy_id: candidates.vacancy_id,
        created_at: candidates.created_at,
      })
        .from(candidates)
        .where(sql`
          ${candidates.deleted_at} IS NULL AND ${candidates.is_archived} = false AND
          (${vid > 0 ? vid : null}::int IS NULL OR ${candidates.vacancy_id} = ${vid > 0 ? vid : null})
        `)
        .orderBy(sql`${candidates.created_at} DESC`)
        .limit(50);
      return Ok(castTo<HrRow[]>(rows));
    } catch (error: unknown) {
      this.logger.error(`findVacancyCandidates: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findDisciplineRecords(employeeId?: string): Promise<Result<HrRow[]>> {
    try {
      const eid = employeeId ? parseInt(employeeId, 10) : 0;
      const rows = await db.select({
        id:              discipline_records.id,
        employee_id:     discipline_records.employeeId,
        violation_type:  discipline_records.violationType,
        discipline_type: discipline_records.violationType,  // alias for FE
        severity:        discipline_records.severity,
        status:          discipline_records.status,
        violation_date:  discipline_records.violationDate,
        fine_amount:     discipline_records.fineAmount,
        created_at:      discipline_records.createdAt,
        // P1.19.1: FE expects full_name and department — join departments
        full_name:       sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
        employee_name:   sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
        department:      hrDepartments.name,
        department_name: hrDepartments.name,
      })
        .from(discipline_records)
        .innerJoin(hrEmployees, eq(hrEmployees.id, discipline_records.employeeId))
        .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .where(sql`
          ${discipline_records.isSoftDeleted} = false AND
          (${eid > 0 ? eid : null}::int IS NULL OR ${discipline_records.employeeId} = ${eid > 0 ? eid : null})
        `)
        .orderBy(sql`${discipline_records.createdAt} DESC`)
        .limit(50);
      return Ok(castTo<HrRow[]>(rows));
    } catch (error: unknown) {
      this.logger.error(`findDisciplineRecords: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findHealthCheckups(departmentId?: string): Promise<Result<HrRow[]>> {
    try {
      const did = departmentId ? parseInt(departmentId, 10) : 0;
      const rows = await db.select()
        .from(hr_health_checkups)
        .where(sql`${did > 0 ? did : null}::int IS NULL OR ${hr_health_checkups.department_id} = ${did > 0 ? did : null}`)
        .orderBy(sql`${hr_health_checkups.updated_at} DESC`)
        .limit(100);
      return Ok(castTo<HrRow[]>(rows));
    } catch (error: unknown) {
      this.logger.error(`findHealthCheckups: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findActiveOvertimePolicy(): Promise<Result<OvertimePolicyRow | null>> {
    try {
      const rows = await db
        .select()
        .from(overtime_policy)
        .where(eq(overtime_policy.isActive, true))
        .orderBy(desc(overtime_policy.effectiveFrom))
        .limit(1);
      const list = Array.isArray(rows) ? rows : [];
      if (!list.length) return Ok(null);
      const row = list[0] as Record<string, unknown>;
      return Ok({
        regularOvertimeHours: Number(row.regularOvertimeHours ?? row.regular_overtime_hours ?? 0),
        regularMultiplier:    Number(row.regularMultiplier    ?? row.regular_multiplier    ?? 0),
        extendedMultiplier:   Number(row.extendedMultiplier   ?? row.extended_multiplier   ?? 0),
        weekendMultiplier:    Number(row.weekendMultiplier    ?? row.weekend_multiplier    ?? 0),
        nightShiftBonus:      Number(row.nightShiftBonus      ?? row.night_shift_bonus      ?? 0),
        nightShiftStartHour:  Number(row.nightShiftStartHour  ?? row.night_shift_start_hour ?? 0),
        nightShiftEndHour:    Number(row.nightShiftEndHour    ?? row.night_shift_end_hour   ?? 0),
      });
    } catch (error: unknown) {
      this.logger.error(`findActiveOvertimePolicy: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  findLeaveById(id: string) { return this.leaveRepo.findLeaveById(id); }
  findLeaves(filters: Row) { return this.leaveRepo.findLeaves(filters); }
  saveLeave(leave: HrRow) { return this.leaveRepo.saveLeave(leave); }
  updateLeave(id: string, data: HrRow) { return this.leaveRepo.updateLeave(id, data); }
  getLeaveBalance(employeeId: string) { return this.leaveRepo.getLeaveBalance(employeeId); }
  getLeaveStats() { return this.leaveRepo.getLeaveStats(); }
  save360Feedback(feedback: Row) { return this.leaveRepo.save360Feedback(feedback as Parameters<typeof this.leaveRepo.save360Feedback>[0]); }
  getAttendanceStats(employeeId: string, period: string) { return this.leaveRepo.getAttendanceStats(employeeId, period); }
  getFeedbackByPeriod(empId: number, start: Date, end: Date) { return this.leaveRepo.getFeedbackByPeriod(empId, start, end); }
  getAttendanceByPeriod(empId: number, start: Date, end: Date) { return this.leaveRepo.getAttendanceByPeriod(empId, start, end); }

  async getRazryadCoefficient(employeeId: number): Promise<number> {
    try {
      const rows = await runQuery<{ coefficient: string | null }>(sql`
        SELECT COALESCE(rl.coefficient, 1.0)::numeric AS coefficient
        FROM employees e
        LEFT JOIN org_functions ofn ON ofn.id = e.org_function_id
        LEFT JOIN razryad_levels rl ON rl.id = ofn.razryad_level_id
        WHERE e.id = ${employeeId}
        LIMIT 1
      `);
      const coeff = parseFloat(String(rows.rows[0]?.coefficient ?? '1'));
      return isNaN(coeff) || coeff <= 0 ? 1.0 : coeff;
    } catch {
      return 1.0;
    }
  }

  async getMonthlyLateCount(employeeId: number, year: number, month: number): Promise<number> {
    try {
      const rows = await runQuery<{ cnt: string }>(sql`
        SELECT COUNT(*)::text AS cnt
        FROM attendance
        WHERE employee_id = ${employeeId}
          AND status = 'late'
          AND EXTRACT(YEAR  FROM attendance_date) = ${year}
          AND EXTRACT(MONTH FROM attendance_date) = ${month}
      `);
      const cnt = parseInt(String(rows.rows[0]?.cnt ?? '0'), 10);
      return isNaN(cnt) ? 0 : cnt;
    } catch {
      return 0;
    }
  }
}
