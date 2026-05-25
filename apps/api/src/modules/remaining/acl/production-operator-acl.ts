/**
 * @module production-operator-acl
 * @description ACL translator: legacy operator rows (from
 * `production-facts.repository.ts:getOperators`, which returns a flat
 * `Record<string, unknown>` per operator) ↔ canonical
 * `ProductionOperatorDto` consumed by new BC-2 (Manufacturing / MES) code.
 *
 * The legacy projection mixes raw `id` + denormalised `name` /
 * `work_center_name` strings. The translator narrows the shape into a
 * strictly-typed DTO usable by frontend operator pickers and analytics.
 *
 * TODO PA2-14: drop once a typed `ProductionOperatorRepository` ships
 * with native camelCase rows.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyProductionOperatorRow {
  id: string | number;
  name?: unknown;
  full_name?: unknown;
  work_center_id?: unknown;
  work_center_name?: unknown;
  shift?: unknown;
  is_active?: unknown;
}

export interface ProductionOperatorDto {
  id: string;
  name: string;
  workCenterId: string | null;
  workCenterName: string | null;
  shift: string | null;
  isActive: boolean;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

export class ProductionOperatorAclTranslator
  implements IAclTranslator<LegacyProductionOperatorRow, ProductionOperatorDto>
{
  toDomain(legacy: LegacyProductionOperatorRow): Result<ProductionOperatorDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'ProductionOperatorAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'ProductionOperatorAcl: legacy.id missing'));
    }
    const name = toStr(legacy.full_name) ?? toStr(legacy.name);
    if (!name) {
      return Err(AppErr('VALIDATION', 'ProductionOperatorAcl: name missing'));
    }
    return Ok({
      id: String(legacy.id),
      name,
      workCenterId: toStr(legacy.work_center_id),
      workCenterName: toStr(legacy.work_center_name),
      shift: toStr(legacy.shift),
      isActive: legacy.is_active == null ? true : Boolean(legacy.is_active),
    });
  }

  toLegacy(domain: ProductionOperatorDto): LegacyProductionOperatorRow {
    return {
      id: domain.id,
      name: domain.name,
      full_name: domain.name,
      work_center_id: domain.workCenterId,
      work_center_name: domain.workCenterName,
      shift: domain.shift,
      is_active: domain.isActive,
    };
  }
}
