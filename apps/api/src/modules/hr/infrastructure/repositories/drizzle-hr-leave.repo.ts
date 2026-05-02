import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { HrRow } from '../../domain/repositories/i-hr.repo';
import { leaveRequestsApp, hrEmployees, hr_360_feedback, hr_attendance } from '@shared/db';

type LtRow = { leave_type: string; used_days?: string };

@Injectable()
export class HrLeaveRepo {
  private readonly logger = new Logger(HrLeaveRepo.name);

  async findLeaveById(id: string): Promise<Result<HrRow | null>> {
    try {
      const rows = await db.select({
        id:            leaveRequestsApp.id,
        employee_id:   leaveRequestsApp.employee_id,
        leave_type:    leaveRequestsApp.leave_type,
        start_date:    leaveRequestsApp.start_date,
        end_date:      leaveRequestsApp.end_date,
        duration_days: leaveRequestsApp.duration_days,
        status:        leaveRequestsApp.status,
        reason:        leaveRequestsApp.reason,
        created_at:    leaveRequestsApp.created_at,
        employee_name: sql<string>`CONCAT(${hrEmployees.first_name}, ' ', ${hrEmployees.last_name})`,
        employee_code: hrEmployees.employee_code,
      })
        .from(leaveRequestsApp)
        .innerJoin(hrEmployees, eq(hrEmployees.id, leaveRequestsApp.employee_id))
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
        (${eid}::int IS NULL OR ${leaveRequestsApp.employee_id} = ${eid}) AND
        (${filters.status ?? null}::text IS NULL OR ${leaveRequestsApp.status} = ${filters.status ?? null}) AND
        (${filters.leaveType ?? null}::text IS NULL OR ${leaveRequestsApp.leave_type} = ${filters.leaveType ?? null})
      `;

      const [items, counts] = await Promise.all([
        db.select({
          id:            leaveRequestsApp.id,
          employee_id:   leaveRequestsApp.employee_id,
          leave_type:    leaveRequestsApp.leave_type,
          start_date:    leaveRequestsApp.start_date,
          end_date:      leaveRequestsApp.end_date,
          duration_days: leaveRequestsApp.duration_days,
          status:        leaveRequestsApp.status,
          reason:        leaveRequestsApp.reason,
          created_at:    leaveRequestsApp.created_at,
          employee_name: sql<string>`CONCAT(${hrEmployees.first_name}, ' ', ${hrEmployees.last_name})`,
          employee_code: hrEmployees.employee_code,
        })
          .from(leaveRequestsApp)
          .innerJoin(hrEmployees, eq(hrEmployees.id, leaveRequestsApp.employee_id))
          .where(where)
          .orderBy(sql`${leaveRequestsApp.created_at} DESC`)
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
        employee_id:   (leave.employeeId ?? leave.employee_id) as number,
        leave_type:    (leave.leaveType ?? leave.leave_type) as string,
        start_date:    (leave.startDate ?? leave.start_date) as string,
        end_date:      (leave.endDate ?? leave.end_date) as string,
        duration_days: (leave.durationDays ?? leave.duration_days ?? null) as number,
        reason:        (leave.reason ?? null) as string,
        status:        (leave.status ?? 'draft') as string,
        submitted_by:  (leave.submittedBy ?? leave.submitted_by ?? null) as number,
        submitted_date: _time.now(),
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
        status:          sql`COALESCE(${data.status ?? null}, ${leaveRequestsApp.status})`,
        manager_status:  sql`COALESCE(${data.managerStatus ?? null}, ${leaveRequestsApp.manager_status})`,
        manager_notes:   sql`COALESCE(${data.managerNotes ?? data.notes ?? null}, ${leaveRequestsApp.manager_notes})`,
        hr_status:       sql`COALESCE(${data.hrStatus ?? null}, ${leaveRequestsApp.hr_status})`,
        hr_notes:        sql`COALESCE(${data.hrNotes ?? null}, ${leaveRequestsApp.hr_notes})`,
        director_status: sql`COALESCE(${data.directorStatus ?? null}, ${leaveRequestsApp.director_status})`,
        director_notes:  sql`COALESCE(${data.directorNotes ?? null}, ${leaveRequestsApp.director_notes})`,
        updated_at:      _time.now(),
      }).where(eq(leaveRequestsApp.id, parseInt(id, 10))).returning();
      return { ok: true, data: castTo<HrRow>((rows[0] ?? {}))};
    } catch (error: unknown) {
      this.logger.error(`updateLeave: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async getLeaveBalance(employeeId: string): Promise<Result<{ annual: { used: number; remaining: number; total: number }; sick: { used: number }; maternity: { used: number } }>> {
    try {
      const ANNUAL_TOTAL = 24;
      const currentYear = _time.now().getFullYear();
      const eid = parseInt(employeeId, 10);
      const rows = await db.select({
        leave_type: leaveRequestsApp.leave_type,
        used_days:  sql<string>`COALESCE(SUM(${leaveRequestsApp.duration_days}), 0)`,
      })
        .from(leaveRequestsApp)
        .where(sql`
          ${leaveRequestsApp.employee_id} = ${eid} AND
          ${leaveRequestsApp.status} IN ('approved', 'draft') AND
          EXTRACT(YEAR FROM ${leaveRequestsApp.start_date}::date) = ${currentYear}
        `)
        .groupBy(leaveRequestsApp.leave_type);
      const byType: Record<string, number> = {};
      for (const row of rows) { byType[row.leave_type ?? ''] = Number(row.used_days ?? 0); }
      const annualUsed = byType['annual'] ?? byType['yillik'] ?? 0;
      return { ok: true, data: { annual: { used: annualUsed, remaining: Math.max(0, ANNUAL_TOTAL - annualUsed), total: ANNUAL_TOTAL }, sick: { used: byType['sick'] ?? byType['kasal'] ?? 0 }, maternity: { used: byType['maternity'] ?? byType['dekret'] ?? 0 } } };
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
        db.select({ leave_type: leaveRequestsApp.leave_type, cnt: sql<string>`COUNT(*)` }).from(leaveRequestsApp).groupBy(leaveRequestsApp.leave_type),
        db.select({ cnt: sql<string>`COUNT(*)` }).from(leaveRequestsApp).where(sql`${leaveRequestsApp.status} = 'approved' AND ${leaveRequestsApp.start_date}::date <= ${now}::date AND ${leaveRequestsApp.end_date}::date >= ${now}::date`),
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
