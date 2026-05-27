/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * Canonical replacement: `Finance module (separate domain)`
 * Existing consumers continue to work. New code must import from the canonical file.
 * See: docs/modules/hr-employees.md
 */
/**
 * @module employees-compat-financials.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
// SECURITY: PA-S5 — canonical bcrypt cost factor.
import { BCRYPT_ROUNDS } from '@common/constants/security.constants';

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

  async createBankAccount(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO employee_bank_accounts (employee_id, bank_name, account_number, account_type, is_primary)
        VALUES (${si(employeeId)}, ${body['bank_name'] ?? body['bankName'] ?? ''}, ${body['account_number'] ?? body['accountNumber'] ?? ''}, ${body['account_type'] ?? body['accountType'] ?? 'checking'}, ${body['is_primary'] ?? body['isPrimary'] ?? false})
        RETURNING id, employee_id, bank_name, account_number, account_type, is_primary, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Bank account creation failed');
      return item;
    });
  }

  async createBonus(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO salary_history (employee_id, salary_period_start, salary_period_end, base_salary, salary_earned, total_bonuses, other_bonuses)
        VALUES (${si(employeeId)}, ${body['period'] ?? body['salary_period_start'] ?? new Date().toISOString().slice(0,7) + '-01'}, ${body['period_end'] ?? body['salary_period_end'] ?? null}, ${body['base_salary'] ?? 0}, ${body['salary_earned'] ?? 0}, ${body['amount'] ?? body['total_bonuses'] ?? 0}, ${body['other_bonuses'] ?? 0})
        RETURNING id, employee_id, salary_period_start AS period, total_bonuses AS amount, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Bonus creation failed');
      return item;
    });
  }

  async createBusinessTrip(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO employee_business_trips (employee_id, destination, purpose, start_date, end_date, status)
        VALUES (${si(employeeId)}, ${body['destination'] ?? ''}, ${body['purpose'] ?? null}, ${body['start_date'] ?? body['startDate'] ?? null}, ${body['end_date'] ?? body['endDate'] ?? null}, ${body['status'] ?? 'pending'})
        RETURNING id, employee_id, destination, purpose, start_date, end_date, status, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Business trip creation failed');
      return item;
    });
  }

  async createCashAdvance(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO payroll_advances (employee_id, amount, request_date, status)
        VALUES (${si(employeeId)}, ${body['amount'] ?? 0}, ${body['request_date'] ?? body['requestDate'] ?? new Date().toISOString().slice(0,10)}, ${body['status'] ?? 'pending'})
        RETURNING id, employee_id, amount, request_date, status, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Cash advance creation failed');
      return item;
    });
  }

  async createFine(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO disciplinary_actions (employee_id, type, reason, severity, appeal_status)
        VALUES (${si(employeeId)}, ${body['type'] ?? 'fine'}, ${body['reason'] ?? ''}, ${body['severity'] ?? 'low'}, ${body['appeal_status'] ?? body['appealStatus'] ?? 'none'})
        RETURNING id, employee_id, type, reason, severity, appeal_status, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Fine creation failed');
      return item;
    });
  }

  async createOvertime(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO attendance_logs (employee_id, log_date, check_in, check_out, overtime_hours)
        VALUES (${si(employeeId)}, ${body['log_date'] ?? body['logDate'] ?? body['date'] ?? new Date().toISOString().slice(0,10)}, ${body['check_in'] ?? body['checkIn'] ?? null}, ${body['check_out'] ?? body['checkOut'] ?? null}, ${body['overtime_hours'] ?? body['overtimeHours'] ?? 0})
        RETURNING id, employee_id, log_date, overtime_hours, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Overtime creation failed');
      return item;
    });
  }

  async createAssessment(employeeId: string, body: Row): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO employee_360_assessments (employee_id, assessment_period, assessment_year, status)
        VALUES (${si(employeeId)}, ${body['assessment_period'] ?? body['assessmentPeriod'] ?? 'Q1'}, ${body['assessment_year'] ?? body['assessmentYear'] ?? new Date().getFullYear()}, ${body['status'] ?? 'pending'})
        RETURNING id, employee_id, assessment_period, assessment_year, status, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException('Assessment creation failed');
      return item;
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
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await rawSql(sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${si(row.user_id)}`);
      return { success: true };
    });
  }
}
