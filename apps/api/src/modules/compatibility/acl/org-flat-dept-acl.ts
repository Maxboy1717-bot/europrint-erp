/**
 * @module org-flat-dept-acl
 * @description ACL translator: legacy flat-department rows emitted by
 * `org-chart-compat.service.ts:getOrgFlat` ↔ canonical
 * `OrgFlatDeptDto` consumed by new BC-3 (HR / People — Org Chart) code.
 *
 * The legacy raw SQL aliases columns to a mixed shape (`id` snake-friendly,
 * `parentId`/`managerId`/`employeeCount` already camel via SQL `AS`). The
 * translator normalises everything to typed camelCase and guarantees
 * `employeeCount` is a finite number.
 *
 * TODO PA2-14: drop once a typed `OrgChartRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyOrgFlatDeptRow {
  id: string | number;
  name?: unknown;
  parentId?: unknown;
  managerId?: unknown;
  employeeCount?: unknown;
}

export interface OrgFlatDeptDto {
  id: string;
  name: string;
  parentId: string | null;
  managerId: string | null;
  employeeCount: number;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : 0;
}

export class OrgFlatDeptAclTranslator
  implements IAclTranslator<LegacyOrgFlatDeptRow, OrgFlatDeptDto>
{
  toDomain(legacy: LegacyOrgFlatDeptRow): Result<OrgFlatDeptDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'OrgFlatDeptAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'OrgFlatDeptAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      name: toStr(legacy.name) ?? '',
      parentId: toStr(legacy.parentId),
      managerId: toStr(legacy.managerId),
      employeeCount: toNum(legacy.employeeCount),
    });
  }

  toLegacy(domain: OrgFlatDeptDto): LegacyOrgFlatDeptRow {
    return {
      id: domain.id,
      name: domain.name,
      parentId: domain.parentId,
      managerId: domain.managerId,
      employeeCount: domain.employeeCount,
    };
  }
}
