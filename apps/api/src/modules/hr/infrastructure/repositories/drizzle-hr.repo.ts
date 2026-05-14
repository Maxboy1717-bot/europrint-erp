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

  async updatePayroll(id: string, data: HrRow): Promise<Result<HrRow>> {
    try {
      const rows = await db.update(salary_history).set({
        base_salary:   data.baseSalary    != null ? String(data.baseSalary)    : undefined,
        salary_earned: data.netSalary     != null ? String(data.netSalary)     : undefined,
        total_bonuses: data.totalBonuses  != null ? String(data.totalBonuses)  : (data.bonus != null ? String(data.bonus) : undefined),
        other_bonuses: data.otherBonuses  != null ? String(data.otherBonuses)  : (data.other_bonuses != null ? String(data.other_bonuses) : undefined),
        salary_period_end: data.paymentDate != null ? String(data.paymentDate) : undefined,
        notes:         data.notes         != null ? String(data.notes)         : undefined,
        updated_at:    _time.now(),
      }).where(eq(salary_history.id, parseInt(id, 10))).returning();
      return { ok: true, data: castTo<HrRow>((rows[0] ?? {}))};
    } catch (error: unknown) {
      this.logger.error(`updatePayroll: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async getPayrollSummary(period: string): Promise<Result<{ totalGross: number; totalNet: number; totalINPS: number; totalJSHD: number; employeeCount: number }>> {
    try {
      const inpsRate = await runQuery<{ value: string }>(sql`SELECT value FROM settings WHERE key = 'inps_rate' LIMIT 1`)
        .then(r => parseFloat(r.rows[0]?.value ?? '0.08'))
        .catch(() => 0.08);
      const jshdRate = await runQuery<{ value: string }>(sql`SELECT value FROM settings WHERE key = 'jshd_rate' LIMIT 1`)
        .then(r => parseFloat(r.rows[0]?.value ?? '0.12'))
        .catch(() => 0.12);
      const rows = await db.select({
        totalGross:     sql<string>`COALESCE(SUM(${salary_history.base_salary}::numeric), 0)`,
        totalNet:       sql<string>`COALESCE(SUM(${salary_history.salary_earned}::numeric), 0)`,
        employeeCount:  sql<string>`COUNT(DISTINCT ${salary_history.employee_id})`,
      })
        .from(salary_history)
        .where(sql`TO_CHAR(${salary_history.salary_period_start}::date, 'YYYY-MM') = ${period}`);
      const row = rows[0] ?? {};
      const gross = Number(row.totalGross ?? 0);
      return { ok: true, data: { totalGross: gross, totalNet: Number(row.totalNet ?? 0), totalINPS: gross * inpsRate, totalJSHD: gross * jshdRate, employeeCount: Number(row.employeeCount ?? 0) } };
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
        id:             discipline_records.id,
        employee_id:    discipline_records.employee_id,
        violation_type: discipline_records.violation_type,
        severity:       discipline_records.severity,
        status:         discipline_records.status,
        violation_date: discipline_records.violation_date,
        fine_amount:    discipline_records.fine_amount,
        created_at:     discipline_records.created_at,
        employee_name:  sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
      })
        .from(discipline_records)
        .innerJoin(hrEmployees, eq(hrEmployees.id, discipline_records.employee_id))
        .where(sql`
          ${discipline_records.deleted_at} IS NULL AND ${discipline_records.is_soft_deleted} = false AND
          (${eid > 0 ? eid : null}::int IS NULL OR ${discipline_records.employee_id} = ${eid > 0 ? eid : null})
        `)
        .orderBy(sql`${discipline_records.created_at} DESC`)
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
}
