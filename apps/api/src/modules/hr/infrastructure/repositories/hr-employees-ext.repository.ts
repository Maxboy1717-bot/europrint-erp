/**
 * @module hr-employees-ext.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (HR)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { sql, eq } from 'drizzle-orm';
import { execHrEmployeeImport } from '@common/database/queries-remaining';
import { safeCall, Result, Ok, Err } from '@common/result';
import {
  hrEmployees, hrDepartments,
  hr_conflict_reports, employee_360_assessments,
  hr_documents,
} from '@shared/db';
import { ShiftRepository } from '../../shift/shift.repository';
import type { IHrEmployeesExtRepo } from '../../domain/repositories/i-hr-employees-ext.repo';

type Row = Record<string, unknown>;

@Injectable()
export class HrEmployeesExtRepository implements IHrEmployeesExtRepo {
  constructor(private readonly shiftRepo: ShiftRepository) {}
  async updateProfileImage(id: number, imageUrl: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(hrEmployees)
        .set({ photo_url: imageUrl, updated_at: _time.now() })
        .where(eq(hrEmployees.id, id))
        .returning();
      return castTo<Row>((rows[0] ?? {}));
    }, 'DB_ERROR');
  }

  async assignOrgFunctions(id: number, departmentId?: string, positionId?: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(hrEmployees).set({
        department_id: sql`COALESCE(${departmentId ?? null}::integer, ${hrEmployees.department_id})`,
        position_id:   sql`COALESCE(${positionId ?? null}::integer, ${hrEmployees.position_id})`,
        updated_at:    _time.now(),
      }).where(eq(hrEmployees.id, id)).returning();
      return castTo<Row>((rows[0] ?? {}));
    }, 'DB_ERROR');
  }

  async importEmployee(emp: Row): Promise<void> {
    await execHrEmployeeImport(emp);
  }

  async getEmployeeAssets(id: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT id, employee_id, asset_type, asset_name, asset_code,
               assigned_date, return_date, status, notes, created_at
        FROM employee_assets
        WHERE employee_id = ${id} AND deleted_at IS NULL
        ORDER BY assigned_date DESC
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
  }

  async assignAsset(id: number, assetType: unknown, assetName: unknown, assetCode: unknown, assignedDate: unknown, notes: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO employee_assets (employee_id, asset_type, asset_name, asset_code, assigned_date, notes, status)
        VALUES (${id}, ${assetType ?? 'equipment'}, ${assetName ?? ''}, ${assetCode ?? null}, ${assignedDate ?? null}, ${notes ?? null}, 'assigned')
        RETURNING *
      `);
      return (rows.rows[0] ?? {}) as Row;
    }, 'DB_ERROR');
  }

  /**
   * @description Proxied to the canonical ShiftRepository (shift/shift.repository.ts,
   * table = lib/db hr-v2-schema.ts `shiftSchedules`). The old local
   * `shift_schedules` compat pgTable (schema-business-c-2-hr-safety.ts) targeted the
   * SAME physical table with duplicate query logic — removed in favor of this proxy.
   */
  async getEmployeeSwapRequests(employeeId: number, status?: string): Promise<Result<Row[]>> {
    return this.shiftRepo.getEmployeeSwapRequests(employeeId, status);
  }

  async getEmployeeComplaints(employeeId: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const pat = `%${employeeId}%`;
      const rows = await db.select({
        id:          hr_conflict_reports.id,
        party1:      hr_conflict_reports.party1,
        party2:      hr_conflict_reports.party2,
        description: hr_conflict_reports.description,
        severity:    hr_conflict_reports.severity,
        status:      hr_conflict_reports.status,
        created_at:  hr_conflict_reports.created_at,
      })
        .from(hr_conflict_reports)
        .where(sql`${hr_conflict_reports.party1}::text ILIKE ${pat} OR ${hr_conflict_reports.party2}::text ILIKE ${pat}`)
        .orderBy(sql`${hr_conflict_reports.created_at} DESC`)
        .limit(50);
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  async createComplaint(employeeId: string, party2: unknown, description: unknown, severity: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(hr_conflict_reports).values({
        party1:      employeeId,
        party2:      (party2 ?? '') as string,
        description: (description ?? null) as string,
        severity:    (severity ?? 'low') as string,
        status:      'open',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
    }, 'DB_ERROR');
  }

  async getAssessmentSkips(id: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:                employee_360_assessments.id,
        employee_id:       employee_360_assessments.employee_id,
        assessment_period: employee_360_assessments.assessment_period,
        assessment_year:   employee_360_assessments.assessment_year,
        status:            employee_360_assessments.status,
        created_at:        employee_360_assessments.created_at,
        employee_name:     sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
      })
        .from(employee_360_assessments)
        .innerJoin(hrEmployees, eq(hrEmployees.id, employee_360_assessments.employee_id))
        .where(sql`${employee_360_assessments.employee_id} = ${id} AND ${employee_360_assessments.status} = 'skipped'`)
        .orderBy(sql`${employee_360_assessments.created_at} DESC`)
        .limit(50);
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  async getEmployeesList(limit = 100, offset = 0): Promise<Result<Row[]>> {
    try {
      const rows = await db
        .select({
          id: hrEmployees.id,
          first_name: hrEmployees.first_name,
          last_name: hrEmployees.last_name,
          department_id: hrEmployees.department_id,
          position_id: hrEmployees.position_id,
          photo_url: hrEmployees.photo_url,
          status: hrEmployees.status,
        })
        .from(hrEmployees)
        .orderBy(sql`${hrEmployees.last_name} ASC`)
        .limit(limit)
        .offset(offset);
      if (!Array.isArray(rows)) return Err('DB_TYPE_ERROR');
      return Ok(castTo<Row[]>(rows));
    } catch (e) {
      return Err(String(e));
    }
  }

  /** P3-26: Real implementation — reads from hr_documents (hr-v2-schema.ts) */
  async getEmployeeDocuments(employeeId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:            hr_documents.id,
        document_type: hr_documents.documentType,
        title:         hr_documents.title,
        status:        hr_documents.status,
        employee_id:   hr_documents.employeeId,
        initiated_by:  hr_documents.initiatedBy,
        total_steps:   hr_documents.totalSteps,
        current_step:  hr_documents.currentStep,
        created_at:    hr_documents.createdAt,
        updated_at:    hr_documents.updatedAt,
      })
        .from(hr_documents)
        .where(eq(hr_documents.employeeId, employeeId))
        .orderBy(sql`${hr_documents.createdAt} DESC`)
        .limit(100);
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  async getEmployeeDocumentById(employeeId: number, docId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:            hr_documents.id,
        document_type: hr_documents.documentType,
        title:         hr_documents.title,
        status:        hr_documents.status,
        employee_id:   hr_documents.employeeId,
        initiated_by:  hr_documents.initiatedBy,
        total_steps:   hr_documents.totalSteps,
        current_step:  hr_documents.currentStep,
        created_at:    hr_documents.createdAt,
        updated_at:    hr_documents.updatedAt,
      })
        .from(hr_documents)
        .where(sql`${hr_documents.id} = ${docId} AND ${hr_documents.employeeId} = ${employeeId}`)
        .limit(1);
      return castTo<Row | null>((rows[0] ?? null));
    }, 'DB_ERROR');
  }

  async deleteEmployeeDocument(employeeId: number, docId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      // Soft-delete: update status to 'deleted' so the record is retained for audit
      const rows = await db.update(hr_documents)
        .set({ status: 'deleted', updatedAt: _time.now() })
        .where(sql`${hr_documents.id} = ${docId} AND ${hr_documents.employeeId} = ${employeeId}`)
        .returning();
      return rows.length > 0;
    }, 'DB_ERROR');
  }

  async getPendingDocuments(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:            hr_documents.id,
        document_type: hr_documents.documentType,
        title:         hr_documents.title,
        status:        hr_documents.status,
        employee_id:   hr_documents.employeeId,
        initiated_by:  hr_documents.initiatedBy,
        total_steps:   hr_documents.totalSteps,
        current_step:  hr_documents.currentStep,
        created_at:    hr_documents.createdAt,
        updated_at:    hr_documents.updatedAt,
      })
        .from(hr_documents)
        .where(eq(hr_documents.status, 'pending'))
        .orderBy(sql`${hr_documents.createdAt} DESC`)
        .limit(100);
      return castTo<Row[]>(rows);
    }, 'DB_ERROR');
  }

  async assignCard(employeeId: number, orgFunctionId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      // Verify the org_function exists and is active
      const fn = await runQuery<{ id: number; razryad_level_id: number | null }>(sql`
        SELECT id, razryad_level_id FROM org_functions
        WHERE id = ${orgFunctionId} AND deleted_at IS NULL AND is_active = true
        LIMIT 1
      `);
      if (!fn.rows[0]) throw new Error(`Karta ID=${orgFunctionId} topilmadi yoki nofaol`);

      // Update employee org_function_id (razryad flows through karta)
      await db.update(hrEmployees)
        .set({ org_function_id: orgFunctionId, updated_at: _time.now() })
        .where(eq(hrEmployees.id, employeeId));

      return {
        employeeId,
        orgFunctionId,
        razryadLevelId: fn.rows[0].razryad_level_id ?? null,
        message: 'Xodim kartaga biriktirildi',
      };
    }, 'DB_ERROR');
  }
}
