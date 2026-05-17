/**
 * @module employees-extra-acl
 * @description ACL translator: canonical `Employee` rows returned by
 * `employees-compat.service.ts:getEmployee` (snake_case columns produced by
 * the raw SELECT against `employees` + `departments` + `positions`) ↔ the
 * `EmployeeExtraDto` consumed by Bitrix-style legacy front-ends still hitting
 * `compatibility/employees-extra.controller.ts`.
 *
 * Mirrors the field-name conventions in `employee-file-acl.ts`:
 *   - ids are coerced to `string` for envelope stability;
 *   - dates become typed `Date | null`;
 *   - the JOIN-projected `*_name` columns are kept verbatim for legacy templates.
 *
 * Wave 13 PR2 — added for ACL symmetry with other compatibility/ controllers.
 *
 * TODO PA2-15: drop once `compatibility/employees-extra` is migrated to a
 * typed Drizzle repo with native camelCase columns.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 * @see docs/ddd-deep-audit-strategic.md Step 4 — ACL gap finding
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyEmployeeExtraRow {
  id: number | string;
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  employee_code?: unknown;
  status?: unknown;
  phone?: unknown;
  hire_date?: unknown;
  photo_url?: unknown;
  department_id?: unknown;
  position_id?: unknown;
  department_name?: unknown;
  position_name?: unknown;
}

export interface EmployeeExtraDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  employeeCode: string | null;
  status: string;
  phone: string | null;
  hireDate: Date | null;
  photoUrl: string | null;
  departmentId: string | null;
  positionId: string | null;
  departmentName: string | null;
  positionName: string | null;
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

export class EmployeesExtraAclTranslator
  implements IAclTranslator<LegacyEmployeeExtraRow, EmployeeExtraDto>
{
  toDomain(legacy: LegacyEmployeeExtraRow): Result<EmployeeExtraDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'EmployeesExtraAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'EmployeesExtraAcl: legacy.id missing'));
    }
    const firstName = toStr(legacy.first_name) ?? '';
    const lastName  = toStr(legacy.last_name) ?? '';
    return Ok({
      id: String(legacy.id),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      email: toStr(legacy.email),
      employeeCode: toStr(legacy.employee_code),
      status: toStr(legacy.status) ?? 'active',
      phone: toStr(legacy.phone),
      hireDate: toDate(legacy.hire_date),
      photoUrl: toStr(legacy.photo_url),
      departmentId: toStr(legacy.department_id),
      positionId: toStr(legacy.position_id),
      departmentName: toStr(legacy.department_name),
      positionName: toStr(legacy.position_name),
    });
  }

  toLegacy(domain: EmployeeExtraDto): LegacyEmployeeExtraRow {
    return {
      id: domain.id,
      first_name: domain.firstName,
      last_name: domain.lastName,
      email: domain.email,
      employee_code: domain.employeeCode,
      status: domain.status,
      phone: domain.phone,
      hire_date: domain.hireDate ? domain.hireDate.toISOString() : null,
      photo_url: domain.photoUrl,
      department_id: domain.departmentId,
      position_id: domain.positionId,
      department_name: domain.departmentName,
      position_name: domain.positionName,
    };
  }
}
