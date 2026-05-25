/**
 * @module hr-map-employee-acl
 * @description ACL translator: legacy hr-map employee rows (from
 * `hr-map-compat.service.ts:getMapEmployees`) ↔ canonical
 * `HrMapEmployeeDto` consumed by new BC-3 (HR / People — Map) code.
 *
 * The legacy SELECT mixes snake_case identifiers with concat-string
 * `full_name`. The translator narrows the row to camelCase and guarantees
 * a non-empty `fullName`.
 *
 * TODO PA2-14: drop once a typed `HrMapRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyHrMapEmployeeRow {
  id: string | number;
  full_name?: unknown;
  status?: unknown;
  employee_code?: unknown;
  department_name?: unknown;
  position_name?: unknown;
  department_id?: unknown;
}

export interface HrMapEmployeeDto {
  id: string;
  fullName: string;
  status: string;
  employeeCode: string | null;
  departmentId: string | null;
  departmentName: string | null;
  positionName: string | null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

export class HrMapEmployeeAclTranslator
  implements IAclTranslator<LegacyHrMapEmployeeRow, HrMapEmployeeDto>
{
  toDomain(legacy: LegacyHrMapEmployeeRow): Result<HrMapEmployeeDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'HrMapEmployeeAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'HrMapEmployeeAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      fullName: toStr(legacy.full_name) ?? '',
      status: toStr(legacy.status) ?? 'active',
      employeeCode: toStr(legacy.employee_code),
      departmentId: toStr(legacy.department_id),
      departmentName: toStr(legacy.department_name),
      positionName: toStr(legacy.position_name),
    });
  }

  toLegacy(domain: HrMapEmployeeDto): LegacyHrMapEmployeeRow {
    return {
      id: domain.id,
      full_name: domain.fullName,
      status: domain.status,
      employee_code: domain.employeeCode,
      department_id: domain.departmentId,
      department_name: domain.departmentName,
      position_name: domain.positionName,
    };
  }
}
