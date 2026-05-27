/**
 * @module drizzle-leave.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery, leaveRequests, hr_leave_requests } from '@shared/db';
import { SQL, SQLWrapper, and, count, eq, gte, lte, sql } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class LeaveRepository {
  private readonly logger = new Logger(LeaveRepository.name);

  async findLeaveById(id: string): Promise<Result<Row>> {
    try {
      const r = await exec(sql`SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name, e.employee_code FROM leave_requests lr LEFT JOIN employees e ON e.id = lr.employee_id WHERE lr.id = ${parseInt(id, 10)} LIMIT 1`);
      if (!r[0]) return Err('Leave request not found');
      return Ok(r[0]);
    } catch (error: unknown) {
      this.logger.error(`findLeaveById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  // NOTE: Raw SQL retained — dynamic WHERE with multi-filter conditionals (employeeId × status × leaveType ⇒ 8 branches),
  // plus the Drizzle `leaveRequests` stub in schema-compat-2 omits real columns (manager_status, hr_status, director_status,
  // manager_notes, hr_notes, director_notes) that `lr.*` returns. Converting would silently drop those fields.
  async findLeaves(filters: { employeeId?: string; status?: string; leaveType?: string; page?: number; limit?: number }): Promise<Result<{ items: unknown[]; total: number }>> {
    try {
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const offset = (page - 1) * limit;
      const [rows, countRows] = await Promise.all([
        filters.employeeId && filters.status && filters.leaveType
          ? exec(sql`SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name FROM leave_requests lr LEFT JOIN employees e ON e.id = lr.employee_id WHERE lr.employee_id = ${parseInt(filters.employeeId, 10)} AND lr.status = ${filters.status} AND lr.leave_type = ${filters.leaveType} ORDER BY lr.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters.employeeId && filters.status
          ? exec(sql`SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name FROM leave_requests lr LEFT JOIN employees e ON e.id = lr.employee_id WHERE lr.employee_id = ${parseInt(filters.employeeId, 10)} AND lr.status = ${filters.status} ORDER BY lr.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters.employeeId && filters.leaveType
          ? exec(sql`SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name FROM leave_requests lr LEFT JOIN employees e ON e.id = lr.employee_id WHERE lr.employee_id = ${parseInt(filters.employeeId, 10)} AND lr.leave_type = ${filters.leaveType} ORDER BY lr.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters.status && filters.leaveType
          ? exec(sql`SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name FROM leave_requests lr LEFT JOIN employees e ON e.id = lr.employee_id WHERE lr.status = ${filters.status} AND lr.leave_type = ${filters.leaveType} ORDER BY lr.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters.employeeId
          ? exec(sql`SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name FROM leave_requests lr LEFT JOIN employees e ON e.id = lr.employee_id WHERE lr.employee_id = ${parseInt(filters.employeeId, 10)} ORDER BY lr.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters.status
          ? exec(sql`SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name FROM leave_requests lr LEFT JOIN employees e ON e.id = lr.employee_id WHERE lr.status = ${filters.status} ORDER BY lr.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : filters.leaveType
          ? exec(sql`SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name FROM leave_requests lr LEFT JOIN employees e ON e.id = lr.employee_id WHERE lr.leave_type = ${filters.leaveType} ORDER BY lr.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
          : exec(sql`SELECT lr.*, CONCAT(e.first_name, ' ', e.last_name) AS employee_name FROM leave_requests lr LEFT JOIN employees e ON e.id = lr.employee_id ORDER BY lr.created_at DESC LIMIT ${limit} OFFSET ${offset}`),
        exec(sql`SELECT COUNT(*) AS cnt FROM leave_requests`),
      ]);
      return { ok: true, data: { items: rows, total: Number(countRows[0]?.cnt ?? 0) } };
    } catch (error: unknown) {
      this.logger.error(`findLeaves: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveLeave(leave: Row): Promise<Result<Row>> {
    try {
      const r = await exec(sql`INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, duration_days, reason, status, submitted_by, submitted_date, created_at, updated_at) VALUES (${leave.employeeId ?? leave.employee_id}, ${leave.leaveType ?? leave.leave_type}, ${leave.startDate ?? leave.start_date}, ${leave.endDate ?? leave.end_date}, ${leave.durationDays ?? leave.duration_days ?? leave.daysRequested ?? null}, ${leave.reason ?? null}, ${leave.status ?? 'draft'}, ${leave.submittedBy ?? leave.submitted_by ?? null}, NOW(), NOW(), NOW()) RETURNING *`);
      const saved = r[0];

      // TASK 4 — Dual-table sync (ADD-ONLY):
      // The Telegram bot writes to `hr_leave_requests`; the main HR API writes here
      // (`leave_requests`). The two tables have DIFFERENT schemas:
      //   leave_requests   : leave_type, duration_days, submitted_by, submitted_date (full workflow)
      //   hr_leave_requests: employee_id, start_date, end_date, reason, status (simplified)
      // To avoid the UI reading from the wrong table, we mirror the essential fields
      // into hr_leave_requests with onConflictDoNothing so we never overwrite
      // Telegram-originated rows that already exist.
      // NOTE: hr_leave_requests has no unique key on (employee_id, start_date, end_date),
      // so we use a bare INSERT — duplicates are harmless (extra rows in the Telegram view).
      try {
        await db.insert(hr_leave_requests).values({
          employee_id:  Number(leave.employeeId ?? leave.employee_id ?? 0),
          start_date:   String(leave.startDate ?? leave.start_date ?? ''),
          end_date:     String(leave.endDate ?? leave.end_date ?? ''),
          reason:       String(leave.reason ?? ''),
          status:       String(leave.status ?? 'pending'),
        });
      } catch (_syncErr) {
        // Sync failure is non-fatal — primary insert succeeded.
        this.logger.warn(`saveLeave hr_leave_requests sync skipped: ${(_syncErr as Error).message}`);
      }

      return Ok(saved);
    } catch (error: unknown) {
      this.logger.error(`saveLeave: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateLeave(id: string, data: Row): Promise<Result<Row>> {
    try {
      const r = await exec(sql`UPDATE leave_requests SET status = COALESCE(${data.status ?? null}, status), manager_status = COALESCE(${data.managerStatus ?? null}, manager_status), manager_notes = COALESCE(${data.managerNotes ?? data.rejectionReason ?? data.notes ?? null}, manager_notes), hr_status = COALESCE(${data.hrStatus ?? null}, hr_status), director_status = COALESCE(${data.directorStatus ?? null}, director_status), updated_at = NOW() WHERE id = ${parseInt(id, 10)} RETURNING *`);
      return Ok(r[0]);
    } catch (error: unknown) {
      this.logger.error(`updateLeave: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  // NOTE: Raw SQL retained — uses EXTRACT(YEAR FROM start_date::date), which Drizzle does not express idiomatically.
  async getLeaveBalance(employeeId: string): Promise<Result<{ annual: { used: number; remaining: number; total: number }; sick: { used: number }; maternity: { used: number } }>> {
    const ANNUAL_TOTAL = 24;
    const currentYear = _time.now().getFullYear();
    try {
      const r = await exec(sql`SELECT leave_type, COALESCE(SUM(duration_days), 0) AS used_days FROM leave_requests WHERE employee_id = ${parseInt(employeeId, 10)} AND status IN ('approved', 'draft') AND EXTRACT(YEAR FROM start_date::date) = ${currentYear} GROUP BY leave_type`);
      const byType: Record<string, number> = {};
      for (const row of r) byType[String(row.leave_type)] = Number(row.used_days ?? 0);
      const annualUsed = byType['annual'] ?? byType['yillik'] ?? 0;
      return { ok: true, data: { annual: { used: annualUsed, remaining: Math.max(0, ANNUAL_TOTAL - annualUsed), total: ANNUAL_TOTAL }, sick: { used: byType['sick'] ?? byType['kasal'] ?? 0 }, maternity: { used: byType['maternity'] ?? byType['dekret'] ?? 0 } } };
    } catch (error: unknown) {
      this.logger.error(`getLeaveBalance: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async getLeaveStats(): Promise<Result<{ byStatus: Record<string, number>; byType: Record<string, number>; currentlyOnLeave: number }>> {
    try {
      const today = _time.now().toISOString().split('T')[0];
      const [statusRows, typeRows, currentRows] = await Promise.all([
        db.select({ status: leaveRequests.status, cnt: count() })
          .from(leaveRequests)
          .groupBy(leaveRequests.status),
        db.select({ leave_type: leaveRequests.leaveType, cnt: count() })
          .from(leaveRequests)
          .groupBy(leaveRequests.leaveType),
        db.select({ cnt: count() })
          .from(leaveRequests)
          .where(and(
            eq(leaveRequests.status, 'approved'),
            lte(leaveRequests.startDate, today),
            gte(leaveRequests.endDate, today),
          )),
      ]);
      return { ok: true, data: { byStatus: Object.fromEntries(statusRows.map((r) => [String(r.status), Number(r.cnt)])), byType: Object.fromEntries(typeRows.map((r) => [String(r.leave_type), Number(r.cnt)])), currentlyOnLeave: Number(currentRows[0]?.cnt ?? 0) } };
    } catch (error: unknown) {
      this.logger.error(`getLeaveStats: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }
}
