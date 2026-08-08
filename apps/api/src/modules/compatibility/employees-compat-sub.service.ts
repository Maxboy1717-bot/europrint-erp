/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * Canonical replacement: `apps/api/src/modules/hr/application/hr-employees-ext.service.ts`
 * Existing consumers continue to work. New code must import from the canonical file.
 * See: docs/modules/hr-employees.md
 */
/**
 * @module employees-compat-sub.service
 * @description Sub-resource / relations service for employees. Returns Result<T> from @common/result; never throws raw Errors.
 * Methods: importEmployees, getAssets, assignAsset, returnAsset, getSwapRequests, getComplaints, createComplaint, getAssessmentSkips.
 */

import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

type Row = Record<string, unknown>;
const si = (v: unknown, d = 0) => parseInt(String(v ?? ''), 10) || d;
/** Prefix used when employee_code is missing in the CSV row */
const IMPORT_CODE_PREFIX = 'IMP';

@Injectable()
export class EmployeesCompatSubService {
  constructor(private readonly i18n: I18nService) {}
  async importEmployees(employees: Record<string, unknown>[]): Promise<Result<{ imported: number; total: number; errors: string[] }, AppError>> {
    return safeCall(async () => {
      let imported = 0;
      const errors: string[] = [];
      for (const emp of employees) {
        try {
          const code = emp['employee_code'] || `${IMPORT_CODE_PREFIX}-${Date.now()}-${imported}`;
          await rawSql(sql`
            INSERT INTO employees (first_name, last_name, phone, birth_date, hire_date, address, employee_code, status)
            VALUES (${emp['first_name'] ?? ''}, ${emp['last_name'] ?? ''}, ${emp['phone'] ?? null},
                    ${emp['birth_date'] ?? null}, ${emp['hire_date'] ?? null}, ${emp['address'] ?? null},
                    ${code}, 'active')
            ON CONFLICT (employee_code) DO NOTHING
          `);
          imported++;
        } catch (e: unknown) {
          errors.push(`${emp['first_name'] ?? '?'} ${emp['last_name'] ?? ''}: ${(e as Error).message}`);
        }
      }
      return { imported, total: employees.length, errors };
    });
  }

  async getAssets(id: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT ea.id, ea.employee_id, ea.asset_type, ea.asset_name, ea.asset_code,
               ea.assigned_date, ea.return_date, ea.status, ea.notes, ea.created_at
        FROM employee_assets ea
        WHERE ea.employee_id = ${si(id)} AND ea.deleted_at IS NULL
        ORDER BY ea.assigned_date DESC
      `);
      return dbRows(r) as Row[];
    });
  }

  async assignAsset(id: string, body: Record<string, unknown>): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        INSERT INTO employee_assets (employee_id, asset_type, asset_name, asset_code, assigned_date, notes, status)
        VALUES (${si(id)}, ${body['asset_type'] ?? 'equipment'}, ${body['asset_name'] ?? ''},
                ${body['asset_code'] ?? null}, ${body['assigned_date'] ?? null}, ${body['notes'] ?? null}, 'assigned')
        RETURNING id, asset_name, status, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException(await this.i18n.t('errors.assetAssignmentFailed'));
      return item;
    });
  }

  async returnAsset(id: string, assetId: string): Promise<Result<void, AppError>> {
    return safeCall(async () => {
      await rawSql(sql`
        UPDATE employee_assets SET status = 'returned', return_date = NOW()::date, deleted_at = NOW()
        WHERE id = ${si(assetId)} AND employee_id = ${si(id)}
      `);
    });
  }

  async getSwapRequests(employeeId: string, status?: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const statusF = status ? sql`AND ss.status = ${status}` : sql``;
      const r = await rawSql(sql`
        SELECT ss.id, ss.employee_id, ss.shift_date, ss.shift_type, ss.start_time,
               ss.end_time, ss.status, ss.created_at,
               e.first_name || ' ' || e.last_name AS employee_name
        FROM shift_schedules ss
        JOIN employees e ON e.id = ss.employee_id
        WHERE ss.employee_id = ${si(employeeId)} ${statusF}
        ORDER BY ss.shift_date DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async getComplaints(employeeId: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT cr.id, cr.party1, cr.party2, cr.description, cr.severity, cr.status, cr.created_at
        FROM hr_conflict_reports cr
        WHERE cr.party1::text = ${employeeId} OR cr.party2::text = ${employeeId}
        ORDER BY cr.created_at DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }

  async createComplaint(employeeId: string, body: Record<string, unknown>): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      // C8.4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): the old COUNT(*)+1 was a TOCTOU read-max
      // race (id is the PRIMARY KEY, so a collision already failed loudly rather than silently
      // duplicating — same "crash under concurrent load" class as 1.7/8.3). nextval() is atomic.
      const r = await rawSql(sql`
        INSERT INTO hr_conflict_reports (id, party1, party2, description, severity, status)
        VALUES (
          'CR-' || LPAD(nextval('hr_conflict_report_seq')::text, 3, '0'),
          ${employeeId}, ${body['party2'] ?? ''}, ${body['description'] ?? null}, ${body['severity'] ?? 'low'}, 'open'
        )
        RETURNING id, severity, status, created_at
      `);
      const item = dbRows(r)[0] as Row | undefined;
      if (!item) throw new InternalServerErrorException(await this.i18n.t('errors.complaintCreationFailed'));
      return item;
    });
  }

  async getAssessmentSkips(employeeId: string): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT a.id, a.employee_id, a.assessment_period, a.assessment_year, a.status, a.created_at
        FROM employee_360_assessments a
        WHERE a.employee_id = ${si(employeeId)} AND a.status = 'skipped'
        ORDER BY a.created_at DESC LIMIT 50
      `);
      return dbRows(r) as Row[];
    });
  }
}
