import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

type Row = Record<string, unknown>;
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;

@Injectable()
export class EmployeesCompatFinancialsService {
  async deleteEmployeeFile(employeeId: string, fileId: string): Promise<Result<{ deleted: boolean }, AppError>> {
    return safeCall(async () => {
      await rawSql(sql`
        DELETE FROM employee_files WHERE id = ${si(fileId)} AND employee_id = ${si(employeeId)}
      `);
      return { deleted: true };
    });
  }

  async getFines(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT da.id, da.employee_id, da.type, da.reason, da.severity,
               da.appeal_status, da.resolved_at, da.created_at
        FROM disciplinary_actions da
        WHERE da.employee_id = ${si(id)}
        ORDER BY da.created_at DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async getCashAdvances(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT pa.id, pa.employee_id, pa.amount, pa.request_date, pa.status,
               pa.approved_at, pa.created_at
        FROM payroll_advances pa
        WHERE pa.employee_id = ${si(id)}
        ORDER BY pa.created_at DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async getBankAccounts(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT id, employee_id, bank_name, account_number, account_type, is_primary, created_at
        FROM employee_bank_accounts
        WHERE employee_id = ${si(id)}
        ORDER BY is_primary DESC, created_at DESC
      `);
      return dbRows(r) as Row[];
    });
  }

  async getBonuses(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT sh.id, sh.employee_id, sh.salary_period_start AS period,
               sh.total_bonuses AS amount, sh.other_bonuses, sh.created_at
        FROM salary_history sh
        WHERE sh.employee_id = ${si(id)}
          AND (sh.total_bonuses::numeric > 0 OR sh.other_bonuses::numeric > 0)
        ORDER BY sh.salary_period_start DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async getBusinessTrips(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT id, employee_id, destination, purpose, start_date, end_date, status, created_at
        FROM employee_business_trips
        WHERE employee_id = ${si(id)}
        ORDER BY start_date DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async getOvertime(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT al.id, al.employee_id, al.log_date, al.check_in, al.check_out,
               al.overtime_hours, al.created_at
        FROM attendance_logs al
        WHERE al.employee_id = ${si(id)}
          AND al.overtime_hours IS NOT NULL AND al.overtime_hours::numeric > 0
        ORDER BY al.log_date DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async getAllAssessments(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT a.id, a.employee_id, a.assessment_period, a.assessment_year,
               a.status, a.created_at
        FROM employee_360_assessments a
        WHERE a.employee_id = ${si(id)}
        ORDER BY a.created_at DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async setPassword(id: string, body: Record<string, unknown>): Promise<Result<{ success: boolean }, AppError>> {
    return safeCall(async () => {
      const password = typeof body.password === 'string' ? body.password.trim() : '';
      if (!password || password.length < 6) {
        throw new BadRequestException('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      }
      const empRow = await rawSql(sql`SELECT user_id FROM employees WHERE id = ${si(id)} LIMIT 1`);
      const row = dbRows(empRow)[0] as Row | undefined;
      if (!row || !row.user_id) {
        throw new NotFoundException(`Xodim topilmadi yoki foydalanuvchi bog'liq emas: ${id}`);
      }
      const passwordHash = await bcrypt.hash(password, 10);
      await rawSql(sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${si(row.user_id)}`);
      return { success: true };
    });
  }
}
