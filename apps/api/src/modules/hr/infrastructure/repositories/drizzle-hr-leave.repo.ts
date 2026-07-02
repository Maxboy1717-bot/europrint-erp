/**
 * @module drizzle-hr-leave.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { and, eq, sql } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { HrRow } from '../../domain/repositories/i-hr.repo';
import { leaveRequestsApp, hrEmployees, hr_360_feedback, hr_attendance, hr_leave_balances } from '@shared/db';

type LtRow = { leave_type: string; used_days?: string };

@Injectable()
export class HrLeaveRepo {
  private readonly logger = new Logger(HrLeaveRepo.name);

  async findLeaveById(id: string): Promise<Result<HrRow | null>> {
    try {
      const rows = await db.select({
        id:            leaveRequestsApp.id,
        employee_id:   leaveRequestsApp.employeeId,
        leave_type:    leaveRequestsApp.leaveType,
        start_date:    leaveRequestsApp.startDate,
        end_date:      leaveRequestsApp.endDate,
        duration_days: leaveRequestsApp.durationDays,
        status:        leaveRequestsApp.status,
        reason:        leaveRequestsApp.reason,
        created_at:    leaveRequestsApp.createdAt,
        employee_name: sql<string>`CONCAT(${hrEmployees.first_name}, ' ', ${hrEmployees.last_name})`,
        employee_code: hrEmployees.employee_code,
      })
        .from(leaveRequestsApp)
        .innerJoin(hrEmployees, eq(hrEmployees.id, leaveRequestsApp.employeeId))
        .where(eq(leaveRequestsApp.id, parseInt(id, 10)))
        .limit(1);
      const row = castTo<HrRow | null>((rows[0] ?? null));
      if (!row) return Err('Leave request not found');
      return Ok(row);
    } catch (error: unknown) {
      this.logger.error(`findLeaveById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findLeaves(filters: { employeeId?: string; status?: string; leaveType?: string; page?: number; limit?: number }): Promise<Result<{ items: HrRow[]; total: number }>> {
    try {
      const page = filters.page ?? 1;
      const lim = filters.limit ?? 20;
      const off = (page - 1) * lim;
      const eid = filters.employeeId ? parseInt(filters.employeeId, 10) : null;

      const where = sql`
        (${eid}::int IS NULL OR ${leaveRequestsApp.employeeId} = ${eid}) AND
        (${filters.status ?? null}::text IS NULL OR ${leaveRequestsApp.status} = ${filters.status ?? null}) AND
        (${filters.leaveType ?? null}::text IS NULL OR ${leaveRequestsApp.leaveType} = ${filters.leaveType ?? null})
      `;

      const [items, counts] = await Promise.all([
        db.select({
          id:            leaveRequestsApp.id,
          employee_id:   leaveRequestsApp.employeeId,
          leave_type:    leaveRequestsApp.leaveType,
          start_date:    leaveRequestsApp.startDate,
          end_date:      leaveRequestsApp.endDate,
          duration_days: leaveRequestsApp.durationDays,
          status:        leaveRequestsApp.status,
          reason:        leaveRequestsApp.reason,
          created_at:    leaveRequestsApp.createdAt,
          employee_name: sql<string>`CONCAT(${hrEmployees.first_name}, ' ', ${hrEmployees.last_name})`,
          employee_code: hrEmployees.employee_code,
        })
          .from(leaveRequestsApp)
          .innerJoin(hrEmployees, eq(hrEmployees.id, leaveRequestsApp.employeeId))
          .where(where)
          .orderBy(sql`${leaveRequestsApp.createdAt} DESC`)
          .limit(lim).offset(off),
        db.select({ cnt: sql<number>`COUNT(*)::int` })
          .from(leaveRequestsApp)
          .where(where),
      ]);
      return { ok: true, data: { items: castTo<HrRow[]>(items), total: Number(counts[0]?.cnt ?? 0) } };
    } catch (error: unknown) {
      this.logger.error(`findLeaves: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveLeave(leave: HrRow): Promise<Result<HrRow>> {
    try {
      const leavePayload: Omit<typeof leaveRequestsApp.$inferInsert, 'id'> = {
        employeeId:    (leave.employeeId ?? leave.employee_id) as number,
        leaveType:     (leave.leaveType ?? leave.leave_type) as string,
        startDate:     (leave.startDate ?? leave.start_date) as string,
        endDate:       (leave.endDate ?? leave.end_date) as string,
        durationDays:  (leave.durationDays ?? leave.duration_days ?? null) as number,
        reason:        (leave.reason ?? null) as string,
        status:        (leave.status ?? 'draft') as string,
        submittedBy:   (leave.submittedBy ?? leave.submitted_by ?? null) as number,
        submittedDate: _time.now(),
      };
      const rows = await db.insert(leaveRequestsApp).values(leavePayload as typeof leaveRequestsApp.$inferInsert).returning();
      return { ok: true, data: castTo<HrRow>((rows[0] ?? {}))};
    } catch (error: unknown) {
      this.logger.error(`saveLeave: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateLeave(id: string, data: HrRow): Promise<Result<HrRow>> {
    try {
      const rows = await db.update(leaveRequestsApp).set({
        status:         sql`COALESCE(${data.status ?? null}, ${leaveRequestsApp.status})`,
        managerStatus:  sql`COALESCE(${data.managerStatus ?? null}, ${leaveRequestsApp.managerStatus})`,
        managerNotes:   sql`COALESCE(${data.managerNotes ?? data.notes ?? null}, ${leaveRequestsApp.managerNotes})`,
        hrStatus:       sql`COALESCE(${data.hrStatus ?? null}, ${leaveRequestsApp.hrStatus})`,
        hrNotes:        sql`COALESCE(${data.hrNotes ?? null}, ${leaveRequestsApp.hrNotes})`,
        directorStatus: sql`COALESCE(${data.directorStatus ?? null}, ${leaveRequestsApp.directorStatus})`,
        directorNotes:  sql`COALESCE(${data.directorNotes ?? null}, ${leaveRequestsApp.directorNotes})`,
        updatedAt:      _time.now(),
      }).where(eq(leaveRequestsApp.id, parseInt(id, 10))).returning();
      return { ok: true, data: castTo<HrRow>((rows[0] ?? {}))};
    } catch (error: unknown) {
      this.logger.error(`updateLeave: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async getLeaveBalance(employeeId: string): Promise<Result<{ annual: { used: number; remaining: number; total: number }; sick: { used: number }; maternity: { used: number } }>> {
    try {
      // Canonical quota source is hr_leave_balances (per employee/year/leave_type:
      // total_days, used_days, remaining_days). The old code hardcoded ANNUAL_TOTAL=24
      // and summed leave_requests — ignoring the real per-employee allocation.
      const currentYear = _time.now().getFullYear();
      const eid = parseInt(employeeId, 10);
      const rows = await db.select({
        leave_type:     hr_leave_balances.leaveType,
        total_days:     hr_leave_balances.totalDays,
        used_days:      hr_leave_balances.usedDays,
        remaining_days: hr_leave_balances.remainingDays,
      })
        .from(hr_leave_balances)
        .where(and(eq(hr_leave_balances.employeeId, eid), eq(hr_leave_balances.year, currentYear)));
      const byType: Record<string, { total: number; used: number; remaining: number }> = {};
      for (const r of rows) {
        byType[String(r.leave_type ?? '')] = {
          total: Number(r.total_days ?? 0),
          used: Number(r.used_days ?? 0),
          remaining: Number(r.remaining_days ?? 0),
        };
      }
      const z = { total: 0, used: 0, remaining: 0 };
      const annual = byType['annual'] ?? z;
      const sick = byType['sick'] ?? z;
      const maternity = byType['maternity'] ?? z;
      return { ok: true, data: { annual: { used: annual.used, remaining: annual.remaining, total: annual.total }, sick: { used: sick.used }, maternity: { used: maternity.used } } };
    } catch (error: unknown) {
      this.logger.error(`getLeaveBalance: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async getLeaveStats(): Promise<Result<{ byStatus: Record<string, number>; byType: Record<string, number>; currentlyOnLeave: number }>> {
    try {
      const now = _time.now().toISOString().split('T')[0];
      const [byStatus, byType, current] = await Promise.all([
        db.select({ status: leaveRequestsApp.status, cnt: sql<string>`COUNT(*)` }).from(leaveRequestsApp).groupBy(leaveRequestsApp.status),
        db.select({ leave_type: leaveRequestsApp.leaveType, cnt: sql<string>`COUNT(*)` }).from(leaveRequestsApp).groupBy(leaveRequestsApp.leaveType),
        db.select({ cnt: sql<string>`COUNT(*)` }).from(leaveRequestsApp).where(sql`${leaveRequestsApp.status} = 'approved' AND ${leaveRequestsApp.startDate}::date <= ${now}::date AND ${leaveRequestsApp.endDate}::date >= ${now}::date`),
      ]);
      return { ok: true, data: {
        byStatus: Object.fromEntries(byStatus.map((r) => [r.status ?? '', Number(r.cnt)])),
        byType:   Object.fromEntries(byType.map((r) => [r.leave_type ?? '', Number(r.cnt)])),
        currentlyOnLeave: Number(current[0]?.cnt ?? 0),
      } };
    } catch (error: unknown) {
      this.logger.error(`getLeaveStats: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async save360Feedback(feedback: { employeeId: number; orderId?: number; sessionId?: string; quantity?: number; defectRate?: number; oee?: number; recordedAt?: Date }): Promise<Result<HrRow>> {
    try {
      const rows = await db.insert(hr_360_feedback).values({
        employee_id: feedback.employeeId,
        order_id:    feedback.orderId ?? undefined,
        session_id:  feedback.sessionId ?? undefined,
        quantity:    feedback.quantity ? String(feedback.quantity) : undefined,
        defect_rate: feedback.defectRate ? String(feedback.defectRate) : undefined,
        oee:         feedback.oee ? String(feedback.oee) : undefined,
        recorded_at: feedback.recordedAt ?? _time.now(),
      }).onConflictDoNothing().returning();
      return { ok: true, data: castTo<HrRow>((rows[0] ?? { id: null }))};
    } catch (error: unknown) {
      this.logger.warn(`save360Feedback: ${(error as Error).message}`);
      return { ok: true, data: castTo<HrRow>({ id: null }) };
    }
  }

  async getAttendanceStats(employeeId: string, period: string): Promise<Result<HrRow>> {
    try {
      const [year, month] = period.split('-');
      const eid = parseInt(employeeId, 10);
      const rows = await db.select({
        present_days:   sql<number>`COUNT(*) FILTER (WHERE ${hr_attendance.status} = 'present')`,
        absent_days:    sql<number>`COUNT(*) FILTER (WHERE ${hr_attendance.status} = 'absent')`,
        late_days:      sql<number>`COUNT(*) FILTER (WHERE ${hr_attendance.status} = 'late')`,
        overtime_hours: sql<number>`COALESCE(SUM(${hr_attendance.overtime_minutes}), 0) / 60.0`,
      })
        .from(hr_attendance)
        .where(sql`
          ${hr_attendance.employee_id} = ${eid} AND
          EXTRACT(YEAR  FROM ${hr_attendance.attendance_date}::date) = ${Number(year)} AND
          EXTRACT(MONTH FROM ${hr_attendance.attendance_date}::date) = ${Number(month)}
        `);
      return { ok: true, data: castTo<HrRow>((rows[0] ?? {}))};
    } catch (error: unknown) {
      this.logger.error(`getAttendanceStats: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async getFeedbackByPeriod(employeeId: number, startDate: Date, endDate: Date): Promise<{ quantity: number; defectRate: number; oee: number; recordedAt: Date }[]> {
    try {
      const rows = await db.select({
        quantity:    hr_360_feedback.quantity,
        defect_rate: hr_360_feedback.defect_rate,
        oee:         hr_360_feedback.oee,
        recorded_at: hr_360_feedback.recorded_at,
      })
        .from(hr_360_feedback)
        .where(sql`${hr_360_feedback.employee_id} = ${employeeId} AND ${hr_360_feedback.recorded_at} BETWEEN ${startDate} AND ${endDate}`)
        .orderBy(hr_360_feedback.recorded_at);
      return rows.map((r) => ({
        quantity: Number(r.quantity ?? 0),
        defectRate: Number(r.defect_rate ?? 0),
        oee: Number(r.oee ?? 0),
        recordedAt: new Date(r.recorded_at ?? _time.now()),
      }));
    } catch (error: unknown) {
      this.logger.warn(`getFeedbackByPeriod: ${(error as Error).message}`);
      throw error;
    }
  }

  async getAttendanceByPeriod(employeeId: number, startDate: Date, endDate: Date): Promise<{ status: string; overtimeHours: number }[]> {
    try {
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      const rows = await db.select({
        status:           hr_attendance.status,
        overtime_minutes: hr_attendance.overtime_minutes,
      })
        .from(hr_attendance)
        .where(sql`${hr_attendance.employee_id} = ${employeeId} AND ${hr_attendance.attendance_date} BETWEEN ${start}::date AND ${end}::date`)
        .orderBy(hr_attendance.attendance_date);
      return rows.map((r) => ({ status: (r.status ?? 'absent') as string, overtimeHours: Number(r.overtime_minutes ?? 0) / 60 }));
    } catch (error: unknown) {
      this.logger.error(`getAttendanceByPeriod: ${(error as Error).message}`);
      throw error;
    }
  }
}
