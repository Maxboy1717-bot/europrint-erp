/**
 * @module cost-center-acl
 * @description ACL translator: legacy `cost_centers` rows (from
 * `fi.repository.ts:getCostCenters`) ↔ canonical `CostCenterDto`
 * consumed by new BC-7 (Finance) code.
 *
 * The legacy `SELECT *` projection emits raw snake_case columns with
 * mixed value types. The translator narrows the shape into camelCase,
 * coerces `is_active` to a strict `boolean`, and converts timestamp
 * strings into typed `Date` values.
 *
 * TODO PA2-14: drop once a typed `CostCenterRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyCostCenterRow {
  id: string | number;
  code?: unknown;
  name?: unknown;
  name_ru?: unknown;
  description?: unknown;
  is_active?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  deleted_at?: unknown;
}

export interface CostCenterDto {
  id: string;
  code: string | null;
  name: string;
  nameRu: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
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

export class CostCenterAclTranslator
  implements IAclTranslator<LegacyCostCenterRow, CostCenterDto>
{
  toDomain(legacy: LegacyCostCenterRow): Result<CostCenterDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'CostCenterAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'CostCenterAcl: legacy.id missing'));
    }
    const name = toStr(legacy.name);
    if (!name) {
      return Err(AppErr('VALIDATION', 'CostCenterAcl: name missing'));
    }
    return Ok({
      id: String(legacy.id),
      code: toStr(legacy.code),
      name,
      nameRu: toStr(legacy.name_ru),
      description: toStr(legacy.description),
      isActive: Boolean(legacy.is_active),
      createdAt: toDate(legacy.created_at),
      updatedAt: toDate(legacy.updated_at),
    });
  }

  toLegacy(domain: CostCenterDto): LegacyCostCenterRow {
    return {
      id: domain.id,
      code: domain.code,
      name: domain.name,
      name_ru: domain.nameRu,
      description: domain.description,
      is_active: domain.isActive,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
