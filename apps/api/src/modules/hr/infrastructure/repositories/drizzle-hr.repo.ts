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
  payroll_period_record, salary_change_log, payroll_periods_hr,
  candidates, discipline_records, hr_health_checkups,
  accounts,
} from '@shared/db';
import { entries } from '@workspace/db';

type Row = Record<string, unknown>;


@Injectable()
export class HrRepository extends HrBaseRepository implements IHrRepo {
  constructor(leaveRepo: HrLeaveRepo) { super(leaveRepo); }
  async findPayroll(filters: { employeeId?: string; period?: string; status?: string }): Promise<Result<HrRow[]>> {
    try {
      const eid = filters.employeeId ? parseInt(filters.employeeId, 10) : null;
      const rows = await db.select({
        id:              payroll_period_record.id,
        employee_id:     payroll_period_record.employee_id,
        employee_name:   sql<string>`CONCAT(${hrEmployees.first_name}, ' ', ${hrEmployees.last_name})`,
        employee_code:   hrEmployees.employee_code,
        salary_period_start: payroll_period_record.salary_period_start,
        salary_period_end:   payroll_period_record.salary_period_end,
        base_salary:         payroll_period_record.base_salary,
        salary_earned:       payroll_period_record.salary_earned,
        total_bonuses:       payroll_period_record.total_bonuses,
        status:              payroll_period_record.status,
        approved_by:         payroll_period_record.approved_by,
        paid_by:             payroll_period_record.paid_by,
        paid_date:           payroll_period_record.paid_date,
      })
        .from(payroll_period_record)
        .innerJoin(hrEmployees, eq(hrEmployees.id, payroll_period_record.employee_id))
        .where(sql`
          (${eid}::int IS NULL OR ${payroll_period_record.employee_id} = ${eid}) AND
          (${filters.period ?? null}::text IS NULL OR TO_CHAR(${payroll_period_record.salary_period_start}::date, 'YYYY-MM') = ${filters.period ?? null})
        `)
        .orderBy(sql`${payroll_period_record.salary_period_start} DESC`)
        .limit(100);
      return Ok(castTo<HrRow[]>(rows));
    } catch (error: unknown) {
      this.logger.error(`findPayroll: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async savePayroll(payrollRecord: HrRow): Promise<Result<HrRow>> {
    try {
      const empId = (payrollRecord.employeeId ?? payrollRecord.employee_id) as number;
      const toDateStr = (v: unknown): string =>
        v instanceof Date
          ? v.toISOString().split('T')[0]
          : (String(v ?? '').slice(0, 10) || _time.now().toISOString().split('T')[0]);
      const pStart  = toDateStr(payrollRecord.periodStart);
      const pEnd    = toDateStr(payrollRecord.periodEnd);
      const baseSal = String(payrollRecord.baseSalary ?? payrollRecord.gross ?? 0);
      const earned  = String(payrollRecord.netSalary ?? payrollRecord.net ?? 0);
      const bonuses = String(payrollRecord.bonus ?? 0);
      const otherB  = String(payrollRecord.otherBonuses ?? payrollRecord.other_bonuses ?? 0);
      // payroll_period_record (Concept B, split from salary_history 2026-07-02) — clean payroll-
      // period-only insert. No more legacy audit-column hack (user_id/effective_date/change_type/
      // new_salary) — those now live in salary_change_log (Concept A: reviewSalaryTransactional).
      const r = await runQuery<HrRow>(sql`
        INSERT INTO payroll_period_record
          (employee_id, salary_period_start, salary_period_end, base_salary, salary_earned,
           total_bonuses, other_bonuses)
        VALUES
          (${empId}, ${pStart}::date, ${pEnd}::date,
           ${baseSal}::numeric, ${earned}::numeric, ${bonuses}::numeric, ${otherB}::numeric)
        RETURNING *
      `);
      return { ok: true, data: castTo<HrRow>((r.rows[0] ?? {})) };
    } catch (error: unknown) {
      this.logger.error(`savePayroll: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  // P1.6.3: wrap salary review in a single DB transaction
  // Concept A (salary_change_log, split from salary_history 2026-07-02): a salary "review"/raise
  // is a CHANGE-EVENT, not a payroll-period calculation — it belongs to the audit-log table, not
  // payroll_period_record.
  async reviewSalaryTransactional(employeeId: number, newSalary: number, today: string): Promise<Result<HrRow>> {
    try {
      let historyRow: HrRow = {};
      await db.transaction(async (tx) => {
        // 1. Read current base_salary (previous_salary for the audit row) + linked user_id
        const empRows = await tx.select({ base_salary: hrEmployees.base_salary, user_id: hrEmployees.user_id })
          .from(hrEmployees).where(eq(hrEmployees.id, employeeId)).limit(1);
        const prevSalary = empRows[0]?.base_salary ?? null;
        const userId     = empRows[0]?.user_id ?? null;
        // 2. UPDATE employees.base_salary
        await tx.update(hrEmployees)
          .set({ base_salary: String(newSalary) })
          .where(eq(hrEmployees.id, employeeId));
        // 3. INSERT salary_change_log row (audit event — not tied to a payroll period)
        const inserted = await tx.insert(salary_change_log).values({
          employee_id:     employeeId,
          user_id:         userId,
          effective_date:  new Date(today),
          change_type:     'review',
          previous_salary: prevSalary != null ? String(prevSalary) : null,
          new_salary:      String(newSalary),
        }).returning();
        historyRow = castTo<HrRow>(inserted[0] ?? {});
      });
      return Ok(historyRow);
    } catch (error: unknown) {
      this.logger.error(`reviewSalaryTransactional: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updatePayroll(id: string, data: HrRow): Promise<Result<HrRow>> {
    try {
      const rows = await db.update(payroll_period_record).set({
        base_salary:       data.baseSalary    != null ? String(data.baseSalary)   : undefined,
        salary_earned:     data.netSalary     != null ? String(data.netSalary)    : undefined,
        total_bonuses:     data.totalBonuses  != null ? String(data.totalBonuses) : (data.bonus != null ? String(data.bonus) : undefined),
        other_bonuses:     data.otherBonuses  != null ? String(data.otherBonuses) : (data.other_bonuses != null ? String(data.other_bonuses) : undefined),
        salary_period_end: data.paymentDate   != null ? String(data.paymentDate)  : undefined,
        // Workflow fields — approvePayroll writes status+approved_by; postToGL writes status+paid_by+paid_date
        status:            data.status        != null ? String(data.status)        : undefined,
        approved_by:       data.approvedBy    != null ? Number(data.approvedBy)    : undefined,
        paid_by:           data.postedBy      != null ? Number(data.postedBy)      : (data.paidBy != null ? Number(data.paidBy) : undefined),
        paid_date:         data.paidDate      != null ? String(data.paidDate)      : undefined,
        updated_at:        _time.now(),
      }).where(eq(payroll_period_record.id, parseInt(id, 10))).returning();
      return { ok: true, data: castTo<HrRow>((rows[0] ?? {}))};
    } catch (error: unknown) {
      this.logger.error(`updatePayroll: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async postPayrollToGL(payrollId: number, postedBy: number): Promise<Result<HrRow>> {
    try {
      // 1. Load payroll_period_record row — need employee_id + salary_earned
      const shRows = await db.select({
        id:           payroll_period_record.id,
        employee_id:  payroll_period_record.employee_id,
        salary_earned: payroll_period_record.salary_earned,
        status:       payroll_period_record.status,
      })
        .from(payroll_period_record)
        .where(eq(payroll_period_record.id, payrollId))
        .limit(1);

      const sh = shRows[0];
      if (!sh) return Err(`payroll_period_record id=${payrollId} topilmadi`);
      if (sh.status === 'paid') return Err(`Oylik ID=${payrollId} allaqachon buxgalteriyaga o'tkazilgan`);

      const amount = Number(sh.salary_earned ?? 0);
      if (amount <= 0) return Err(`salary_earned <= 0; GL yozuvi yaratilmaydi`);

      // 2. Resolve GL account IDs (9410 debit, 6710 credit)
      const acctRows = await db.select({ id: accounts.id, code: accounts.accountCode })
        .from(accounts)
        .where(sql`${accounts.accountCode} IN ('9410', '6710') AND ${accounts.isActive} = true`);

      const debitAcct  = acctRows.find((a) => a.code === '9410');
      const creditAcct = acctRows.find((a) => a.code === '6710');
      if (!debitAcct)  return Err(`GL hisob 9410 (Ish haqi expense) topilmadi`);
      if (!creditAcct) return Err(`GL hisob 6710 (Xodimlarga to'lanadigan) topilmadi`);

      const today = _time.now().toISOString().split('T')[0];
      const description = `Oylik maosh: xodim #${sh.employee_id ?? payrollId}`;

      let glEntryId: number | null = null;
      let updatedRow: HrRow = {};

      // 3. Atomic transaction: INSERT entry + UPDATE payroll_period_record
      await db.transaction(async (tx) => {
        // INSERT INTO entries using canonical @workspace/db schema
        // entryNumber is required by schema; generate as PAYROLL-{id}-{ts}
        // debitAccountId / creditAccountId are varchar in Drizzle schema (DB stores as int FK)
        const entryNumber = `PAYROLL-${payrollId}-${Date.now()}`;
        const insertedEntry = await tx.insert(entries).values({
          entryNumber:      entryNumber,
          entryDate:        today,
          documentType:     'PAYROLL',
          documentId:       String(payrollId),
          debitAccountId:   String(debitAcct.id),
          creditAccountId:  String(creditAcct.id),
          amount:           amount,
          description:      description,
          createdBy:        postedBy,
        }).returning({ id: entries.id });

        if (!insertedEntry[0]) throw new Error('GL entries INSERT returned no rows');
        glEntryId = insertedEntry[0].id;

        // UPDATE payroll_period_record SET status='paid', paid_by, paid_date
        const updated = await tx.update(payroll_period_record).set({
          status:   'paid',
          paid_by:  postedBy,
          paid_date: today,
          updated_at: _time.now(),
        }).where(eq(payroll_period_record.id, payrollId)).returning();
        updatedRow = castTo<HrRow>(updated[0] ?? {});
      });

      return Ok({ ...updatedRow, gl_entry_id: glEntryId });
    } catch (error: unknown) {
      this.logger.error(`postPayrollToGL: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async getPayrollSummary(period: string): Promise<Result<{ totalGross: number; totalNet: number; employeeCount: number }>> {
    try {
      const rows = await db.select({
        totalGross:     sql<string>`COALESCE(SUM(${payroll_period_record.base_salary}::numeric), 0)`,
        totalNet:       sql<string>`COALESCE(SUM(${payroll_period_record.salary_earned}::numeric), 0)`,
        employeeCount:  sql<string>`COUNT(DISTINCT ${payroll_period_record.employee_id})`,
      })
        .from(payroll_period_record)
        .where(sql`TO_CHAR(${payroll_period_record.salary_period_start}::date, 'YYYY-MM') = ${period}`);
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
    // PHASE-04 (MASSIV-100): oylik razryad-koeffi KANONIK kartadan (org_departments) keladi —
    // employee -> user_id -> employee_org_departments (aktiv, birlamchi) -> org_departments.razryad_level_id
    // -> razryad_levels.coefficient. org_functions (de-routed) YO'Q (FAZA-00). Data yo'q -> 1.0 (graceful, egasi-data).
    try {
      const rows = await runQuery<{ coefficient: string | null }>(sql`
        SELECT COALESCE(rl.coefficient, 1.0)::numeric AS coefficient
        FROM employees e
        LEFT JOIN employee_org_departments eod ON eod.user_id = e.user_id AND eod.is_active = true
        LEFT JOIN org_departments od ON od.id = eod.org_department_id
        LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
        WHERE e.id = ${employeeId}
        ORDER BY eod.is_primary DESC NULLS LAST
        LIMIT 1
      `);
      const coeff = parseFloat(String(rows.rows[0]?.coefficient ?? '1'));
      return isNaN(coeff) || coeff <= 0 ? 1.0 : coeff;
    } catch {
      return 1.0;
    }
  }

  async getRazryadBand(employeeId: number): Promise<{ salaryMin: number | null; salaryMax: number | null }> {
    // PHASE-04 (MASSIV-100, A8): razryad salary-band (salary_min/salary_max) KANONIK kartadan keladi —
    // employee -> user_id -> employee_org_departments (aktiv, birlamchi) -> org_departments.razryad_level_id
    // -> razryad_levels.salary_min/salary_max. Bu getRazryadCoefficient bilan bir xil kanonik zanjir.
    // FABRIKATSIYA YO'Q (Q-40): band egasi-data — qiymat o'rnatilmagan bo'lsa NULL qaytadi (soxta 0/default EMAS).
    // NULL => band yo'q (chaqiruvchi o'zi hal qiladi); razryad biriktirilmagan kartada ham NULL.
    try {
      const rows = await runQuery<{ salary_min: string | null; salary_max: string | null }>(sql`
        SELECT rl.salary_min::text AS salary_min, rl.salary_max::text AS salary_max
        FROM employees e
        LEFT JOIN employee_org_departments eod ON eod.user_id = e.user_id AND eod.is_active = true
        LEFT JOIN org_departments od ON od.id = eod.org_department_id
        LEFT JOIN razryad_levels rl ON rl.id = od.razryad_level_id
        WHERE e.id = ${employeeId}
        ORDER BY eod.is_primary DESC NULLS LAST
        LIMIT 1
      `);
      const row = rows.rows[0];
      const toNum = (v: string | null | undefined): number | null => {
        if (v == null) return null;
        const n = parseFloat(String(v));
        return isNaN(n) ? null : n;
      };
      return { salaryMin: toNum(row?.salary_min), salaryMax: toNum(row?.salary_max) };
    } catch {
      // graceful: band yo'q (fabrikatsiya yo'q)
      return { salaryMin: null, salaryMax: null };
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
