/**
 * @module employee-kpi-acl
 * @description ACL translator: legacy `employee_daily_kpi` rows joined with
 * `employees`/`departments` (from `employee-kpi-compat.service.ts:getKpis`)
 * ↔ canonical `EmployeeKpiDto` consumed by new BC-3 (HR / People —
 * Performance) code.
 *
 * The legacy SELECT mixes snake_case score columns (`attendance_score`,
 * `quality_score`, ...) with concat-string `employee_name`. The translator
 * narrows the row to camelCase, clamps scores to 0-100, and coerces
 * `kpi_date` to typed `Date | null`.
 *
 * TODO PA2-14: drop once a typed `EmployeeKpiRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyEmployeeKpiRow {
  id: string | number;
  employee_id?: unknown;
  kpi_date?: unknown;
  attendance_score?: unknown;
  quality_score?: unknown;
  task_completion_score?: unknown;
  total_score?: unknown;
  attendance_status?: unknown;
  notes?: unknown;
  employee_name?: unknown;
  department_name?: unknown;
}

export interface EmployeeKpiDto {
  id: string;
  employeeId: string | null;
  kpiDate: Date | null;
  attendanceScore: number;
  qualityScore: number;
  taskCompletionScore: number;
  totalScore: number;
  attendanceStatus: string | null;
  notes: string | null;
  employeeName: string | null;
  departmentName: string | null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toScore(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(String(v));
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export class EmployeeKpiAclTranslator
  implements IAclTranslator<LegacyEmployeeKpiRow, EmployeeKpiDto>
{
  toDomain(legacy: LegacyEmployeeKpiRow): Result<EmployeeKpiDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'EmployeeKpiAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'EmployeeKpiAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      employeeId: toStr(legacy.employee_id),
      kpiDate: toDate(legacy.kpi_date),
      attendanceScore: toScore(legacy.attendance_score),
      qualityScore: toScore(legacy.quality_score),
      taskCompletionScore: toScore(legacy.task_completion_score),
      totalScore: toScore(legacy.total_score),
      attendanceStatus: toStr(legacy.attendance_status),
      notes: toStr(legacy.notes),
      employeeName: toStr(legacy.employee_name),
      departmentName: toStr(legacy.department_name),
    });
  }

  toLegacy(domain: EmployeeKpiDto): LegacyEmployeeKpiRow {
    return {
      id: domain.id,
      employee_id: domain.employeeId,
      kpi_date: domain.kpiDate ? domain.kpiDate.toISOString() : null,
      attendance_score: domain.attendanceScore,
      quality_score: domain.qualityScore,
      task_completion_score: domain.taskCompletionScore,
      total_score: domain.totalScore,
      attendance_status: domain.attendanceStatus,
      notes: domain.notes,
      employee_name: domain.employeeName,
      department_name: domain.departmentName,
    };
  }
}
