/**
 * @module discipline-record-acl
 * @description ACL translator: legacy `discipline_records` JOIN `employees`
 * JOIN `departments` rows ↔ canonical `DisciplineRecordDto` for new
 * BC-3 (HR / People) consumers.
 *
 * Legacy SELECT in `discipline-records-compat.service.ts` mixes snake_case
 * (dr.*) with concat-string `employee_name` and `department_name`. This
 * translator promotes them to camelCase, coerces dates, and produces typed
 * monetary fields.
 *
 * TODO PA2-14: remove when a `DisciplineRecordsRepository` returns
 * domain-shaped rows directly.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyDisciplineRecordRow {
  id: string | number;
  employee_id: string | number | null;
  violation_type: string | null;
  discipline_type: string | null;
  severity: string | null;
  violation_date: string | Date | null;
  issued_date?: string | Date | null;
  description: string | null;
  fine_amount: number | string | null;
  suspension_days?: number | string | null;
  status: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  employee_name?: string | null;
  department_name?: string | null;
}

export interface DisciplineRecordDto {
  id: string;
  employeeId: string | null;
  violationType: string;
  disciplineType: string | null;
  severity: string;
  violationDate: Date | null;
  issuedDate: Date | null;
  description: string | null;
  fineAmount: number | null;
  suspensionDays: number | null;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  employeeName: string | null;
  departmentName: string | null;
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNumOrNull(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export class DisciplineRecordAclTranslator
  implements IAclTranslator<LegacyDisciplineRecordRow, DisciplineRecordDto>
{
  toDomain(legacy: LegacyDisciplineRecordRow): Result<DisciplineRecordDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'DisciplineRecordAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'DisciplineRecordAcl: legacy.id missing'));
    }
    if (!legacy.violation_type) {
      return Err(AppErr('VALIDATION', 'DisciplineRecordAcl: violation_type missing'));
    }
    return Ok({
      id: String(legacy.id),
      employeeId: legacy.employee_id != null ? String(legacy.employee_id) : null,
      violationType: legacy.violation_type,
      disciplineType: legacy.discipline_type ?? null,
      severity: legacy.severity ?? 'minor',
      violationDate: toDate(legacy.violation_date),
      issuedDate: toDate(legacy.issued_date),
      description: legacy.description ?? null,
      fineAmount: toNumOrNull(legacy.fine_amount),
      suspensionDays: toNumOrNull(legacy.suspension_days),
      status: legacy.status ?? 'issued',
      createdAt: toDate(legacy.created_at),
      updatedAt: toDate(legacy.updated_at),
      employeeName: legacy.employee_name ?? null,
      departmentName: legacy.department_name ?? null,
    });
  }

  toLegacy(domain: DisciplineRecordDto): LegacyDisciplineRecordRow {
    return {
      id: domain.id,
      employee_id: domain.employeeId,
      violation_type: domain.violationType,
      discipline_type: domain.disciplineType,
      severity: domain.severity,
      violation_date: domain.violationDate ? domain.violationDate.toISOString() : null,
      issued_date: domain.issuedDate ? domain.issuedDate.toISOString() : null,
      description: domain.description,
      fine_amount: domain.fineAmount,
      suspension_days: domain.suspensionDays,
      status: domain.status,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
      employee_name: domain.employeeName,
      department_name: domain.departmentName,
    };
  }
}
