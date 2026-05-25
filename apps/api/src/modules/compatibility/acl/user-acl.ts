/**
 * @module user-acl
 * @description ACL translator: legacy `users` rows (raw join with `employees`) ↔
 * canonical `UserDto` consumed by new BC-6 (Platform) code. Demonstrates the
 * PA2-14 pattern; see docs/context-map.md "Legacy / Migration" section.
 *
 * Concern picked from `compatibility/users-compat.service.ts` — the most
 * "customer-shaped" legacy concern in the compatibility module (users +
 * employee profile join). Real Customer (BC-1 Sales) flows through `sd/`.
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

/**
 * Raw shape returned by `users-compat.service.ts:listUsers()` — snake_case
 * mixed with quoted-camelCase aliases ("fullName", "departmentId"). Kept as
 * `unknown`-fielded record because the legacy SELECT is text-projected.
 */
export interface LegacyUserRow {
  id: number | string;
  username: string | null;
  email: string | null;
  role: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  full_name?: string | null;
  fullName?: string | null;
  departmentId?: string | number | null;
  positionId?: string | number | null;
  employee_id?: string | number | null;
}

/**
 * Canonical domain DTO. Camel-case, typed dates, null only where domain
 * semantics actually allow it. Consumed by new platform code.
 */
export interface UserDto {
  id: string;
  username: string;
  email: string | null;
  role: string | null;
  fullName: string;
  departmentId: string | null;
  positionId: string | null;
  employeeId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

/** Coerce a maybe-null string/Date into a Date or return undefined. */
function toDate(v: string | Date | null | undefined): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toStrOrNull(v: string | number | null | undefined): string | null {
  if (v == null) return null;
  return String(v);
}

export class UserAclTranslator implements IAclTranslator<LegacyUserRow, UserDto> {
  toDomain(legacy: LegacyUserRow): Result<UserDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'UserAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'UserAcl: legacy.id missing'));
    }
    if (legacy.username == null || legacy.username === '') {
      return Err(AppErr('VALIDATION', 'UserAcl: legacy.username missing'));
    }
    const createdAt = toDate(legacy.created_at);
    if (!createdAt) {
      return Err(AppErr('VALIDATION', 'UserAcl: created_at is not a valid date'));
    }
    const fullName =
      (typeof legacy.fullName === 'string' && legacy.fullName.trim()) ||
      (typeof legacy.full_name === 'string' && legacy.full_name.trim()) ||
      legacy.username;

    const dto: UserDto = {
      id: String(legacy.id),
      username: legacy.username,
      email: legacy.email ?? null,
      role: legacy.role ?? null,
      fullName,
      departmentId: toStrOrNull(legacy.departmentId ?? null),
      positionId: toStrOrNull(legacy.positionId ?? null),
      employeeId: toStrOrNull(legacy.employee_id ?? null),
      createdAt,
      updatedAt: toDate(legacy.updated_at) ?? null,
    };
    return Ok(dto);
  }

  toLegacy(domain: UserDto): LegacyUserRow {
    return {
      id: domain.id,
      username: domain.username,
      email: domain.email,
      role: domain.role,
      created_at: domain.createdAt.toISOString(),
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
      full_name: domain.fullName,
      fullName: domain.fullName,
      departmentId: domain.departmentId,
      positionId: domain.positionId,
      employee_id: domain.employeeId,
    };
  }
}
