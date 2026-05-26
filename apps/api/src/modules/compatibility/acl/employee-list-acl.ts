/**
 * @module employee-list-acl
 * @description ACL translator: legacy extended-employee-list rows (from
 * `employees-list-extended.service.ts:listExtended`) ↔ canonical
 * `EmployeeListItemDto` consumed by new BC-3 (HR / People) code.
 *
 * The legacy SELECT mixes snake_case identifiers with concat-string
 * `full_name`, `salary` as either string-numeric or null, and free-form
 * `status`. The translator narrows the shape into camelCase, coerces
 * `salary` to `number | null`, and guarantees a non-empty `fullName`.
 *
 * TODO PA2-14: drop once a typed `EmployeeListRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyEmployeeListRow {
  id: string | number;
  full_name?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  employee_code?: unknown;
  email?: unknown;
  phone?: unknown;
  status?: unknown;
  /** org_departments.id — new system */
  org_department_id?: unknown;
  org_department_name?: unknown;
  org_position_name?: unknown;
  salary?: unknown;
  hire_date?: unknown;
  created_at?: unknown;
}

export interface EmployeeListItemDto {
  id: string;
  fullName: string;
  employeeCode: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  /** org_departments.id — used as filter key */
  orgDepartmentId: string | null;
  orgDepartmentName: string | null;
  orgPositionName: string | null;
  salary: number | null;
  hireDate: Date | null;
  createdAt: Date | null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toMoney(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
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

function buildFullName(legacy: LegacyEmployeeListRow): string {
  const direct = toStr(legacy.full_name);
  if (direct && direct.trim() !== '') return direct;
  const first = toStr(legacy.first_name) ?? '';
  const last = toStr(legacy.last_name) ?? '';
  const composed = `${first} ${last}`.trim();
  return composed === '' ? 'Unknown' : composed;
}

export class EmployeeListAclTranslator
  implements IAclTranslator<LegacyEmployeeListRow, EmployeeListItemDto>
{
  toDomain(legacy: LegacyEmployeeListRow): Result<EmployeeListItemDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'EmployeeListAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'EmployeeListAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      fullName: buildFullName(legacy),
      employeeCode: toStr(legacy.employee_code),
      email: toStr(legacy.email),
      phone: toStr(legacy.phone),
      status: toStr(legacy.status) ?? 'active',
      orgDepartmentId: toStr(legacy.org_department_id),
      orgDepartmentName: toStr(legacy.org_department_name),
      orgPositionName: toStr(legacy.org_position_name),
      salary: toMoney(legacy.salary),
      hireDate: toDate(legacy.hire_date),
      createdAt: toDate(legacy.created_at),
    });
  }

  toLegacy(domain: EmployeeListItemDto): LegacyEmployeeListRow {
    return {
      id: domain.id,
      full_name: domain.fullName,
      employee_code: domain.employeeCode,
      email: domain.email,
      phone: domain.phone,
      status: domain.status,
      org_department_id: domain.orgDepartmentId,
      org_department_name: domain.orgDepartmentName,
      org_position_name: domain.orgPositionName,
      salary: domain.salary != null ? String(domain.salary) : null,
      hire_date: domain.hireDate ? domain.hireDate.toISOString() : null,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
    };
  }
}
