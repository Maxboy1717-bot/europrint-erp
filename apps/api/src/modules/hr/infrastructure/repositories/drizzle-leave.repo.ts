/**
 * @module drizzle-leave.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
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
      return Ok(r[0]);
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
        exec(sql`SELECT status, COUNT(*) AS cnt FROM leave_requests GROUP BY status`),
        exec(sql`SELECT leave_type, COUNT(*) AS cnt FROM leave_requests GROUP BY leave_type`),
        exec(sql`SELECT COUNT(*) AS cnt FROM leave_requests WHERE status = 'approved' AND start_date::date <= ${today}::date AND end_date::date >= ${today}::date`),
      ]);
      return { ok: true, data: { byStatus: Object.fromEntries(statusRows.map((r) => [String(r.status), Number(r.cnt)])), byType: Object.fromEntries(typeRows.map((r) => [String(r.leave_type), Number(r.cnt)])), currentlyOnLeave: Number(currentRows[0]?.cnt ?? 0) } };
    } catch (error: unknown) {
      this.logger.error(`getLeaveStats: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }
}
