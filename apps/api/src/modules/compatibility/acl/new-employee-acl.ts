/**
 * @module new-employee-acl
 * @description ACL translator: legacy `adaptation_records` rows joined with
 * `adaptation_programs`/`employees`/`departments`/`positions` (from
 * `adaptation-compat.service.ts:getNewEmployees`) ↔ canonical
 * `NewEmployeeDto` consumed by new BC-3 (HR / People — Adaptation) code.
 *
 * The legacy SELECT mixes snake_case identifiers with concat-string
 * `full_name` and free-form `status`. The translator narrows the row to
 * camelCase, normalises `progressPercent` to 0-100, and coerces dates to
 * typed `Date | null`.
 *
 * TODO PA2-14: drop once a typed `AdaptationRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyNewEmployeeRow {
  id: string | number;
  employee_id?: unknown;
  program_id?: unknown;
  start_date?: unknown;
  end_date?: unknown;
  status?: unknown;
  progress_percent?: unknown;
  current_milestone?: unknown;
  created_at?: unknown;
  program_name?: unknown;
  full_name?: unknown;
  department_name?: unknown;
  position_name?: unknown;
}

export interface NewEmployeeDto {
  id: string;
  employeeId: string | null;
  programId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  progressPercent: number;
  currentMilestone: string | null;
  programName: string | null;
  fullName: string | null;
  departmentName: string | null;
  positionName: string | null;
  createdAt: Date | null;
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

function toPercent(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(String(v));
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export class NewEmployeeAclTranslator
  implements IAclTranslator<LegacyNewEmployeeRow, NewEmployeeDto>
{
  toDomain(legacy: LegacyNewEmployeeRow): Result<NewEmployeeDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'NewEmployeeAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'NewEmployeeAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      employeeId: toStr(legacy.employee_id),
      programId: toStr(legacy.program_id),
      startDate: toDate(legacy.start_date),
      endDate: toDate(legacy.end_date),
      status: toStr(legacy.status) ?? 'in_progress',
      progressPercent: toPercent(legacy.progress_percent),
      currentMilestone: toStr(legacy.current_milestone),
      programName: toStr(legacy.program_name),
      fullName: toStr(legacy.full_name),
      departmentName: toStr(legacy.department_name),
      positionName: toStr(legacy.position_name),
      createdAt: toDate(legacy.created_at),
    });
  }

  toLegacy(domain: NewEmployeeDto): LegacyNewEmployeeRow {
    return {
      id: domain.id,
      employee_id: domain.employeeId,
      program_id: domain.programId,
      start_date: domain.startDate ? domain.startDate.toISOString() : null,
      end_date: domain.endDate ? domain.endDate.toISOString() : null,
      status: domain.status,
      progress_percent: domain.progressPercent,
      current_milestone: domain.currentMilestone,
      program_name: domain.programName,
      full_name: domain.fullName,
      department_name: domain.departmentName,
      position_name: domain.positionName,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
    };
  }
}
